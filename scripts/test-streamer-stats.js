import assert from 'node:assert/strict';
import {
  applyStreamerMatchResult,
  normalizeStreamerStatsConfig,
  rankMedalFromMmr,
  rankMedalFromRankTier,
  repairMojibakeText,
  resetStreamerGoalRecord,
  resetStreamerSession,
  restorePreviousStreamerSession,
  updateStreamerSessionPresence
} from '../src/streamer-stats.js';

assert.equal(rankMedalFromMmr(0).medal, 'calibration');
assert.equal(rankMedalFromMmr(1).medal, 1);
assert.equal(rankMedalFromMmr(1).stars, 1);
assert.equal(rankMedalFromMmr(153).stars, 1);
assert.equal(rankMedalFromMmr(154).stars, 2);
assert.equal(rankMedalFromMmr(769).stars, 5);
assert.equal(rankMedalFromMmr(770).medal, 2);
assert.equal(rankMedalFromMmr(770).stars, 1);
assert.equal(rankMedalFromMmr(4619).medal, 6);
assert.equal(rankMedalFromMmr(4620).medal, 7);
assert.equal(rankMedalFromMmr(4820).stars, 2);
assert.equal(rankMedalFromMmr(5620).medal, 8);
assert.equal(rankMedalFromMmr(5620).stars, 0);
assert.equal(rankMedalFromRankTier(75).medal, 7);
assert.equal(rankMedalFromRankTier(75).stars, 5);
assert.equal(rankMedalFromRankTier(80).medal, 8);
assert.equal(rankMedalFromRankTier(80).stars, 0);

const normalizedConfig = { streamerMmr: 120000 };
normalizeStreamerStatsConfig(normalizedConfig);
assert.equal(normalizedConfig.streamerMmr, 99999);
assert.equal(normalizedConfig.streamerGoalMmr, 0);
assert.equal(normalizedConfig.streamerGoalStartMmr, 0);
assert.equal(normalizedConfig.autoBindStreamerAccounts, true);
assert.equal(normalizedConfig.hideStreamerStatsDuringDraft, true);
assert.equal(normalizedConfig.streamerWinLossPosition, 'left');
assert.equal(normalizedConfig.streamerWinLossMenuPosition, 'left');
assert.equal(normalizedConfig.streamerWinLossGamePosition, 'left');
assert.equal(normalizedConfig.showStreamerMmrGoal, true);
assert.equal(normalizedConfig.showStreamerMmrGoalInMenu, true);
assert.equal(normalizedConfig.showStreamerMmrGoalDuringDraft, true);
assert.equal(normalizedConfig.showStreamerMmrGoalInGame, true);
assert.equal(normalizedConfig.showStreamerMmrGoalCurrent, true);
assert.equal(normalizedConfig.showStreamerMmrGoalStart, false);
assert.equal(normalizedConfig.showStreamerMmrGoalTarget, true);
assert.equal(normalizedConfig.showStreamerMmrGoalRecord, true);
assert.equal(normalizedConfig.showStreamerMmrGoalBackground, true);
assert.equal(normalizedConfig.streamerMmrGoalTemplate, 'classic');
assert.equal(normalizedConfig.streamerMmrGoalFillStart, '#63c9ff');
assert.equal(normalizedConfig.streamerMmrGoalAnimationSpeed, 1);
assert.equal(normalizedConfig.streamerMmrGoalPaddingTop, 10);
assert.equal(normalizedConfig.streamerMmrGoalPaddingRight, 10);
assert.equal(normalizedConfig.streamerMmrGoalPaddingBottom, 10);
assert.equal(normalizedConfig.streamerMmrGoalPaddingLeft, 10);
assert.equal(normalizedConfig.streamerMmrGoalStartPrefix, '');
assert.equal(normalizedConfig.streamerMmrGoalStartSuffix, ' → ');
assert.equal(normalizedConfig.streamerMmrGoalTargetPrefix, '/ ');
assert.equal(normalizedConfig.streamerMmrGoalDeltaPrefix, '+');
assert.equal(normalizedConfig.streamerMmrGoalCustomCss, '');

