import assert from 'node:assert/strict';
import {
  isDotaMainMenu,
  parseMmrFromOcrText,
  selectMenuMmrOcrResult
} from '../src/menu-mmr-ocr.js';

assert.equal(parseMmrFromOcrText('2 869\nРейтинг'), 2869);
assert.equal(parseMmrFromOcrText('2,869\nMMR'), 2869);
assert.equal(parseMmrFromOcrText('MMR 2869'), 2869);
assert.equal(parseMmrFromOcrText('рейтинг: 1234'), 1234);
assert.equal(parseMmrFromOcrText('Rating 4321'), 4321);
assert.equal(parseMmrFromOcrText('profile level 123\nMMR 2869'), 2869);
assert.equal(parseMmrFromOcrText('profile level 123\nMMR\n2869'), 2869);
assert.equal(parseMmrFromOcrText('MMR\nprofile level 123\nMMR 2869'), 2869);
assert.equal(parseMmrFromOcrText('2869 MMR\nprofile level 123'), 2869);
assert.equal(parseMmrFromOcrText('2869'), null);
assert.equal(parseMmrFromOcrText('2,869'), null);
assert.equal(parseMmrFromOcrText('hello world'), null);
assert.equal(parseMmrFromOcrText(''), null);
assert.equal(parseMmrFromOcrText('MMR Rank Confidence 50%'), null);
assert.equal(parseMmrFromOcrText('MMR\n50%'), null);
assert.equal(parseMmrFromOcrText('profile level 123 MMR'), null);
assert.equal(parseMmrFromOcrText('MMR #2869'), null);

assert.deepEqual(
  selectMenuMmrOcrResult(
    { rawText: 'MMR 2869', confidence: 74 },
    { rawText: 'MMR 2869', confidence: 91 }
  ),
  { mmr: 2869, rawText: 'MMR 2869\nMMR 2869', confidence: 91 }
);
assert.deepEqual(
  selectMenuMmrOcrResult(
    { rawText: 'MMR 1234', confidence: 44 },
    { rawText: 'MMR 2869', confidence: 96 }
  ),
  { mmr: null, rawText: 'MMR 1234\nMMR 2869', confidence: 0 }
);
assert.deepEqual(
  selectMenuMmrOcrResult(
    { rawText: 'unreadable', confidence: 98 },
    { rawText: 'MMR 2869', confidence: 62 }
  ),
  { mmr: 2869, rawText: 'unreadable\nMMR 2869', confidence: 62 }
);

assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false }, { running: true }), true);
assert.equal(isDotaMainMenu({ gameState: 'HERO_SELECTION', queueSearchSignal: false, inGameScreen: true }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: true, inGameScreen: false }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false, playerActivity: 'playing' }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false }, { running: false }), false);

console.log('test-menu-mmr-ocr: ok');
