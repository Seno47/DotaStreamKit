import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const assetDir = join(rootDir, 'data', 'assets');
const screenshotName = 'draft-screenshot.png';
const slotNames = Array.from({ length: 10 }, (_, index) => `topbar-slot-${index}.png`);
const slots = [
  { left: 208, top: 0, width: 122, height: 66 },
  { left: 333, top: 0, width: 122, height: 66 },
  { left: 457, top: 0, width: 122, height: 66 },
  { left: 581, top: 0, width: 122, height: 66 },
  { left: 706, top: 0, width: 122, height: 66 },
  { left: 1096, top: 0, width: 122, height: 66 },
  { left: 1220, top: 0, width: 122, height: 66 },
  { left: 1344, top: 0, width: 122, height: 66 },
  { left: 1468, top: 0, width: 122, height: 66 },
  { left: 1592, top: 0, width: 122, height: 66 }
];

await mkdir(assetDir, { recursive: true });

const screenshotPath = join(assetDir, screenshotName);
let screenshot = null;

try {
  await stat(screenshotPath);
  const input = await readFile(screenshotPath);
  screenshot = await sharp(input, { failOn: 'warning' })
    .rotate()
    .resize({ width: 1920, height: 1080, fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90 })
    .toBuffer();
  await writeFile(screenshotPath, screenshot);
  console.log(`${screenshotName}: ${formatBytes(input.length)} -> ${formatBytes(screenshot.length)}`);
} catch {
  console.log(`${screenshotName}: missing`);
}

if (screenshot) {
  for (let index = 0; index < slots.length; index += 1) {
    await sharp(screenshot)
      .extract(slots[index])
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90 })
      .toFile(join(assetDir, slotNames[index]));
  }
}

for (const name of slotNames) {
  try {
    const file = await readFile(join(assetDir, name));
    console.log(`${name}: ${formatBytes(file.length)}`);
  } catch {
    console.log(`${name}: missing`);
  }
}

function formatBytes(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}