const normalizedGoalStyle = {
  streamerMmrGoalTemplate: 'bubbles',
  streamerMmrGoalFillStart: '#ABCDEF',
  streamerMmrGoalFillEnd: 'bad',
  streamerMmrGoalBarHeight: 99,
  streamerMmrGoalBarRadius: -10,
  streamerMmrGoalGlow: 18,
  streamerMmrGoalAnimationSpeed: 9,
  streamerMmrGoalPaddingTop: 99,
  streamerMmrGoalPaddingRight: 22,
  streamerMmrGoalPaddingBottom: -5,
  streamerMmrGoalPaddingLeft: 0,
  streamerMmrGoalAnimated: false,
  streamerMmrGoalStartPrefix: 'FROM ',
  streamerMmrGoalStartSuffix: ' -> ',
  streamerMmrGoalCurrentPrefix: 'Current ',
  streamerMmrGoalCurrentSuffix: ' MMR',
  streamerMmrGoalTargetPrefix: 'Goal ',
  streamerMmrGoalTargetSuffix: ' pts',
  streamerMmrGoalDeltaPrefix: 'Left ',
  streamerMmrGoalDeltaSuffix: ' mmr',
  streamerMmrGoalCustomCss: '[data-goal-part="fill"] { animation: pulse 1s infinite; }',
  showStreamerMmrGoalInMenu: false,
  showStreamerMmrGoalDuringDraft: false,
  showStreamerMmrGoalInGame: false,
  showStreamerMmrGoalStart: true,
  showStreamerMmrGoalRecord: false,
  showStreamerMmrGoalWinRate: false,
  showStreamerMmrGoalEta: false
};
normalizeStreamerStatsConfig(normalizedGoalStyle);
assert.equal(normalizedGoalStyle.streamerMmrGoalTemplate, 'bubbles');
assert.equal(normalizedGoalStyle.streamerMmrGoalFillStart, '#abcdef');
assert.equal(normalizedGoalStyle.streamerMmrGoalFillEnd, '#8df0a1');
assert.equal(normalizedGoalStyle.streamerMmrGoalBarHeight, 64);
assert.equal(normalizedGoalStyle.streamerMmrGoalBarRadius, 0);
assert.equal(normalizedGoalStyle.streamerMmrGoalGlow, 18);
assert.equal(normalizedGoalStyle.streamerMmrGoalAnimationSpeed, 3);
assert.equal(normalizedGoalStyle.streamerMmrGoalPaddingTop, 48);
assert.equal(normalizedGoalStyle.streamerMmrGoalPaddingRight, 22);
assert.equal(normalizedGoalStyle.streamerMmrGoalPaddingBottom, 0);
assert.equal(normalizedGoalStyle.streamerMmrGoalPaddingLeft, 0);
assert.equal(normalizedGoalStyle.streamerMmrGoalAnimated, false);
assert.equal(normalizedGoalStyle.streamerMmrGoalStartPrefix, 'FROM ');
assert.equal(normalizedGoalStyle.streamerMmrGoalStartSuffix, ' -> ');
assert.equal(normalizedGoalStyle.streamerMmrGoalCurrentPrefix, 'Current ');
assert.equal(normalizedGoalStyle.streamerMmrGoalCurrentSuffix, ' MMR');
assert.equal(normalizedGoalStyle.streamerMmrGoalTargetPrefix, 'Goal ');
assert.equal(normalizedGoalStyle.streamerMmrGoalTargetSuffix, ' pts');
assert.equal(normalizedGoalStyle.streamerMmrGoalDeltaPrefix, 'Left ');
assert.equal(normalizedGoalStyle.streamerMmrGoalDeltaSuffix, ' mmr');
assert.equal(normalizedGoalStyle.streamerMmrGoalCustomCss, '[data-goal-part="fill"] { animation: pulse 1s infinite; }');
assert.equal(normalizedGoalStyle.showStreamerMmrGoalInMenu, false);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalDuringDraft, false);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalInGame, false);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalStart, true);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalRecord, false);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalWinRate, false);
assert.equal(normalizedGoalStyle.showStreamerMmrGoalEta, false);

