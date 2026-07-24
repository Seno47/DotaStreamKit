import assert from 'node:assert/strict';
import {
  buildTwitchPredictionCreateBody,
  hasCompletePredictionOutcomePoints,
  hasPointsOnEveryPredictionOutcome,
  isLeftActiveGameViewCancelSignal,
  isPredictionProfileCompatibleWithActivity,
  isPredictionUncontested,
  predictionOutcomePoints,
  shouldAutoLockPredictionAtGameTime,
  withPredictionCreationLifecycle,
  shouldContinueLeftGameViewCancelCandidate
} from '../src/prediction-safety.js';

function prediction(points) {
  return {
    outcomes: points.map((channelPoints) => ({ channelPoints }))
  };
}

assert.deepEqual(predictionOutcomePoints(prediction([0, 10])), [0, 10]);
assert.equal(hasCompletePredictionOutcomePoints(prediction([0, 10])), true);
assert.equal(isPredictionUncontested(prediction([0, 10])), true);

assert.equal(hasPointsOnEveryPredictionOutcome(prediction([5, 10])), true);
assert.equal(isPredictionUncontested(prediction([5, 10])), false);

assert.equal(hasCompletePredictionOutcomePoints({ outcomes: [{}, { channelPoints: 10 }] }), false);
assert.equal(isPredictionUncontested({ outcomes: [{}, { channelPoints: 10 }] }), false);
assert.equal(hasPointsOnEveryPredictionOutcome({ outcomes: [{}, { channelPoints: 10 }] }), false);

assert.equal(hasCompletePredictionOutcomePoints(prediction([null, 10])), false);
assert.equal(isPredictionUncontested(prediction([null, 10])), false);

assert.equal(hasCompletePredictionOutcomePoints({ outcomes: [{ channelPoints: '3' }, { channelPoints: '7' }] }), true);
assert.equal(hasPointsOnEveryPredictionOutcome({ outcomes: [{ channelPoints: '3' }, { channelPoints: '7' }] }), true);

assert.equal(hasCompletePredictionOutcomePoints(prediction([10])), false);
assert.equal(isPredictionUncontested(prediction([10])), false);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: 'lobby-1', gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', inGameScreen: true, clockTime: 90 },
  { activeMatchId: 'lobby-1', gameState: null, leftGameView: true }
), true);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: null, gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', inGameScreen: true, clockTime: 90 },
  { activeMatchId: null, gameState: null, inGameScreen: false, leftGameView: false }
), true);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: 'match-1', gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', inGameScreen: true, clockTime: 90 },
  { activeMatchId: 'match-1', gameState: 'DOTA_GAMERULES_STATE_DISCONNECT', leftGameView: true }
), false);

const leftViewCandidate = {
  kind: 'left_game_view',
  reason: 'streamer left the active game view before prediction was resolved',
  matchId: 'lobby-1',
  delaySeconds: 15,
  since: '2026-05-01T10:00:00Z'
};
assert.equal(shouldContinueLeftGameViewCancelCandidate(leftViewCandidate, {
  gameState: null,
  inGameScreen: false,
  leftGameView: true
}), true);
assert.equal(shouldContinueLeftGameViewCancelCandidate(leftViewCandidate, {
  gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS',
  inGameScreen: true,
  leftGameView: false
}), false);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: null, gameState: null, inGameScreen: false, clockTime: null },
  { activeMatchId: null, gameState: null, leftGameView: true }
), false);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: 'stale-match', gameState: null, inGameScreen: false, clockTime: null },
  { activeMatchId: 'stale-match', gameState: null, leftGameView: true }
), false);

assert.equal(isLeftActiveGameViewCancelSignal(
  { activeMatchId: 'match-1', gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', inGameScreen: true, clockTime: 90 },
  { activeMatchId: 'match-1', gameState: 'DOTA_GAMERULES_STATE_GAME_IN_PROGRESS', inGameScreen: true, leftGameView: false }
), false);

assert.equal(isPredictionProfileCompatibleWithActivity('own', 'playing'), true);
assert.equal(isPredictionProfileCompatibleWithActivity('own', 'spectating'), false);
assert.equal(isPredictionProfileCompatibleWithActivity('spectator', 'spectating'), true);
assert.equal(isPredictionProfileCompatibleWithActivity('spectator', 'playing'), false);
assert.equal(isPredictionProfileCompatibleWithActivity('own', null), true);

assert.deepEqual(buildTwitchPredictionCreateBody({
  broadcasterId: 'broadcaster-1',
  title: 'Seven minute prediction',
  yesTitle: 'Yes',
  noTitle: 'No',
  windowSeconds: 420
}), {
  broadcaster_id: 'broadcaster-1',
  title: 'Seven minute prediction',
  outcomes: [{ title: 'Yes' }, { title: 'No' }],
  prediction_window: 420
});

const automaticPredictionMeta = withPredictionCreationLifecycle(
  { type: 'win_loss' },
  { automatic: true, clockTime: -10 }
);
assert.equal(automaticPredictionMeta.creationMode, 'automatic');
assert.equal(automaticPredictionMeta.createdAtGameSeconds, -10);
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'automatic-before-threshold', status: 'ACTIVE' },
  automaticPredictionMeta,
  { autoLockAtGameSeconds: 60 },
  { clockTime: 60 }
), true, 'the game-time cutoff may precede the seven-minute Twitch window');

for (const clockTime of [0, 60, 120, 420, 900]) {
  assert.equal(shouldAutoLockPredictionAtGameTime(
    { id: 'game-time-lock-disabled', status: 'ACTIVE' },
    automaticPredictionMeta,
    { autoLockAtGameSeconds: 0 },
    { clockTime }
  ), false, `disabled game-time lock at ${clockTime}s`);
}
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'legacy-game-time-lock-disabled', status: 'ACTIVE' },
  { type: 'win_loss' },
  { autoLockAtGameSeconds: 0 },
  { clockTime: 900 }
), false, 'zero also disables the game-time lock for legacy prediction metadata');

const manualReplacementMeta = withPredictionCreationLifecycle(
  { type: 'win_loss' },
  { automatic: false, clockTime: 135 }
);
assert.equal(manualReplacementMeta.creationMode, 'manual');
assert.equal(manualReplacementMeta.createdAtGameSeconds, 135);
assert.equal(withPredictionCreationLifecycle({}, { automatic: false }).createdAtGameSeconds, null);
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'replacement-after-cancel', status: 'ACTIVE' },
  manualReplacementMeta,
  { autoLockAtGameSeconds: 60 },
  { clockTime: 136 }
), false);

const lateAutomaticMeta = withPredictionCreationLifecycle(
  { type: 'win_loss' },
  { automatic: true, clockTime: 135 }
);
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'late-automatic-retry', status: 'ACTIVE' },
  lateAutomaticMeta,
  { autoLockAtGameSeconds: 60 },
  { clockTime: 136 }
), false);

assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'before-threshold', status: 'ACTIVE' },
  automaticPredictionMeta,
  { autoLockAtGameSeconds: 60 },
  { clockTime: 59 }
), false);
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'already-locked', status: 'LOCKED' },
  automaticPredictionMeta,
  { autoLockAtGameSeconds: 60 },
  { clockTime: 120 }
), false);
assert.equal(shouldAutoLockPredictionAtGameTime(
  { id: 'legacy-active', status: 'ACTIVE' },
  { type: 'win_loss' },
  { autoLockAtGameSeconds: 60 },
  { clockTime: 120 }
), true);

console.log('Prediction safety checks passed');
