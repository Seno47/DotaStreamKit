import assert from 'node:assert/strict';
import { merge } from '../src/safe-merge.js';

const polluted = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"owned":true}},"safe":{"prototype":{"nested":true},"value":42}}');
const target = merge({ safe: { existing: true } }, polluted);

assert.equal({}.polluted, undefined);
assert.equal({}.owned, undefined);
assert.deepEqual(target, { safe: { existing: true, value: 42 } });

const nested = merge({}, JSON.parse('{"a":{"b":{"__proto__":{"polluted":true},"ok":1}}}'));
assert.deepEqual(nested, { a: { b: { ok: 1 } } });
assert.equal({}.polluted, undefined);

const arraysAreValues = merge({}, { list: [1, 2, 3] });
assert.deepEqual(arraysAreValues, { list: [1, 2, 3] });

console.log('Safe merge checks passed');