const normalizedNewGoalStyle = {
  streamerMmrGoalTemplate: 'aurora',
  streamerWinLossPosition: 'right',
  streamerGoalMmr: 7000,
  streamerGoalStartMmr: 5120
};
normalizeStreamerStatsConfig(normalizedNewGoalStyle);
assert.equal(normalizedNewGoalStyle.streamerMmrGoalTemplate, 'aurora');
assert.equal(normalizedNewGoalStyle.streamerWinLossMenuPosition, 'right');
assert.equal(normalizedNewGoalStyle.streamerWinLossGamePosition, 'right');
assert.equal(normalizedNewGoalStyle.streamerGoalMmr, 7000);
assert.equal(normalizedNewGoalStyle.streamerGoalStartMmr, 5120);

const normalizedAccountsConfig = {
  streamerAccounts: [
    { accountId: '123', label: 'Main' },
    { id: '123', label: 'Duplicate', goalMmr: 6500, goalStartMmr: 5200 },
    { dotaId: '456', name: 'Smurf', mmr: 4000, goalMmr: 5000, goalStartMmr: 4000 },
    { accountId: 'bad', label: 'Invalid' }
  ]
};
normalizeStreamerStatsConfig(normalizedAccountsConfig);
assert.deepEqual(normalizedAccountsConfig.streamerAccounts, [
  { accountId: 123, label: 'Duplicate', mmr: 0, goalMmr: 6500, goalStartMmr: 5200, boundAt: null },
  { accountId: 456, label: 'Smurf', mmr: 4000, goalMmr: 5000, goalStartMmr: 0, boundAt: null }
]);
assert.equal(repairMojibakeText('РќР°Р·РІР°РЅРёРµ'), 'Название');
assert.equal(repairMojibakeText('\u00d0\u009d\u00d0\u00b0\u00d0\u00b7\u00d0\u00b2\u00d0\u00b0\u00d0\u00bd\u00d0\u00b8\u00d0\u00b5'), 'Название');
assert.equal(repairMojibakeText('Роман'), 'Роман');

const normalizedMojibakeAccountsConfig = {
  streamerAccounts: [
    { accountId: '789', label: 'РќР°Р·РІР°РЅРёРµ', mmr: 1000 }
  ]
};
normalizeStreamerStatsConfig(normalizedMojibakeAccountsConfig);
assert.equal(normalizedMojibakeAccountsConfig.streamerAccounts[0].label, 'Название');

const config = {
  showStreamerStats: true,
  autoUpdateStreamerMmr: true,
  streamerMmr: 5000,
  streamerMmrWinDelta: 25,
  streamerMmrLossDelta: 25
};
let applied = applyStreamerMatchResult({}, config, 'win', '123', new Date('2026-05-01T10:00:00Z'));
assert.equal(applied.state.wins, 1);
assert.equal(applied.state.losses, 0);
assert.equal(applied.config.streamerMmr, 5025);
assert.equal(applied.state.lastMmrChange, 25);

applied = applyStreamerMatchResult(applied.state, applied.config, 'win', '123', new Date('2026-05-01T10:10:00Z'));
assert.equal(applied.changed, false);
assert.equal(applied.state.wins, 1);

applied = applyStreamerMatchResult(applied.state, applied.config, 'lose', '124', new Date('2026-05-01T10:20:00Z'));
assert.equal(applied.state.wins, 1);
assert.equal(applied.state.losses, 1);
assert.equal(applied.config.streamerMmr, 5000);
assert.equal(applied.state.lastMmrChange, -25);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 1 }, 'lose', '125', new Date('2026-05-01T10:30:00Z'));
assert.equal(applied.config.streamerMmr, 1);
assert.equal(applied.state.lastMmrChange, 0);
assert.equal(applied.configChanged, false);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 99990 }, 'win', '126', new Date('2026-05-01T10:40:00Z'));
assert.equal(applied.config.streamerMmr, 99999);
assert.equal(applied.state.lastMmrChange, 9);

applied = applyStreamerMatchResult({}, { ...config, streamerMmr: 0 }, 'win', '127', new Date('2026-05-01T10:50:00Z'));
assert.equal(applied.config.streamerMmr, 0);
assert.equal(applied.state.lastMmrChange, 0);
assert.equal(applied.configChanged, false);

