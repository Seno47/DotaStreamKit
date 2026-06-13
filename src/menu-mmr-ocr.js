import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const execFileAsync = promisify(execFile);

const inGameStatePattern = /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS|POST_GAME/i;

let workerPromise = null;
let tesseractCachePath = join(rootDir, 'data', 'tesseract-cache');

export function setMenuMmrOcrCachePath(cachePath) {
  if (cachePath) tesseractCachePath = cachePath;
}

export function explainMenuOcrSkip(settings, gsi, dotaProcess, inFlight = false) {
  if (process.platform !== 'win32') return 'platform is not win32';
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

export function parseMmrFromOcrText(text) {
  const source = String(text || '');
  const withoutCommas = source.replace(/,/g, '');
  const compact = withoutCommas.replace(/\s+/g, ' ').trim();
  const direct = Number(compact);
  let parsedMmr = null;

  if (Number.isFinite(direct) && direct >= 1 && direct <= 99999) {
    parsedMmr = Math.trunc(direct);
  } else {
    const digits = withoutCommas.replace(/\D/g, '');
    const fromDigits = Number(digits);
    if (Number.isFinite(fromDigits) && fromDigits >= 1 && fromDigits <= 99999) {
      parsedMmr = Math.trunc(fromDigits);
    }
  }

  return parsedMmr;
}

export async function pickScreenRegion() {
  if (process.platform !== 'win32') {
    throw new Error('Screen region picker is only available on Windows');
  }
  const scriptPath = join(rootDir, 'scripts', 'pick-screen-region.ps1');
  const resultPath = join(tmpdir(), `dotastreamkit-region-${randomBytes(8).toString('hex')}.json`);
  try {
    const { stdout, stderr } = await execFileAsync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-STA',
      '-File', scriptPath,
      '-ResultFile', resultPath
    ], { windowsHide: false, maxBuffer: 1024 * 1024 });

    let raw = '';
    try {
      raw = await readFile(resultPath, 'utf8');
    } catch {
      raw = String(stdout || '').trim();
    }

    const line = raw.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).pop();
    if (!line) {
      const details = String(stderr || '').trim();
      throw new Error(details ? `Region picker failed: ${details}` : 'Region picker returned no data');
    }
    const parsed = JSON.parse(line);
    if (parsed.cancelled) return null;
    return normalizeRegion(parsed);
  } finally {
    await unlink(resultPath).catch(() => {});
  }
}

export async function recognizeMenuMmr(region) {
  const normalized = normalizeRegion(region);
  if (!normalized) return null;

  let imagePath = null;
  try {
    imagePath = await captureScreenRegion(normalized);
    const imageBuffer = await readFile(imagePath);
    const processed = await sharp(imageBuffer)
      .resize({
        width: Math.max(normalized.width * 3, 60),
        height: Math.max(normalized.height * 3, 30),
        kernel: sharp.kernel.lanczos3
      })
      .greyscale()
      .normalize()
      .threshold(140)
      .png()
      .toBuffer();

    const worker = await getWorker();
    const { data } = await worker.recognize(processed);
    const rawText = String(data?.text || '').trim();
    const confidence = Number(data?.confidence);
    const mmr = parseMmrFromOcrText(rawText);
    if (mmr === null) return { mmr: null, rawText, confidence };
    return { mmr, rawText, confidence };
  } catch (error) {
    throw error;
  } finally {
    if (imagePath) {
      await unlink(imagePath).catch(() => {});
    }
  }
}

async function captureScreenRegion(region) {
  const scriptPath = join(rootDir, 'scripts', 'capture-screen-region.ps1');
  const { stdout } = await execFileAsync('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-NoProfile',
    '-File', scriptPath,
    '-X', String(region.x),
    '-Y', String(region.y),
    '-Width', String(region.width),
    '-Height', String(region.height)
  ], { windowsHide: true, maxBuffer: 1024 * 1024 });
  const imagePath = String(stdout || '').trim().split(/\r?\n/).filter(Boolean).pop();
  if (!imagePath) throw new Error('Screen capture returned no file path');
  return imagePath;
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

function normalizeRegion(value) {
  if (!value || typeof value !== 'object') return null;
  const x = toInt(value.x, 0, 10000);
  const y = toInt(value.y, 0, 10000);
  const width = toInt(value.width, 10, 2000);
  const height = toInt(value.height, 10, 2000);
  if (x === null || y === null || width === null || height === null) return null;
  return { x, y, width, height };
}

function toInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const truncated = Math.trunc(number);
  if (truncated < min || truncated > max) return null;
  return truncated;
}
