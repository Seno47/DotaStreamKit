import assert from 'node:assert/strict';
import {
  hasCompletePredictionOutcomePoints,
  hasPointsOnEveryPredictionOutcome,
  isLeftActiveGameViewCancelSignal,
  isPredictionUncontested,
  predictionOutcomePoints
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

console.log('Prediction safety checks passed');