applied = applyStreamerMatchResult(
  { streamerAccountId: 456 },
  {
    ...config,
    streamerMmr: 5000,
    streamerAccounts: [
      { accountId: 123, label: 'Main', mmr: 4000 },
      { accountId: 456, label: 'Second', mmr: 6000 }
    ]
  },
  'lose',
  '128',
  new Date('2026-05-01T11:00:00Z')
);
assert.equal(applied.config.streamerMmr, 5000);
assert.equal(applied.config.streamerAccounts[1].mmr, 5975);
assert.equal(applied.state.lastStreamerAccountId, 456);
assert.equal(applied.state.accountSessions['456'].wins, 0);
assert.equal(applied.state.accountSessions['456'].losses, 1);
assert.equal(applied.state.accountGoalRecords['456'].wins, 0);
assert.equal(applied.state.accountGoalRecords['456'].losses, 1);
assert.equal(applied.state.lastMmrChange, -25);

let session = updateStreamerSessionPresence(
  {
    wins: 2,
    losses: 1,
    lastMatchId: 'offline-repeat-post-game',
    sessionStartedAt: '2026-05-01T08:00:00Z',
    accountGoalRecords: {
      456: { accountId: 456, wins: 9, losses: 4 }
    }
  },
  false,
  new Date('2026-05-01T09:00:00Z')
);
assert.equal(session.state.wins, 2);
assert.ok(session.state.offlineSince);

session = updateStreamerSessionPresence(session.state, false, new Date('2026-05-01T11:01:00Z'));
assert.equal(session.state.wins, 0);
assert.equal(session.state.losses, 0);
assert.deepEqual(session.state.accountSessions, {});
assert.equal(session.state.accountGoalRecords['456'].wins, 9);
assert.equal(session.state.accountGoalRecords['456'].losses, 4);
assert.equal(session.state.previousSession.wins, 2);
assert.equal(session.state.lastMatchId, 'offline-repeat-post-game');

const repeatedAfterOfflineReset = applyStreamerMatchResult(
  session.state,
  config,
  'win',
  'offline-repeat-post-game',
  new Date('2026-05-01T11:01:30Z')
);
assert.equal(repeatedAfterOfflineReset.changed, false);
assert.equal(repeatedAfterOfflineReset.state.wins, 0);

const restored = restorePreviousStreamerSession(session.state, new Date('2026-05-01T11:02:00Z'));
assert.equal(restored.state.wins, 2);
assert.equal(restored.state.losses, 1);
assert.equal(restored.state.accountGoalRecords['456'].wins, 9);
assert.equal(restored.state.accountGoalRecords['456'].losses, 4);
assert.equal(restored.state.previousSession, null);

const reset = resetStreamerSession(restored.state, new Date('2026-05-01T11:03:00Z'));
assert.equal(reset.state.wins, 0);
assert.equal(reset.state.losses, 0);
assert.equal(reset.state.accountGoalRecords['456'].wins, 9);
assert.equal(reset.state.accountGoalRecords['456'].losses, 4);

const completedBeforeReset = applyStreamerMatchResult({}, config, 'win', 'repeat-post-game', new Date('2026-05-01T11:04:00Z'));
const resetDuringPostGame = resetStreamerSession(completedBeforeReset.state, new Date('2026-05-01T11:05:00Z'));
assert.equal(resetDuringPostGame.state.lastMatchId, 'repeat-post-game');
const repeatedPostGame = applyStreamerMatchResult(
  resetDuringPostGame.state,
  completedBeforeReset.config,
  'win',
  'repeat-post-game',
  new Date('2026-05-01T11:06:00Z')
);
assert.equal(repeatedPostGame.changed, false);
assert.equal(repeatedPostGame.state.wins, 0);

const goalReset = resetStreamerGoalRecord(reset.state, 456);
assert.equal(goalReset.state.accountGoalRecords['456'], undefined);
assert.equal(goalReset.state.previousSession.wins, 2);

console.log('Streamer stats checks passed');
