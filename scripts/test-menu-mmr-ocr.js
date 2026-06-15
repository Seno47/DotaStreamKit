import assert from 'node:assert/strict';
import { isDotaMainMenu, parseMmrFromOcrText } from '../src/menu-mmr-ocr.js';

assert.equal(parseMmrFromOcrText('2 869\nРейтинг'), 2869);
assert.equal(parseMmrFromOcrText('2,869\nMMR'), 2869);
assert.equal(parseMmrFromOcrText('MMR 2869'), 2869);
assert.equal(parseMmrFromOcrText('рейтинг: 1234'), 1234);
assert.equal(parseMmrFromOcrText('2869'), null);
assert.equal(parseMmrFromOcrText('2,869'), null);
assert.equal(parseMmrFromOcrText('hello world'), null);
assert.equal(parseMmrFromOcrText(''), null);

assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false }, { running: true }), true);
assert.equal(isDotaMainMenu({ gameState: 'HERO_SELECTION', queueSearchSignal: false, inGameScreen: true }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: true, inGameScreen: false }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false, playerActivity: 'playing' }, { running: true }), false);
assert.equal(isDotaMainMenu({ gameState: null, queueSearchSignal: false, inGameScreen: false }, { running: false }), false);

console.log('test-menu-mmr-ocr: ok');
