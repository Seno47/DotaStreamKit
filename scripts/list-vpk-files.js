import { readFile } from 'node:fs/promises';

const [,, vpkDirPath, matchText = '', limitText = '200'] = process.argv;

if (!vpkDirPath) {
  console.error('Usage: node scripts/list-vpk-files.js <pak01_dir.vpk> [matchText] [limit]');
  process.exit(1);
}

const limit = Math.max(1, Number.parseInt(limitText, 10) || 200);
const dir = await readFile(vpkDirPath);
const header = parseHeader(dir);
const entries = parseEntries(dir, header);
const matches = entries.filter((entry) => entry.fullPath.toLowerCase().includes(matchText.toLowerCase()));

console.log(`matches: ${matches.length}`);
for (const entry of matches.slice(0, limit)) {
  console.log(entry.fullPath);
}

function parseHeader(buffer) {
  const signature = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const treeSize = buffer.readUInt32LE(8);
  if (signature !== 0x55aa1234) throw new Error(`Unexpected VPK signature: 0x${signature.toString(16)}`);
  return {
    version,
    treeSize,
    headerSize: version === 1 ? 12 : 28
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
        offset += 4;
        const preloadBytes = buffer.readUInt16LE(offset); offset += 2;
        offset += 2;
        offset += 4;
        offset += 4;
        const terminator = buffer.readUInt16LE(offset); offset += 2;
        offset += preloadBytes;
        if (terminator !== 0xffff) throw new Error(`Bad entry terminator near ${offset}`);
        const folder = path.value === ' ' ? '' : path.value;
        entries.push({ fullPath: `${folder ? `${folder}/` : ''}${filename.value}.${ext.value}` });
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
