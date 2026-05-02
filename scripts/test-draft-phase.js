import assert from 'node:assert/strict';
import { collectDraftHeroCounts, inferOwnPickPhase } from '../src/draft-phase.js';

const heroSelection = 'DOTA_GAMERULES_STATE_HERO_SELECTION';

function player(player_slot, hero_id, team_name) {
  return { player_slot, hero_id, team_name };
}

function phase(payload, previous = {}, playerTeam = 'radiant') {
  return inferOwnPickPhase({
    previous,
    payload,
    gameState: heroSelection,
    playerHeroPicked: true,
    playerTeam,
    lifecycle: { newDraft: false }
  });
}

let result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant')
  }
});
assert.equal(result.ownPickPhaseTargetCount, 2);
assert.equal(result.ownPickPhaseEnded, false);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player6: player(128, 6, 'dire')
  }
});
assert.equal(result.ownTeamPickedHeroCount, 2);
assert.equal(result.enemyTeamPickedHeroCount, 1);
assert.equal(result.ownPickPhaseEnded, false);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire')
  }
});
assert.equal(result.ownPickPhaseEnded, true);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player3: player(3, 3, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire')
  }
});
assert.equal(result.ownPickPhaseTargetCount, 4);
assert.equal(result.ownPickPhaseEnded, false);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player3: player(3, 3, 'radiant'),
    player4: player(4, 4, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire'),
    player8: player(130, 8, 'dire')
  }
});
assert.equal(result.ownPickPhaseEnded, false);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player3: player(3, 3, 'radiant'),
    player4: player(4, 4, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire'),
    player8: player(130, 8, 'dire'),
    player9: player(131, 9, 'dire')
  }
});
assert.equal(result.ownPickPhaseEnded, true);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player3: player(3, 3, 'radiant'),
    player4: player(4, 4, 'radiant'),
    player5: player(5, 5, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire'),
    player8: player(130, 8, 'dire'),
    player9: player(131, 9, 'dire')
  }
});
assert.equal(result.ownPickPhaseTargetCount, 5);
assert.equal(result.ownPickPhaseEnded, false);

result = phase({
  allplayers: {
    player1: player(1, 1, 'radiant'),
    player2: player(2, 2, 'radiant'),
    player3: player(3, 3, 'radiant'),
    player4: player(4, 4, 'radiant'),
    player5: player(5, 5, 'radiant'),
    player6: player(128, 6, 'dire'),
    player7: player(129, 7, 'dire'),
    player8: player(130, 8, 'dire'),
    player9: player(131, 9, 'dire'),
    player10: player(132, 10, 'dire')
  }
});
assert.equal(result.ownPickPhaseEnded, true);

result = inferOwnPickPhase({
  previous: { ownPickPhaseTargetCount: 4 },
  payload: {
    allplayers: {
      player1: player(1, 1, 'radiant'),
      player2: player(2, 2, 'radiant'),
      player3: player(3, 3, 'radiant'),
      player6: player(128, 6, 'dire'),
      player7: player(129, 7, 'dire'),
      player8: player(130, 8, 'dire')
    }
  },
  gameState: heroSelection,
  playerHeroPicked: true,
  playerTeam: 'radiant',
  lifecycle: { newDraft: false }
});
assert.equal(result.ownPickPhaseTargetCount, 4);
assert.equal(result.ownPickPhaseEnded, false);

result = inferOwnPickPhase({
  previous: { ownPickPhaseTargetCount: 4 },
  payload: {
    allplayers: {
      player1: player(1, 1, 'radiant'),
      player2: player(2, 2, 'radiant'),
      player3: player(3, 3, 'radiant'),
      player4: player(4, 4, 'radiant'),
      player6: player(128, 6, 'dire'),
      player7: player(129, 7, 'dire'),
      player8: player(130, 8, 'dire'),
      player9: player(131, 9, 'dire')
    }
  },
  gameState: heroSelection,
  playerHeroPicked: true,
  playerTeam: 'radiant',
  lifecycle: { newDraft: false }
});
assert.equal(result.ownPickPhaseEnded, true);

result = inferOwnPickPhase({
  previous: { ownPickPhaseTargetCount: 4 },
  payload: {},
  gameState: 'DOTA_GAMERULES_STATE_STRATEGY_TIME',
  playerHeroPicked: true,
  playerTeam: 'radiant',
  lifecycle: { newDraft: false }
});
assert.equal(result.ownPickPhaseEnded, true);

result = inferOwnPickPhase({
  previous: { ownPickPhaseTargetCount: 4, ownPickPhaseEnded: true },
  payload: {},
  gameState: heroSelection,
  playerHeroPicked: false,
  playerTeam: 'radiant',
  lifecycle: { newDraft: true }
});
assert.equal(result.ownPickPhaseTargetCount, null);
assert.equal(result.ownPickPhaseEnded, false);

assert.deepEqual(collectDraftHeroCounts({
  draft: {
    radiant_picks: [1, 2],
    dire_picks: [6, 7]
  }
}, 'radiant', true), {
  radiant: 2,
  dire: 2,
  source: 'draft',
  reliable: true
});

console.log('Draft phase checks passed');
