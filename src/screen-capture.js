import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const execFileAsync = promisify(execFile);

let screenshotsModule = null;
let screenshotsLoadError = null;

try {
  screenshotsModule = await import('node-screenshots');
} catch (error) {
  screenshotsLoadError = error;
}

const cliAvailability = {
  slop: null,
  slurp: null,
  grim: null
};

export function parseSlopOutput(value) {
  const source = String(value || '').trim();
  if (!source) return null;
  const match = source.match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/);
  if (!match) return null;
  return normalizeRegion({
    width: Number(match[1]),
    height: Number(match[2]),
    x: Number(match[3]),
    y: Number(match[4])
  });
}

export function parseSlurpOutput(value) {
  const source = String(value || '').trim();
  if (!source) return null;
  const match = source.match(/^(-?\d+),(-?\d+)\s+(\d+)x(\d+)$/);
  if (!match) return null;
  return normalizeRegion({
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4])
  });
}

export function regionToMonitorCrop(region, monitor) {
  const scale = Number(monitor.scaleFactor?.() ?? monitor.scaleFactor ?? 1) || 1;
  const monitorX = Number(monitor.x?.() ?? monitor.x ?? 0);
  const monitorY = Number(monitor.y?.() ?? monitor.y ?? 0);
  const localX = Math.round((region.x - monitorX) * scale);
  const localY = Math.round((region.y - monitorY) * scale);
  const width = Math.max(1, Math.round(region.width * scale));
  const height = Math.max(1, Math.round(region.height * scale));
  return { localX, localY, width, height };
}

export function normalizeRegion(value) {
  if (!value || typeof value !== 'object') return null;
  const x = toInt(value.x, 0, 10000);
  const y = toInt(value.y, 0, 10000);
  const width = toInt(value.width, 10, 2000);
  const height = toInt(value.height, 10, 2000);
  if (x === null || y === null || width === null || height === null) return null;
  return { x, y, width, height };
}

export function getScreenCaptureSupport() {
  const platform = process.platform;
  const wayland = Boolean(process.env.WAYLAND_DISPLAY);
  const hasDisplay = Boolean(process.env.DISPLAY) || wayland;
  const hasScreenshots = Boolean(screenshotsModule?.Monitor);

  if (platform === 'win32') {
    return {
      supported: true,
      picker: 'native',
      capture: hasScreenshots ? 'node-screenshots' : 'powershell',
      displayServer: 'windows'
    };
  }

  if (platform === 'linux') {
    const picker = cliAvailability.slop || cliAvailability.slurp ? 'cli' : 'manual';
    const capture = hasScreenshots ? 'node-screenshots' : (cliAvailability.grim ? 'grim' : 'grim');
    return {
      supported: hasDisplay,
      picker,
      capture,
      displayServer: wayland ? 'wayland' : 'x11',
      reason: hasDisplay ? undefined : 'No display server detected (set DISPLAY or WAYLAND_DISPLAY)'
    };
  }

  if (platform === 'darwin') {
    return {
      supported: hasScreenshots,
      picker: hasScreenshots ? 'native' : 'manual',
      capture: hasScreenshots ? 'node-screenshots' : 'none',
      displayServer: 'darwin',
      reason: hasScreenshots ? undefined : (screenshotsLoadError?.message || 'node-screenshots is not available')
    };
  }

  return {
    supported: false,
    picker: 'manual',
    capture: 'none',
    reason: 'unsupported platform'
  };
}

export async function refreshScreenCaptureSupport() {
  if (process.platform === 'linux') {
    cliAvailability.slop = await commandExists('slop');
    cliAvailability.slurp = await commandExists('slurp');
    cliAvailability.grim = await commandExists('grim');
  }
  return getScreenCaptureSupport();
}

export async function pickScreenRegion() {
  if (process.platform === 'win32') {
    return pickScreenRegionWindows();
  }
  if (process.platform === 'linux') {
    return pickScreenRegionLinux();
  }
  throw new Error('Screen region picker is not available on this platform');
}

export async function captureScreenRegion(region) {
  const normalized = normalizeRegion(region);
  if (!normalized) throw new Error('Invalid screen region');

  if (screenshotsModule?.Monitor) {
    try {
      return await captureWithNodeScreenshots(normalized);
    } catch (error) {
      if (process.platform === 'linux') {
        try {
          return await captureWithGrim(normalized);
        } catch (grimError) {
          grimError.cause = error;
          throw grimError;
        }
      }
      if (process.platform === 'win32') {
        return captureScreenRegionWindows(normalized);
      }
      throw error;
    }
  }

  if (process.platform === 'win32') {
    return captureScreenRegionWindows(normalized);
  }
  if (process.platform === 'linux') {
    return captureWithGrim(normalized);
  }

  throw new Error('Screen capture is not available on this platform');
}

async function captureWithNodeScreenshots(region) {
  const { Monitor } = screenshotsModule;
  const pointX = region.x + Math.floor(region.width / 2);
  const pointY = region.y + Math.floor(region.height / 2);
  const monitor = Monitor.fromPoint(pointX, pointY);
  if (!monitor) throw new Error('No monitor found for region');

  const image = await monitor.captureImage();
  const { localX, localY, width, height } = regionToMonitorCrop(region, monitor);
  const cropped = await image.crop(localX, localY, width, height);
  return cropped.toPng();
}

async function captureWithGrim(region) {
  const scriptPath = join(rootDir, 'scripts', 'capture-screen-region-wayland.sh');
  const imagePath = join(tmpdir(), `dotastreamkit-ocr-${randomBytes(8).toString('hex')}.png`);
  try {
    await execFileAsync('bash', [
      scriptPath,
      String(region.x),
      String(region.y),
      String(region.width),
      String(region.height),
      imagePath
    ], { maxBuffer: 1024 * 1024 });
    return readFile(imagePath);
  } finally {
    await unlink(imagePath).catch(() => {});
  }
}

async function captureScreenRegionWindows(region) {
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
  try {
    return await readFile(imagePath);
  } finally {
    await unlink(imagePath).catch(() => {});
  }
}

async function pickScreenRegionWindows() {
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

async function pickScreenRegionLinux() {
  await refreshScreenCaptureSupport();
  const scriptPath = join(rootDir, 'scripts', 'pick-screen-region.sh');
  const resultPath = join(tmpdir(), `dotastreamkit-region-${randomBytes(8).toString('hex')}.json`);
  try {
    const { stdout, stderr } = await execFileAsync('bash', [scriptPath, resultPath], {
      maxBuffer: 1024 * 1024
    });

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
    if (parsed.error) throw new Error(parsed.error);
    return normalizeRegion(parsed);
  } finally {
    await unlink(resultPath).catch(() => {});
  }
}

async function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(checker, [command], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

function toInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const truncated = Math.trunc(number);
  if (truncated < min || truncated > max) return null;
  return truncated;
}

await refreshScreenCaptureSupport();
