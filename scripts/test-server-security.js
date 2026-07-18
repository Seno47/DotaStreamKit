import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = await mkdtemp(join(tmpdir(), 'dotastreamkit-security-test-'));
const port = 40000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const password = 'integration-secret';
const gsiToken = 'b'.repeat(64);
let output = '';

await mkdir(join(dataDir, 'assets'), { recursive: true });
await writeFile(join(dataDir, 'config.json'), JSON.stringify({
  deployment: { mode: 'server', publicBaseUrl: `http://127.0.0.1:${port}` },
  dota: { gsiToken }
}));
await writeFile(join(dataDir, 'state.json'), '{}');
await writeFile(join(dataDir, 'twitch-token.json'), '{}');

const child = spawn(process.execPath, ['src/server.js'], {
  cwd: rootDir,
  env: {
    ...process.env,
    DOTASTREAMKIT_DATA_DIR: dataDir,
    DOTASTREAMKIT_SERVER_PASSWORD: password,
    PORT: String(port)
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true
});
child.stdout.on('data', (chunk) => { output += chunk.toString(); });
child.stderr.on('data', (chunk) => { output += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server exited early (${child.exitCode})\n${output}`);
    try {
      const response = await fetch(`${baseUrl}/api/state`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start\n${output}`);
}

try {
  await waitForServer();
  const remoteHeaders = { 'x-forwarded-for': '203.0.113.10' };
  const unauthenticated = await fetch(`${baseUrl}/api/state`, { headers: remoteHeaders });
  assert.equal(unauthenticated.status, 401);
  assert.match(unauthenticated.headers.get('www-authenticate') || '', /^Basic/i);

  const spoofedForwardedChain = await fetch(`${baseUrl}/api/state`, {
    headers: { 'x-forwarded-for': '127.0.0.1, 203.0.113.10' }
  });
  assert.equal(spoofedForwardedChain.status, 401);

  const validCredentials = Buffer.from(`viewer:${password}`).toString('base64');
  const authorization = `Basic ${validCredentials}`;
  const requestRemoteState = (value, timeoutMs = 5_000) => fetch(`${baseUrl}/api/state`, {
    headers: {
      ...remoteHeaders,
      ...(value === undefined ? {} : { authorization: value })
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  const authenticated = await fetch(`${baseUrl}/api/state`, {
    headers: { ...remoteHeaders, authorization }
  });
  assert.equal(authenticated.status, 200);

  const compatibleWhitespace = await requestRemoteState(`bAsIc \t  ${validCredentials}`);
  assert.equal(compatibleWhitespace.status, 200);

  for (const [label, value] of [
    ['non-Basic scheme', `Bearer ${validCredentials}`],
    ['missing credentials', 'Basic'],
    ['malformed Base64', 'Basic !!!not-base64!!!'],
    ['wrong password', `Basic ${Buffer.from('viewer:wrong-secret').toString('base64')}`]
  ]) {
    const response = await requestRemoteState(value);
    assert.equal(response.status, 401, label);
    assert.match(response.headers.get('www-authenticate') || '', /^Basic/i, label);
  }

  const hostileAuthorization = `Basic ${' '.repeat(8_192)}!`;
  const hostileResponse = await requestRemoteState(hostileAuthorization, 2_000);
  assert.equal(hostileResponse.status, 401);
  assert.match(hostileResponse.headers.get('www-authenticate') || '', /^Basic/i);
  assert.equal(child.exitCode, null);

  const recoveredResponse = await requestRemoteState(authorization, 2_000);
  assert.equal(recoveredResponse.status, 200);

  const crossSite = await fetch(`${baseUrl}/api/config`, {
    method: 'POST',
    headers: {
      ...remoteHeaders,
      authorization,
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site',
      'content-type': 'application/json'
    },
    body: '{}'
  });
  assert.equal(crossSite.status, 403);

  const spoofedGsi = await fetch(`${baseUrl}/gsi/dota2`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ map: {} })
  });
  assert.equal(spoofedGsi.status, 403);
  console.log('Server security checks passed');
} finally {
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]);
  await rm(dataDir, { recursive: true, force: true });
}
