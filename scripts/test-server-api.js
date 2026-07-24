import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = await mkdtemp(join(tmpdir(), 'dotastreamkit-server-test-'));
const port = 38000 + Math.floor(Math.random() * 2000);
const baseUrl = `http://127.0.0.1:${port}`;
const gsiToken = 'a'.repeat(64);
let output = '';

await mkdir(join(dataDir, 'assets'), { recursive: true });
await writeFile(join(dataDir, 'config.json'), JSON.stringify({
  dota: { gsiToken },
  predictions: { windowSeconds: 420, autoLockAtGameSeconds: 0 },
  spectatorPredictions: { windowSeconds: 420, autoLockAtGameSeconds: 75 }
}));
const startupState = JSON.stringify({
  streamerStats: { wins: 7, losses: 3 },
  events: [{ at: '2026-01-01T00:00:00.000Z', type: 'test', message: 'startup sentinel' }]
});
await writeFile(join(dataDir, 'state.json'), '{invalid json');
await writeFile(join(dataDir, 'state.json.bak'), startupState);
await writeFile(join(dataDir, 'twitch-token.json'), '{}');

const child = spawn(process.execPath, ['src/server.js'], {
  cwd: rootDir,
  env: {
    ...process.env,
    DOTASTREAMKIT_DATA_DIR: dataDir,
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
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start\n${output}`);
}

async function request(path, body = undefined) {
  const requestBody = path === '/gsi/dota2' && body && typeof body === 'object'
    ? { ...body, auth: { ...(body.auth || {}), token: gsiToken } }
    : body;
  const response = await fetch(`${baseUrl}${path}`, {
    method: requestBody === undefined ? 'GET' : 'POST',
    headers: requestBody === undefined ? {} : { 'content-type': 'application/json' },
    body: requestBody === undefined ? undefined : JSON.stringify(requestBody)
  });
  const json = await response.json().catch(() => ({}));
  return { response, json };
}

async function state() {
  const { response, json } = await request('/api/state');
  assert.equal(response.status, 200);
  return json;
}

try {
  await waitForServer();

  let duplicateOutput = '';
  const duplicate = spawn(process.execPath, ['src/server.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      DOTASTREAMKIT_DATA_DIR: dataDir,
      PORT: String(port + 1)
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  duplicate.stdout.on('data', (chunk) => { duplicateOutput += chunk.toString(); });
  duplicate.stderr.on('data', (chunk) => { duplicateOutput += chunk.toString(); });
  const duplicateExitCode = await Promise.race([
    new Promise((resolve) => duplicate.once('exit', resolve)),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Duplicate server did not exit')), 5000))
  ]);
  assert.equal(duplicateExitCode, 1, duplicateOutput);
  assert.match(duplicateOutput, /already running/i);

  let snapshot = await state();
  assert.equal(snapshot.state.streamerStats.wins, 7);
  assert.equal(snapshot.state.streamerStats.losses, 3);
  assert.equal(snapshot.config.dota.gsiToken, '********');
  assert.equal(snapshot.config.predictions.windowSeconds, 420);
  assert.equal(snapshot.config.predictions.autoLockAtGameSeconds, 0);
  assert.equal(snapshot.config.spectatorPredictions.windowSeconds, 420);
  assert.equal(snapshot.config.spectatorPredictions.autoLockAtGameSeconds, 75);
  assert.ok(snapshot.state.events.some((event) => event.message === 'startup sentinel'));
  assert.equal((await request('/api/streamer-stats/reset', {})).response.status, 200);

  const unauthenticatedGsi = await fetch(`${baseUrl}/gsi/dota2`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ map: {} })
  });
  assert.equal(unauthenticatedGsi.status, 403);
  const crossSiteConfig = await fetch(`${baseUrl}/api/config`, {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site'
    },
    body: '{}'
  });
  assert.equal(crossSiteConfig.status, 403);

  const region = await request('/api/menu-mmr-ocr/set-region', {
    x: -1920,
    y: -200,
    width: 120,
    height: 30
  });
  assert.equal(region.response.status, 200, JSON.stringify(region.json));
  assert.deepEqual(region.json.region, { x: -1920, y: -200, width: 120, height: 30 });

  const configUpdate = await request('/api/config', {
    predictions: {
      windowSeconds: 420,
      autoLockAtGameSeconds: 0
    },
    spectatorPredictions: {
      windowSeconds: 420,
      autoLockAtGameSeconds: 120
    },
    protection: {
      matchIntel: {
        showStreamerStats: true,
        showStreamerRankMedal: false,
        autoUpdateStreamerMmr: false,
        streamerAccounts: []
      }
    }
  });
  assert.equal(configUpdate.response.status, 200);
  assert.equal(configUpdate.json.config.predictions.windowSeconds, 420);
  assert.equal(configUpdate.json.config.predictions.autoLockAtGameSeconds, 0);
  assert.equal(configUpdate.json.config.spectatorPredictions.windowSeconds, 420);
  assert.equal(configUpdate.json.config.spectatorPredictions.autoLockAtGameSeconds, 120);
  const persistedConfig = JSON.parse(await readFile(join(dataDir, 'config.json'), 'utf8'));
  assert.equal(persistedConfig.predictions.windowSeconds, 420);
  assert.equal(persistedConfig.predictions.autoLockAtGameSeconds, 0);
  assert.equal(persistedConfig.spectatorPredictions.windowSeconds, 420);
  assert.equal(persistedConfig.spectatorPredictions.autoLockAtGameSeconds, 120);

  const spectator = await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', matchid: 'spectated-1', clock_time: 100 },
    player: { activity: 'spectating', accountid: 999, name: 'Observed player' }
  });
  assert.equal(spectator.response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.playerActivity, 'spectating');
  assert.deepEqual(snapshot.config.protection.matchIntel.streamerAccounts, []);

  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_PRE_GAME', clock_time: -5 },
    player: { activity: 'spectating' }
  })).response.status, 200);
  snapshot = await state();
  const firstSpectatorCycle = snapshot.state.gsi.spectatorCycle;
  assert.ok(firstSpectatorCycle > 0);
  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_INIT', clock_time: 0 },
    player: { activity: 'menu' }
  })).response.status, 200);
  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_PRE_GAME', clock_time: -5 },
    player: { activity: 'spectating' }
  })).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.spectatorCycle, firstSpectatorCycle + 1);
  const secondSpectatorCycle = snapshot.state.gsi.spectatorCycle;
  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', clock_time: 600 },
    player: { activity: 'spectating' },
    events: [{ event_type: 'roshan_killed', game_time: 600 }]
  })).response.status, 200);
  snapshot = await state();
  assert.ok(snapshot.state.matchIntel.roshan);
  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', clock_time: 0 },
    player: { activity: 'spectating' }
  })).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.spectatorCycle, secondSpectatorCycle + 1);
  assert.equal(snapshot.state.matchIntel.roshan, null);

  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', clock_time: 900 },
    player: { activity: 'spectating' }
  })).response.status, 200);
  snapshot = await state();
  const anonymousLateGameCycle = snapshot.state.gsi.spectatorCycle;
  assert.equal((await request('/gsi/dota2', {
    map: { game_state: 'DOTA_GAMERULES_STATE_PRE_GAME', matchid: 'spectated-2', clock_time: -5 },
    player: { activity: 'spectating' }
  })).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.spectatorCycle, anonymousLateGameCycle + 1);
  assert.equal(snapshot.state.gsi.activeMatchId, 'spectated-2');

  const livePayload = {
    map: {
      game_state: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS',
      matchid: 'own-1',
      clock_time: 500,
      win_team: 'radiant'
    },
    player: {
      activity: 'playing',
      accountid: 111,
      name: 'Streamer',
      team_name: 'radiant',
      player_slot: 0,
      kills: 2,
      deaths: 1,
      assists: 4
    },
    hero: { id: 14, name: 'npc_dota_hero_pudge', level: 10 },
    allplayers: {
      player0: { team_name: 'radiant', player_slot: 0, accountid: 9999, kills: 99, deaths: 99, assists: 99 },
      player1: { team_name: 'radiant', player_slot: 0, accountid: 111, kills: 2, deaths: 1, assists: 4 },
      player2: { team_name: 'radiant', player_slot: 1, accountid: 112, kills: 0, deaths: 0, assists: 0 },
      player3: { team_name: 'radiant', player_slot: 2, accountid: 113, kills: 0, deaths: 0, assists: 0 },
      player4: { team_name: 'radiant', player_slot: 3, accountid: 114, kills: 0, deaths: 0, assists: 0 },
      player5: { team_name: 'radiant', player_slot: 4, accountid: 115, kills: 0, deaths: 0, assists: 0 },
      player6: { team_name: 'dire', player_slot: 128, accountid: 222, kills: 3, deaths: 2, assists: 5 },
      player7: { team_name: 'dire', player_slot: 129, accountid: 223, kills: 0, deaths: 0, assists: 0 },
      player8: { team_name: 'dire', player_slot: 130, accountid: 224, kills: 0, deaths: 0, assists: 0 },
      player9: { team_name: 'dire', player_slot: 131, accountid: 225, kills: 0, deaths: 0, assists: 0 },
      player10: { team_name: 'dire', player_slot: 132, accountid: 226, kills: 0, deaths: 0, assists: 0 }
    }
  };
  assert.equal((await request('/gsi/dota2', livePayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.streamerStats.wins, 0);
  assert.equal(snapshot.state.gsi.radiantKills, 2);
  assert.equal(snapshot.state.gsi.direKills, 3);
  assert.equal(snapshot.state.gsi.totalKills, 5);
  assert.deepEqual(snapshot.config.protection.matchIntel.streamerAccounts.map((account) => account.accountId), [111]);

  const completeRadiantPayload = structuredClone(livePayload);
  for (const key of ['player7', 'player8', 'player9', 'player10']) delete completeRadiantPayload.allplayers[key];
  assert.equal((await request('/gsi/dota2', completeRadiantPayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.radiantKills, 2);
  assert.equal(snapshot.state.gsi.teamKills, 2);
  assert.equal(snapshot.state.gsi.direKills, null);
  assert.equal(snapshot.state.gsi.enemyKills, null);
  assert.equal(snapshot.state.gsi.totalKills, null);

  const sparseRosterPayload = structuredClone(livePayload);
  for (const key of ['player3', 'player4', 'player5', 'player7', 'player8', 'player9', 'player10']) {
    delete sparseRosterPayload.allplayers[key];
  }
  assert.equal((await request('/gsi/dota2', sparseRosterPayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.radiantKills, null);
  assert.equal(snapshot.state.gsi.direKills, null);
  assert.equal(snapshot.state.gsi.totalKills, null);

  const incompleteStatsPayload = structuredClone(livePayload);
  delete incompleteStatsPayload.allplayers.player1.kills;
  assert.equal((await request('/gsi/dota2', incompleteStatsPayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.radiantKills, null);
  assert.equal(snapshot.state.gsi.totalKills, null);

  const nextMatchSparsePayload = {
    map: { game_state: 'DOTA_GAMERULES_STATE_PRE_GAME', matchid: 'own-2', clock_time: -5 },
    player: {
      activity: 'playing',
      accountid: 111,
      name: 'Streamer',
      team_name: 'radiant',
      player_slot: 0
    }
  };
  assert.equal((await request('/gsi/dota2', nextMatchSparsePayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.gsi.heroName, null);
  assert.equal(snapshot.state.gsi.kills, null);
  assert.equal(snapshot.state.gsi.playerHeroPicked, false);

  const postGamePayload = structuredClone(livePayload);
  postGamePayload.map.game_state = 'DOTA_GAMERULES_STATE_POST_GAME';
  postGamePayload.map.matchid = 'own-2';
  assert.equal((await request('/gsi/dota2', postGamePayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.streamerStats.wins, 1);

  assert.equal((await request('/api/streamer-stats/reset', {})).response.status, 200);
  assert.equal((await request('/gsi/dota2', postGamePayload)).response.status, 200);
  snapshot = await state();
  assert.equal(snapshot.state.streamerStats.wins, 0);
  assert.equal(snapshot.state.streamerStats.lastMatchId, 'own-2');

  const oversized = await fetch(`${baseUrl}/api/config`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ padding: 'x'.repeat(2 * 1024 * 1024) })
  });
  assert.equal(oversized.status, 413);

  await new Promise((resolve) => setTimeout(resolve, 1200));
  const persistedState = JSON.parse(await readFile(join(dataDir, 'state.json'), 'utf8'));
  assert.equal(Object.hasOwn(persistedState, 'twitchToken'), false);

  console.log('Server API checks passed');
} finally {
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000))
  ]);
  await rm(dataDir, { recursive: true, force: true });
}
