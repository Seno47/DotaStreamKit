import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';

const [,, vpkDirPath, matchText, outDir = 'data/extracted'] = process.argv;

if (!vpkDirPath || !matchText) {
  console.error('Usage: node scripts/extract-vpk-file.js <pak01_dir.vpk> <matchText> [outDir]');
  process.exit(1);
}

const dir = await readFile(vpkDirPath);
const header = parseHeader(dir);
const entries = parseEntries(dir, header);
const matches = entries.filter((entry) => entry.fullPath.toLowerCase().includes(matchText.toLowerCase()));

console.log(`matches: ${matches.length}`);
for (const entry of matches.slice(0, 50)) {
  console.log(`${entry.fullPath} archive=${entry.archiveIndex} offset=${entry.offset} length=${entry.length} preload=${entry.preload.length}`);
}

await mkdir(outDir, { recursive: true });
for (const entry of matches) {
  const output = join(outDir, entry.fullPath.replace(/[\\/]/g, '__'));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, await extractEntry(vpkDirPath, dir, header, entry));
  console.log(`wrote ${output}`);
}

function parseHeader(buffer) {
  const signature = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const treeSize = buffer.readUInt32LE(8);
  if (signature !== 0x55aa1234) throw new Error(`Unexpected VPK signature: 0x${signature.toString(16)}`);
  return {
    version,
    treeSize,
    headerSize: version === 1 ? 12 : 28,
    fileDataOffset: (version === 1 ? 12 : 28) + treeSize
  };
}

function parseEntries(buffer, header) {
  let offset = header.headerSize;
  const entries = [];
  while (offset < header.headerSize + header.treeSize) {
    const ext = readCString(buffer, offset);
    offset = ext.next;
    if (!ext.value) break;
    while (true) {
      const path = readCString(buffer, offset);
      offset = path.next;
      if (!path.value) break;
      while (true) {
        const filename = readCString(buffer, offset);
        offset = filename.next;
        if (!filename.value) break;
        const crc = buffer.readUInt32LE(offset); offset += 4;
        const preloadBytes = buffer.readUInt16LE(offset); offset += 2;
        const archiveIndex = buffer.readUInt16LE(offset); offset += 2;
        const entryOffset = buffer.readUInt32LE(offset); offset += 4;
        const entryLength = buffer.readUInt32LE(offset); offset += 4;
        const terminator = buffer.readUInt16LE(offset); offset += 2;
        const preload = buffer.subarray(offset, offset + preloadBytes);
        offset += preloadBytes;
        if (terminator !== 0xffff) throw new Error(`Bad entry terminator near ${offset}`);
        const folder = path.value === ' ' ? '' : path.value;
        const fullPath = `${folder ? `${folder}/` : ''}${filename.value}.${ext.value}`;
        entries.push({ fullPath, crc, preloadBytes, archiveIndex, offset: entryOffset, length: entryLength, preload });
      }
    }
  }
  return entries;
}

function readCString(buffer, start) {
  let end = start;
  while (end < buffer.length && buffer[end] !== 0) end += 1;
  return { value: buffer.toString('utf8', start, end), next: end + 1 };
}

async function extractEntry(vpkDirPath, dirBuffer, header, entry) {
  const chunks = [entry.preload];
  if (entry.length > 0) {
    const archivePath = entry.archiveIndex === 0x7fff
      ? vpkDirPath
      : vpkDirPath.replace(/_dir\.vpk$/i, `_${String(entry.archiveIndex).padStart(3, '0')}.vpk`);
    const archive = entry.archiveIndex === 0x7fff ? dirBuffer : await readFile(archivePath);
    const base = entry.archiveIndex === 0x7fff ? header.fileDataOffset : 0;
    chunks.push(archive.subarray(base + entry.offset, base + entry.offset + entry.length));
  }
  return Buffer.concat(chunks);
}
