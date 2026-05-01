import assert from 'node:assert/strict';
import {
  hasCompletePredictionOutcomePoints,
  hasPointsOnEveryPredictionOutcome,
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

console.log('Prediction safety checks passed');
