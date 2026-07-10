import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';
import { join } from 'node:path';
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

const mmrMarkerSource = '(?:рейтинг|rating|mmr)';
const mmrNumberSource = "\\d(?:[\\d\\s,.'’]*\\d)?";
const mmrMarkerOnlyPattern = new RegExp(`^\\s*${mmrMarkerSource}\\s*[:=\\-–—]?\\s*$`, 'i');
const mmrAfterMarkerPattern = new RegExp(`^\\s*${mmrMarkerSource}\\s*[:=\\-–—]?\\s*(${mmrNumberSource})\\s*$`, 'i');
const mmrBeforeMarkerPattern = new RegExp(`^\\s*(${mmrNumberSource})\\s*${mmrMarkerSource}\\s*$`, 'i');
const mmrNumberOnlyPattern = new RegExp(`^\\s*(${mmrNumberSource})\\s*$`);

function normalizeMmrCandidate(value) {
  const numeric = Number(String(value || '').replace(/\D/g, ''));
  return Number.isFinite(numeric) && numeric >= 1 && numeric <= 99999 ? Math.trunc(numeric) : null;
}

function extractMmrNumberNearMarker(lines, markerLineIndex) {
  const line = lines[markerLineIndex] || '';
  const direct = line.match(mmrAfterMarkerPattern) || line.match(mmrBeforeMarkerPattern);
  if (direct) return normalizeMmrCandidate(direct[1]);
  if (!mmrMarkerOnlyPattern.test(line)) return null;

  const previousLine = (lines[markerLineIndex - 1] || '').match(mmrNumberOnlyPattern);
  if (previousLine) return normalizeMmrCandidate(previousLine[1]);
  const nextLine = (lines[markerLineIndex + 1] || '').match(mmrNumberOnlyPattern);
  return nextLine ? normalizeMmrCandidate(nextLine[1]) : null;
}

function extractMmrNumber(source) {
  const lines = String(source || '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    if (!new RegExp(mmrMarkerSource, 'i').test(lines[index])) continue;
    const mmr = extractMmrNumberNearMarker(lines, index);
    if (mmr !== null) return mmr;
  }
  return null;
}

export function parseMmrFromOcrText(text) {
  const source = String(text || '');
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

export function selectMenuMmrOcrResult(brightResult = {}, dimResult = {}) {
  const results = [brightResult, dimResult].map((result) => ({
    rawText: String(result?.rawText || '').trim(),
    confidence: Number.isFinite(Number(result?.confidence)) ? Number(result.confidence) : 0,
    mmr: parseMmrFromOcrText(result?.rawText)
  }));
  const rawText = results
    .map((result) => result.rawText)
    .filter(Boolean)
    .join('\n');
  const recognized = results.filter((result) => result.mmr !== null);

  if (!recognized.length) {
    return {
      mmr: null,
      rawText,
      confidence: Math.max(...results.map((result) => result.confidence))
    };
  }

  const distinctValues = new Set(recognized.map((result) => result.mmr));
  if (distinctValues.size > 1) {
    return { mmr: null, rawText, confidence: 0 };
  }

  return {
    mmr: recognized[0].mmr,
    rawText,
    confidence: Math.max(...recognized.map((result) => result.confidence))
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

  return selectMenuMmrOcrResult(brightResult, dimResult);
}

async function getWorker() {
  if (!workerPromise) {
    const pending = (async () => {
      let worker = null;
      try {
        worker = await createWorker('eng+rus', 1, {
          cachePath: tesseractCachePath
        });
        await worker.setParameters({
          tessedit_pageseg_mode: String(PSM.SINGLE_BLOCK)
        });
        return worker;
      } catch (error) {
        await worker?.terminate?.().catch(() => {});
        throw error;
      }
    })();
    workerPromise = pending;
    pending.catch(() => {
      if (workerPromise === pending) workerPromise = null;
    });
  }
  return workerPromise;
}
