import assert from 'node:assert/strict';
import {
  applyStreamerMatchResult,
  normalizeStreamerStatsConfig,
  rankMedalFromMmr,
  rankMedalFromRankTier,
  restorePreviousStreamerSession,
  updateStreamerSessionPresence
} from '../src/streamer-stats.js';

assert.equal(rankMedalFromMmr(0).medal, 'calibration');
assert.equal(rankMedalFromMmr(1).medal, 1);
assert.equal(rankMedalFromMmr(1).stars, 1);
assert.equal(rankMedalFromMmr(153).stars, 1);
assert.equal(rankMedalFromMmr(154).stars, 2);
assert.equal(rankMedalFromMmr(769).stars, 5);
assert.equal(rankMedalFromMmr(770).medal, 2);
assert.equal(rankMedalFromMmr(770).stars, 1);
assert.equal(rankMedalFromMmr(4619).medal, 6);
assert.equal(rankMedalFromMmr(4620).medal, 7);
assert.equal(rankMedalFromMmr(4820).stars, 2);
assert.equal(rankMedalFromMmr(5620).medal, 8);
assert.equal(rankMedalFromMmr(5620).stars, 0);
assert.equal(rankMedalFromRankTier(75).medal, 7);
assert.equal(rankMedalFromRankTier(75).stars, 5);
assert.equal(rankMedalFromRankTier(80).medal, 8);
assert.equal(rankMedalFromRankTier(80).stars, 0);

const normalizedConfig = { streamerMmr: 120000 };
normalizeStreamerStatsConfig(normalizedConfig);
assert.equal(normalizedConfig.streamerMmr, 99999);
assert.equal(normalizedConfig.autoBindStreamerAccounts, true);

const normalizedAccountsConfig = {
  streamerAccounts: [
    { accountId: '123', label: 'Main' },
    { id: '123', label: 'Duplicate' },
    { dotaId: '456', name: 'Smurf' },
    { accountId: 'bad', label: 'Invalid' }
  ]
};
normalizeStreamerStatsConfig(normalizedAccountsConfig);
assert.deepEqual(normalizedAccountsConfig.streamerAccounts, [
  { accountId: 123, label: 'Duplicate', mmr: 0, boundAt: null },
  { accountId: 456, label: 'Smurf', mmr: 0, boundAt: null }
]);

const config = {
  showStreamerStats: true,
  autoUpdateStreamerMmr: true,
  streamerMmr: 5000,
  streamerMmrWinDelta: 25,
  streamerMmrLossDelta: 25
};
let applied = applyStreamerMatchResult({}, config, 'win', '123', new Date('2026-05-01T10:00:00Z'));
assert.equal(applied.state.wins, 1);
assert.equal(applied.state.losses, 0);
assert.equal(applied.config.streamerMmr, 5025);
assert.equal(applied.state.lastMmrChange, 25);

applied = applyStreamerMatchResult(applied.state, applied.config, 'win', '123', new Date('2026-05-01T10:10:00Z'));
assert.equal(applied.changed, false);
assert.equal(applied.state.wins, 1);

applied = applyStreamerMatchResult(applied.state, applied.config, 'lose', '124', new Date('2026-05-01T10:20:00Z'));
assert.equal(applied.state.wins, 1);
assert.equal(applied.state.losses, 1);
assert.equal(applied.config.streamerMmr, 5000);
assert.equal(applied.state.lastMmrChange, -25);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 1 }, 'lose', '125', new Date('2026-05-01T10:30:00Z'));
assert.equal(applied.config.streamerMmr, 1);
assert.equal(applied.state.lastMmrChange, 0);
assert.equal(applied.configChanged, false);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 99990 }, 'win', '126', new Date('2026-05-01T10:40:00Z'));
assert.equal(applied.config.streamerMmr, 99999);
assert.equal(applied.state.lastMmrChange, 9);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 0 }, 'win', '127', new Date('2026-05-01T10:50:00Z'));
assert.equal(applied.config.streamerMmr, 0);
assert.equal(applied.state.lastMmrChange, 0);
assert.equal(applied.configChanged, false);

applied = applyStreamerMatchResult(
  { streamerAccountId: 456 },
  {
    ...config,
    streamerMmr: 5000,
    streamerAccounts: [
      { accountId: 123, label: 'Main', mmr: 4000 },
      { accountId: 456, label: 'Second', mmr: 6000 }
    ]
  },
  'lose',
  '128',
  new Date('2026-05-01T11:00:00Z')
);
assert.equal(applied.config.streamerMmr, 5000);
assert.equal(applied.config.streamerAccounts[1].mmr, 5975);
assert.equal(applied.state.accountSessions['456'].wins, 0);
assert.equal(applied.state.accountSessions['456'].losses, 1);
assert.equal(applied.state.lastMmrChange, -25);

let session = updateStreamerSessionPresence(
  { wins: 2, losses: 1, sessionStartedAt: '2026-05-01T08:00:00Z' },
  false,
  new Date('2026-05-01T09:00:00Z')
);
assert.equal(session.state.wins, 2);
assert.ok(session.state.offlineSince);

session = updateStreamerSessionPresence(session.state, false, new Date('2026-05-01T11:01:00Z'));
assert.equal(session.state.wins, 0);
assert.equal(session.state.losses, 0);
assert.deepEqual(session.state.accountSessions, {});
assert.equal(session.state.previousSession.wins, 2);

const restored = restorePreviousStreamerSession(session.state, new Date('2026-05-01T11:02:00Z'));
assert.equal(restored.state.wins, 2);
assert.equal(restored.state.losses, 1);
assert.equal(restored.state.previousSession, null);

console.log('Streamer stats checks passed');
