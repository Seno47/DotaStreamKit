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
assert.equal(possibleIntel.roshanStatus, null);

const repeatedRoshanEvent = updateMatchIntel(intel, { events: { roshan_killed: true } }, { clockTime: 1205, activeMatchId: 42 }, players);
assert.equal(repeatedRoshanEvent.roshan.killedAt, 1195);

const hiddenAegisItems = updateMatchIntel(intel, {}, { clockTime: 1230, activeMatchId: 42 }, players.map((player) => ({ ...player, hasAegis: false })));
assert.equal(hiddenAegisItems.aegis, null);

const sparseAegisItems = updateMatchIntel(intel, {}, { clockTime: 1230, activeMatchId: 42 }, players.map((player) => ({ ...player, hasAegis: false, hasItemData: false })));
assert.equal(sparseAegisItems.aegis.slot, 5);

const notable = notablePlayersFromRankCache(players, (accountId) => accountId === '111'
  ? { leaderboardRank: 123, rankTier: 80, name: 'Top Mid', countryCode: 'ua' }
  : null, [{ accountId: 222, name: 'Custom Carry', countryCode: 'se' }]);
assert.deepEqual(notable, [
  { slot: 0, accountId: 111, name: 'Top Mid', leaderboardRank: 123, rankTier: 80, countryCode: 'UA' },
  { slot: 5, accountId: 222, name: 'Custom Carry', leaderboardRank: null, rankTier: null, countryCode: 'SE' }
]);

const fallbackPlayers = collectMatchPlayers({
  player: { team_name: 'radiant', player_slot: 2, team_slot: 2, accountid: 333, name: 'Streamer' },
  hero: { name: 'npc_dota_hero_axe' },
  items: { slot0: { name: 'item_aegis' } }
});
assert.deepEqual(fallbackPlayers, [{
  slot: 0,
  team: 'radiant',
  accountId: 333,
  name: 'Streamer',
  hero: 'npc_dota_hero_axe',
  hasItemData: true,
  hasAegis: true
}]);

const singlePlayerPayload = collectMatchPlayers({
  players: {
    player1: { player_slot: 1, accountid: 333, name: 'Streamer' }
  },
  player: { team_name: 'radiant', player_slot: 1, accountid: 333, name: 'Streamer' },
  hero: { name: 'npc_dota_hero_morphling' }
});
assert.equal(singlePlayerPayload.length, 1);
assert.equal(singlePlayerPayload[0].slot, 0);

console.log('Game intel checks passed');
