import assert from 'node:assert/strict';
import {
  collectMatchPlayers,
  notablePlayersFromRankCache,
  updateMatchIntel
} from '../src/game-intel.js';

const payload = {
  map: { clock_time: 1200 },
  allplayers: {
    player0: {
      player_slot: 0,
      accountid: 111,
      name: 'Mid',
      hero_name: 'npc_dota_hero_nevermore',
      items: { slot0: { name: 'item_blink' } }
    },
    player1: {
      player_slot: 128,
      accountid: 222,
      name: 'Carry',
      items: { slot0: { name: 'item_aegis' } }
    }
  }
};

const players = collectMatchPlayers(payload);
assert.equal(players.length, 2);
assert.equal(players[0].slot, 0);
assert.equal(players[1].slot, 5);
assert.equal(players[1].hasAegis, true);

const intel = updateMatchIntel(null, payload, { clockTime: 1200, activeMatchId: 42 }, players);
assert.equal(intel.aegis.slot, 5);
assert.equal(intel.aegis.expiresAt, 1500);
assert.equal(intel.roshanStatus.phase, 'waiting');
assert.equal(intel.roshanStatus.earliestRemaining, 475);
assert.equal(intel.roshanStatus.latestRemaining, 655);

const windowIntel = updateMatchIntel(intel, {}, { clockTime: 1685, activeMatchId: 42 }, players);
assert.equal(windowIntel.roshanStatus.phase, 'window');
assert.equal(windowIntel.roshanStatus.latestRemaining, 170);

const possibleIntel = updateMatchIntel(windowIntel, {}, { clockTime: 1860, activeMatchId: 42 }, players);
assert.equal(possibleIntel.roshanStatus.phase, 'possible');

const notable = notablePlayersFromRankCache(players, (accountId) => accountId === '111'
  ? { leaderboardRank: 123, rankTier: 80, name: 'Top Mid', countryCode: 'ua' }
  : null, [{ accountId: 222, name: 'Custom Carry', countryCode: 'se' }]);
assert.deepEqual(notable, [
  { slot: 0, accountId: 111, name: 'Top Mid', leaderboardRank: 123, rankTier: 80, countryCode: 'UA' },
  { slot: 5, accountId: 222, name: 'Custom Carry', leaderboardRank: null, rankTier: null, countryCode: 'SE' }
]);

console.log('Game intel checks passed');
