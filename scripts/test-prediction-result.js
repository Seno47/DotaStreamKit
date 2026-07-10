import assert from 'node:assert/strict';
import { inferPredictionResult, latchPredictionResult } from '../src/prediction-result.js';

const postGame = { gameState: 'DOTA_GAMERULES_STATE_POST_GAME' };

assert.equal(inferPredictionResult({ type: 'game_duration_at_least', deadlineSeconds: 1800 }, postGame), null);
assert.equal(inferPredictionResult(
  { type: 'game_duration_at_least', deadlineSeconds: 1800 },
  { ...postGame, clockTime: 1700 }
), 'no');
assert.equal(inferPredictionResult(
  { type: 'game_duration_at_least', deadlineSeconds: 1800 },
  { gameState: 'GAME_IN_PROGRESS', clockTime: 1800 }
), 'yes');

const killsByMinute = { type: 'total_kills_by_minute', deadlineSeconds: 1200, target: 20 };
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1200, totalKills: null }), null);
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1200, totalKills: 19 }), 'no');
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1200, totalKills: 20 }), 'yes');
assert.equal(inferPredictionResult(killsByMinute, { ...postGame, clockTime: 1100, totalKills: 25 }), 'yes');
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1190, totalKills: 20 }), 'yes');
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1210, totalKills: 19 }), 'no');
assert.equal(inferPredictionResult(killsByMinute, { clockTime: 1210, totalKills: 20 }), null);

const noDeath = { type: 'no_death_until', deadlineSeconds: 600 };
assert.equal(inferPredictionResult(noDeath, { clockTime: 600, deaths: null }), null);
assert.equal(inferPredictionResult(noDeath, { clockTime: 600, deaths: 0 }), 'yes');
assert.equal(inferPredictionResult(noDeath, { clockTime: 200, deaths: 1 }), 'no');
assert.equal(inferPredictionResult(noDeath, { ...postGame, clockTime: 500, deaths: 0 }), 'no');
assert.equal(inferPredictionResult(noDeath, { clockTime: 601, deaths: 0 }), 'yes');
assert.equal(inferPredictionResult(noDeath, { clockTime: 601, deaths: 1 }), null);
const noDeathLatched = latchPredictionResult(noDeath, { clockTime: 600, deaths: 0 }, () => null, new Date('2026-01-01T00:00:00Z'));
assert.equal(noDeathLatched.result, 'yes');
assert.equal(noDeathLatched.changed, true);
const noDeathAfterLateDeath = latchPredictionResult(noDeathLatched.meta, { clockTime: 720, deaths: 1 });
assert.equal(noDeathAfterLateDeath.result, 'yes');
assert.equal(noDeathAfterLateDeath.changed, false);

const lastHits = { type: 'last_hits_by_minute', deadlineSeconds: 600, target: 50 };
assert.equal(inferPredictionResult(lastHits, { clockTime: 600, lastHits: null }), null);
assert.equal(inferPredictionResult(lastHits, { clockTime: 600, lastHits: 49 }), 'no');
assert.equal(inferPredictionResult(lastHits, { ...postGame, clockTime: 500, lastHits: 49 }), 'no');
assert.equal(inferPredictionResult(lastHits, { ...postGame, clockTime: 500, lastHits: 50 }), 'yes');
assert.equal(inferPredictionResult(lastHits, { clockTime: 590, lastHits: 50 }), 'yes');
assert.equal(inferPredictionResult(lastHits, { clockTime: 610, lastHits: 49 }), 'no');
assert.equal(inferPredictionResult(lastHits, { clockTime: 610, lastHits: 50 }), null);

assert.equal(inferPredictionResult(
  { type: 'streamer_kills', target: 5 },
  { ...postGame, kills: null }
), null);
assert.equal(inferPredictionResult(
  { type: 'streamer_kills', target: 5 },
  { ...postGame, kills: 4 }
), 'no');

assert.equal(inferPredictionResult(
  { type: 'custom_condition', condition: 'metric_reaches_target', metric: 'team_kills', target: 10 },
  { ...postGame, teamKills: null }
), null);
assert.equal(inferPredictionResult(
  { type: 'custom_condition', condition: 'metric_by_minute', metric: 'clock_minutes', target: 20, deadlineSeconds: 1200 },
  { clockTime: 1200 }
), 'yes');
assert.equal(inferPredictionResult(
  { type: 'custom_condition', condition: 'metric_by_minute', metric: 'team_kills', target: 20, deadlineSeconds: 1200 },
  { clockTime: 1210, teamKills: 20 }
), null);
assert.equal(inferPredictionResult(
  { type: 'custom_condition', condition: 'metric_by_minute', metric: 'team_kills', target: 20, deadlineSeconds: 1200 },
  { ...postGame, clockTime: 1100, teamKills: 25 }
), 'yes');

assert.equal(inferPredictionResult({ type: 'win_loss' }, postGame, () => 'win'), 'yes');
assert.equal(inferPredictionResult({ type: 'win_loss' }, postGame, () => null), null);

console.log('Prediction result checks passed');
