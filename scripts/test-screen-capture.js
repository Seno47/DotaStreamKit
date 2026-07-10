import assert from 'node:assert/strict';
import {
  parseSlopOutput,
  parseSlurpOutput,
  regionToMonitorCrop,
  normalizeRegion
} from '../src/screen-capture.js';

assert.deepEqual(parseSlopOutput('120x30+100+200'), { x: 100, y: 200, width: 120, height: 30 });
assert.equal(parseSlopOutput(''), null);
assert.equal(parseSlopOutput('invalid'), null);

assert.deepEqual(parseSlurpOutput('100,200 120x30'), { x: 100, y: 200, width: 120, height: 30 });
assert.deepEqual(parseSlurpOutput('0,0 1920x1080'), { x: 0, y: 0, width: 1920, height: 1080 });
assert.deepEqual(parseSlurpOutput('-1920,-200 120x30'), { x: -1920, y: -200, width: 120, height: 30 });
assert.equal(parseSlurpOutput(''), null);

const monitor = {
  x: () => 100,
  y: () => 50,
  scaleFactor: () => 2
};
assert.deepEqual(
  regionToMonitorCrop({ x: 120, y: 70, width: 40, height: 20 }, monitor),
  { localX: 40, localY: 40, width: 80, height: 40 }
);

assert.deepEqual(normalizeRegion({ x: 10, y: 20, width: 100, height: 30 }), {
  x: 10,
  y: 20,
  width: 100,
  height: 30
});
assert.deepEqual(normalizeRegion({ x: -1920, y: -200, width: 100, height: 30 }), {
  x: -1920,
  y: -200,
  width: 100,
  height: 30
});
assert.equal(normalizeRegion({ x: 10, y: 20, width: 5, height: 30 }), null);

console.log('test-screen-capture: ok');
