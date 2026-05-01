import assert from 'node:assert/strict';
import {
  applyStreamerMatchResult,
  rankMedalFromMmr,
  rankMedalFromRankTier,
  restorePreviousStreamerSession,
  updateStreamerSessionPresence
} from '../src/streamer-stats.js';

assert.equal(rankMedalFromMmr(0).medal, 0);
assert.equal(rankMedalFromMmr(1).medal, 1);
assert.equal(rankMedalFromMmr(770).medal, 2);
assert.equal(rankMedalFromMmr(4619).medal, 6);
assert.equal(rankMedalFromMmr(4620).medal, 7);
assert.equal(rankMedalFromMmr(5620).medal, 8);
assert.equal(rankMedalFromRankTier(75).medal, 7);
assert.equal(rankMedalFromRankTier(80).medal, 8);

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
assert.equal(session.state.previousSession.wins, 2);

const restored = restorePreviousStreamerSession(session.state, new Date('2026-05-01T11:02:00Z'));
assert.equal(restored.state.wins, 2);
assert.equal(restored.state.losses, 1);
assert.equal(restored.state.previousSession, null);

console.log('Streamer stats checks passed');
