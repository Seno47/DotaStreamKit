import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  captureScreenRegion,
  getScreenCaptureSupport,
  pickScreenRegion,
  normalizeRegion
} from './screen-capture.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

const inGameStatePattern = /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS|POST_GAME/i;

let workerPromise = null;
let tesseractCachePath = join(rootDir, 'data', 'tesseract-cache');

export { pickScreenRegion, normalizeRegion };

export function setMenuMmrOcrCachePath(cachePath) {
  if (cachePath) tesseractCachePath = cachePath;
}

export function explainMenuOcrSkip(settings, gsi, dotaProcess, inFlight = false) {
  const support = getScreenCaptureSupport();
  if (!support.supported) return support.reason || 'screen capture is not available';
  if (inFlight) return 'previous OCR run still in progress';
  if (!settings?.menuMmrOcrEnabled) return 'OCR disabled in settings';
  if (!settings?.menuMmrOcrRegion) return 'OCR region is not set';
  if (!isDotaMainMenu(gsi, dotaProcess)) {
    return [
      'not in Dota main menu',
      `dotaProcess=${dotaProcess?.running === true}`,
      `gameState=${String(gsi?.gameState || '-')}`,
      `queueSearch=${Boolean(gsi?.queueSearchSignal)}`,
      `inGameScreen=${Boolean(gsi?.inGameScreen)}`,
      `playerActivity=${String(gsi?.playerActivity || '-')}`,
      `gsiConnected=${Boolean(gsi?.connected)}`
    ].join(' | ');
  }
  return null;
}

export function isDotaMainMenu(gsi, dotaProcess) {
  if (dotaProcess?.running !== true) return false;
  const state = String(gsi?.gameState || '');
  if (inGameStatePattern.test(state)) return false;
  if (gsi?.queueSearchSignal) return false;
  if (gsi?.inGameScreen) return false;
  const activity = String(gsi?.playerActivity || '').toLowerCase();
  if (/play|spectat/.test(activity)) return false;
  return true;
}

const mmrMarkerPattern = /рейтинг|mmr/i;

function extractMmrNumber(source) {
  const lines = String(source).split(/\r?\n/);
  for (const line of lines) {
    const digits = line.replace(/[^\d]/g, '');
    if (!digits) continue;
    const num = Number(digits);
    if (Number.isFinite(num) && num >= 1 && num <= 99999) {
      return Math.trunc(num);
    }
  }
  return null;
}

export function parseMmrFromOcrText(text) {
  const source = String(text || '');
  if (!mmrMarkerPattern.test(source)) return null;
  return extractMmrNumber(source);
}

const ocrUpscaleFactor = 3;

const ocrPreprocessPresets = {
  bright: {
    modulate: { brightness: 1.05 },
    linear: [1.1, -10],
    threshold: 125
  },
  dim: {
    modulate: { brightness: 1.9 },
    linear: [2.2, -90],
    threshold: 55
  }
};

export async function buildOcrImageBuffer(imageBuffer, region, preset = 'bright') {
  const normalized = normalizeRegion(region);
  if (!normalized) throw new Error('Invalid screen region');

  const options = ocrPreprocessPresets[preset] || ocrPreprocessPresets.bright;
  let pipeline = sharp(imageBuffer)
    .resize({
      width: Math.max(normalized.width * ocrUpscaleFactor, 60),
      height: Math.max(normalized.height * ocrUpscaleFactor, 30),
      kernel: sharp.kernel.lanczos3
    })
    .greyscale()
    .normalize();

  if (options.modulate) {
    pipeline = pipeline.modulate(options.modulate);
  }

  return pipeline
    .linear(options.linear[0], options.linear[1])
    .threshold(options.threshold)
    .png()
    .toBuffer();
}

async function recognizeProcessedImage(worker, imageBuffer) {
  const { data } = await worker.recognize(imageBuffer);
  return {
    rawText: String(data?.text || '').trim(),
    confidence: Number(data?.confidence)
  };
}

export async function recognizeMenuMmr(region) {
  const normalized = normalizeRegion(region);
  if (!normalized) return null;

  const imageBuffer = await captureScreenRegion(normalized);
  const [brightBuffer, dimBuffer] = await Promise.all([
    buildOcrImageBuffer(imageBuffer, normalized, 'bright'),
    buildOcrImageBuffer(imageBuffer, normalized, 'dim')
  ]);

  const worker = await getWorker();
  const [brightResult, dimResult] = await Promise.all([
    recognizeProcessedImage(worker, brightBuffer),
    recognizeProcessedImage(worker, dimBuffer)
  ]);

  const rawText = [brightResult.rawText, dimResult.rawText]
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n');
  const confidence = Math.max(
    Number.isFinite(brightResult.confidence) ? brightResult.confidence : 0,
    Number.isFinite(dimResult.confidence) ? dimResult.confidence : 0
  );
  const mmr = parseMmrFromOcrText(rawText);

  // console.log('[Menu MMR OCR] recognition result:');
  // console.log(`  bright pass: ${JSON.stringify(brightResult.rawText)}`);
  // console.log(`  dim pass: ${JSON.stringify(dimResult.rawText)}`);
  // console.log(`  merged raw text: ${JSON.stringify(rawText)}`);
  // console.log(`  confidence: ${Number.isFinite(confidence) ? confidence.toFixed(1) : '-'}`);
  // console.log(`  marker (mmr/рейтинг): ${mmrMarkerPattern.test(rawText) ? 'yes' : 'no'}`);
  // console.log(`  parsed MMR: ${mmr ?? 'null'}`);

  if (mmr === null) return { mmr: null, rawText, confidence };
  return { mmr, rawText, confidence };
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('eng+rus', 1, {
        cachePath: tesseractCachePath
      });
      await worker.setParameters({
        tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK)
      });
      return worker;
    })();
  }
  return workerPromise;
}
