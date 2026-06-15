cloneSpectatorPredictionPanel();

function cloneSpectatorPredictionPanel() {
  const source = document.querySelector('[data-page="predictions"]');
  const grid = source?.parentElement;
  if (!source || !grid || document.querySelector('[data-page="spectatorPredictions"]')) return;
  const clone = source.cloneNode(true);
  clone.classList.remove('active-page');
  clone.dataset.page = 'spectatorPredictions';
  clone.dataset.predictionProfile = 'spectator';
  source.dataset.predictionProfile = 'own';
  for (const element of clone.querySelectorAll('[id]')) {
    element.id = `spectator${element.id[0].toUpperCase()}${element.id.slice(1)}`;
  }
  const heading = clone.querySelector('h2');
  if (heading) heading.textContent = 'Ставки при просмотре игр';
  const variableGrid = clone.querySelector('.variable-grid');
  if (variableGrid) {
    variableGrid.replaceChildren(...spectatorVariableChips().map(({ variable, label }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'variable-chip';
      button.dataset.var = variable;
      button.innerHTML = `<code>${variable}</code><span>${label}</span>`;
      return button;
    }));
  }
  const summary = document.createElement('p');
  summary.className = 'muted spectator-prediction-note';
  summary.textContent = 'Отдельные автоставки для режима просмотра чужих игр. Защитные маски в этом режиме не включаются.';
  clone.insertBefore(summary, clone.querySelector('details')?.nextSibling || clone.firstElementChild?.nextSibling || null);
  const intel = document.createElement('section');
  intel.className = 'custom-builder spectator-intel-settings';
  intel.innerHTML = `
    <div class="section-head">
      <div>
        <h3 id="spectatorIntelTitle">Match Intel при просмотре</h3>
        <p id="spectatorIntelHelp">Отдельные настройки подсказок для чужих игр.</p>
      </div>
    </div>
    <div class="control-row">
      <label class="check"><input type="checkbox" id="spectatorMatchIntelEnabled"> Match intel overlay</label>
      <label class="check"><input type="checkbox" id="spectatorGameLabelEnabled"> Spectating game label</label>
      <label id="spectatorGameLabelTemplateWrap" class="wide-control">Label text<input id="spectatorGameLabelTemplate" type="text" maxlength="120" placeholder="Spectating game: {game_id}"></label>
      <label class="check"><input type="checkbox" id="spectatorShowPlayerRanks"> Notable players</label>
      <label class="check"><input type="checkbox" id="spectatorShowPlayerFlags"> Флаги игроков</label>
      <label class="check"><input type="checkbox" id="spectatorShowAegisTimer"> Aegis timer</label>
      <label class="check"><input type="checkbox" id="spectatorShowRoshanTimer"> Roshan timer</label>
      <label id="spectatorRankDisplayModeWrap">Когда показывать notable players<select id="spectatorRankDisplayMode"><option value="minutes">Первые N минут</option><option value="full_game">До конца игры</option><option value="pre_game_only">Только до начала игры</option></select></label>
      <label id="spectatorRankDisplayMinutesWrap">Показывать первые N минут<input id="spectatorRankDisplayMinutes" type="number" min="1" max="30"></label>
    </div>
  `;
  clone.insertBefore(intel, clone.querySelector(`#spectatorPredictionForm`));
  grid.insertBefore(clone, source.nextSibling);
}

function spectatorVariableChips() {
  return [
    ['{radiant_team}', 'команда Radiant'],
    ['{dire_team}', 'команда Dire'],
    ['{winning_team}', 'победившая команда после игры'],
    ['{match_id}', 'ID матча'],
    ['{radiant_heroes}', 'герои Radiant списком'],
    ['{dire_heroes}', 'герои Dire списком'],
    ['{radiant_hero_1}', 'герой Radiant слот 1'],
    ['{radiant_hero_2}', 'герой Radiant слот 2'],
    ['{radiant_hero_3}', 'герой Radiant слот 3'],
    ['{radiant_hero_4}', 'герой Radiant слот 4'],
    ['{radiant_hero_5}', 'герой Radiant слот 5'],
    ['{dire_hero_1}', 'герой Dire слот 1'],
    ['{dire_hero_2}', 'герой Dire слот 2'],
    ['{dire_hero_3}', 'герой Dire слот 3'],
    ['{dire_hero_4}', 'герой Dire слот 4'],
    ['{dire_hero_5}', 'герой Dire слот 5'],
    ['{radiant_player_1}', 'игрок Radiant слот 1'],
    ['{radiant_player_2}', 'игрок Radiant слот 2'],
    ['{radiant_player_3}', 'игрок Radiant слот 3'],
    ['{radiant_player_4}', 'игрок Radiant слот 4'],
    ['{radiant_player_5}', 'игрок Radiant слот 5'],
    ['{dire_player_1}', 'игрок Dire слот 1'],
    ['{dire_player_2}', 'игрок Dire слот 2'],
    ['{dire_player_3}', 'игрок Dire слот 3'],
    ['{dire_player_4}', 'игрок Dire слот 4'],
    ['{dire_player_5}', 'игрок Dire слот 5'],
    ['{radiant_kills}', 'убийства Radiant'],
    ['{dire_kills}', 'убийства Dire'],
    ['{total_kills}', 'убийства обеих команд'],
    ['{clock_minutes}', 'текущая минута игры'],
    ['{target}', 'случайная цель из диапазона'],
    ['{minute}', 'выбранная минута']
  ].map(([variable, label]) => ({ variable, label }));
}

const els = {
  gsiStatus: document.querySelector('#gsiStatus'),
  twitchStatus: document.querySelector('#twitchStatus'),
  appVersion: document.querySelector('#appVersion'),
  languageSelect: document.querySelector('#languageSelect'),
  pageTabs: document.querySelectorAll('[data-page-target]'),
  pagePanels: document.querySelectorAll('[data-page]'),
  autoDraft: document.querySelector('#autoDraft'),
  autoMinimap: document.querySelector('#autoMinimap'),
  autoQueue: document.querySelector('#autoQueue'),
  queueAutoMode: document.querySelector('#queueAutoMode'),
  draftHideMode: document.querySelector('#draftHideMode'),
  minimapSize: document.querySelector('#minimapSize'),
  minimapSide: document.querySelector('#minimapSide'),
  minimapStyle: document.querySelector('#minimapStyle'),
  queueMode: document.querySelector('#queueMode'),
  matchIntelEnabled: document.querySelector('#matchIntelEnabled'),
  showPlayerRanks: document.querySelector('#showPlayerRanks'),
  showPlayerFlags: document.querySelector('#showPlayerFlags'),
  showAegisTimer: document.querySelector('#showAegisTimer'),
  showRoshanTimer: document.querySelector('#showRoshanTimer'),
  rankDisplayModeWrap: document.querySelector('#rankDisplayModeWrap'),
  rankDisplayMode: document.querySelector('#rankDisplayMode'),
  rankDisplayMinutesWrap: document.querySelector('#rankDisplayMinutesWrap'),
  rankDisplayMinutes: document.querySelector('#rankDisplayMinutes'),
  streamerStatsWrap: document.querySelector('#streamerStatsWrap'),
  gameIntelSectionTitle: document.querySelector('#gameIntelSectionTitle'),
  gameIntelSectionSummary: document.querySelector('#gameIntelSectionSummary'),
  streamerStatsSectionSummary: document.querySelector('#streamerStatsSectionSummary'),
  overlayPositionSectionSummary: document.querySelector('#overlayPositionSectionSummary'),
  customNotablePlayersSectionSummary: document.querySelector('#customNotablePlayersSectionSummary'),
  intelMatchStatus: document.querySelector('#intelMatchStatus'),
  intelNotableStatus: document.querySelector('#intelNotableStatus'),
  intelRoshanStatus: document.querySelector('#intelRoshanStatus'),
  intelPositionStatus: document.querySelector('#intelPositionStatus'),
  streamerStatsTitle: document.querySelector('#streamerStatsTitle'),
  streamerStatsHint: document.querySelector('#streamerStatsHint'),
  streamerGoalWrap: document.querySelector('#streamerGoalWrap'),
  streamerGoalTitle: document.querySelector('#streamerGoalTitle'),
  streamerGoalSectionSummary: document.querySelector('#streamerGoalSectionSummary'),
  streamerGoalHint: document.querySelector('#streamerGoalHint'),
  streamerGoalPreview: document.querySelector('#streamerGoalPreview'),
  streamerGoalPreviewPercent: document.querySelector('#streamerGoalPreviewPercent'),
  streamerGoalPreviewBar: document.querySelector('#streamerGoalPreviewBar'),
  streamerGoalPreviewFill: document.querySelector('#streamerGoalPreviewFill'),
  streamerGoalPreviewCurrent: document.querySelector('#streamerGoalPreviewCurrent'),
  streamerGoalPreviewStart: document.querySelector('#streamerGoalPreviewStart'),
  streamerGoalPreviewTarget: document.querySelector('#streamerGoalPreviewTarget'),
  streamerGoalPreviewDelta: document.querySelector('#streamerGoalPreviewDelta'),
  streamerGoalPreviewRecord: document.querySelector('#streamerGoalPreviewRecord'),
  streamerGoalPreviewWinRate: document.querySelector('#streamerGoalPreviewWinRate'),
  streamerGoalPreviewEta: document.querySelector('#streamerGoalPreviewEta'),
  streamerMedalCard: document.querySelector('#streamerMedalCard'),
  streamerMedalArt: document.querySelector('#streamerMedalArt'),
  streamerMedalImage: document.querySelector('#streamerMedalImage'),
  streamerMedalPips: document.querySelector('#streamerMedalPips'),
  streamerMedalEyebrow: document.querySelector('#streamerMedalEyebrow'),
  streamerMedalName: document.querySelector('#streamerMedalName'),
  streamerMedalDetails: document.querySelector('#streamerMedalDetails'),
  streamerStatWinsLabel: document.querySelector('#streamerStatWinsLabel'),
  streamerStatWins: document.querySelector('#streamerStatWins'),
  streamerStatLossesLabel: document.querySelector('#streamerStatLossesLabel'),
  streamerStatLosses: document.querySelector('#streamerStatLosses'),
  streamerCurrentAccountLabel: document.querySelector('#streamerCurrentAccountLabel'),
  streamerCurrentAccount: document.querySelector('#streamerCurrentAccount'),
  menuMmrOcrEnabledWrap: document.querySelector('#menuMmrOcrEnabledWrap'),
  menuMmrOcrEnabled: document.querySelector('#menuMmrOcrEnabled'),
  streamerOcrControls: document.querySelector('#streamerOcrControls'),
  pickMenuMmrOcrRegion: document.querySelector('#pickMenuMmrOcrRegion'),
  clearMenuMmrOcrRegion: document.querySelector('#clearMenuMmrOcrRegion'),
  menuMmrOcrRegionStatus: document.querySelector('#menuMmrOcrRegionStatus'),
  menuMmrOcrManualRegion: document.querySelector('#menuMmrOcrManualRegion'),
  menuMmrOcrRegionX: document.querySelector('#menuMmrOcrRegionX'),
  menuMmrOcrRegionY: document.querySelector('#menuMmrOcrRegionY'),
  menuMmrOcrRegionWidth: document.querySelector('#menuMmrOcrRegionWidth'),
  menuMmrOcrRegionHeight: document.querySelector('#menuMmrOcrRegionHeight'),
  saveMenuMmrOcrRegion: document.querySelector('#saveMenuMmrOcrRegion'),
  showStreamerStats: document.querySelector('#showStreamerStats'),
  showStreamerRankMedal: document.querySelector('#showStreamerRankMedal'),
  showStreamerMmr: document.querySelector('#showStreamerMmr'),
  showStreamerWinLoss: document.querySelector('#showStreamerWinLoss'),
  streamerWinLossMenuPositionWrap: document.querySelector('#streamerWinLossMenuPositionWrap'),
  streamerWinLossMenuPosition: document.querySelector('#streamerWinLossMenuPosition'),
  streamerWinLossGamePositionWrap: document.querySelector('#streamerWinLossGamePositionWrap'),
  streamerWinLossGamePosition: document.querySelector('#streamerWinLossGamePosition'),
  hideStreamerStatsDuringDraft: document.querySelector('#hideStreamerStatsDuringDraft'),
  showStreamerMmrGoal: document.querySelector('#showStreamerMmrGoal'),
  showStreamerMmrGoalInMenu: document.querySelector('#showStreamerMmrGoalInMenu'),
  showStreamerMmrGoalDuringDraft: document.querySelector('#showStreamerMmrGoalDuringDraft'),
  showStreamerMmrGoalInGame: document.querySelector('#showStreamerMmrGoalInGame'),
  showStreamerMmrGoalProgress: document.querySelector('#showStreamerMmrGoalProgress'),
  showStreamerMmrGoalBackground: document.querySelector('#showStreamerMmrGoalBackground'),
  showStreamerMmrGoalCurrent: document.querySelector('#showStreamerMmrGoalCurrent'),
  showStreamerMmrGoalStart: document.querySelector('#showStreamerMmrGoalStart'),
  showStreamerMmrGoalTarget: document.querySelector('#showStreamerMmrGoalTarget'),
  showStreamerMmrGoalDelta: document.querySelector('#showStreamerMmrGoalDelta'),
  showStreamerMmrGoalRecord: document.querySelector('#showStreamerMmrGoalRecord'),
  showStreamerMmrGoalWinRate: document.querySelector('#showStreamerMmrGoalWinRate'),
  showStreamerMmrGoalEta: document.querySelector('#showStreamerMmrGoalEta'),
  resetStreamerGoalRecord: document.querySelector('#resetStreamerGoalRecord'),
  streamerMmrGoalTemplateWrap: document.querySelector('#streamerMmrGoalTemplateWrap'),
  streamerMmrGoalTemplate: document.querySelector('#streamerMmrGoalTemplate'),
  streamerMmrGoalFillStartWrap: document.querySelector('#streamerMmrGoalFillStartWrap'),
  streamerMmrGoalFillStart: document.querySelector('#streamerMmrGoalFillStart'),
  streamerMmrGoalFillEndWrap: document.querySelector('#streamerMmrGoalFillEndWrap'),
  streamerMmrGoalFillEnd: document.querySelector('#streamerMmrGoalFillEnd'),
  streamerMmrGoalTrackWrap: document.querySelector('#streamerMmrGoalTrackWrap'),
  streamerMmrGoalTrack: document.querySelector('#streamerMmrGoalTrack'),
  streamerMmrGoalAccentWrap: document.querySelector('#streamerMmrGoalAccentWrap'),
  streamerMmrGoalAccent: document.querySelector('#streamerMmrGoalAccent'),
  streamerMmrGoalTextWrap: document.querySelector('#streamerMmrGoalTextWrap'),
  streamerMmrGoalText: document.querySelector('#streamerMmrGoalText'),
  streamerMmrGoalBarHeightWrap: document.querySelector('#streamerMmrGoalBarHeightWrap'),
  streamerMmrGoalBarHeight: document.querySelector('#streamerMmrGoalBarHeight'),
  streamerMmrGoalBarHeightValue: document.querySelector('#streamerMmrGoalBarHeightValue'),
  streamerMmrGoalBarRadiusWrap: document.querySelector('#streamerMmrGoalBarRadiusWrap'),
  streamerMmrGoalBarRadius: document.querySelector('#streamerMmrGoalBarRadius'),
  streamerMmrGoalBarRadiusValue: document.querySelector('#streamerMmrGoalBarRadiusValue'),
  streamerMmrGoalGlowWrap: document.querySelector('#streamerMmrGoalGlowWrap'),
  streamerMmrGoalGlow: document.querySelector('#streamerMmrGoalGlow'),
  streamerMmrGoalGlowValue: document.querySelector('#streamerMmrGoalGlowValue'),
  streamerMmrGoalAnimationSpeedWrap: document.querySelector('#streamerMmrGoalAnimationSpeedWrap'),
  streamerMmrGoalAnimationSpeed: document.querySelector('#streamerMmrGoalAnimationSpeed'),
  streamerMmrGoalAnimationSpeedValue: document.querySelector('#streamerMmrGoalAnimationSpeedValue'),
  streamerMmrGoalPaddingTopWrap: document.querySelector('#streamerMmrGoalPaddingTopWrap'),
  streamerMmrGoalPaddingTop: document.querySelector('#streamerMmrGoalPaddingTop'),
  streamerMmrGoalPaddingTopValue: document.querySelector('#streamerMmrGoalPaddingTopValue'),
  streamerMmrGoalPaddingRightWrap: document.querySelector('#streamerMmrGoalPaddingRightWrap'),
  streamerMmrGoalPaddingRight: document.querySelector('#streamerMmrGoalPaddingRight'),
  streamerMmrGoalPaddingRightValue: document.querySelector('#streamerMmrGoalPaddingRightValue'),
  streamerMmrGoalPaddingBottomWrap: document.querySelector('#streamerMmrGoalPaddingBottomWrap'),
  streamerMmrGoalPaddingBottom: document.querySelector('#streamerMmrGoalPaddingBottom'),
  streamerMmrGoalPaddingBottomValue: document.querySelector('#streamerMmrGoalPaddingBottomValue'),
  streamerMmrGoalPaddingLeftWrap: document.querySelector('#streamerMmrGoalPaddingLeftWrap'),
  streamerMmrGoalPaddingLeft: document.querySelector('#streamerMmrGoalPaddingLeft'),
  streamerMmrGoalPaddingLeftValue: document.querySelector('#streamerMmrGoalPaddingLeftValue'),
  streamerMmrGoalAnimated: document.querySelector('#streamerMmrGoalAnimated'),
  streamerMmrGoalStartPrefixWrap: document.querySelector('#streamerMmrGoalStartPrefixWrap'),
  streamerMmrGoalStartPrefix: document.querySelector('#streamerMmrGoalStartPrefix'),
  streamerMmrGoalStartSuffixWrap: document.querySelector('#streamerMmrGoalStartSuffixWrap'),
  streamerMmrGoalStartSuffix: document.querySelector('#streamerMmrGoalStartSuffix'),
  streamerMmrGoalCurrentPrefixWrap: document.querySelector('#streamerMmrGoalCurrentPrefixWrap'),
  streamerMmrGoalCurrentPrefix: document.querySelector('#streamerMmrGoalCurrentPrefix'),
  streamerMmrGoalCurrentSuffixWrap: document.querySelector('#streamerMmrGoalCurrentSuffixWrap'),
  streamerMmrGoalCurrentSuffix: document.querySelector('#streamerMmrGoalCurrentSuffix'),
  streamerMmrGoalTargetPrefixWrap: document.querySelector('#streamerMmrGoalTargetPrefixWrap'),
  streamerMmrGoalTargetPrefix: document.querySelector('#streamerMmrGoalTargetPrefix'),
  streamerMmrGoalTargetSuffixWrap: document.querySelector('#streamerMmrGoalTargetSuffixWrap'),
  streamerMmrGoalTargetSuffix: document.querySelector('#streamerMmrGoalTargetSuffix'),
  streamerMmrGoalDeltaPrefixWrap: document.querySelector('#streamerMmrGoalDeltaPrefixWrap'),
  streamerMmrGoalDeltaPrefix: document.querySelector('#streamerMmrGoalDeltaPrefix'),
  streamerMmrGoalDeltaSuffixWrap: document.querySelector('#streamerMmrGoalDeltaSuffixWrap'),
  streamerMmrGoalDeltaSuffix: document.querySelector('#streamerMmrGoalDeltaSuffix'),
  streamerMmrGoalCustomCssWrap: document.querySelector('#streamerMmrGoalCustomCssWrap'),
  streamerMmrGoalCustomCss: document.querySelector('#streamerMmrGoalCustomCss'),
  streamerGoalCssTools: document.querySelector('#streamerGoalCssTools'),
  streamerGoalCssHint: document.querySelector('#streamerGoalCssHint'),
  streamerGoalCssLabelButtons: document.querySelectorAll('[data-goal-css-label]'),
  streamerGoalCssInsertButtons: document.querySelectorAll('[data-goal-css-insert]'),
  streamerGoalCssSnippetButtons: document.querySelectorAll('[data-goal-css-snippet]'),
  streamerMedalSourceWrap: document.querySelector('#streamerMedalSourceWrap'),
  streamerMedalSource: document.querySelector('#streamerMedalSource'),
  streamerMmrWrap: document.querySelector('#streamerMmrWrap'),
  streamerMmr: document.querySelector('#streamerMmr'),
  streamerGoalMmrWrap: document.querySelector('#streamerGoalMmrWrap'),
  streamerGoalMmr: document.querySelector('#streamerGoalMmr'),
  streamerGoalStartMmrWrap: document.querySelector('#streamerGoalStartMmrWrap'),
  streamerGoalStartMmr: document.querySelector('#streamerGoalStartMmr'),
  autoUpdateStreamerMmr: document.querySelector('#autoUpdateStreamerMmr'),
  streamerMmrWinDeltaWrap: document.querySelector('#streamerMmrWinDeltaWrap'),
  streamerMmrWinDelta: document.querySelector('#streamerMmrWinDelta'),
  streamerMmrLossDeltaWrap: document.querySelector('#streamerMmrLossDeltaWrap'),
  streamerMmrLossDelta: document.querySelector('#streamerMmrLossDelta'),
  streamerStatsStatus: document.querySelector('#streamerStatsStatus'),
  resetStreamerStats: document.querySelector('#resetStreamerStats'),
  restoreStreamerStats: document.querySelector('#restoreStreamerStats'),
  streamerAccountsWrap: document.querySelector('#streamerAccountsWrap'),
  streamerAccountsTitle: document.querySelector('#streamerAccountsTitle'),
  streamerAccountsSectionSummary: document.querySelector('#streamerAccountsSectionSummary'),
  streamerAccountsHint: document.querySelector('#streamerAccountsHint'),
  streamerSettingsAccountWrap: document.querySelector('#streamerSettingsAccountWrap'),
  streamerSettingsAccount: document.querySelector('#streamerSettingsAccount'),
  streamerAccountIdWrap: document.querySelector('#streamerAccountIdWrap'),
  streamerAccountId: document.querySelector('#streamerAccountId'),
  streamerAccountLabelWrap: document.querySelector('#streamerAccountLabelWrap'),
  streamerAccountLabel: document.querySelector('#streamerAccountLabel'),
  streamerAccountMmrWrap: document.querySelector('#streamerAccountMmrWrap'),
  streamerAccountMmr: document.querySelector('#streamerAccountMmr'),
  addStreamerAccount: document.querySelector('#addStreamerAccount'),
  cancelStreamerAccountEdit: document.querySelector('#cancelStreamerAccountEdit'),
  streamerAccountListCurrent: document.querySelector('#streamerAccountListCurrent'),
  streamerAccountListId: document.querySelector('#streamerAccountListId'),
  streamerAccountListLabel: document.querySelector('#streamerAccountListLabel'),
  streamerAccountListMmr: document.querySelector('#streamerAccountListMmr'),
  streamerAccountListSession: document.querySelector('#streamerAccountListSession'),
  streamerAccountListActions: document.querySelector('#streamerAccountListActions'),
  streamerAccountRows: document.querySelector('#streamerAccountRows'),
  streamerMmrAutomationWrap: document.querySelector('#streamerMmrAutomationWrap'),
  streamerMmrAutomationTitle: document.querySelector('#streamerMmrAutomationTitle'),
  streamerMmrAutomationSectionSummary: document.querySelector('#streamerMmrAutomationSectionSummary'),
  streamerMmrAutomationHint: document.querySelector('#streamerMmrAutomationHint'),
  overlayPositionWrap: document.querySelector('#overlayPositionWrap'),
  overlayPositionTitle: document.querySelector('#overlayPositionTitle'),
  overlayPositionHint: document.querySelector('#overlayPositionHint'),
  overlayPositionTargetWrap: document.querySelector('#overlayPositionTargetWrap'),
  overlayPositionTarget: document.querySelector('#overlayPositionTarget'),
  overlayPreviewBackgroundWrap: document.querySelector('#overlayPreviewBackgroundWrap'),
  overlayPreviewBackground: document.querySelector('#overlayPreviewBackground'),
  streamerStatsMenuPositionTitle: document.querySelector('#streamerStatsMenuPositionTitle'),
  streamerStatsMenuX: document.querySelector('#streamerStatsMenuX'),
  streamerStatsMenuY: document.querySelector('#streamerStatsMenuY'),
  streamerStatsMenuXValue: document.querySelector('#streamerStatsMenuXValue'),
  streamerStatsMenuYValue: document.querySelector('#streamerStatsMenuYValue'),
  streamerStatsGamePositionTitle: document.querySelector('#streamerStatsGamePositionTitle'),
  streamerStatsGameX: document.querySelector('#streamerStatsGameX'),
  streamerStatsGameY: document.querySelector('#streamerStatsGameY'),
  streamerStatsGameXValue: document.querySelector('#streamerStatsGameXValue'),
  streamerStatsGameYValue: document.querySelector('#streamerStatsGameYValue'),
  streamerMmrGoalMenuPositionTitle: document.querySelector('#streamerMmrGoalMenuPositionTitle'),
  streamerMmrGoalMenuX: document.querySelector('#streamerMmrGoalMenuX'),
  streamerMmrGoalMenuY: document.querySelector('#streamerMmrGoalMenuY'),
  streamerMmrGoalMenuXValue: document.querySelector('#streamerMmrGoalMenuXValue'),
  streamerMmrGoalMenuYValue: document.querySelector('#streamerMmrGoalMenuYValue'),
  streamerMmrGoalGamePositionTitle: document.querySelector('#streamerMmrGoalGamePositionTitle'),
  streamerMmrGoalGameX: document.querySelector('#streamerMmrGoalGameX'),
  streamerMmrGoalGameY: document.querySelector('#streamerMmrGoalGameY'),
  streamerMmrGoalGameXValue: document.querySelector('#streamerMmrGoalGameXValue'),
  streamerMmrGoalGameYValue: document.querySelector('#streamerMmrGoalGameYValue'),
  roshanTimerPositionTitle: document.querySelector('#roshanTimerPositionTitle'),
  roshanTimerX: document.querySelector('#roshanTimerX'),
  roshanTimerY: document.querySelector('#roshanTimerY'),
  roshanTimerXValue: document.querySelector('#roshanTimerXValue'),
  roshanTimerYValue: document.querySelector('#roshanTimerYValue'),
  predictionOverlayPositionTitle: document.querySelector('#predictionOverlayPositionTitle'),
  predictionOverlayX: document.querySelector('#predictionOverlayX'),
  predictionOverlayY: document.querySelector('#predictionOverlayY'),
  predictionOverlayXValue: document.querySelector('#predictionOverlayXValue'),
  predictionOverlayYValue: document.querySelector('#predictionOverlayYValue'),
  resetAllOverlayPositions: document.querySelector('#resetAllOverlayPositions'),
  customNotablePlayersWrap: document.querySelector('#customNotablePlayersWrap'),
  customNotablePlayersTitle: document.querySelector('#customNotablePlayersTitle'),
  customNotablePlayersHint: document.querySelector('#customNotablePlayersHint'),
  notablePlayerIdWrap: document.querySelector('#notablePlayerIdWrap'),
  notablePlayerId: document.querySelector('#notablePlayerId'),
  notablePlayerNameWrap: document.querySelector('#notablePlayerNameWrap'),
  notablePlayerName: document.querySelector('#notablePlayerName'),
  notablePlayerCountryWrap: document.querySelector('#notablePlayerCountryWrap'),
  notablePlayerCountry: document.querySelector('#notablePlayerCountry'),
  addNotablePlayer: document.querySelector('#addNotablePlayer'),
  cancelNotablePlayerEdit: document.querySelector('#cancelNotablePlayerEdit'),
  notablePlayerListId: document.querySelector('#notablePlayerListId'),
  notablePlayerListName: document.querySelector('#notablePlayerListName'),
  notablePlayerListCountry: document.querySelector('#notablePlayerListCountry'),
  notablePlayerListActions: document.querySelector('#notablePlayerListActions'),
  customNotablePlayersRows: document.querySelector('#customNotablePlayersRows'),
  manualDraft: document.querySelector('#manualDraft'),
  manualMinimap: document.querySelector('#manualMinimap'),
  manualTopBar: document.querySelector('#manualTopBar'),
  manualQueue: document.querySelector('#manualQueue'),
  gameState: document.querySelector('#gameState'),
  gameScreen: document.querySelector('#gameScreen'),
  heroState: document.querySelector('#heroState'),
  clockTime: document.querySelector('#clockTime'),
  matchId: document.querySelector('#matchId'),
  deploymentMode: document.querySelector('#deploymentMode'),
  publicBaseUrl: document.querySelector('#publicBaseUrl'),
  clientId: document.querySelector('#clientId'),
  clientSecret: document.querySelector('#clientSecret'),
  twitchChannelMode: document.querySelector('#twitchChannelMode'),
  targetChannelLogin: document.querySelector('#targetChannelLogin'),
  resolveTwitchChannel: document.querySelector('#resolveTwitchChannel'),
  effectiveRedirectUri: document.querySelector('#effectiveRedirectUri'),
  targetChannelStatus: document.querySelector('#targetChannelStatus'),
  logoutTwitch: document.querySelector('#logoutTwitch'),
  predictionForm: document.querySelector('#predictionForm'),
  predictionTypeForm: document.querySelector('#predictionTypeForm'),
  predictionWindow: document.querySelector('#predictionWindow'),
  autoCreate: document.querySelector('#autoCreate'),
  forceStreamOnline: document.querySelector('#forceStreamOnline'),
  forceStreamOnlineHint: document.querySelector('#forceStreamOnlineHint'),
  autoResolve: document.querySelector('#autoResolve'),
  cancelUncontestedPrediction: document.querySelector('#cancelUncontestedPrediction'),
  cancelUncontestedHint: document.querySelector('#cancelUncontestedHint'),
  autoCancelInvalidGame: document.querySelector('#autoCancelInvalidGame'),
  predictionSelectionMode: document.querySelector('#predictionSelectionMode'),
  selectedPredictionType: document.querySelector('#selectedPredictionType'),
  selectedPredictionTypeWrap: document.querySelector('#selectedPredictionTypeWrap'),
  predictionTypes: document.querySelector('#predictionTypes'),
  customPredictionForm: document.querySelector('#customPredictionForm'),
  customPredictionName: document.querySelector('#customPredictionName'),
  customPredictionCondition: document.querySelector('#customPredictionCondition'),
  customPredictionMetric: document.querySelector('#customPredictionMetric'),
  customPredictionMin: document.querySelector('#customPredictionMin'),
  customPredictionMax: document.querySelector('#customPredictionMax'),
  customPredictionMinMinute: document.querySelector('#customPredictionMinMinute'),
  customPredictionMaxMinute: document.querySelector('#customPredictionMaxMinute'),
  customPredictionTitle: document.querySelector('#customPredictionTitle'),
  customPredictionYes: document.querySelector('#customPredictionYes'),
  customPredictionNo: document.querySelector('#customPredictionNo'),
  variableChips: document.querySelectorAll('.variable-chip'),
  createPrediction: document.querySelector('#createPrediction'),
  lockPrediction: document.querySelector('#lockPrediction'),
  cancelPrediction: document.querySelector('#cancelPrediction'),
  resolveWin: document.querySelector('#resolveWin'),
  resolveLose: document.querySelector('#resolveLose'),
  activePrediction: document.querySelector('#activePrediction'),
  spectatorPredictionForm: document.querySelector('#spectatorPredictionForm'),
  spectatorPredictionTypeForm: document.querySelector('#spectatorPredictionTypeForm'),
  spectatorPredictionWindow: document.querySelector('#spectatorPredictionWindow'),
  spectatorAutoCreate: document.querySelector('#spectatorAutoCreate'),
  spectatorForceStreamOnline: document.querySelector('#spectatorForceStreamOnline'),
  spectatorForceStreamOnlineHint: document.querySelector('#spectatorForceStreamOnlineHint'),
  spectatorAutoResolve: document.querySelector('#spectatorAutoResolve'),
  spectatorCancelUncontestedPrediction: document.querySelector('#spectatorCancelUncontestedPrediction'),
  spectatorCancelUncontestedHint: document.querySelector('#spectatorCancelUncontestedHint'),
  spectatorAutoCancelInvalidGame: document.querySelector('#spectatorAutoCancelInvalidGame'),
  spectatorPredictionSelectionMode: document.querySelector('#spectatorPredictionSelectionMode'),
  spectatorSelectedPredictionType: document.querySelector('#spectatorSelectedPredictionType'),
  spectatorSelectedPredictionTypeWrap: document.querySelector('#spectatorSelectedPredictionTypeWrap'),
  spectatorPredictionTypes: document.querySelector('#spectatorPredictionTypes'),
  spectatorCustomPredictionForm: document.querySelector('#spectatorCustomPredictionForm'),
  spectatorCustomPredictionName: document.querySelector('#spectatorCustomPredictionName'),
  spectatorCustomPredictionCondition: document.querySelector('#spectatorCustomPredictionCondition'),
  spectatorCustomPredictionMetric: document.querySelector('#spectatorCustomPredictionMetric'),
  spectatorCustomPredictionMin: document.querySelector('#spectatorCustomPredictionMin'),
  spectatorCustomPredictionMax: document.querySelector('#spectatorCustomPredictionMax'),
  spectatorCustomPredictionMinMinute: document.querySelector('#spectatorCustomPredictionMinMinute'),
  spectatorCustomPredictionMaxMinute: document.querySelector('#spectatorCustomPredictionMaxMinute'),
  spectatorCustomPredictionTitle: document.querySelector('#spectatorCustomPredictionTitle'),
  spectatorCustomPredictionYes: document.querySelector('#spectatorCustomPredictionYes'),
  spectatorCustomPredictionNo: document.querySelector('#spectatorCustomPredictionNo'),
  spectatorIntelTitle: document.querySelector('#spectatorIntelTitle'),
  spectatorIntelHelp: document.querySelector('#spectatorIntelHelp'),
  spectatorMatchIntelEnabled: document.querySelector('#spectatorMatchIntelEnabled'),
  spectatorGameLabelEnabled: document.querySelector('#spectatorGameLabelEnabled'),
  spectatorGameLabelTemplateWrap: document.querySelector('#spectatorGameLabelTemplateWrap'),
  spectatorGameLabelTemplate: document.querySelector('#spectatorGameLabelTemplate'),
  spectatorShowPlayerRanks: document.querySelector('#spectatorShowPlayerRanks'),
  spectatorShowPlayerFlags: document.querySelector('#spectatorShowPlayerFlags'),
  spectatorShowAegisTimer: document.querySelector('#spectatorShowAegisTimer'),
  spectatorShowRoshanTimer: document.querySelector('#spectatorShowRoshanTimer'),
  spectatorRankDisplayModeWrap: document.querySelector('#spectatorRankDisplayModeWrap'),
  spectatorRankDisplayMode: document.querySelector('#spectatorRankDisplayMode'),
  spectatorRankDisplayMinutesWrap: document.querySelector('#spectatorRankDisplayMinutesWrap'),
  spectatorRankDisplayMinutes: document.querySelector('#spectatorRankDisplayMinutes'),
  spectatorCreatePrediction: document.querySelector('#spectatorCreatePrediction'),
  spectatorLockPrediction: document.querySelector('#spectatorLockPrediction'),
  spectatorCancelPrediction: document.querySelector('#spectatorCancelPrediction'),
  spectatorResolveWin: document.querySelector('#spectatorResolveWin'),
  spectatorResolveLose: document.querySelector('#spectatorResolveLose'),
  spectatorActivePrediction: document.querySelector('#spectatorActivePrediction'),
  dotaPath: document.querySelector('#dotaPath'),
  detectDota: document.querySelector('#detectDota'),
  installGsi: document.querySelector('#installGsi'),
  autoInstallUpdates: document.querySelector('#autoInstallUpdates'),
  checkUpdates: document.querySelector('#checkUpdates'),
  installUpdate: document.querySelector('#installUpdate'),
  updateStatus: document.querySelector('#updateStatus'),
  backupAll: document.querySelector('#backupAll'),
  backupSections: document.querySelector('#backupSections'),
  exportBackup: document.querySelector('#exportBackup'),
  importBackupFile: document.querySelector('#importBackupFile'),
  importBackupLabel: document.querySelector('#importBackupLabel'),
  backupStatus: document.querySelector('#backupStatus'),
  draftScreenshotAsset: document.querySelector('#draftScreenshotAsset'),
  queueScreenshotAsset: document.querySelector('#queueScreenshotAsset'),
  assetStatus: document.querySelector('#assetStatus'),
  events: document.querySelector('#events')
};

let snapshot = null;
let lastTemplateInput = null;
let predictionConfigSaveTimer = null;
const predictionConfigSaveTimers = { own: null, spectator: null };
let overlayPositionSaveTimer = null;
let streamerGoalStyleSaveTimer = null;
let pendingStreamerGoalMatchIntel = null;
let streamerGoalSaveRevision = 0;
let activePage = localStorage.getItem('dsk.activePage') || 'protection';
let editingNotablePlayerAccountId = '';
let editingStreamerAccountId = '';
const STREAMER_SETTINGS_ACCOUNT_LOCK_MS = 5 * 60 * 1000;
let activeStreamerSettingsAccountId = localStorage.getItem('dsk.streamerSettingsAccount') || '';
let activeStreamerSettingsAccountTouchedAt = Number(localStorage.getItem('dsk.streamerSettingsAccountTouchedAt') || 0);
let activeOverlayPositionKey = localStorage.getItem('dsk.overlayPositionTarget') || 'streamerStatsGame';
let latestUpdateStatus = null;

const previewRankMedalThresholds = [
  { medal: 0, name: 'Unranked', minMmr: 0, starStep: 0 },
  { medal: 1, name: 'Herald', minMmr: 0, starStep: 154 },
  { medal: 2, name: 'Guardian', minMmr: 770, starStep: 154 },
  { medal: 3, name: 'Crusader', minMmr: 1540, starStep: 154 },
  { medal: 4, name: 'Archon', minMmr: 2310, starStep: 154 },
  { medal: 5, name: 'Legend', minMmr: 3080, starStep: 154 },
  { medal: 6, name: 'Ancient', minMmr: 3850, starStep: 154 },
  { medal: 7, name: 'Divine', minMmr: 4620, starStep: 200 },
  { medal: 8, name: 'Immortal', minMmr: 5620, starStep: 0 }
];

const overlayPositionKeys = ['streamerStatsMenu', 'streamerStatsGame', 'streamerMmrGoalMenu', 'streamerMmrGoalGame', 'roshanTimer', 'predictionOverlay'];
if (activeOverlayPositionKey === 'streamerMmrGoal') activeOverlayPositionKey = 'streamerMmrGoalGame';
if (!overlayPositionKeys.includes(activeOverlayPositionKey)) activeOverlayPositionKey = 'streamerStatsGame';
const streamerMmrGoalTemplates = ['classic', 'bubbles', 'neon', 'minimal', 'lightning', 'eye', 'scanner', 'shimmer', 'comet', 'aurora', 'pulse', 'segments', 'liquid', 'equalizer', 'heartbeat', 'sparks', 'glitch'];
const streamerMmrGoalTemplateClasses = streamerMmrGoalTemplates.map((template) => `streamer-goal-template-${template}`);
const streamerMmrGoalStyleDefaults = {
  template: 'classic',
  fillStart: '#63c9ff',
  fillEnd: '#8df0a1',
  track: '#101720',
  accent: '#ffdf91',
  text: '#f8f1df',
  barHeight: 13,
  barRadius: 7,
  glow: 12,
  animationSpeed: 1,
  paddingTop: 10,
  paddingRight: 10,
  paddingBottom: 10,
  paddingLeft: 10,
  animated: true,
  startPrefix: '',
  startSuffix: ' → ',
  currentPrefix: '',
  currentSuffix: '',
  targetPrefix: '/ ',
  targetSuffix: '',
  deltaPrefix: '+',
  deltaSuffix: '',
  customCss: ''
};
const streamerGoalCssSnippets = {
  shine: `[data-goal-part="fill"]::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,.45) 45%, transparent 72%);
  transform: translateX(-120%);
  animation: goalCustomShine var(--goal-duration-custom-shine, 1.8s) ease-in-out infinite;
}

@keyframes goalCustomShine {
  to { transform: translateX(120%); }
}`,
  bubbles: `[data-goal-part="fill"]::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 55%, rgba(255,255,255,.5) 0 2px, transparent 3px),
    radial-gradient(circle at 46% 35%, rgba(255,255,255,.32) 0 3px, transparent 4px),
    radial-gradient(circle at 74% 62%, rgba(255,255,255,.38) 0 2px, transparent 3px);
  background-size: 84px 22px;
  animation: goalCustomBubbles var(--goal-duration-custom-bubbles, 2.4s) linear infinite;
}

@keyframes goalCustomBubbles {
  to { background-position: 84px -22px; }
}`,
  marker: `[data-goal-part="bar"]::before {
  content: "";
  position: absolute;
  left: 75%;
  top: -5px;
  width: 3px;
  height: calc(100% + 10px);
  border-radius: 99px;
  background: var(--goal-accent);
  box-shadow: 0 0 12px var(--goal-accent);
}`,
  frame: `[data-goal-part="root"] {
  border: 1px solid rgba(255, 223, 145, .45);
  box-shadow: 0 14px 36px rgba(0,0,0,.38), 0 0 24px rgba(255, 223, 145, .28);
}

[data-goal-part="bar"] {
  outline: 1px solid rgba(255,255,255,.14);
  outline-offset: 3px;
}`,
  pulse: `[data-goal-part="root"] {
  animation: goalCustomPulse var(--goal-duration-custom-pulse, 1.8s) ease-in-out infinite;
}

@keyframes goalCustomPulse {
  50% { filter: brightness(1.12) saturate(1.12); }
}`,
  separator: `[data-goal-part="meta"]::before {
  content: "";
  display: block;
  width: 42px;
  height: 2px;
  border-radius: 99px;
  background: var(--goal-accent);
  box-shadow: 0 0 12px var(--goal-accent);
}`,
  lightning: `[data-goal-part="bar"] {
  overflow: hidden;
}

[data-goal-part="fill"]::before {
  content: "";
  position: absolute;
  inset: -42% 0;
  background-image:
    linear-gradient(10deg, transparent 0 40%, rgba(255,255,255,.95) 42% 43%, transparent 45% 100%),
    linear-gradient(-7deg, transparent 0 50%, rgba(249,248,113,.9) 52% 54%, transparent 56% 100%),
    linear-gradient(5deg, transparent 0 60%, rgba(99,201,255,.76) 62% 63%, transparent 65% 100%);
  background-size: 96px 19px, 128px 23px, 72px 15px;
  filter: drop-shadow(0 0 6px var(--goal-accent)) drop-shadow(0 0 10px #fff);
  opacity: .82;
  animation: goalCustomLightning var(--goal-duration-custom-diagonal, 1.15s) linear infinite;
}

[data-goal-part="fill"]::after {
  opacity: .42;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.72), transparent);
  transform: translateX(-120%);
  animation: goalCustomLightningSweep var(--goal-duration-custom-diagonal-sweep, 1.7s) ease-in-out infinite;
}

@keyframes goalCustomLightning {
  0% { background-position: 0 4px, 18px 11px, 38px 1px; opacity: .38; }
  18% { opacity: .95; }
  42% { opacity: .48; }
  63% { opacity: .9; }
  100% { background-position: 192px 4px, -110px 11px, 146px 1px; opacity: .38; }
}

@keyframes goalCustomLightningSweep {
  0% { transform: translateX(-120%); opacity: 0; }
  35% { opacity: .5; }
  70%, 100% { transform: translateX(120%); opacity: 0; }
}`,
  eye: `[data-goal-part="bar"] {
  position: relative;
  overflow: hidden;
}

[data-goal-part="bar"]::before,
[data-goal-part="bar"]::after {
  content: "";
  position: absolute;
  left: -5%;
  z-index: 3;
  width: 110%;
  height: 60%;
  pointer-events: none;
  background:
    radial-gradient(ellipse at center, rgba(255,255,255,.16), transparent 62%),
    rgba(2, 4, 8, .82);
  box-shadow: 0 0 12px rgba(255,255,255,.16);
  opacity: 0;
  animation: goalCustomEyeClose var(--goal-duration-custom-eye, 3.8s) ease-in-out infinite;
}

[data-goal-part="bar"]::before {
  top: -58%;
  border-radius: 0 0 50% 50%;
  --goal-eye-close-y: 90%;
}

[data-goal-part="bar"]::after {
  bottom: -58%;
  border-radius: 50% 50% 0 0;
  --goal-eye-close-y: -90%;
}

@keyframes goalCustomEyeClose {
  0%, 68%, 100% { transform: translateY(0); opacity: 0; }
  76%, 88% { transform: translateY(var(--goal-eye-close-y)); opacity: 1; }
}`,
  scanner: `[data-goal-part="bar"] {
  position: relative;
  overflow: hidden;
}

[data-goal-part="bar"]::after {
  content: "";
  position: absolute;
  inset: -45% auto -45% -28%;
  z-index: 3;
  width: 24%;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent);
  filter: blur(1px);
  mix-blend-mode: screen;
  animation: goalCustomScanner var(--goal-duration-custom-scanner, 2.6s) linear infinite;
}

@keyframes goalCustomScanner {
  to { transform: translateX(560%); }
}`,
  sparks: `[data-goal-part="fill"]::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 70%, rgba(255,255,255,.9) 0 1px, transparent 2px),
    radial-gradient(circle at 34% 35%, var(--goal-accent) 0 2px, transparent 3px),
    radial-gradient(circle at 61% 62%, rgba(255,255,255,.7) 0 1px, transparent 2px),
    radial-gradient(circle at 84% 28%, var(--goal-fill-end) 0 2px, transparent 3px);
  background-size: 118px 24px;
  filter: drop-shadow(0 0 6px var(--goal-accent));
  opacity: .85;
  animation: goalCustomSparks var(--goal-duration-custom-sparks, 1.7s) linear infinite;
}

@keyframes goalCustomSparks {
  to { background-position: 118px -24px; }
}`,
  glitch: `[data-goal-part="meta"],
[data-goal-part="kpis"],
[data-goal-part="percent"] {
  animation: goalCustomGlitch var(--goal-duration-custom-glitch, 2.8s) steps(1, end) infinite;
}

@keyframes goalCustomGlitch {
  0%, 84%, 100% { transform: translate(0, 0); text-shadow: 0 2px 3px #000, 0 0 5px #000; }
  86% { transform: translate(2px, -1px); text-shadow: -2px 0 #00e5ff, 2px 0 #ff3b6b; }
  88% { transform: translate(-2px, 1px); text-shadow: 2px 0 #00e5ff, -2px 0 #ff3b6b; }
  90% { transform: translate(1px, 0); text-shadow: 0 0 9px var(--goal-accent); }
}`
};
const overlayPreviewBoxes = {
  streamerStatsMenu: {
    left: 1276,
    top: 18,
    width: 170,
    height: 116,
    anchor: { x: 24, y: 0 },
    visible: { width: 124, height: 92 }
  },
  streamerStatsGame: {
    left: 1390,
    top: 922,
    width: 260,
    height: 150,
    anchor: { x: 52, y: 0 },
    visible: { width: 150, height: 112 }
  },
  streamerMmrGoalMenu: {
    left: 390,
    top: 132,
    width: 420,
    height: 88,
    anchor: { x: 0, y: 0 },
    visible: { width: 420, height: 88 }
  },
  streamerMmrGoalGame: {
    left: 1110,
    top: 812,
    width: 420,
    height: 88,
    anchor: { x: 0, y: 0 },
    visible: { width: 420, height: 88 }
  },
  roshanTimer: {
    left: 318,
    top: 6,
    width: 145,
    height: 34,
    anchor: { x: 0, y: 0 },
    visible: { width: 145, height: 34 }
  },
  predictionOverlay: {
    left: 610,
    top: 104,
    width: 700,
    height: 96,
    anchor: { x: 0, y: 0 },
    visible: { width: 700, height: 96 }
  }
};

if (!overlayPositionKeys.includes(activeOverlayPositionKey)) {
  activeOverlayPositionKey = 'streamerStatsGame';
}

if (els.overlayPreviewBackground) {
  const savedPreviewBackground = localStorage.getItem('dsk.overlayPreviewBackground');
  if (['screenshot', 'black', 'white'].includes(savedPreviewBackground)) {
    els.overlayPreviewBackground.value = savedPreviewBackground;
  }
}

if (els.overlayPositionTarget) {
  els.overlayPositionTarget.value = activeOverlayPositionKey;
}

document.querySelectorAll('[data-collapsible-section]').forEach((section) => {
  const key = section.dataset.collapsibleSection;
  const saved = localStorage.getItem(`dsk.section.${key}`);
  if (saved === 'open') section.open = true;
  if (saved === 'closed') section.open = false;
  section.addEventListener('toggle', () => {
    localStorage.setItem(`dsk.section.${key}`, section.open ? 'open' : 'closed');
  });
});

const translations = {
  ru: {
    languageLabel: 'Язык',
    sponsor: 'Спонсор',
    sitePrefix: 'Сайт: xyranet.pro',
    botPrefix: 'Бот: @XyraNet_bot',
    developer: 'Разработчик',
    supportDeveloper: 'Поддержать',
    installedVersion: 'Версия',
    updateAvailableInline: 'доступна {version}',
    installUpdateInline: 'Установить',
    subtitle: 'Локальная защита стрима и автоматизация Twitch Predictions.',
    pageProtection: 'Защита',
    pageIntel: 'Оверлей',
    pageStreamerStats: 'Статистика',
    pagePredictions: 'Прогнозы',
    pageSpectatorPredictions: 'Настройки просмотра',
    pageTwitch: 'Twitch',
    pageSetup: 'Настройка',
    pageEvents: 'Журнал',
    protection: 'Защита',
    autoDraft: 'Авто скрывать draft',
    autoMinimap: 'Авто скрывать миникарту',
    autoQueue: 'Авто скрывать поиск',
    minimapSize: 'Размер миникарты',
    normal: 'Обычная',
    large: 'Большая',
    side: 'Сторона',
    left: 'Слева',
    right: 'Справа',
    minimapStyle: 'Фон миникарты',
    realistic: 'Реалистичный',
    simple: 'Простой',
    empty: 'Пустой',
    queueMode: 'Скрытие поиска',
    queueAutoMode: 'Режим автопоиска',
    queueAutoSearch: 'Только поиск',
    queueAutoMenuSearch: 'Меню + поиск',
    draftHideMode: 'Скрытие пиков',
    draftHideAll: 'Все пики',
    draftHideStreamerTeam: 'Только сторона стримера',
    partial: 'Только области поиска',
    full: 'Фуллскрин',
    matchIntelEnabled: 'Игровая аналитика в overlay',
    spectatorGameLabel: 'Подпись просматриваемой игры',
    spectatorGameLabelText: 'Текст подписи',
    showPlayerRanks: 'Ники notable игроков',
    showPlayerFlags: 'Флаги игроков',
    showAegisTimer: 'Таймер Aegis',
    showRoshanTimer: 'Таймер Roshan',
    gameIntelSection: 'Игровая информация',
    gameIntelSectionSummary: 'Notable Players, флаги, Aegis, Roshan',
    streamerStatsSectionSummary: 'Медаль, MMR, Win-Lose',
    overlayPositionSectionSummary: 'Медаль, Roshan, прогноз Twitch',
    customNotablePlayersSectionSummary: 'Ручной список notable игроков',
    intelStatusOn: 'вкл',
    intelStatusOff: 'выкл',
    intelStatusDefault: 'по умолчанию',
    intelStatusCustom: 'изменены',
    intelMatchStatus: 'Match intel: {value}',
    intelNotableStatus: 'Notable: {value}',
    intelRoshanStatus: 'Таймеры: {value}',
    intelPositionStatus: 'Позиции: {value}',
    rankDisplayMode: 'Когда показывать notable players',
    rankDisplayFirstMinutes: 'Первые N минут',
    rankDisplayFullGame: 'До конца игры',
    rankDisplayPreGameOnly: 'Только до начала игры',
    rankDisplayMinutes: 'Показывать первые N минут',
    streamerStats: 'Статистика стримера',
    streamerStatsHint: 'Локальный W-L за стрим, ручной MMR и медаль ранга. Offline не сбрасывает сессию первые 2 часа.',
    streamerMedalEyebrow: 'Текущая медаль',
    streamerMedalNoData: 'Медаль пока не определена',
    streamerMedalByAccount: 'по текущему Dota аккаунту',
    streamerMedalByMmr: 'по указанному MMR',
    streamerMedalStars: '{stars} зв.',
    streamerStatWins: 'Победы',
    streamerStatLosses: 'Поражения',
    streamerCurrentAccount: 'Текущий Dota аккаунт',
    menuMmrOcrEnabled: 'Распознавать текущий MMR через OCR',
    pickMenuMmrOcrRegion: 'Указать область',
    menuMmrOcrRegionUnset: 'Область не задана',
    menuMmrOcrRegionSet: 'Область: {width}×{height} @ {x},{y}',
    menuMmrOcrPickHint: 'Выделите область с числом MMR на экране Dota 2. Esc — отмена.',
    menuMmrOcrPickFailed: 'Не удалось выбрать область',
    menuMmrOcrLastRun: 'Последнее чтение: {mmr}',
    clearMenuMmrOcrRegion: 'Очистить область',
    saveMenuMmrOcrRegion: 'Сохранить область',
    menuMmrOcrManualHint: 'Установите slop (X11) или slurp (Wayland), либо введите координаты вручную.',
    menuMmrOcrRegionSaved: 'Область сохранена',
    menuMmrOcrRegionCleared: 'Область очищена',
    streamerAccounts: 'Dota аккаунты стримера',
    streamerAccountsSectionSummary: 'Авто и ручная привязка',
    streamerAccountsHint: 'DotaStreamKit всегда смотрит, какой аккаунт сейчас прислал GSI, и автоматически добавляет новые аккаунты в список.',
    streamerSettingsAccount: 'Аккаунт для настроек',
    streamerSettingsFallback: 'Без аккаунта / fallback',
    streamerSettingsCurrentSuffix: 'сейчас',
    streamerAccountId: 'Dota ID',
    streamerAccountLabel: 'Название',
    streamerAccountMmr: 'MMR',
    addStreamerAccount: 'Добавить',
    saveStreamerAccount: 'Сохранить',
    cancelStreamerAccountEdit: 'Отмена',
    editStreamerAccount: 'Редактировать',
    removeStreamerAccount: 'Удалить',
    streamerAccountListCurrent: 'Сейчас',
    streamerAccountListMmr: 'MMR',
    streamerAccountListSession: 'W-L за стрим',
    streamerAccountListActions: 'Действия',
    streamerAccountCurrentBadge: 'активен',
    noStreamerAccounts: 'Привязанных аккаунтов пока нет.',
    streamerMmrAutomation: 'Автоподсчёт MMR',
    streamerMmrAutomationSectionSummary: 'Изменения MMR по аккаунтам',
    streamerMmrAutomationHint: 'Если включено, после засчитанного матча обновляется MMR именно текущего Dota аккаунта.',
    streamerGoal: 'Цель MMR',
    streamerGoalSectionSummary: 'Прогресс выбранного аккаунта',
    streamerGoalHint: 'Укажи цель для выбранного аккаунта настроек и выбери, что показывать в оверлее цели.',
    showStreamerStats: 'Статистика стримера в overlay',
    showStreamerRankMedal: 'Медаль ранга',
    showStreamerMmr: 'MMR',
    showStreamerWinLoss: 'Win-Lose',
    streamerWinLossMenuPosition: '\u041f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435 Win-Lose \u0432 \u043c\u0435\u043d\u044e',
    streamerWinLossGamePosition: '\u041f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435 Win-Lose \u0432 \u0438\u0433\u0440\u0435',
    streamerWinLossLeft: '\u0421\u043b\u0435\u0432\u0430',
    streamerWinLossRight: '\u0421\u043f\u0440\u0430\u0432\u0430',
    streamerWinLossBottom: '\u0421\u043d\u0438\u0437\u0443',
    streamerWinLossTop: '\u0421\u0432\u0435\u0440\u0445\u0443',
    showStreamerMmrGoalInMenu: '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0432 \u043c\u0435\u043d\u044e',
    showStreamerMmrGoalDuringDraft: '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u043d\u0430 \u0434\u0440\u0430\u0444\u0442\u0435',
    showStreamerMmrGoalInGame: '\u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c \u0432\u043e \u0432\u0440\u0435\u043c\u044f \u043c\u0430\u0442\u0447\u0430',
    hideStreamerStatsDuringDraft: 'Скрывать на драфте',
    showStreamerMmrGoal: 'Цель MMR в overlay',
    showStreamerMmrGoalProgress: 'Полоска прогресса цели',
    showStreamerMmrGoalBackground: 'Фон и рамка цели',
    showStreamerMmrGoalCurrent: 'Текущий MMR',
    showStreamerMmrGoalStart: 'Старт MMR',
    showStreamerMmrGoalTarget: 'Цель MMR',
    showStreamerMmrGoalDelta: 'Сколько MMR осталось',
    showStreamerMmrGoalRecord: 'Счёт побед-поражений',
    showStreamerMmrGoalWinRate: 'Winrate',
    showStreamerMmrGoalEta: 'Побед до цели',
    resetStreamerGoalRecord: 'Сбросить W-L цели',
    streamerMmrGoalTemplate: 'Стиль полоски',
    streamerMmrGoalTemplateClassic: 'Классика',
    streamerMmrGoalTemplateBubbles: 'Анимированные пузырьки',
    streamerMmrGoalTemplateNeon: 'Неон',
    streamerMmrGoalTemplateMinimal: 'Минимал',
    streamerMmrGoalTemplateLightning: 'Диагональные полосы',
    streamerMmrGoalTemplateEye: 'Глаз',
    streamerMmrGoalTemplateScanner: 'Сканер',
    streamerMmrGoalTemplateShimmer: 'Шиммер',
    streamerMmrGoalTemplateComet: 'Комета',
    streamerMmrGoalTemplateAurora: 'Аврора',
    streamerMmrGoalTemplatePulse: 'Пульс',
    streamerMmrGoalTemplateSegments: 'Сегменты',
    streamerMmrGoalTemplateLiquid: 'Жидкость',
    streamerMmrGoalTemplateEqualizer: 'Эквалайзер',
    streamerMmrGoalTemplateHeartbeat: 'Сердцебиение',
    streamerMmrGoalTemplateSparks: 'Искры',
    streamerMmrGoalTemplateGlitch: 'Глитч',
    streamerMmrGoalFillStart: 'Цвет старта',
    streamerMmrGoalFillEnd: 'Цвет финиша',
    streamerMmrGoalTrack: 'Цвет фона',
    streamerMmrGoalAccent: 'Акцент',
    streamerMmrGoalText: 'Текст',
    streamerMmrGoalBarHeight: 'Толщина',
    streamerMmrGoalBarRadius: 'Скругление',
    streamerMmrGoalGlow: 'Свечение',
    streamerMmrGoalAnimationSpeed: 'Скорость анимации',
    streamerMmrGoalPaddingTop: 'Отступ сверху',
    streamerMmrGoalPaddingRight: 'Отступ справа',
    streamerMmrGoalPaddingBottom: 'Отступ снизу',
    streamerMmrGoalPaddingLeft: 'Отступ слева',
    streamerMmrGoalAnimated: 'Анимация полоски',
    streamerMmrGoalStartPrefix: 'Текст перед стартовым MMR',
    streamerMmrGoalStartSuffix: 'Текст после стартового MMR',
    streamerMmrGoalCurrentPrefix: 'Текст перед текущим MMR',
    streamerMmrGoalCurrentSuffix: 'Текст после текущего MMR',
    streamerMmrGoalTargetPrefix: 'Текст перед целью MMR',
    streamerMmrGoalTargetSuffix: 'Текст после цели MMR',
    streamerMmrGoalDeltaPrefix: 'Текст перед остатком MMR',
    streamerMmrGoalDeltaSuffix: 'Текст после остатка MMR',
    streamerMmrGoalCustomCss: 'Свой CSS / анимации',
    streamerGoalCssHint: 'Клик по части вставит селектор, клик по эффекту добавит готовый CSS. Эти же части работают в превью и OBS overlay.',
    streamerGoalCssParts: 'Куда рисовать',
    streamerGoalCssSnippets: 'Готовые эффекты',
    streamerGoalCssPartRoot: 'Весь блок',
    streamerGoalCssPartBar: 'Полоска',
    streamerGoalCssPartFill: 'Заполнение',
    streamerGoalCssPartPercent: 'Проценты',
    streamerGoalCssPartMeta: 'MMR числа',
    streamerGoalCssPartCurrent: 'Текущий',
    streamerGoalCssPartStart: 'Старт',
    streamerGoalCssPartTarget: 'Цель',
    streamerGoalCssPartDelta: 'Осталось',
    streamerGoalCssPartKpis: 'W-L / WR',
    streamerGoalCssSnippetShine: 'Блик',
    streamerGoalCssSnippetBubbles: 'Пузырьки',
    streamerGoalCssSnippetMarker: 'Метка',
    streamerGoalCssSnippetFrame: 'Рамка',
    streamerGoalCssSnippetPulse: 'Пульс',
    streamerGoalCssSnippetSeparator: 'Разделитель',
    streamerGoalCssSnippetLightning: 'Диагональные полосы',
    streamerGoalCssSnippetEye: 'Глаз',
    streamerGoalCssSnippetScanner: 'Сканер',
    streamerGoalCssSnippetSparks: 'Искры',
    streamerGoalCssSnippetGlitch: 'Глитч',
    streamerMedalSource: 'Источник медали',
    streamerMedalAuto: 'Аккаунт, затем MMR',
    streamerMedalAccount: 'Dota аккаунт',
    streamerMedalMmr: 'Указанный MMR',
    streamerMmr: 'Текущий MMR',
    streamerGoalMmr: 'Цель MMR',
    streamerGoalStartMmr: 'Старт MMR',
    autoUpdateStreamerMmr: 'Авто считать MMR после матча',
    streamerMmrWinDelta: 'MMR за победу',
    streamerMmrLossDelta: 'MMR за поражение',
    resetStreamerStats: 'Сбросить W-L',
    restoreStreamerStats: 'Восстановить прошлый W-L',
    streamerStatsStatus: 'W-L: {wins}-{losses} / MMR: {mmr} / медаль: {medal} / стрим: {stream}',
    streamerStatsNoMmr: 'не указан',
    streamerStatsNoMedal: 'нет данных',
    streamerStatsOnline: 'online',
    streamerStatsOffline: 'offline',
    streamerStatsUnknown: 'неизвестно',
    streamerStatsPrevious: ' / прошлый W-L можно восстановить: {wins}-{losses}',
    overlayPositionTitle: 'Положение overlay',
    overlayPositionHint: 'Перемещение цельных блоков без разрыва иконок и чисел.',
    overlayPositionTarget: 'Блок',
    overlayPreviewBackground: 'Фон превью',
    overlayPreviewScreenshot: 'Скриншот',
    overlayPreviewBlack: 'Черный',
    overlayPreviewWhite: 'Белый',
    streamerStatsMenuPosition: 'Медаль в меню',
    streamerStatsGamePosition: 'Медаль в игре',
    streamerMmrGoalMenuPosition: 'Цель MMR в меню',
    streamerMmrGoalGamePosition: 'Цель MMR в игре',
    roshanTimerPosition: 'Таймер Roshan',
    predictionOverlayPosition: 'Прогноз Twitch',
    overlayPositionX: 'Горизонталь',
    overlayPositionY: 'Вертикаль',
    overlayPositionReset: 'Сбросить',
    overlayPositionResetAll: 'Сбросить все позиции',
    customNotablePlayers: 'Кастомные Notable Players',
    customNotablePlayersHint: 'Добавь Dota account id игроков, которых нужно всегда считать notable. Ник и страна из этого списка имеют приоритет над OpenDota.',
    notablePlayerId: 'Dota ID',
    notablePlayerName: 'Никнейм',
    notablePlayerCountry: 'Код страны',
    addNotablePlayer: 'Добавить',
    saveNotablePlayer: 'Сохранить',
    cancelNotablePlayerEdit: 'Отмена',
    editNotablePlayer: 'Редактировать',
    removeNotablePlayer: 'Удалить',
    notablePlayerListActions: 'Действия',
    noCustomNotablePlayers: 'Список пока пуст.',
    minimap: 'Миникарта',
    topBar: 'Верхняя панель',
    queue: 'Поиск',
    game: 'Игра',
    screen: 'Экран',
    hero: 'Герой',
    time: 'Время',
    match: 'Матч',
    twitchPanel: 'Twitch',
    deploymentMode: 'Режим запуска',
    local: 'Локально',
    server: 'Сервер',
    publicUrl: 'Public URL сервера',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    clientSecretPlaceholder: 'не менять, если уже сохранен',
    redirectUri: 'Redirect URI в Twitch app:',
    channelMode: 'Канал для прогнозов',
    personalAccount: 'Личный Twitch аккаунт',
    separateAccount: 'Отдельный аккаунт / канал стримера по нику',
    streamerLogin: 'Ник стримера',
    connectTwitch: 'Подключить Twitch',
    disconnect: 'Отключить',
    bindChannel: 'Привязать канал',
    predictions: 'Ставка за баллы канала',
    spectatorPredictions: 'Настройки просмотра',
    spectatorProfileShort: 'просмотр',
    variablesTitle: 'Переменные шаблонов',
    variablesHelp: 'Нажми на переменную, чтобы вставить ее в активное поле заголовка.',
    varHero: 'герой стримера',
    varTarget: 'случайная цель из диапазона',
    varMinute: 'выбранная минута',
    varClockMinutes: 'текущая минута игры',
    varKills: 'текущие киллы',
    varDeaths: 'текущие смерти',
    varAssists: 'текущие ассисты',
    varLastHits: 'ластхиты',
    varDenies: 'добивания',
    varLevel: 'уровень героя',
    varTeamKills: 'киллы команды стримера',
    varTeamDeaths: 'смерти команды стримера',
    varTeamAssists: 'ассисты команды стримера',
    varEnemyKills: 'киллы команды противника',
    varEnemyDeaths: 'смерти команды противника',
    varEnemyAssists: 'ассисты команды противника',
    varTotalKills: 'киллы обеих команд',
    varTotalDeaths: 'смерти обеих команд',
    varTotalAssists: 'ассисты обеих команд',
    title: 'Заголовок',
    windowSec: 'Окно, сек',
    outcome1: 'Исход 1',
    outcome2: 'Исход 2',
    autoCreate: 'Создавать автоматически',
    forceStreamOnline: 'Считать стрим онлайн для авто-прогнозов',
    forceStreamOnlineHint: 'Если включить, бот будет создавать авто-прогнозы даже когда Twitch показывает offline. Используй только если статус канала определяется неверно.',
    streamForcedShort: 'принудительно online',
    autoResolve: 'Закрывать автоматически',
    cancelUncontestedPrediction: 'Отменять, если один исход без ставок',
    cancelUncontestedHint: 'Если после игры хотя бы на один исход не поставили баллы канала, бот отменит прогноз вместо выбора победившего исхода.',
    autoCancelInvalidGame: 'Отменять незасчитанную игру',
    typeMode: 'Режим типов',
    selectedMode: 'Один выбранный',
    randomMode: 'Случайный из включённых',
    selectedType: 'Выбранный тип',
    saveSettings: 'Сохранить настройки',
    create: 'Создать',
    lock: 'Закрыть прием',
    cancel: 'Отменить',
    resolveYes: 'Исход Да',
    resolveNo: 'Исход Нет',
    noActivePrediction: 'Нет активной ставки.',
    dotaGsi: 'Dota GSI',
    dotaFolder: 'Папка Dota 2',
    findDota: 'Найти Dota',
    installGsi: 'Установить GSI',
    gsiHelp: 'GSI встроен в Dota 2. DotaStreamKit устанавливает только маленький cfg-файл, который отправляет состояние игры на локальный сервер.',
    updatesTitle: 'Обновления',
    autoInstallUpdates: 'Автоматически устанавливать опубликованный релиз',
    checkUpdates: 'Проверить',
    installUpdate: 'Установить обновление',
    updateOnlyReleases: 'Обновления проверяются только по опубликованным GitHub Releases.',
    updateChecking: 'Проверяю обновления...',
    updateAvailable: 'Доступна версия {version}.',
    updateCurrent: 'Установлена актуальная версия {version}.',
    updateStarted: 'Обновление запущено. Приложение перезапустится после установки.',
    backupTitle: 'Перенос настроек',
    backupAll: 'Все настройки и файлы',
    exportBackup: 'Экспорт',
    importBackup: 'Импорт',
    backupHelp: 'По умолчанию переносится всё. Можно оставить один раздел или любую комбинацию.',
    backupExported: 'Файл настроек сохранён.',
    backupImported: 'Настройки импортированы.',
    assetsTitle: 'Картинки draft HUD',
    draftImage: 'Полный draft-скрин',
    queueImage: 'Скрин меню для скрытия поиска',
    slotsNotReady: 'Слоты еще не нарезаны.',
    journal: 'Журнал',
    enabled: 'Включен',
    preview: 'Превью',
    yes: 'Да',
    no: 'Нет',
    weight: 'Шанс выбора',
    targetFrom: 'Цель от',
    targetTo: 'Цель до',
    minuteFrom: 'Минута от',
    minuteTo: 'Минута до',
    yesOutcome: 'Исход Да',
    noOutcome: 'Исход Нет',
    typeWinLoss: 'Победа/поражение',
    descWinLoss: 'Базовый прогноз на исход игры.',
    typeKills: 'Киллы стримера',
    descKills: 'Случайная цель по убийствам из диапазона.',
    typeDeaths: 'Смерти стримера',
    descDeaths: 'Случайная цель по смертям из диапазона.',
    typeAssists: 'Ассисты стримера',
    descAssists: 'Случайная цель по ассистам из диапазона.',
    typeNoDeath: 'Не умереть до минуты',
    descNoDeath: 'Случайная минута, до которой герой должен выжить.',
    typeLastHits: 'Ластхиты к минуте',
    descLastHits: 'Случайная цель по ластхитам и минута проверки.',
    typeRadiantWin: 'Победа Radiant',
    descRadiantWin: 'Прогноз на победу команды Radiant в просматриваемой игре.',
    typeDireWin: 'Победа Dire',
    descDireWin: 'Прогноз на победу команды Dire в просматриваемой игре.',
    typeGameDuration: 'Длительность игры',
    descGameDuration: 'Случайная минута, до которой должна дойти игра.',
    typeTotalKillsMinute: 'Общие убийства к минуте',
    descTotalKillsMinute: 'Суммарные убийства обеих команд к выбранной минуте.',
    typeRadiantKillsMinute: 'Убийства Radiant к минуте',
    descRadiantKillsMinute: 'Убийства Radiant к выбранной минуте.',
    typeDireKillsMinute: 'Убийства Dire к минуте',
    descDireKillsMinute: 'Убийства Dire к выбранной минуте.',
    typeCustom: 'Свой прогноз',
    descCustom: 'Пользовательское условие по времени игры или выбранной метрике.',
    deleteTemplate: 'Удалить шаблон',
    confirmDeleteTemplate: 'Удалить пользовательский шаблон?',
    customBuilderTitle: 'Конструктор своего прогноза',
    customBuilderHelp: 'Собери условие, задай текст прогноза и сохрани шаблон. После сохранения он появится в выборе типов.',
    customName: 'Название шаблона',
    customNamePlaceholder: 'Игра 40+ минут',
    saveTemplate: 'Сохранить шаблон',
    customTemplateSaved: 'Шаблон сохранен',
    condition: 'Условие',
    metric: 'Метрика',
    conditionGameDuration: 'Игра дойдет до минуты',
    conditionReachTarget: 'Метрика достигнет цели до конца игры',
    conditionByMinute: 'Метрика будет на минуте',
    metricClockMinutes: 'Минута игры',
    metricKills: 'Киллы стримера',
    metricDeaths: 'Смерти стримера',
    metricAssists: 'Ассисты стримера',
    metricLastHits: 'Ластхиты стримера',
    metricDenies: 'Добивания стримера',
    metricLevel: 'Уровень стримера',
    metricTeamKills: 'Киллы команды стримера',
    metricTeamDeaths: 'Смерти команды стримера',
    metricTeamAssists: 'Ассисты команды стримера',
    metricEnemyKills: 'Киллы противника',
    metricEnemyDeaths: 'Смерти противника',
    metricEnemyAssists: 'Ассисты противника',
    metricRadiantKills: 'Киллы Radiant',
    metricRadiantDeaths: 'Смерти Radiant',
    metricRadiantAssists: 'Ассисты Radiant',
    metricDireKills: 'Киллы Dire',
    metricDireDeaths: 'Смерти Dire',
    metricDireAssists: 'Ассисты Dire',
    metricTotalKills: 'Киллы обеих команд',
    metricTotalDeaths: 'Смерти обеих команд',
    metricTotalAssists: 'Ассисты обеих команд',
    gameScreenMenu: 'меню Dota / reconnect',
    gameScreenGame: 'игровой экран',
    picked: 'выбран',
    topbarOnly: 'только верхняя панель',
    twitchReconnect: 'Twitch: переподключить',
    twitchDisconnected: 'Twitch отключен',
    channelNotSelected: 'Канал прогнозов не выбран.',
    channelStatusUnknown: 'статус не проверен',
    checkedAt: 'проверено',
    separateOauth: 'отдельный от OAuth аккаунта',
    neededImage: 'Нужен PNG, JPEG или WebP',
    noActivePredictionAlert: 'Нет активной ставки',
    noOutcomeAlert: 'Не найден исход для закрытия',
    dotaFound: 'Dota найдена:',
    gsiInstalled: 'GSI установлен:',
    restartDota: 'Перезапусти Dota 2, если она уже была открыта.',
    channelFound: 'Канал привязан:',
    readFileFailed: 'Не удалось прочитать файл',
    notAvailable: 'нет',
    assetSlots: 'Слоты',
    assetDraft: 'Draft',
    assetQueue: 'Поиск',
    assetMinimap: 'Миникарта'
  },
  en: {
    languageLabel: 'Language',
    sponsor: 'Sponsor',
    sitePrefix: 'Site: xyranet.pro',
    botPrefix: 'Bot: @XyraNet_bot',
    developer: 'Developer',
    supportDeveloper: 'Support',
    installedVersion: 'Version',
    updateAvailableInline: 'available {version}',
    installUpdateInline: 'Install',
    subtitle: 'Local stream protection and Twitch Predictions automation.',
    pageProtection: 'Protection',
    pageIntel: 'Overlay',
    pageStreamerStats: 'Streamer stats',
    pagePredictions: 'Predictions',
    pageSpectatorPredictions: 'Spectator settings',
    pageTwitch: 'Twitch',
    pageSetup: 'Setup',
    pageEvents: 'Log',
    protection: 'Protection',
    autoDraft: 'Auto hide draft',
    autoMinimap: 'Auto hide minimap',
    autoQueue: 'Auto hide queue/search',
    minimapSize: 'Minimap size',
    normal: 'Normal',
    large: 'Large',
    side: 'Side',
    left: 'Left',
    right: 'Right',
    minimapStyle: 'Minimap background',
    realistic: 'Realistic',
    simple: 'Simple',
    empty: 'Empty',
    queueMode: 'Queue masking',
    queueAutoMode: 'Queue auto mode',
    queueAutoSearch: 'Search only',
    queueAutoMenuSearch: 'Menu + search',
    draftHideMode: 'Pick hiding',
    draftHideAll: 'All picks',
    draftHideStreamerTeam: 'Streamer team only',
    partial: 'Queue areas only',
    full: 'Fullscreen',
    matchIntelEnabled: 'Match intel overlay',
    spectatorGameLabel: 'Spectating game label',
    spectatorGameLabelText: 'Label text',
    showPlayerRanks: 'Notable player names',
    showPlayerFlags: 'Player flags',
    showAegisTimer: 'Aegis timer',
    showRoshanTimer: 'Roshan timer',
    gameIntelSection: 'Game information',
    gameIntelSectionSummary: 'Notable Players, flags, Aegis, Roshan',
    streamerStatsSectionSummary: 'Medal, MMR, Win-Lose',
    overlayPositionSectionSummary: 'Medal, Roshan, Twitch prediction',
    customNotablePlayersSectionSummary: 'Manual notable list',
    intelStatusOn: 'on',
    intelStatusOff: 'off',
    intelStatusDefault: 'default',
    intelStatusCustom: 'custom',
    intelMatchStatus: 'Match intel: {value}',
    intelNotableStatus: 'Notable: {value}',
    intelRoshanStatus: 'Timers: {value}',
    intelPositionStatus: 'Positions: {value}',
    rankDisplayMode: 'When to show notable players',
    rankDisplayFirstMinutes: 'First N minutes',
    rankDisplayFullGame: 'Full game',
    rankDisplayPreGameOnly: 'Before the game starts only',
    rankDisplayMinutes: 'Show for first N minutes',
    streamerStats: 'Streamer stats',
    streamerStatsHint: 'Local stream W-L, manual MMR, and rank medal. Offline keeps the session for the first 2 hours.',
    streamerMedalEyebrow: 'Current medal',
    streamerMedalNoData: 'Medal is not detected yet',
    streamerMedalByAccount: 'from current Dota account',
    streamerMedalByMmr: 'from manual MMR',
    streamerMedalStars: '{stars} stars',
    streamerStatWins: 'Wins',
    streamerStatLosses: 'Losses',
    streamerCurrentAccount: 'Current Dota account',
    menuMmrOcrEnabled: 'Recognize current MMR via OCR',
    pickMenuMmrOcrRegion: 'Select region',
    menuMmrOcrRegionUnset: 'Region not set',
    menuMmrOcrRegionSet: 'Region: {width}×{height} @ {x},{y}',
    menuMmrOcrPickHint: 'Select the MMR number area on the Dota 2 screen. Esc cancels.',
    menuMmrOcrPickFailed: 'Failed to select region',
    menuMmrOcrLastRun: 'Last read: {mmr}',
    clearMenuMmrOcrRegion: 'Clear region',
    saveMenuMmrOcrRegion: 'Save region',
    menuMmrOcrManualHint: 'Install slop (X11) or slurp (Wayland), or enter coordinates manually.',
    menuMmrOcrRegionSaved: 'Region saved',
    menuMmrOcrRegionCleared: 'Region cleared',
    streamerAccounts: 'Streamer Dota accounts',
    streamerAccountsSectionSummary: 'Auto and manual binding',
    streamerAccountsHint: 'DotaStreamKit always tracks the account sent by GSI and automatically adds new accounts to this list.',
    streamerSettingsAccount: 'Settings account',
    streamerSettingsFallback: 'No account / fallback',
    streamerSettingsCurrentSuffix: 'current',
    streamerAccountId: 'Dota ID',
    streamerAccountLabel: 'Label',
    streamerAccountMmr: 'MMR',
    addStreamerAccount: 'Add',
    saveStreamerAccount: 'Save',
    cancelStreamerAccountEdit: 'Cancel',
    editStreamerAccount: 'Edit',
    removeStreamerAccount: 'Remove',
    streamerAccountListCurrent: 'Current',
    streamerAccountListMmr: 'MMR',
    streamerAccountListSession: 'Stream W-L',
    streamerAccountListActions: 'Actions',
    streamerAccountCurrentBadge: 'active',
    noStreamerAccounts: 'No bound accounts yet.',
    streamerMmrAutomation: 'MMR automation',
    streamerMmrAutomationSectionSummary: 'Per-account MMR changes',
    streamerMmrAutomationHint: 'When enabled, the current Dota account MMR is updated after each scored match.',
    streamerGoal: 'MMR goal',
    streamerGoalSectionSummary: 'Selected account progress',
    streamerGoalHint: 'Set the target for the selected settings account and choose what the goal overlay shows.',
    showStreamerStats: 'Streamer stats overlay',
    showStreamerRankMedal: 'Rank medal',
    showStreamerMmr: 'MMR',
    showStreamerWinLoss: 'Win-Lose',
    streamerWinLossMenuPosition: 'Win-Lose in menu',
    streamerWinLossGamePosition: 'Win-Lose in game',
    streamerWinLossLeft: 'Left',
    streamerWinLossRight: 'Right',
    streamerWinLossBottom: 'Bottom',
    streamerWinLossTop: 'Top',
    hideStreamerStatsDuringDraft: 'Hide during draft',
    showStreamerMmrGoal: 'MMR goal overlay',
    showStreamerMmrGoalInMenu: 'Show in menu',
    showStreamerMmrGoalDuringDraft: 'Show during draft',
    showStreamerMmrGoalInGame: 'Show during match',
    showStreamerMmrGoalProgress: 'Goal progress bar',
    showStreamerMmrGoalBackground: 'Background and frame',
    showStreamerMmrGoalCurrent: 'Current MMR',
    showStreamerMmrGoalStart: 'Start MMR',
    showStreamerMmrGoalTarget: 'Goal MMR',
    showStreamerMmrGoalDelta: 'MMR left',
    showStreamerMmrGoalRecord: 'Win-Lose score',
    showStreamerMmrGoalWinRate: 'Winrate',
    showStreamerMmrGoalEta: 'Wins to goal',
    resetStreamerGoalRecord: 'Reset goal W-L',
    streamerMmrGoalTemplate: 'Progress style',
    streamerMmrGoalTemplateClassic: 'Classic',
    streamerMmrGoalTemplateBubbles: 'Animated bubbles',
    streamerMmrGoalTemplateNeon: 'Neon',
    streamerMmrGoalTemplateMinimal: 'Minimal',
    streamerMmrGoalTemplateLightning: 'Diagonal stripes',
    streamerMmrGoalTemplateEye: 'Eye blink',
    streamerMmrGoalTemplateScanner: 'Scanner',
    streamerMmrGoalTemplateShimmer: 'Shimmer',
    streamerMmrGoalTemplateComet: 'Comet',
    streamerMmrGoalTemplateAurora: 'Aurora',
    streamerMmrGoalTemplatePulse: 'Pulse',
    streamerMmrGoalTemplateSegments: 'Segments',
    streamerMmrGoalTemplateLiquid: 'Liquid',
    streamerMmrGoalTemplateEqualizer: 'Equalizer',
    streamerMmrGoalTemplateHeartbeat: 'Heartbeat',
    streamerMmrGoalTemplateSparks: 'Sparks',
    streamerMmrGoalTemplateGlitch: 'Glitch',
    streamerMmrGoalFillStart: 'Fill start',
    streamerMmrGoalFillEnd: 'Fill end',
    streamerMmrGoalTrack: 'Track',
    streamerMmrGoalAccent: 'Accent',
    streamerMmrGoalText: 'Text',
    streamerMmrGoalBarHeight: 'Bar height',
    streamerMmrGoalBarRadius: 'Roundness',
    streamerMmrGoalGlow: 'Glow',
    streamerMmrGoalAnimationSpeed: 'Animation speed',
    streamerMmrGoalPaddingTop: 'Top padding',
    streamerMmrGoalPaddingRight: 'Right padding',
    streamerMmrGoalPaddingBottom: 'Bottom padding',
    streamerMmrGoalPaddingLeft: 'Left padding',
    streamerMmrGoalAnimated: 'Animated bar',
    streamerMmrGoalStartPrefix: 'Text before start MMR',
    streamerMmrGoalStartSuffix: 'Text after start MMR',
    streamerMmrGoalCurrentPrefix: 'Text before current MMR',
    streamerMmrGoalCurrentSuffix: 'Text after current MMR',
    streamerMmrGoalTargetPrefix: 'Text before goal MMR',
    streamerMmrGoalTargetSuffix: 'Text after goal MMR',
    streamerMmrGoalDeltaPrefix: 'Text before remaining MMR',
    streamerMmrGoalDeltaSuffix: 'Text after remaining MMR',
    streamerMmrGoalCustomCss: 'Custom CSS / animations',
    streamerGoalCssHint: 'Click a part to insert its selector, or click an effect to add ready CSS. The same parts work in preview and OBS overlay.',
    streamerGoalCssParts: 'Where to draw',
    streamerGoalCssSnippets: 'Ready effects',
    streamerGoalCssPartRoot: 'Whole block',
    streamerGoalCssPartBar: 'Bar',
    streamerGoalCssPartFill: 'Fill',
    streamerGoalCssPartPercent: 'Percent',
    streamerGoalCssPartMeta: 'MMR numbers',
    streamerGoalCssPartCurrent: 'Current',
    streamerGoalCssPartStart: 'Start',
    streamerGoalCssPartTarget: 'Goal',
    streamerGoalCssPartDelta: 'Left',
    streamerGoalCssPartKpis: 'W-L / WR',
    streamerGoalCssSnippetShine: 'Shine',
    streamerGoalCssSnippetBubbles: 'Bubbles',
    streamerGoalCssSnippetMarker: 'Marker',
    streamerGoalCssSnippetFrame: 'Frame',
    streamerGoalCssSnippetPulse: 'Pulse',
    streamerGoalCssSnippetSeparator: 'Separator',
    streamerGoalCssSnippetLightning: 'Diagonal stripes',
    streamerGoalCssSnippetEye: 'Eye blink',
    streamerGoalCssSnippetScanner: 'Scanner',
    streamerGoalCssSnippetSparks: 'Sparks',
    streamerGoalCssSnippetGlitch: 'Glitch',
    streamerMedalSource: 'Medal source',
    streamerMedalAuto: 'Account, then MMR',
    streamerMedalAccount: 'Dota account',
    streamerMedalMmr: 'Manual MMR',
    streamerMmr: 'Current MMR',
    streamerGoalMmr: 'MMR goal',
    streamerGoalStartMmr: 'Start MMR',
    autoUpdateStreamerMmr: 'Auto update MMR after match',
    streamerMmrWinDelta: 'MMR for win',
    streamerMmrLossDelta: 'MMR for loss',
    resetStreamerStats: 'Reset W-L',
    restoreStreamerStats: 'Restore previous W-L',
    streamerStatsStatus: 'W-L: {wins}-{losses} / MMR: {mmr} / medal: {medal} / stream: {stream}',
    streamerStatsNoMmr: 'not set',
    streamerStatsNoMedal: 'no data',
    streamerStatsOnline: 'online',
    streamerStatsOffline: 'offline',
    streamerStatsUnknown: 'unknown',
    streamerStatsPrevious: ' / previous W-L can be restored: {wins}-{losses}',
    overlayPositionTitle: 'Overlay position',
    overlayPositionHint: 'Move grouped blocks without splitting icons from numbers.',
    overlayPositionTarget: 'Block',
    overlayPreviewBackground: 'Preview background',
    overlayPreviewScreenshot: 'Screenshot',
    overlayPreviewBlack: 'Black',
    overlayPreviewWhite: 'White',
    streamerStatsMenuPosition: 'Menu medal',
    streamerStatsGamePosition: 'In-game medal',
    streamerMmrGoalMenuPosition: 'Menu MMR goal',
    streamerMmrGoalGamePosition: 'In-game MMR goal',
    roshanTimerPosition: 'Roshan timer',
    predictionOverlayPosition: 'Twitch prediction',
    overlayPositionX: 'Horizontal',
    overlayPositionY: 'Vertical',
    overlayPositionReset: 'Reset',
    overlayPositionResetAll: 'Reset all positions',
    customNotablePlayers: 'Custom notable players',
    customNotablePlayersHint: 'Add Dota account ids that should always be treated as notable. Name and country here override OpenDota.',
    notablePlayerId: 'Dota ID',
    notablePlayerName: 'Nickname',
    notablePlayerCountry: 'Country code',
    addNotablePlayer: 'Add',
    saveNotablePlayer: 'Save',
    cancelNotablePlayerEdit: 'Cancel',
    editNotablePlayer: 'Edit',
    removeNotablePlayer: 'Remove',
    notablePlayerListActions: 'Actions',
    noCustomNotablePlayers: 'The list is empty.',
    minimap: 'Minimap',
    topBar: 'Top bar',
    queue: 'Queue',
    game: 'Game',
    screen: 'Screen',
    hero: 'Hero',
    time: 'Time',
    match: 'Match',
    twitchPanel: 'Twitch',
    deploymentMode: 'Run mode',
    local: 'Local',
    server: 'Server',
    publicUrl: 'Server public URL',
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    clientSecretPlaceholder: 'leave empty if already saved',
    redirectUri: 'Redirect URI in Twitch app:',
    channelMode: 'Prediction channel',
    personalAccount: 'Personal Twitch account',
    separateAccount: 'Separate account / streamer channel by login',
    streamerLogin: 'Streamer login',
    connectTwitch: 'Connect Twitch',
    disconnect: 'Disconnect',
    bindChannel: 'Bind channel',
    predictions: 'Channel Points prediction',
    spectatorPredictions: 'Spectator settings',
    spectatorProfileShort: 'spectator',
    variablesTitle: 'Template variables',
    variablesHelp: 'Click a variable to insert it into the active title field.',
    varHero: 'streamer hero',
    varTarget: 'random target from range',
    varMinute: 'selected minute',
    varClockMinutes: 'current game minute',
    varKills: 'current kills',
    varDeaths: 'current deaths',
    varAssists: 'current assists',
    varLastHits: 'last hits',
    varDenies: 'denies',
    varLevel: 'hero level',
    varTeamKills: 'streamer team kills',
    varTeamDeaths: 'streamer team deaths',
    varTeamAssists: 'streamer team assists',
    varEnemyKills: 'enemy team kills',
    varEnemyDeaths: 'enemy team deaths',
    varEnemyAssists: 'enemy team assists',
    varTotalKills: 'both teams kills',
    varTotalDeaths: 'both teams deaths',
    varTotalAssists: 'both teams assists',
    title: 'Title',
    windowSec: 'Window, sec',
    outcome1: 'Outcome 1',
    outcome2: 'Outcome 2',
    autoCreate: 'Create automatically',
    forceStreamOnline: 'Treat stream as online for auto predictions',
    forceStreamOnlineHint: 'When enabled, the bot creates automatic predictions even if Twitch reports the channel as offline. Use it only when Twitch status detection is wrong.',
    streamForcedShort: 'forced online',
    autoResolve: 'Resolve automatically',
    cancelUncontestedPrediction: 'Cancel if one outcome has no points',
    cancelUncontestedHint: 'After the game, if at least one outcome has no Channel Points, the bot cancels the prediction instead of resolving it.',
    autoCancelInvalidGame: 'Cancel invalid game',
    typeMode: 'Type mode',
    selectedMode: 'One selected',
    randomMode: 'Random from enabled',
    selectedType: 'Selected type',
    saveSettings: 'Save settings',
    create: 'Create',
    lock: 'Lock entries',
    cancel: 'Cancel',
    resolveYes: 'Resolve Yes',
    resolveNo: 'Resolve No',
    noActivePrediction: 'No active prediction.',
    dotaGsi: 'Dota GSI',
    dotaFolder: 'Dota 2 folder',
    findDota: 'Find Dota',
    installGsi: 'Install GSI',
    gsiHelp: 'GSI is built into Dota 2. DotaStreamKit installs only a small cfg file that sends game state to the local server.',
    updatesTitle: 'Updates',
    autoInstallUpdates: 'Automatically install published releases',
    checkUpdates: 'Check',
    installUpdate: 'Install update',
    updateOnlyReleases: 'Updates are checked only from published GitHub Releases.',
    updateChecking: 'Checking for updates...',
    updateAvailable: 'Version {version} is available.',
    updateCurrent: 'You are on the latest version {version}.',
    updateStarted: 'Update started. The app will restart after installation.',
    backupTitle: 'Settings transfer',
    backupAll: 'All settings and files',
    exportBackup: 'Export',
    importBackup: 'Import',
    backupHelp: 'Everything is selected by default. You can keep one section or any combination.',
    backupExported: 'Settings file saved.',
    backupImported: 'Settings imported.',
    assetsTitle: 'Draft HUD images',
    draftImage: 'Full draft screenshot',
    queueImage: 'Menu screenshot for queue masking',
    slotsNotReady: 'Slots are not generated yet.',
    journal: 'Log',
    enabled: 'Enabled',
    preview: 'Preview',
    yes: 'Yes',
    no: 'No',
    weight: 'Selection chance',
    targetFrom: 'Target from',
    targetTo: 'Target to',
    minuteFrom: 'Minute from',
    minuteTo: 'Minute to',
    yesOutcome: 'Yes outcome',
    noOutcome: 'No outcome',
    typeWinLoss: 'Win/loss',
    descWinLoss: 'Basic prediction for game result.',
    typeKills: 'Streamer kills',
    descKills: 'Random kill target from the range.',
    typeDeaths: 'Streamer deaths',
    descDeaths: 'Random death target from the range.',
    typeAssists: 'Streamer assists',
    descAssists: 'Random assist target from the range.',
    typeNoDeath: 'No death until minute',
    descNoDeath: 'Random minute the hero must survive until.',
    typeLastHits: 'Last hits by minute',
    descLastHits: 'Random last-hit target and check minute.',
    typeRadiantWin: 'Radiant win',
    descRadiantWin: 'Prediction for Radiant winning the spectated game.',
    typeDireWin: 'Dire win',
    descDireWin: 'Prediction for Dire winning the spectated game.',
    typeGameDuration: 'Game duration',
    descGameDuration: 'Random minute the game needs to reach.',
    typeTotalKillsMinute: 'Total kills by minute',
    descTotalKillsMinute: 'Both teams total kills by the selected minute.',
    typeRadiantKillsMinute: 'Radiant kills by minute',
    descRadiantKillsMinute: 'Radiant kills by the selected minute.',
    typeDireKillsMinute: 'Dire kills by minute',
    descDireKillsMinute: 'Dire kills by the selected minute.',
    typeCustom: 'Custom prediction',
    descCustom: 'Custom condition based on game time or a selected metric.',
    deleteTemplate: 'Delete template',
    confirmDeleteTemplate: 'Delete this custom template?',
    customBuilderTitle: 'Custom prediction builder',
    customBuilderHelp: 'Build a condition, set the prediction text, and save the template. It will appear in the type selector.',
    customName: 'Template name',
    customNamePlaceholder: 'Game 40+ minutes',
    saveTemplate: 'Save template',
    customTemplateSaved: 'Template saved',
    condition: 'Condition',
    metric: 'Metric',
    conditionGameDuration: 'Game reaches minute',
    conditionReachTarget: 'Metric reaches target before game end',
    conditionByMinute: 'Metric value at minute',
    metricClockMinutes: 'Game minute',
    metricKills: 'Streamer kills',
    metricDeaths: 'Streamer deaths',
    metricAssists: 'Streamer assists',
    metricLastHits: 'Streamer last hits',
    metricDenies: 'Streamer denies',
    metricLevel: 'Streamer level',
    metricTeamKills: 'Streamer team kills',
    metricTeamDeaths: 'Streamer team deaths',
    metricTeamAssists: 'Streamer team assists',
    metricEnemyKills: 'Enemy kills',
    metricEnemyDeaths: 'Enemy deaths',
    metricEnemyAssists: 'Enemy assists',
    metricRadiantKills: 'Radiant kills',
    metricRadiantDeaths: 'Radiant deaths',
    metricRadiantAssists: 'Radiant assists',
    metricDireKills: 'Dire kills',
    metricDireDeaths: 'Dire deaths',
    metricDireAssists: 'Dire assists',
    metricTotalKills: 'Both teams kills',
    metricTotalDeaths: 'Both teams deaths',
    metricTotalAssists: 'Both teams assists',
    gameScreenMenu: 'Dota menu / reconnect',
    gameScreenGame: 'game screen',
    picked: 'picked',
    topbarOnly: 'topbar only',
    twitchReconnect: 'Twitch reconnect',
    twitchDisconnected: 'Twitch disconnected',
    channelNotSelected: 'Prediction channel is not selected.',
    channelStatusUnknown: 'status not checked',
    checkedAt: 'checked',
    separateOauth: 'separate from OAuth account',
    neededImage: 'PNG, JPEG or WebP is required',
    noActivePredictionAlert: 'No active prediction',
    noOutcomeAlert: 'No outcome found for resolving',
    dotaFound: 'Dota found:',
    gsiInstalled: 'GSI installed:',
    restartDota: 'Restart Dota 2 if it is already open.',
    channelFound: 'Channel bound:',
    readFileFailed: 'Failed to read file',
    notAvailable: 'none',
    assetSlots: 'Slots',
    assetDraft: 'Draft',
    assetQueue: 'Queue',
    assetMinimap: 'Minimap'
  }
};

let currentLang = resolveLanguage('auto');
let currentLanguageSetting = 'auto';

const builtinPredictionTypeDefs = [
  { type: 'win_loss', labelKey: 'typeWinLoss', descriptionKey: 'descWinLoss', ranges: [] },
  { type: 'streamer_kills', labelKey: 'typeKills', descriptionKey: 'descKills', ranges: ['min', 'max'] },
  { type: 'streamer_deaths', labelKey: 'typeDeaths', descriptionKey: 'descDeaths', ranges: ['min', 'max'] },
  { type: 'streamer_assists', labelKey: 'typeAssists', descriptionKey: 'descAssists', ranges: ['min', 'max'] },
  { type: 'no_death_until', labelKey: 'typeNoDeath', descriptionKey: 'descNoDeath', ranges: ['minMinute', 'maxMinute'] },
  { type: 'last_hits_by_minute', labelKey: 'typeLastHits', descriptionKey: 'descLastHits', ranges: ['min', 'max', 'minMinute', 'maxMinute'] }
];

const spectatorBuiltinPredictionTypeDefs = [
  { type: 'radiant_win', labelKey: 'typeRadiantWin', descriptionKey: 'descRadiantWin', ranges: [] },
  { type: 'dire_win', labelKey: 'typeDireWin', descriptionKey: 'descDireWin', ranges: [] },
  { type: 'game_duration_at_least', labelKey: 'typeGameDuration', descriptionKey: 'descGameDuration', ranges: ['minMinute', 'maxMinute'] },
  { type: 'total_kills_by_minute', labelKey: 'typeTotalKillsMinute', descriptionKey: 'descTotalKillsMinute', ranges: ['min', 'max', 'minMinute', 'maxMinute'] },
  { type: 'radiant_kills_by_minute', labelKey: 'typeRadiantKillsMinute', descriptionKey: 'descRadiantKillsMinute', ranges: ['min', 'max', 'minMinute', 'maxMinute'] },
  { type: 'dire_kills_by_minute', labelKey: 'typeDireKillsMinute', descriptionKey: 'descDireKillsMinute', ranges: ['min', 'max', 'minMinute', 'maxMinute'] }
];

const predictionEditorStates = {
  own: { defs: [...builtinPredictionTypeDefs], controlKey: '' },
  spectator: { defs: [...spectatorBuiltinPredictionTypeDefs], controlKey: '' }
};

buildPredictionTypeControls('own');
buildPredictionTypeControls('spectator');
setActivePage(activePage);
syncBackupSectionToggles();

const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  snapshot = JSON.parse(event.data);
  render(snapshot);
  refreshAssets();
};

async function api(path, body = null, method = 'POST') {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function setActivePage(page) {
  const available = [...els.pagePanels].some((panel) => panel.dataset.page === page);
  activePage = available ? page : 'protection';
  localStorage.setItem('dsk.activePage', activePage);
  for (const panel of els.pagePanels) {
    panel.classList.toggle('active-page', panel.dataset.page === activePage);
  }
  for (const tab of els.pageTabs) {
    const active = tab.dataset.pageTarget === activePage;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  }
}

function t(key) {
  return translations[currentLang]?.[key] || translations.ru[key] || key;
}

function variableLabel(variable) {
  const key = String(variable || '').replace(/[{}]/g, '');
  const normalLabels = {
    hero: 'varHero',
    target: 'varTarget',
    minute: 'varMinute',
    clock_minutes: 'varClockMinutes',
    kills: 'varKills',
    deaths: 'varDeaths',
    assists: 'varAssists',
    last_hits: 'varLastHits',
    denies: 'varDenies',
    level: 'varLevel',
    team_kills: 'varTeamKills',
    team_deaths: 'varTeamDeaths',
    team_assists: 'varTeamAssists',
    enemy_kills: 'varEnemyKills',
    enemy_deaths: 'varEnemyDeaths',
    enemy_assists: 'varEnemyAssists',
    total_kills: 'varTotalKills',
    total_deaths: 'varTotalDeaths',
    total_assists: 'varTotalAssists'
  };
  if (normalLabels[key]) return t(normalLabels[key]);
  const spectatorLabels = spectatorVariableLabelMap();
  return spectatorLabels[key] || key;
}

function spectatorVariableLabelMap() {
  const ru = currentLang !== 'en';
  const map = {
    radiant_team: ru ? 'команда Radiant' : 'Radiant team',
    dire_team: ru ? 'команда Dire' : 'Dire team',
    winning_team: ru ? 'победившая команда после игры' : 'winning team after game',
    match_id: ru ? 'ID матча' : 'match ID',
    radiant_heroes: ru ? 'герои Radiant списком' : 'Radiant heroes list',
    dire_heroes: ru ? 'герои Dire списком' : 'Dire heroes list',
    radiant_kills: ru ? 'убийства Radiant' : 'Radiant kills',
    dire_kills: ru ? 'убийства Dire' : 'Dire kills',
    clock_minutes: t('varClockMinutes'),
    target: t('varTarget'),
    minute: t('varMinute'),
    total_kills: t('varTotalKills')
  };
  for (let index = 1; index <= 5; index += 1) {
    map[`radiant_hero_${index}`] = ru ? `герой Radiant слот ${index}` : `Radiant hero slot ${index}`;
    map[`dire_hero_${index}`] = ru ? `герой Dire слот ${index}` : `Dire hero slot ${index}`;
    map[`radiant_player_${index}`] = ru ? `игрок Radiant слот ${index}` : `Radiant player slot ${index}`;
    map[`dire_player_${index}`] = ru ? `игрок Dire слот ${index}` : `Dire player slot ${index}`;
  }
  return map;
}

function resolveLanguage(setting) {
  if (setting === 'ru' || setting === 'en') return setting;
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || 'ru'];
  return browserLanguages.some((language) => String(language).toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

function applyLanguage(config) {
  currentLanguageSetting = config.ui?.language || 'auto';
  currentLang = resolveLanguage(currentLanguageSetting);
  document.documentElement.lang = currentLang;
  if (els.languageSelect) els.languageSelect.value = currentLanguageSetting;

  setText('[data-i18n="languageLabel"]', 'languageLabel');
  setText('.sponsor-label', 'sponsor');
  setText('.developer-link:not(.support-link) span', 'developer');
  setText('.support-link span', 'supportDeveloper');
  renderAppVersion(snapshot?.version, snapshot?.state?.update);
  const sponsorLinkSpans = document.querySelectorAll('.sponsor-links span');
  if (sponsorLinkSpans[0]) sponsorLinkSpans[0].textContent = t('sitePrefix');
  if (sponsorLinkSpans[1]) sponsorLinkSpans[1].textContent = t('botPrefix');
  setText('.top p', 'subtitle');
  setPageTabLabels();

  setText(els.autoDraft.closest('article').querySelector('h2'), 'protection');
  setLabelText(els.autoDraft.closest('label'), t('autoDraft'));
  setLabelText(els.autoMinimap.closest('label'), t('autoMinimap'));
  setLabelText(els.autoQueue.closest('label'), t('autoQueue'));
  setLabelText(els.minimapSize.closest('label'), t('minimapSize'));
  setOptionText(els.minimapSize, 'normal', t('normal'));
  setOptionText(els.minimapSize, 'large', t('large'));
  setLabelText(els.minimapSide.closest('label'), t('side'));
  setOptionText(els.minimapSide, 'left', t('left'));
  setOptionText(els.minimapSide, 'right', t('right'));
  setLabelText(els.minimapStyle.closest('label'), t('minimapStyle'));
  setOptionText(els.minimapStyle, 'realistic', t('realistic'));
  setOptionText(els.minimapStyle, 'simple', t('simple'));
  setOptionText(els.minimapStyle, 'empty', t('empty'));
  setLabelText(els.queueAutoMode.closest('label'), t('queueAutoMode'));
  setOptionText(els.queueAutoMode, 'search', t('queueAutoSearch'));
  setOptionText(els.queueAutoMode, 'menu_search', t('queueAutoMenuSearch'));
  setLabelText(els.draftHideMode.closest('label'), t('draftHideMode'));
  setOptionText(els.draftHideMode, 'all', t('draftHideAll'));
  setOptionText(els.draftHideMode, 'streamer_team', t('draftHideStreamerTeam'));
  setLabelText(els.queueMode.closest('label'), t('queueMode'));
  setOptionText(els.queueMode, 'partial', t('partial'));
  setOptionText(els.queueMode, 'full', t('full'));
  setText(els.matchIntelEnabled.closest('article').querySelector('h2'), 'pageIntel');
  els.gameIntelSectionTitle.textContent = t('gameIntelSection');
  els.gameIntelSectionSummary.textContent = t('gameIntelSectionSummary');
  els.streamerStatsSectionSummary.textContent = t('streamerStatsSectionSummary');
  els.overlayPositionSectionSummary.textContent = t('overlayPositionSectionSummary');
  els.customNotablePlayersSectionSummary.textContent = t('customNotablePlayersSectionSummary');
  setLabelText(els.matchIntelEnabled.closest('label'), t('matchIntelEnabled'));
  setLabelText(els.showPlayerRanks.closest('label'), t('showPlayerRanks'));
  setLabelText(els.showPlayerFlags.closest('label'), t('showPlayerFlags'));
  setLabelText(els.showAegisTimer.closest('label'), t('showAegisTimer'));
  setLabelText(els.showRoshanTimer.closest('label'), t('showRoshanTimer'));
  setLabelText(els.rankDisplayMode.closest('label'), t('rankDisplayMode'));
  setOptionText(els.rankDisplayMode, 'minutes', t('rankDisplayFirstMinutes'));
  setOptionText(els.rankDisplayMode, 'full_game', t('rankDisplayFullGame'));
  setOptionText(els.rankDisplayMode, 'pre_game_only', t('rankDisplayPreGameOnly'));
  setLabelText(els.rankDisplayMinutes.closest('label'), t('rankDisplayMinutes'));
  setText(els.streamerStatsWrap.closest('article').querySelector('h2'), 'pageStreamerStats');
  els.streamerStatsTitle.textContent = t('streamerStats');
  els.streamerStatsHint.textContent = t('streamerStatsHint');
  els.streamerGoalTitle.textContent = t('streamerGoal');
  els.streamerGoalSectionSummary.textContent = t('streamerGoalSectionSummary');
  els.streamerGoalHint.textContent = t('streamerGoalHint');
  els.streamerMedalEyebrow.textContent = t('streamerMedalEyebrow');
  els.streamerStatWinsLabel.textContent = t('streamerStatWins');
  els.streamerStatLossesLabel.textContent = t('streamerStatLosses');
  els.streamerCurrentAccountLabel.textContent = t('streamerCurrentAccount');
  setLabelText(els.menuMmrOcrEnabledWrap, t('menuMmrOcrEnabled'));
  if (els.pickMenuMmrOcrRegion) els.pickMenuMmrOcrRegion.textContent = t('pickMenuMmrOcrRegion');
  if (els.clearMenuMmrOcrRegion) els.clearMenuMmrOcrRegion.textContent = t('clearMenuMmrOcrRegion');
  if (els.saveMenuMmrOcrRegion) els.saveMenuMmrOcrRegion.textContent = t('saveMenuMmrOcrRegion');
  setLabelText(els.showStreamerStats.closest('label'), t('showStreamerStats'));
  setLabelText(els.showStreamerRankMedal.closest('label'), t('showStreamerRankMedal'));
  setLabelText(els.showStreamerMmr.closest('label'), t('showStreamerMmr'));
  setLabelText(els.showStreamerWinLoss.closest('label'), t('showStreamerWinLoss'));
  setLabelText(els.streamerWinLossMenuPositionWrap, t('streamerWinLossMenuPosition'));
  setLabelText(els.streamerWinLossGamePositionWrap, t('streamerWinLossGamePosition'));
  [els.streamerWinLossMenuPosition, els.streamerWinLossGamePosition].forEach((select) => {
    setOptionText(select, 'left', t('streamerWinLossLeft'));
    setOptionText(select, 'right', t('streamerWinLossRight'));
    setOptionText(select, 'bottom', t('streamerWinLossBottom'));
    setOptionText(select, 'top', t('streamerWinLossTop'));
  });
  setLabelText(els.hideStreamerStatsDuringDraft.closest('label'), t('hideStreamerStatsDuringDraft'));
  setLabelText(els.showStreamerMmrGoal.closest('label'), t('showStreamerMmrGoal'));
  setLabelText(els.showStreamerMmrGoalInMenu.closest('label'), t('showStreamerMmrGoalInMenu'));
  setLabelText(els.showStreamerMmrGoalDuringDraft.closest('label'), t('showStreamerMmrGoalDuringDraft'));
  setLabelText(els.showStreamerMmrGoalInGame.closest('label'), t('showStreamerMmrGoalInGame'));
  setLabelText(els.showStreamerMmrGoalProgress.closest('label'), t('showStreamerMmrGoalProgress'));
  setLabelText(els.showStreamerMmrGoalBackground.closest('label'), t('showStreamerMmrGoalBackground'));
  setLabelText(els.showStreamerMmrGoalCurrent.closest('label'), t('showStreamerMmrGoalCurrent'));
  setLabelText(els.showStreamerMmrGoalStart.closest('label'), t('showStreamerMmrGoalStart'));
  setLabelText(els.showStreamerMmrGoalTarget.closest('label'), t('showStreamerMmrGoalTarget'));
  setLabelText(els.showStreamerMmrGoalDelta.closest('label'), t('showStreamerMmrGoalDelta'));
  setLabelText(els.showStreamerMmrGoalRecord.closest('label'), t('showStreamerMmrGoalRecord'));
  setLabelText(els.showStreamerMmrGoalWinRate.closest('label'), t('showStreamerMmrGoalWinRate'));
  setLabelText(els.showStreamerMmrGoalEta.closest('label'), t('showStreamerMmrGoalEta'));
  els.resetStreamerGoalRecord.textContent = t('resetStreamerGoalRecord');
  setLabelText(els.streamerMmrGoalTemplateWrap, t('streamerMmrGoalTemplate'));
  setOptionText(els.streamerMmrGoalTemplate, 'classic', t('streamerMmrGoalTemplateClassic'));
  setOptionText(els.streamerMmrGoalTemplate, 'bubbles', t('streamerMmrGoalTemplateBubbles'));
  setOptionText(els.streamerMmrGoalTemplate, 'neon', t('streamerMmrGoalTemplateNeon'));
  setOptionText(els.streamerMmrGoalTemplate, 'minimal', t('streamerMmrGoalTemplateMinimal'));
  setOptionText(els.streamerMmrGoalTemplate, 'lightning', t('streamerMmrGoalTemplateLightning'));
  setOptionText(els.streamerMmrGoalTemplate, 'eye', t('streamerMmrGoalTemplateEye'));
  setOptionText(els.streamerMmrGoalTemplate, 'scanner', t('streamerMmrGoalTemplateScanner'));
  setOptionText(els.streamerMmrGoalTemplate, 'shimmer', t('streamerMmrGoalTemplateShimmer'));
  setOptionText(els.streamerMmrGoalTemplate, 'comet', t('streamerMmrGoalTemplateComet'));
  setOptionText(els.streamerMmrGoalTemplate, 'aurora', t('streamerMmrGoalTemplateAurora'));
  setOptionText(els.streamerMmrGoalTemplate, 'pulse', t('streamerMmrGoalTemplatePulse'));
  setOptionText(els.streamerMmrGoalTemplate, 'segments', t('streamerMmrGoalTemplateSegments'));
  setOptionText(els.streamerMmrGoalTemplate, 'liquid', t('streamerMmrGoalTemplateLiquid'));
  setOptionText(els.streamerMmrGoalTemplate, 'equalizer', t('streamerMmrGoalTemplateEqualizer'));
  setOptionText(els.streamerMmrGoalTemplate, 'heartbeat', t('streamerMmrGoalTemplateHeartbeat'));
  setOptionText(els.streamerMmrGoalTemplate, 'sparks', t('streamerMmrGoalTemplateSparks'));
  setOptionText(els.streamerMmrGoalTemplate, 'glitch', t('streamerMmrGoalTemplateGlitch'));
  setLabelText(els.streamerMmrGoalFillStartWrap, t('streamerMmrGoalFillStart'));
  setLabelText(els.streamerMmrGoalFillEndWrap, t('streamerMmrGoalFillEnd'));
  setLabelText(els.streamerMmrGoalTrackWrap, t('streamerMmrGoalTrack'));
  setLabelText(els.streamerMmrGoalAccentWrap, t('streamerMmrGoalAccent'));
  setLabelText(els.streamerMmrGoalTextWrap, t('streamerMmrGoalText'));
  setLabelText(els.streamerMmrGoalBarHeightWrap, t('streamerMmrGoalBarHeight'));
  setLabelText(els.streamerMmrGoalBarRadiusWrap, t('streamerMmrGoalBarRadius'));
  setLabelText(els.streamerMmrGoalGlowWrap, t('streamerMmrGoalGlow'));
  setLabelText(els.streamerMmrGoalAnimationSpeedWrap, t('streamerMmrGoalAnimationSpeed'));
  setLabelText(els.streamerMmrGoalPaddingTopWrap, t('streamerMmrGoalPaddingTop'));
  setLabelText(els.streamerMmrGoalPaddingRightWrap, t('streamerMmrGoalPaddingRight'));
  setLabelText(els.streamerMmrGoalPaddingBottomWrap, t('streamerMmrGoalPaddingBottom'));
  setLabelText(els.streamerMmrGoalPaddingLeftWrap, t('streamerMmrGoalPaddingLeft'));
  setLabelText(els.streamerMmrGoalAnimated.closest('label'), t('streamerMmrGoalAnimated'));
  setLabelText(els.streamerMmrGoalStartPrefixWrap, t('streamerMmrGoalStartPrefix'));
  setLabelText(els.streamerMmrGoalStartSuffixWrap, t('streamerMmrGoalStartSuffix'));
  setLabelText(els.streamerMmrGoalCurrentPrefixWrap, t('streamerMmrGoalCurrentPrefix'));
  setLabelText(els.streamerMmrGoalCurrentSuffixWrap, t('streamerMmrGoalCurrentSuffix'));
  setLabelText(els.streamerMmrGoalTargetPrefixWrap, t('streamerMmrGoalTargetPrefix'));
  setLabelText(els.streamerMmrGoalTargetSuffixWrap, t('streamerMmrGoalTargetSuffix'));
  setLabelText(els.streamerMmrGoalDeltaPrefixWrap, t('streamerMmrGoalDeltaPrefix'));
  setLabelText(els.streamerMmrGoalDeltaSuffixWrap, t('streamerMmrGoalDeltaSuffix'));
  setLabelText(els.streamerMmrGoalCustomCssWrap, t('streamerMmrGoalCustomCss'));
  if (els.streamerGoalCssHint) els.streamerGoalCssHint.textContent = t('streamerGoalCssHint');
  els.streamerGoalCssLabelButtons?.forEach((item) => {
    const key = item.dataset.goalCssLabel;
    if (key) item.textContent = t(key);
  });
  setLabelText(els.streamerMedalSourceWrap, t('streamerMedalSource'));
  setOptionText(els.streamerMedalSource, 'auto', t('streamerMedalAuto'));
  setOptionText(els.streamerMedalSource, 'account', t('streamerMedalAccount'));
  setOptionText(els.streamerMedalSource, 'mmr', t('streamerMedalMmr'));
  setLabelText(els.streamerMmrWrap, t('streamerMmr'));
  setLabelText(els.streamerGoalMmrWrap, t('streamerGoalMmr'));
  setLabelText(els.streamerGoalStartMmrWrap, t('streamerGoalStartMmr'));
  setLabelText(els.autoUpdateStreamerMmr.closest('label'), t('autoUpdateStreamerMmr'));
  setLabelText(els.streamerMmrWinDeltaWrap, t('streamerMmrWinDelta'));
  setLabelText(els.streamerMmrLossDeltaWrap, t('streamerMmrLossDelta'));
  els.resetStreamerStats.textContent = t('resetStreamerStats');
  els.restoreStreamerStats.textContent = t('restoreStreamerStats');
  els.streamerAccountsTitle.textContent = t('streamerAccounts');
  els.streamerAccountsSectionSummary.textContent = t('streamerAccountsSectionSummary');
  els.streamerAccountsHint.textContent = t('streamerAccountsHint');
  setLabelText(els.streamerSettingsAccountWrap, t('streamerSettingsAccount'));
  setLabelText(els.streamerAccountIdWrap, t('streamerAccountId'));
  setLabelText(els.streamerAccountLabelWrap, t('streamerAccountLabel'));
  setLabelText(els.streamerAccountMmrWrap, t('streamerAccountMmr'));
  els.addStreamerAccount.textContent = editingStreamerAccountId ? t('saveStreamerAccount') : t('addStreamerAccount');
  els.cancelStreamerAccountEdit.textContent = t('cancelStreamerAccountEdit');
  els.streamerAccountListCurrent.textContent = t('streamerAccountListCurrent');
  els.streamerAccountListId.textContent = t('streamerAccountId');
  els.streamerAccountListLabel.textContent = t('streamerAccountLabel');
  els.streamerAccountListMmr.textContent = t('streamerAccountListMmr');
  els.streamerAccountListSession.textContent = t('streamerAccountListSession');
  els.streamerAccountListActions.textContent = t('streamerAccountListActions');
  els.streamerMmrAutomationTitle.textContent = t('streamerMmrAutomation');
  els.streamerMmrAutomationSectionSummary.textContent = t('streamerMmrAutomationSectionSummary');
  els.streamerMmrAutomationHint.textContent = t('streamerMmrAutomationHint');
  els.overlayPositionTitle.textContent = t('overlayPositionTitle');
  els.overlayPositionHint.textContent = t('overlayPositionHint');
  setLabelText(els.overlayPositionTargetWrap, t('overlayPositionTarget'));
  setOptionText(els.overlayPositionTarget, 'streamerStatsMenu', t('streamerStatsMenuPosition'));
  setOptionText(els.overlayPositionTarget, 'streamerStatsGame', t('streamerStatsGamePosition'));
  setOptionText(els.overlayPositionTarget, 'streamerMmrGoalMenu', t('streamerMmrGoalMenuPosition'));
  setOptionText(els.overlayPositionTarget, 'streamerMmrGoalGame', t('streamerMmrGoalGamePosition'));
  setOptionText(els.overlayPositionTarget, 'roshanTimer', t('roshanTimerPosition'));
  setOptionText(els.overlayPositionTarget, 'predictionOverlay', t('predictionOverlayPosition'));
  setLabelText(els.overlayPreviewBackgroundWrap, t('overlayPreviewBackground'));
  setOptionText(els.overlayPreviewBackground, 'screenshot', t('overlayPreviewScreenshot'));
  setOptionText(els.overlayPreviewBackground, 'black', t('overlayPreviewBlack'));
  setOptionText(els.overlayPreviewBackground, 'white', t('overlayPreviewWhite'));
  els.streamerStatsMenuPositionTitle.textContent = t('streamerStatsMenuPosition');
  els.streamerStatsGamePositionTitle.textContent = t('streamerStatsGamePosition');
  els.streamerMmrGoalMenuPositionTitle.textContent = t('streamerMmrGoalMenuPosition');
  els.streamerMmrGoalGamePositionTitle.textContent = t('streamerMmrGoalGamePosition');
  els.roshanTimerPositionTitle.textContent = t('roshanTimerPosition');
  els.predictionOverlayPositionTitle.textContent = t('predictionOverlayPosition');
  for (const key of overlayPositionKeys) {
    els[`${key}X`]?.closest('label')?.querySelector('span')?.replaceChildren(document.createTextNode(t('overlayPositionX')));
    els[`${key}Y`]?.closest('label')?.querySelector('span')?.replaceChildren(document.createTextNode(t('overlayPositionY')));
  }
  document.querySelectorAll('[data-reset-position]').forEach((button) => {
    button.textContent = t('overlayPositionReset');
  });
  els.resetAllOverlayPositions.textContent = t('overlayPositionResetAll');
  els.customNotablePlayersTitle.textContent = t('customNotablePlayers');
  els.customNotablePlayersHint.textContent = t('customNotablePlayersHint');
  setLabelText(els.notablePlayerIdWrap, t('notablePlayerId'));
  setLabelText(els.notablePlayerNameWrap, t('notablePlayerName'));
  setLabelText(els.notablePlayerCountryWrap, t('notablePlayerCountry'));
  els.addNotablePlayer.textContent = editingNotablePlayerAccountId ? t('saveNotablePlayer') : t('addNotablePlayer');
  els.cancelNotablePlayerEdit.textContent = t('cancelNotablePlayerEdit');
  els.notablePlayerListId.textContent = t('notablePlayerId');
  els.notablePlayerListName.textContent = t('notablePlayerName');
  els.notablePlayerListCountry.textContent = t('notablePlayerCountry');
  els.notablePlayerListActions.textContent = t('notablePlayerListActions');
  els.manualMinimap.textContent = t('minimap');
  els.manualTopBar.textContent = t('topBar');
  els.manualQueue.textContent = t('queue');
  const factLabels = els.autoDraft.closest('article').querySelectorAll('dt');
  [t('game'), t('screen'), t('hero'), t('time'), t('match')].forEach((label, index) => {
    if (factLabels[index]) factLabels[index].textContent = label;
  });

  setText(els.deploymentMode.closest('article').querySelector('h2'), 'twitchPanel');
  setLabelText(els.deploymentMode.closest('label'), t('deploymentMode'));
  setOptionText(els.deploymentMode, 'local', t('local'));
  setOptionText(els.deploymentMode, 'server', t('server'));
  setLabelText(els.publicBaseUrl.closest('label'), t('publicUrl'));
  setLabelText(els.clientId.closest('label'), t('clientId'));
  setLabelText(els.clientSecret.closest('label'), t('clientSecret'));
  els.clientSecret.placeholder = t('clientSecretPlaceholder');
  setLabelText(els.twitchChannelMode.closest('label'), t('channelMode'));
  setOptionText(els.twitchChannelMode, 'personal', t('personalAccount'));
  setOptionText(els.twitchChannelMode, 'separate', t('separateAccount'));
  setLabelText(els.targetChannelLogin.closest('label'), t('streamerLogin'));
  document.querySelector('a[href="/auth/twitch"]').textContent = t('connectTwitch');
  els.logoutTwitch.textContent = t('disconnect');
  els.resolveTwitchChannel.textContent = t('bindChannel');
  setPrefixText(els.effectiveRedirectUri.parentElement, t('redirectUri'));

  setText(els.predictionForm.closest('article').querySelector('h2'), 'predictions');
  document.querySelectorAll('.variable-summary span').forEach((item) => { item.textContent = t('variablesTitle'); });
  document.querySelectorAll('.variable-guide p').forEach((item) => { item.textContent = t('variablesHelp'); });
  document.querySelectorAll('.variable-chip').forEach((chip) => {
    const span = chip.querySelector('span');
    if (span) span.textContent = variableLabel(chip.dataset.var);
  });
  setLabelText(els.predictionWindow.closest('label'), t('windowSec'));
  setLabelText(els.autoCreate.closest('label'), t('autoCreate'));
  setLabelText(els.forceStreamOnline.closest('label'), t('forceStreamOnline'));
  els.forceStreamOnlineHint.textContent = t('forceStreamOnlineHint');
  setLabelText(els.autoResolve.closest('label'), t('autoResolve'));
  setLabelText(els.cancelUncontestedPrediction.closest('label'), t('cancelUncontestedPrediction'));
  els.cancelUncontestedHint.textContent = t('cancelUncontestedHint');
  setLabelText(els.autoCancelInvalidGame.closest('label'), t('autoCancelInvalidGame'));
  setLabelText(els.predictionSelectionMode.closest('label'), t('typeMode'));
  setOptionText(els.predictionSelectionMode, 'selected', t('selectedMode'));
  setOptionText(els.predictionSelectionMode, 'random', t('randomMode'));
  setLabelText(els.selectedPredictionTypeWrap, t('selectedType'));
  els.predictionTypeForm.querySelector('button[type="submit"]').textContent = t('saveSettings');
  const spectatorArticle = els.spectatorPredictionForm?.closest('article');
  if (spectatorArticle) {
    setText(spectatorArticle.querySelector('h2'), 'spectatorPredictions');
    const note = spectatorArticle.querySelector('.spectator-prediction-note');
    if (note) note.textContent = currentLang === 'en'
      ? 'Separate automatic bets for spectated games. Stream protection masks stay disabled in this mode.'
      : 'Отдельные автоставки для режима просмотра чужих игр. Защитные маски в этом режиме не включаются.';
  }
  for (const profile of predictionProfiles()) {
    const ctx = predictionEditor(profile);
    if (profile === 'own') continue;
    setLabelText(ctx.predictionWindow.closest('label'), t('windowSec'));
    setLabelText(ctx.autoCreate.closest('label'), t('autoCreate'));
    setLabelText(ctx.forceStreamOnline.closest('label'), t('forceStreamOnline'));
    ctx.forceStreamOnlineHint.textContent = t('forceStreamOnlineHint');
    setLabelText(ctx.autoResolve.closest('label'), t('autoResolve'));
    setLabelText(ctx.cancelUncontestedPrediction.closest('label'), t('cancelUncontestedPrediction'));
    ctx.cancelUncontestedHint.textContent = t('cancelUncontestedHint');
    setLabelText(ctx.autoCancelInvalidGame.closest('label'), t('autoCancelInvalidGame'));
    setLabelText(ctx.selectionMode.closest('label'), t('typeMode'));
    setOptionText(ctx.selectionMode, 'selected', t('selectedMode'));
    setOptionText(ctx.selectionMode, 'random', t('randomMode'));
    setLabelText(ctx.selectedTypeWrap, t('selectedType'));
    ctx.typeForm.querySelector('button[type="submit"]').textContent = t('saveSettings');
  }
  document.querySelectorAll('.custom-builder h3').forEach((item) => { item.textContent = t('customBuilderTitle'); });
  document.querySelectorAll('.custom-builder .section-head p').forEach((item) => { item.textContent = t('customBuilderHelp'); });
  for (const profile of predictionProfiles()) {
    const ctx = predictionEditor(profile);
    setLabelText(ctx.customName.closest('label'), t('customName'));
    ctx.customName.placeholder = t('customNamePlaceholder');
    setLabelText(ctx.customCondition.closest('label'), t('condition'));
    setLabelText(ctx.customMetric.closest('label'), t('metric'));
    setLabelText(ctx.customMin.closest('label'), t('targetFrom'));
    setLabelText(ctx.customMax.closest('label'), t('targetTo'));
    setLabelText(ctx.customMinMinute.closest('label'), t('minuteFrom'));
    setLabelText(ctx.customMaxMinute.closest('label'), t('minuteTo'));
    setLabelText(ctx.customTitle.closest('label'), t('title'));
    setLabelText(ctx.customYes.closest('label'), t('yesOutcome'));
    setLabelText(ctx.customNo.closest('label'), t('noOutcome'));
    ctx.customForm.querySelector('button[type="submit"]').textContent = t('saveTemplate');
    applyConditionOptions(ctx.customCondition);
    applyMetricOptions(ctx.customMetric, profile);
    updateCustomBuilderFieldVisibilityForProfile(profile);
  }
  els.createPrediction.textContent = t('create');
  els.lockPrediction.textContent = t('lock');
  els.cancelPrediction.textContent = t('cancel');
  els.resolveWin.textContent = t('resolveYes');
  els.resolveLose.textContent = t('resolveNo');
  if (els.spectatorCreatePrediction) els.spectatorCreatePrediction.textContent = t('create');
  if (els.spectatorLockPrediction) els.spectatorLockPrediction.textContent = t('lock');
  if (els.spectatorCancelPrediction) els.spectatorCancelPrediction.textContent = t('cancel');
  if (els.spectatorResolveWin) els.spectatorResolveWin.textContent = t('resolveYes');
  if (els.spectatorResolveLose) els.spectatorResolveLose.textContent = t('resolveNo');
  if (els.spectatorIntelTitle) els.spectatorIntelTitle.textContent = currentLang === 'en' ? 'Spectator Match Intel' : 'Match Intel при просмотре';
  if (els.spectatorIntelHelp) els.spectatorIntelHelp.textContent = currentLang === 'en' ? 'Separate overlay intel settings for spectated games.' : 'Отдельные настройки подсказок для чужих игр.';
  setLabelText(els.spectatorMatchIntelEnabled?.closest('label'), t('matchIntelEnabled'));
  setLabelText(els.spectatorGameLabelEnabled?.closest('label'), t('spectatorGameLabel'));
  setLabelText(els.spectatorGameLabelTemplateWrap, t('spectatorGameLabelText'));
  if (els.spectatorGameLabelTemplate) els.spectatorGameLabelTemplate.placeholder = 'Spectating game: {game_id}';
  setLabelText(els.spectatorShowPlayerRanks?.closest('label'), t('showPlayerRanks'));
  setLabelText(els.spectatorShowPlayerFlags?.closest('label'), t('showPlayerFlags'));
  setLabelText(els.spectatorShowAegisTimer?.closest('label'), t('showAegisTimer'));
  setLabelText(els.spectatorShowRoshanTimer?.closest('label'), t('showRoshanTimer'));
  setLabelText(els.spectatorRankDisplayModeWrap, t('rankDisplayMode'));
  setOptionText(els.spectatorRankDisplayMode, 'minutes', t('rankDisplayFirstMinutes'));
  setOptionText(els.spectatorRankDisplayMode, 'full_game', t('rankDisplayFullGame'));
  setOptionText(els.spectatorRankDisplayMode, 'pre_game_only', t('rankDisplayPreGameOnly'));
  setLabelText(els.spectatorRankDisplayMinutesWrap, t('rankDisplayMinutes'));

  setText(els.dotaPath.closest('article').querySelector('h2'), 'dotaGsi');
  setLabelText(els.dotaPath.closest('label'), t('dotaFolder'));
  els.detectDota.textContent = t('findDota');
  els.installGsi.textContent = t('installGsi');
  els.installGsi.closest('article').querySelector('.muted').textContent = t('gsiHelp');

  setText('#updatesTitle', 'updatesTitle');
  setLabelText(els.autoInstallUpdates.closest('label'), t('autoInstallUpdates'));
  els.checkUpdates.textContent = t('checkUpdates');
  els.installUpdate.textContent = t('installUpdate');
  if (!latestUpdateStatus) els.updateStatus.textContent = t('updateOnlyReleases');

  setText('#backupTitle', 'backupTitle');
  setLabelText(els.backupAll.closest('label'), t('backupAll'));
  els.exportBackup.textContent = t('exportBackup');
  els.importBackupLabel.textContent = t('importBackup');
  if (!els.backupStatus.dataset.custom) els.backupStatus.textContent = t('backupHelp');

  setText(els.draftScreenshotAsset.closest('article').querySelector('h2'), 'assetsTitle');
  setLabelText(els.draftScreenshotAsset.closest('label'), t('draftImage'));
  setLabelText(els.queueScreenshotAsset.closest('label'), t('queueImage'));
  setText(els.events.closest('article').querySelector('h2'), 'journal');

  applyPredictionTypeLanguage();
}

function setText(target, key) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (el) el.textContent = t(key);
}

function setPageTabLabels() {
  const labelKeys = {
    protection: 'pageProtection',
    intel: 'pageIntel',
    streamerStats: 'pageStreamerStats',
    predictions: 'pagePredictions',
    spectatorPredictions: 'pageSpectatorPredictions',
    twitch: 'pageTwitch',
    setup: 'pageSetup',
    events: 'pageEvents'
  };
  for (const tab of els.pageTabs) {
    const key = labelKeys[tab.dataset.pageTarget];
    if (key) tab.textContent = t(key);
  }
}

function setLabelText(label, text) {
  if (!label) return;
  for (const node of Array.from(label.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) node.remove();
  }
  const control = label.querySelector('input, select, textarea');
  const controlStartsLabel = control === label.firstElementChild && control?.matches('input[type="checkbox"]');
  const textNode = document.createTextNode(controlStartsLabel ? ` ${text}` : text);
  if (!control) label.prepend(textNode);
  else if (controlStartsLabel) control.after(textNode);
  else label.insertBefore(textNode, control);
}

function setOptionText(select, value, text) {
  const option = select?.querySelector(`option[value="${value}"]`);
  if (option) option.textContent = text;
}

function setPrefixText(container, text) {
  if (!container) return;
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) node.remove();
  }
  container.prepend(document.createTextNode(`${text} `));
}

function applyConditionOptions(select) {
  if (!select) return;
  const current = select.value || 'game_duration_at_least';
  select.innerHTML = '';
  [
    ['game_duration_at_least', 'conditionGameDuration'],
    ['metric_reaches_target', 'conditionReachTarget'],
    ['metric_by_minute', 'conditionByMinute']
  ].forEach(([value, key]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    select.append(option);
  });
  select.value = [...select.options].some((option) => option.value === current)
    ? current
    : (select.options[0]?.value || '');
}

function applyMetricOptions(select, profile = 'own') {
  if (!select) return;
  const current = select.value || 'clock_minutes';
  select.innerHTML = '';
  metricOptionDefs(profile).forEach(([value, key]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    select.append(option);
  });
  select.value = current;
}

function metricOptionDefs(profile = 'own') {
  const base = [
    ['clock_minutes', 'metricClockMinutes'],
    ['kills', 'metricKills'],
    ['deaths', 'metricDeaths'],
    ['assists', 'metricAssists'],
    ['last_hits', 'metricLastHits'],
    ['denies', 'metricDenies'],
    ['level', 'metricLevel'],
    ['team_kills', 'metricTeamKills'],
    ['team_deaths', 'metricTeamDeaths'],
    ['team_assists', 'metricTeamAssists'],
    ['enemy_kills', 'metricEnemyKills'],
    ['enemy_deaths', 'metricEnemyDeaths'],
    ['enemy_assists', 'metricEnemyAssists'],
    ['total_kills', 'metricTotalKills'],
    ['total_deaths', 'metricTotalDeaths'],
    ['total_assists', 'metricTotalAssists']
  ];
  if (profile !== 'spectator') return base;
  return [
    ['clock_minutes', 'metricClockMinutes'],
    ['radiant_kills', 'metricRadiantKills'],
    ['radiant_deaths', 'metricRadiantDeaths'],
    ['radiant_assists', 'metricRadiantAssists'],
    ['dire_kills', 'metricDireKills'],
    ['dire_deaths', 'metricDireDeaths'],
    ['dire_assists', 'metricDireAssists'],
    ['total_kills', 'metricTotalKills'],
    ['total_deaths', 'metricTotalDeaths'],
    ['total_assists', 'metricTotalAssists']
  ];
}

function metricOptionsHtml(profile = 'own') {
  return metricOptionDefs(profile)
    .map(([value, key]) => `<option value="${value}">${t(key)}</option>`)
    .join('');
}

function renderAppVersion(version, update = null) {
  if (!els.appVersion) return;
  const base = `${t('installedVersion')}: ${version || '-'}`;
  const updateAvailable = update?.updateAvailable && update.latestVersion;
  els.appVersion.replaceChildren(document.createTextNode(base));
  if (updateAvailable) {
    els.appVersion.append(document.createTextNode(' / '));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-version-update';
    button.dataset.installUpdateInline = 'true';
    button.textContent = t('updateAvailableInline').replace('{version}', update.latestVersion);
    els.appVersion.append(button);
  }
  els.appVersion.classList.toggle('has-update', Boolean(updateAvailable));
  els.appVersion.title = update?.error || (update?.checking ? t('updateChecking') : '');
}

function renderUpdateStatusText(status) {
  if (!els.updateStatus) return;
  els.updateStatus.dataset.custom = 'true';
  els.updateStatus.replaceChildren();
  if (status?.updateAvailable) {
    els.updateStatus.append(document.createTextNode(t('updateAvailable').replace('{version}', status.latestVersion)));
    els.updateStatus.append(document.createTextNode(' '));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inline-update-button';
    button.dataset.installUpdateInline = 'true';
    button.textContent = t('installUpdateInline');
    els.updateStatus.append(button);
  } else {
    els.updateStatus.textContent = t('updateCurrent').replace('{version}', status?.currentVersion || '-');
  }
}

function renderServerUpdateStatus(update) {
  if (!update?.checkedAt && !update?.checking && !update?.error) return;
  latestUpdateStatus = {
    currentVersion: update.currentVersion,
    latestVersion: update.latestVersion,
    updateAvailable: update.updateAvailable === true,
    releaseUrl: update.releaseUrl || ''
  };
  els.installUpdate.disabled = !latestUpdateStatus.updateAvailable;
  if (update.checking) {
    els.updateStatus.dataset.custom = 'true';
    els.updateStatus.textContent = t('updateChecking');
  } else if (update.error) {
    els.updateStatus.dataset.custom = 'true';
    els.updateStatus.textContent = update.error;
  } else {
    renderUpdateStatusText(update);
  }
}

function render(data) {
  const { config, state } = data;
  applyLanguage(config);
  renderAppVersion(data.version, state.update);
  els.gsiStatus.textContent = state.gsi.connected ? 'Dota GSI online' : 'Dota GSI offline';
  els.gsiStatus.className = `pill ${state.gsi.connected ? 'ok' : 'bad'}`;
  const liveSuffix = state.twitch.isLive === true ? ' / live' : state.twitch.isLive === false ? ' / offline' : '';
  const forcedStreamSuffix = (config.predictions?.forceStreamOnline || config.spectatorPredictions?.forceStreamOnline)
    ? ` / ${t('streamForcedShort')}`
    : '';
  const predictionChannel = state.twitch.effectiveBroadcasterLogin || state.twitch.broadcasterLogin || 'Twitch';
  els.twitchStatus.textContent = state.twitch.authenticated
    ? state.twitch.needsReconnect
      ? `Twitch: ${state.twitch.broadcasterLogin} / reconnect`
      : `Twitch: ${predictionChannel}${liveSuffix}${forcedStreamSuffix}`
    : state.twitch.needsReconnect
      ? t('twitchReconnect')
      : t('twitchDisconnected');
  els.twitchStatus.className = `pill ${state.twitch.authenticated && !state.twitch.needsReconnect ? 'ok' : 'bad'}`;

  els.autoDraft.checked = config.protection.autoDraft;
  els.autoMinimap.checked = config.protection.autoMinimap;
  els.autoQueue.checked = config.protection.autoQueue;
  els.minimapSize.value = config.protection.minimapSize || 'normal';
  els.minimapSide.value = config.protection.minimapSide || 'left';
  els.minimapStyle.value = config.protection.minimapStyle || 'realistic';
  els.queueAutoMode.value = config.protection.queueAutoMode || 'menu_search';
  els.draftHideMode.value = config.protection.draftHideMode || 'all';
  els.queueMode.value = config.protection.queueMode || 'partial';
  const matchIntel = applyPendingStreamerGoalMatchIntel(config.protection.matchIntel || {});
  els.matchIntelEnabled.checked = matchIntel.enabled !== false;
  els.showPlayerRanks.checked = matchIntel.showPlayerRanks !== false;
  els.showPlayerFlags.checked = matchIntel.showPlayerFlags === true;
  els.showAegisTimer.checked = matchIntel.showAegisTimer !== false && matchIntel.showAegisRoshan !== false;
  els.showRoshanTimer.checked = matchIntel.showRoshanTimer !== false && matchIntel.showAegisRoshan !== false;
  els.rankDisplayMode.value = matchIntel.rankDisplayMode || 'minutes';
  setInputValue(els.rankDisplayMinutes, matchIntel.rankDisplayMinutes || 12);
  els.showStreamerStats.checked = matchIntel.showStreamerStats === true;
  els.showStreamerRankMedal.checked = matchIntel.showStreamerRankMedal !== false;
  els.showStreamerMmr.checked = matchIntel.showStreamerMmr !== false;
  els.showStreamerWinLoss.checked = matchIntel.showStreamerWinLoss !== false;
  const legacyWinLossPosition = normalizeStreamerWinLossPosition(matchIntel.streamerWinLossPosition, 'left');
  els.streamerWinLossMenuPosition.value = normalizeStreamerWinLossPosition(matchIntel.streamerWinLossMenuPosition, legacyWinLossPosition);
  els.streamerWinLossGamePosition.value = normalizeStreamerWinLossPosition(matchIntel.streamerWinLossGamePosition, legacyWinLossPosition);
  els.hideStreamerStatsDuringDraft.checked = matchIntel.hideStreamerStatsDuringDraft !== false;
  els.showStreamerMmrGoal.checked = matchIntel.showStreamerMmrGoal !== false;
  els.showStreamerMmrGoalInMenu.checked = matchIntel.showStreamerMmrGoalInMenu !== false;
  els.showStreamerMmrGoalDuringDraft.checked = matchIntel.showStreamerMmrGoalDuringDraft !== false;
  els.showStreamerMmrGoalInGame.checked = matchIntel.showStreamerMmrGoalInGame !== false;
  els.showStreamerMmrGoalProgress.checked = matchIntel.showStreamerMmrGoalProgress !== false;
  els.showStreamerMmrGoalBackground.checked = matchIntel.showStreamerMmrGoalBackground !== false;
  els.showStreamerMmrGoalCurrent.checked = matchIntel.showStreamerMmrGoalCurrent !== false;
  els.showStreamerMmrGoalStart.checked = matchIntel.showStreamerMmrGoalStart === true;
  els.showStreamerMmrGoalTarget.checked = matchIntel.showStreamerMmrGoalTarget !== false;
  els.showStreamerMmrGoalDelta.checked = matchIntel.showStreamerMmrGoalDelta !== false;
  els.showStreamerMmrGoalRecord.checked = matchIntel.showStreamerMmrGoalRecord !== false;
  els.showStreamerMmrGoalWinRate.checked = matchIntel.showStreamerMmrGoalWinRate !== false;
  els.showStreamerMmrGoalEta.checked = matchIntel.showStreamerMmrGoalEta !== false;
  const goalStyle = streamerMmrGoalStyleFromSettings(matchIntel);
  els.streamerMmrGoalTemplate.value = goalStyle.template;
  els.streamerMmrGoalFillStart.value = goalStyle.fillStart;
  els.streamerMmrGoalFillEnd.value = goalStyle.fillEnd;
  els.streamerMmrGoalTrack.value = goalStyle.track;
  els.streamerMmrGoalAccent.value = goalStyle.accent;
  els.streamerMmrGoalText.value = goalStyle.text;
  setInputValue(els.streamerMmrGoalBarHeight, goalStyle.barHeight);
  setInputValue(els.streamerMmrGoalBarRadius, goalStyle.barRadius);
  setInputValue(els.streamerMmrGoalGlow, goalStyle.glow);
  setInputValue(els.streamerMmrGoalAnimationSpeed, goalStyle.animationSpeed);
  setInputValue(els.streamerMmrGoalPaddingTop, goalStyle.paddingTop);
  setInputValue(els.streamerMmrGoalPaddingRight, goalStyle.paddingRight);
  setInputValue(els.streamerMmrGoalPaddingBottom, goalStyle.paddingBottom);
  setInputValue(els.streamerMmrGoalPaddingLeft, goalStyle.paddingLeft);
  els.streamerMmrGoalAnimated.checked = goalStyle.animated;
  setInputValue(els.streamerMmrGoalStartPrefix, goalStyle.startPrefix);
  setInputValue(els.streamerMmrGoalStartSuffix, goalStyle.startSuffix);
  setInputValue(els.streamerMmrGoalCurrentPrefix, goalStyle.currentPrefix);
  setInputValue(els.streamerMmrGoalCurrentSuffix, goalStyle.currentSuffix);
  setInputValue(els.streamerMmrGoalTargetPrefix, goalStyle.targetPrefix);
  setInputValue(els.streamerMmrGoalTargetSuffix, goalStyle.targetSuffix);
  setInputValue(els.streamerMmrGoalDeltaPrefix, goalStyle.deltaPrefix);
  setInputValue(els.streamerMmrGoalDeltaSuffix, goalStyle.deltaSuffix);
  setInputValue(els.streamerMmrGoalCustomCss, goalStyle.customCss);
  updateStreamerGoalStyleOutputs();
  els.streamerMedalSource.value = matchIntel.streamerMedalSource || 'auto';
  const settingsAccountId = syncStreamerSettingsAccount(matchIntel.streamerAccounts || [], state.streamerStats || {});
  setInputValue(els.streamerMmr, streamerMmrForSettingsAccount(matchIntel, settingsAccountId));
  setInputValue(els.streamerGoalMmr, streamerGoalMmrForSettingsAccount(matchIntel, settingsAccountId));
  setInputValue(els.streamerGoalStartMmr, streamerGoalStartMmrForSettingsAccount(matchIntel, settingsAccountId));
  els.autoUpdateStreamerMmr.checked = matchIntel.autoUpdateStreamerMmr !== false;
  if (els.menuMmrOcrEnabled) els.menuMmrOcrEnabled.checked = matchIntel.menuMmrOcrEnabled === true;
  updateMenuMmrOcrUi(matchIntel, state.menuMmrOcr || null, data.menuMmrOcrSupport || null);
  setInputValue(els.streamerMmrWinDelta, matchIntel.streamerMmrWinDelta ?? 25);
  setInputValue(els.streamerMmrLossDelta, matchIntel.streamerMmrLossDelta ?? 25);
  setOverlayPositionControls(matchIntel.overlayPositions || {});
  renderIntelSummary(matchIntel);
  renderStreamerStatsStatus(state.streamerStats || {}, matchIntel);
  renderStreamerStatsPreview(state.streamerStats || {}, matchIntel, settingsAccountId);
  renderStreamerGoalPreview(state.streamerStats || {}, matchIntel, settingsAccountId);
  renderStreamerAccounts(matchIntel.streamerAccounts || [], state.streamerStats || {}, settingsAccountId);
  updateStreamerGoalResetButton(settingsAccountId);
  renderCustomNotablePlayers(matchIntel.customPlayers || []);
  updateMatchIntelFieldVisibility();
  renderSpectatorMatchIntelConfig(config.protection.spectatorMatchIntel || matchIntel);
  toggleButton(els.manualDraft, config.protection.manualDraft, state.protection.draft);
  toggleButton(els.manualMinimap, config.protection.manualMinimap, state.protection.minimap);
  toggleButton(els.manualTopBar, config.protection.manualTopBar, state.protection.topBar);
  toggleButton(els.manualQueue, config.protection.manualQueue, state.protection.queue);

  els.gameState.textContent = state.gsi.gameState || '-';
  els.gameScreen.textContent = state.gsi.leftGameView ? t('gameScreenMenu') : state.gsi.inGameScreen ? t('gameScreenGame') : '-';
  els.heroState.textContent = state.gsi.playerHeroPicked ? `${state.gsi.heroName || state.gsi.heroId || t('picked')}${state.gsi.ownPickPhaseEnded ? ` / ${t('topbarOnly')}` : ''}` : '-';
  els.clockTime.textContent = state.gsi.clockTime ?? '-';
  els.matchId.textContent = state.gsi.matchId || '-';

  els.deploymentMode.value = config.deployment?.mode || 'local';
  els.publicBaseUrl.value = config.deployment?.publicBaseUrl || '';
  els.clientId.value = config.twitch.clientId || '';
  els.twitchChannelMode.value = config.twitch.channelMode || 'personal';
  if (document.activeElement !== els.targetChannelLogin) {
    els.targetChannelLogin.value = config.twitch.targetChannelLogin || config.twitch.targetBroadcasterLogin || '';
  }
  els.effectiveRedirectUri.textContent = state.twitch.effectiveRedirectUri || config.twitch.redirectUri || '';
  const channelLive = state.twitch.isLive === true ? ' / live' : state.twitch.isLive === false ? ' / offline' : ` / ${t('channelStatusUnknown')}`;
  const checkedAt = state.twitch.streamCheckedAt ? ` / ${t('checkedAt')} ${new Date(state.twitch.streamCheckedAt).toLocaleTimeString()}` : '';
  els.targetChannelStatus.textContent = state.twitch.effectiveBroadcasterId
    ? `${t('channelMode')}: ${state.twitch.effectiveBroadcasterLogin || '-'} (${state.twitch.effectiveBroadcasterId})${channelLive}${checkedAt}${state.twitch.targetMatchesToken === false ? ` / ${t('separateOauth')}` : ''}`
    : t('channelNotSelected');
  updateConditionalVisibility(config);
  if (document.activeElement !== els.dotaPath) {
    els.dotaPath.value = config.dota?.installPath || '';
  }
  renderPredictionEditorConfig('own', config.predictions);
  renderPredictionEditorConfig('spectator', config.spectatorPredictions || config.predictions);
  els.autoInstallUpdates.checked = config.updates?.autoInstall === true;
  renderServerUpdateStatus(state.update);

  renderPrediction(state.activePrediction);
  renderEvents(state.events || []);

  if (!latestUpdateStatus && !sessionStorage.getItem('dsk.updateChecked')) {
    sessionStorage.setItem('dsk.updateChecked', '1');
    checkUpdates(false).catch((error) => {
      els.updateStatus.dataset.custom = 'true';
      els.updateStatus.textContent = error.message;
    });
  }
}

function updateConditionalVisibility(config) {
  const serverMode = (config.deployment?.mode || 'local') === 'server';
  const separateChannel = (config.twitch?.channelMode || 'personal') === 'separate';
  document.querySelectorAll('[data-visible-for="server"]').forEach((item) => {
    item.hidden = !serverMode;
  });
  document.querySelectorAll('[data-visible-for="separate-channel"]').forEach((item) => {
    item.hidden = !separateChannel;
  });
}

function toggleButton(button, manualEnabled, effectiveEnabled) {
  button.classList.toggle('active', Boolean(manualEnabled));
  button.classList.toggle('auto-active', Boolean(effectiveEnabled) && !manualEnabled);
  button.setAttribute('aria-pressed', manualEnabled ? 'true' : 'false');
}

function setInputValue(input, value) {
  if (document.activeElement !== input) input.value = value ?? '';
}

function renderPredictionEditorConfig(profile, config) {
  const ctx = predictionEditor(profile);
  if (!ctx.form || !config) return;
  setInputValue(ctx.predictionWindow, config.windowSeconds);
  ctx.autoCreate.checked = config.autoCreate;
  ctx.forceStreamOnline.checked = config.forceStreamOnline === true;
  ctx.forceStreamOnlineHint.hidden = !ctx.forceStreamOnline.checked;
  ctx.autoResolve.checked = config.autoResolve;
  ctx.cancelUncontestedPrediction.checked = config.cancelUncontestedPrediction === true;
  ctx.cancelUncontestedHint.hidden = !ctx.cancelUncontestedPrediction.checked;
  ctx.autoCancelInvalidGame.checked = config.autoCancelInvalidGame ?? true;
  ctx.selectionMode.value = config.selectionMode || 'selected';
  syncPredictionTypeDefinitions(config, profile);
  ctx.selectedType.value = config.selectedType || 'win_loss';
  renderPredictionTypes(config.types || {}, profile);
  renderPredictionTypeVisibility(profile);
  renderPredictionTypePreviews(profile);
}

function renderSpectatorMatchIntelConfig(config) {
  if (!els.spectatorMatchIntelEnabled || !config) return;
  els.spectatorMatchIntelEnabled.checked = config.enabled !== false;
  if (els.spectatorGameLabelEnabled) els.spectatorGameLabelEnabled.checked = config.showSpectatorGameLabel !== false;
  setInputValue(els.spectatorGameLabelTemplate, config.spectatorGameLabelTemplate || 'Spectating game: {game_id}');
  els.spectatorShowPlayerRanks.checked = config.showPlayerRanks !== false;
  els.spectatorShowPlayerFlags.checked = config.showPlayerFlags === true;
  els.spectatorShowAegisTimer.checked = config.showAegisTimer !== false && config.showAegisRoshan !== false;
  els.spectatorShowRoshanTimer.checked = config.showRoshanTimer !== false && config.showAegisRoshan !== false;
  els.spectatorRankDisplayMode.value = config.rankDisplayMode || 'minutes';
  setInputValue(els.spectatorRankDisplayMinutes, config.rankDisplayMinutes || 12);
  updateSpectatorMatchIntelFieldVisibility();
}

function spectatorMatchIntelConfigFromForm() {
  return {
    enabled: els.spectatorMatchIntelEnabled.checked,
    showSpectatorGameLabel: els.spectatorGameLabelEnabled?.checked !== false,
    spectatorGameLabelTemplate: els.spectatorGameLabelTemplate?.value || 'Spectating game: {game_id}',
    showPlayerRanks: els.spectatorShowPlayerRanks.checked,
    showPlayerFlags: els.spectatorShowPlayerFlags.checked,
    showAegisTimer: els.spectatorShowAegisTimer.checked,
    showRoshanTimer: els.spectatorShowRoshanTimer.checked,
    rankDisplayMode: els.spectatorRankDisplayMode.value,
    rankDisplayMinutes: Number(els.spectatorRankDisplayMinutes.value || 12)
  };
}

function updateSpectatorMatchIntelFieldVisibility() {
  if (!els.spectatorRankDisplayMinutesWrap) return;
  els.spectatorRankDisplayMinutesWrap.hidden = els.spectatorRankDisplayMode.value !== 'minutes';
  if (els.spectatorGameLabelTemplateWrap) {
    els.spectatorGameLabelTemplateWrap.hidden = els.spectatorGameLabelEnabled?.checked === false;
  }
}

function renderPrediction(prediction) {
  const targets = [els.activePrediction, els.spectatorActivePrediction].filter(Boolean);
  if (!prediction) {
    targets.forEach((target) => { target.textContent = t('noActivePrediction'); });
    return;
  }
  const outcomes = prediction.outcomes.map((item) => `${item.title}: ${item.channelPoints || 0}`).join(' | ');
  const type = prediction.type ? ` [${prediction.type}]` : '';
  const profile = prediction.profile === 'spectator' ? ` / ${t('spectatorProfileShort')}` : '';
  targets.forEach((target) => {
    target.textContent = `${prediction.title}${type}${profile} (${prediction.status}) ${outcomes}`;
  });
}

function predictionEditor(profile = 'own') {
  const spectator = profile === 'spectator';
  return {
    profile: spectator ? 'spectator' : 'own',
    configKey: spectator ? 'spectatorPredictions' : 'predictions',
    state: predictionEditorStates[spectator ? 'spectator' : 'own'],
    form: spectator ? els.spectatorPredictionForm : els.predictionForm,
    typeForm: spectator ? els.spectatorPredictionTypeForm : els.predictionTypeForm,
    predictionWindow: spectator ? els.spectatorPredictionWindow : els.predictionWindow,
    autoCreate: spectator ? els.spectatorAutoCreate : els.autoCreate,
    forceStreamOnline: spectator ? els.spectatorForceStreamOnline : els.forceStreamOnline,
    forceStreamOnlineHint: spectator ? els.spectatorForceStreamOnlineHint : els.forceStreamOnlineHint,
    autoResolve: spectator ? els.spectatorAutoResolve : els.autoResolve,
    cancelUncontestedPrediction: spectator ? els.spectatorCancelUncontestedPrediction : els.cancelUncontestedPrediction,
    cancelUncontestedHint: spectator ? els.spectatorCancelUncontestedHint : els.cancelUncontestedHint,
    autoCancelInvalidGame: spectator ? els.spectatorAutoCancelInvalidGame : els.autoCancelInvalidGame,
    selectionMode: spectator ? els.spectatorPredictionSelectionMode : els.predictionSelectionMode,
    selectedType: spectator ? els.spectatorSelectedPredictionType : els.selectedPredictionType,
    selectedTypeWrap: spectator ? els.spectatorSelectedPredictionTypeWrap : els.selectedPredictionTypeWrap,
    typesRoot: spectator ? els.spectatorPredictionTypes : els.predictionTypes,
    customForm: spectator ? els.spectatorCustomPredictionForm : els.customPredictionForm,
    customName: spectator ? els.spectatorCustomPredictionName : els.customPredictionName,
    customCondition: spectator ? els.spectatorCustomPredictionCondition : els.customPredictionCondition,
    customMetric: spectator ? els.spectatorCustomPredictionMetric : els.customPredictionMetric,
    customMin: spectator ? els.spectatorCustomPredictionMin : els.customPredictionMin,
    customMax: spectator ? els.spectatorCustomPredictionMax : els.customPredictionMax,
    customMinMinute: spectator ? els.spectatorCustomPredictionMinMinute : els.customPredictionMinMinute,
    customMaxMinute: spectator ? els.spectatorCustomPredictionMaxMinute : els.customPredictionMaxMinute,
    customTitle: spectator ? els.spectatorCustomPredictionTitle : els.customPredictionTitle,
    customYes: spectator ? els.spectatorCustomPredictionYes : els.customPredictionYes,
    customNo: spectator ? els.spectatorCustomPredictionNo : els.customPredictionNo
  };
}

function predictionProfileFromElement(element) {
  return element?.closest?.('[data-page="spectatorPredictions"]') ? 'spectator' : 'own';
}

function predictionProfiles() {
  return ['own', 'spectator'];
}

function buildPredictionTypeControls(profile = 'own') {
  const ctx = predictionEditor(profile);
  if (!ctx.selectedType || !ctx.typesRoot) return;
  ctx.selectedType.innerHTML = '';
  ctx.typesRoot.innerHTML = '';
  for (const def of ctx.state.defs) {
    const option = document.createElement('option');
    option.value = def.type;
    option.textContent = def.label || t(def.labelKey);
    ctx.selectedType.append(option);

    const card = document.createElement('section');
    card.className = 'prediction-type';
    card.dataset.type = def.type;
    card.dataset.custom = def.custom ? 'true' : 'false';
    card.innerHTML = `
      <div class="prediction-type-header">
        <div>
          <h3 data-type-title></h3>
          <p data-type-description></p>
        </div>
        <div class="prediction-type-actions">
          <button type="button" class="danger-icon" data-delete-template title="${t('deleteTemplate')}" ${def.savedCustom ? '' : 'hidden'}>x</button>
          <label class="check"><input data-field="enabled" type="checkbox"> ${t('enabled')}</label>
        </div>
      </div>
      <div class="prediction-preview">
        <span data-preview-label>${t('preview')}</span>
        <strong data-preview-title>-</strong>
        <small><b data-preview-yes>${t('yes')}</b> / <b data-preview-no>${t('no')}</b></small>
      </div>
      <div class="prediction-type-grid">
        <label data-field-label="weight">${t('weight')}<input data-field="weight" type="number" min="1" max="100"></label>
        ${def.custom ? `<label data-field-label="condition">${t('condition')}<select data-field="condition"><option value="game_duration_at_least">${t('conditionGameDuration')}</option><option value="metric_reaches_target">${t('conditionReachTarget')}</option><option value="metric_by_minute">${t('conditionByMinute')}</option></select></label>` : ''}
        ${def.custom ? `<label data-field-label="metric">${t('metric')}<select data-field="metric">${metricOptionsHtml(ctx.profile)}</select></label>` : ''}
        ${def.ranges.includes('min') ? `<label data-field-label="min">${t('targetFrom')}<input data-field="min" type="number" min="0" max="999"></label>` : ''}
        ${def.ranges.includes('max') ? `<label data-field-label="max">${t('targetTo')}<input data-field="max" type="number" min="0" max="999"></label>` : ''}
        ${def.ranges.includes('minMinute') ? `<label data-field-label="minMinute">${t('minuteFrom')}<input data-field="minMinute" type="number" min="1" max="180"></label>` : ''}
        ${def.ranges.includes('maxMinute') ? `<label data-field-label="maxMinute">${t('minuteTo')}<input data-field="maxMinute" type="number" min="1" max="180"></label>` : ''}
        <label class="full" data-field-label="titleTemplate">${t('title')}<input data-field="titleTemplate" maxlength="120"></label>
        <label data-field-label="yesTitle">${t('yesOutcome')}<input data-field="yesTitle" maxlength="25"></label>
        <label data-field-label="noTitle">${t('noOutcome')}<input data-field="noTitle" maxlength="25"></label>
      </div>
    `;
    ctx.typesRoot.append(card);
  }
  applyPredictionTypeLanguage(profile);
}

function syncPredictionTypeDefinitions(predictions, profile = 'own') {
  const ctx = predictionEditor(profile);
  const customDefs = (predictions.customTemplates || []).map((template) => ({
    type: template.id,
    label: template.label || template.titleTemplate || template.id,
    descriptionKey: 'descCustom',
    ranges: ['min', 'max', 'minMinute', 'maxMinute'],
    custom: true,
    savedCustom: true
  }));
  const key = customDefs.map((def) => `${def.type}:${def.label}`).join('|');
  if (key === ctx.state.controlKey) return;
  ctx.state.controlKey = key;
  const builtins = ctx.profile === 'spectator' ? spectatorBuiltinPredictionTypeDefs : builtinPredictionTypeDefs;
  ctx.state.defs = [...builtins, ...customDefs];
  buildPredictionTypeControls(profile);
}

function applyPredictionTypeLanguage(profile = null) {
  const profiles = profile ? [profile] : predictionProfiles();
  for (const currentProfile of profiles) {
    const ctx = predictionEditor(currentProfile);
    if (!ctx.selectedType || !ctx.typesRoot) continue;
    for (const def of ctx.state.defs) {
    const option = ctx.selectedType.querySelector(`option[value="${def.type}"]`);
    if (option) option.textContent = def.label || t(def.labelKey);
    const card = ctx.typesRoot.querySelector(`[data-type="${def.type}"]`);
    if (!card) continue;
    card.querySelector('[data-type-title]').textContent = def.label || t(def.labelKey);
    card.querySelector('[data-type-description]').textContent = t(def.descriptionKey);
    setLabelText(card.querySelector('[data-field="enabled"]').closest('label'), t('enabled'));
    const deleteButton = card.querySelector('[data-delete-template]');
    if (deleteButton) {
      deleteButton.title = t('deleteTemplate');
      deleteButton.setAttribute('aria-label', t('deleteTemplate'));
    }
    const fieldLabels = {
      weight: 'weight',
      condition: 'condition',
      metric: 'metric',
      min: 'targetFrom',
      max: 'targetTo',
      minMinute: 'minuteFrom',
      maxMinute: 'minuteTo',
      titleTemplate: 'title',
      yesTitle: 'yesOutcome',
      noTitle: 'noOutcome'
    };
    for (const [field, key] of Object.entries(fieldLabels)) {
      setLabelText(card.querySelector(`[data-field-label="${field}"]`), t(key));
    }
    setOptionText(card.querySelector('[data-field="condition"]'), 'game_duration_at_least', t('conditionGameDuration'));
    setOptionText(card.querySelector('[data-field="condition"]'), 'metric_reaches_target', t('conditionReachTarget'));
    setOptionText(card.querySelector('[data-field="condition"]'), 'metric_by_minute', t('conditionByMinute'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'clock_minutes', t('metricClockMinutes'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'kills', t('metricKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'deaths', t('metricDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'assists', t('metricAssists'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'last_hits', t('metricLastHits'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'denies', t('metricDenies'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'level', t('metricLevel'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'team_kills', t('metricTeamKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'team_deaths', t('metricTeamDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'team_assists', t('metricTeamAssists'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'enemy_kills', t('metricEnemyKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'enemy_deaths', t('metricEnemyDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'enemy_assists', t('metricEnemyAssists'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'radiant_kills', t('metricRadiantKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'radiant_deaths', t('metricRadiantDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'radiant_assists', t('metricRadiantAssists'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'dire_kills', t('metricDireKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'dire_deaths', t('metricDireDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'dire_assists', t('metricDireAssists'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_kills', t('metricTotalKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_deaths', t('metricTotalDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_assists', t('metricTotalAssists'));
    const previewLabel = card.querySelector('[data-preview-label]');
    if (previewLabel) previewLabel.textContent = t('preview');
    updateCustomConditionFieldVisibility(card);
    }
  }
}

function renderPredictionTypes(types, profile = 'own') {
  const ctx = predictionEditor(profile);
  const customById = Object.fromEntries((snapshot?.config?.[ctx.configKey]?.customTemplates || []).map((template) => [template.id, template]));
  for (const def of ctx.state.defs) {
    const config = types[def.type] || customById[def.type] || {};
    const card = ctx.typesRoot.querySelector(`[data-type="${def.type}"]`);
    if (!card) continue;
    setTypeField(card, 'enabled', config.enabled !== false);
    setTypeField(card, 'weight', config.weight ?? 1);
    setTypeField(card, 'condition', config.condition || 'game_duration_at_least');
    setTypeField(card, 'metric', config.metric || 'clock_minutes');
    setTypeField(card, 'min', config.min ?? 0);
    setTypeField(card, 'max', config.max ?? config.min ?? 0);
    setTypeField(card, 'minMinute', config.minMinute ?? 10);
    setTypeField(card, 'maxMinute', config.maxMinute ?? config.minMinute ?? 10);
    setTypeField(card, 'titleTemplate', config.titleTemplate || '');
    updateCustomConditionFieldVisibility(card);
    setTypeField(card, 'yesTitle', config.yesTitle || 'Да');
    setTypeField(card, 'noTitle', config.noTitle || 'Нет');
  }
}

function setTypeField(card, field, value) {
  const input = card.querySelector(`[data-field="${field}"]`);
  if (!input || document.activeElement === input) return;
  if (input.type === 'checkbox') input.checked = Boolean(value);
  else input.value = value;
}

function collectPredictionTypes(profile = 'own') {
  const ctx = predictionEditor(profile);
  const types = {};
  for (const def of ctx.state.defs) {
    if (def.savedCustom) continue;
    const card = ctx.typesRoot.querySelector(`[data-type="${def.type}"]`);
    types[def.type] = {
      enabled: getTypeField(card, 'enabled'),
      weight: Number(getTypeField(card, 'weight')),
      condition: String(getTypeField(card, 'condition') || ''),
      metric: String(getTypeField(card, 'metric') || ''),
      titleTemplate: String(getTypeField(card, 'titleTemplate')).trim(),
      yesTitle: String(getTypeField(card, 'yesTitle')).trim(),
      noTitle: String(getTypeField(card, 'noTitle')).trim()
    };
    for (const field of ['min', 'max', 'minMinute', 'maxMinute']) {
      const value = getTypeField(card, field);
      if (value !== null) types[def.type][field] = Number(value);
    }
  }
  return types;
}

function collectCustomPredictionTemplates(profile = 'own') {
  const ctx = predictionEditor(profile);
  return ctx.state.defs.filter((def) => def.savedCustom).map((def) => {
    const card = ctx.typesRoot.querySelector(`[data-type="${def.type}"]`);
    const min = Number(getTypeField(card, 'min') || 0);
    const minMinute = Number(getTypeField(card, 'minMinute') || 10);
    return {
      id: def.type,
      label: def.label || String(getTypeField(card, 'titleTemplate') || def.type).slice(0, 60),
      enabled: getTypeField(card, 'enabled'),
      weight: Number(getTypeField(card, 'weight') || 1),
      condition: String(getTypeField(card, 'condition') || 'game_duration_at_least'),
      metric: String(getTypeField(card, 'metric') || 'clock_minutes'),
      min,
      max: Number(getTypeField(card, 'max') || min),
      minMinute,
      maxMinute: Number(getTypeField(card, 'maxMinute') || minMinute),
      titleTemplate: String(getTypeField(card, 'titleTemplate') || '').trim(),
      yesTitle: String(getTypeField(card, 'yesTitle') || '').trim(),
      noTitle: String(getTypeField(card, 'noTitle') || '').trim()
    };
  });
}

function removeCustomTemplate(type, profile = 'own') {
  if (!confirm(t('confirmDeleteTemplate'))) return;
  const ctx = predictionEditor(profile);
  const config = predictionConfigFromForm(profile);
  config.customTemplates = config.customTemplates.filter((template) => template.id !== type);
  if (config.selectedType === type) config.selectedType = 'win_loss';
  api('/api/config', { [ctx.configKey]: config }).catch(alert);
}

function getTypeField(card, field) {
  const input = card?.querySelector(`[data-field="${field}"]`);
  if (!input) return null;
  return input.type === 'checkbox' ? input.checked : input.value;
}

function renderPredictionTypePreviews(profile = 'own') {
  const ctx = predictionEditor(profile);
  for (const def of ctx.state.defs) {
    const card = ctx.typesRoot.querySelector(`[data-type="${def.type}"]`);
    if (!card) continue;
    const typeConfig = typeConfigFromCard(card);
    const template = typeConfig.titleTemplate || '{hero}: {target}+?';
    const yesTitle = typeConfig.yesTitle || t('yes');
    const noTitle = typeConfig.noTitle || t('no');
    const title = card.querySelector('[data-preview-title]');
    const yes = card.querySelector('[data-preview-yes]');
    const no = card.querySelector('[data-preview-no]');
    if (title) title.textContent = fillTemplate(template, typeConfig);
    if (yes) yes.textContent = yesTitle;
    if (no) no.textContent = noTitle;
  }
}

function renderPredictionTypeVisibility(profile = 'own') {
  const ctx = predictionEditor(profile);
  const selectedMode = ctx.selectionMode.value === 'selected';
  const selectedType = ctx.selectedType.value || 'win_loss';
  ctx.selectedTypeWrap.hidden = !selectedMode;
  for (const card of ctx.typesRoot.querySelectorAll('.prediction-type')) {
    card.hidden = selectedMode && card.dataset.type !== selectedType;
  }
}

function typeConfigFromCard(card) {
  return {
    condition: String(getTypeField(card, 'condition') || 'game_duration_at_least'),
    metric: String(getTypeField(card, 'metric') || 'clock_minutes'),
    titleTemplate: String(getTypeField(card, 'titleTemplate') || '').trim(),
    yesTitle: String(getTypeField(card, 'yesTitle') || '').trim(),
    noTitle: String(getTypeField(card, 'noTitle') || '').trim(),
    min: Number(getTypeField(card, 'min') || 0),
    max: Number(getTypeField(card, 'max') || 0),
    minMinute: Number(getTypeField(card, 'minMinute') || 10),
    maxMinute: Number(getTypeField(card, 'maxMinute') || 10)
  };
}

function updateCustomConditionFieldVisibility(card) {
  if (!card || card.dataset.custom !== 'true') return;
  const condition = String(getTypeField(card, 'condition') || 'game_duration_at_least');
  const metricWrap = card.querySelector('[data-field-label="metric"]');
  const minWrap = card.querySelector('[data-field-label="min"]');
  const maxWrap = card.querySelector('[data-field-label="max"]');
  const minMinuteWrap = card.querySelector('[data-field-label="minMinute"]');
  const maxMinuteWrap = card.querySelector('[data-field-label="maxMinute"]');
  const isDuration = condition === 'game_duration_at_least';
  const usesMinute = condition === 'game_duration_at_least' || condition === 'metric_by_minute';
  if (metricWrap) metricWrap.hidden = isDuration;
  if (minWrap) minWrap.hidden = isDuration;
  if (maxWrap) maxWrap.hidden = isDuration;
  if (minMinuteWrap) minMinuteWrap.hidden = !usesMinute;
  if (maxMinuteWrap) maxMinuteWrap.hidden = !usesMinute;
}

function updateCustomBuilderFieldVisibility() {
  const profile = predictionProfileFromElement(document.activeElement) || 'own';
  const ctx = predictionEditor(profile);
  const condition = ctx.customCondition.value || 'game_duration_at_least';
  const isDuration = condition === 'game_duration_at_least';
  const usesMinute = condition === 'game_duration_at_least' || condition === 'metric_by_minute';
  ctx.customMetric.closest('label').hidden = isDuration;
  ctx.customMin.closest('label').hidden = isDuration;
  ctx.customMax.closest('label').hidden = isDuration;
  ctx.customMinMinute.closest('label').hidden = !usesMinute;
  ctx.customMaxMinute.closest('label').hidden = !usesMinute;
}

function customTemplateFromBuilder(profile = 'own') {
  const ctx = predictionEditor(profile);
  const label = ctx.customName.value.trim() || ctx.customTitle.value.trim() || t('typeCustom');
  const min = Number(ctx.customMin.value || 0);
  const minMinute = Number(ctx.customMinMinute.value || 40);
  return {
    id: `custom_${Date.now().toString(36)}`,
    label,
    enabled: true,
    weight: 1,
    condition: ctx.customCondition.value || 'game_duration_at_least',
    metric: ctx.customMetric.value || 'clock_minutes',
    min,
    max: Number(ctx.customMax.value || min),
    minMinute,
    maxMinute: Number(ctx.customMaxMinute.value || minMinute),
    titleTemplate: ctx.customTitle.value.trim() || label,
    yesTitle: ctx.customYes.value.trim() || t('yes'),
    noTitle: ctx.customNo.value.trim() || t('no')
  };
}

function resetCustomBuilder(profile = 'own') {
  const ctx = predictionEditor(profile);
  ctx.customName.value = '';
  ctx.customCondition.value = 'game_duration_at_least';
  ctx.customMetric.value = 'clock_minutes';
  ctx.customMin.value = '40';
  ctx.customMax.value = '40';
  ctx.customMinMinute.value = '40';
  ctx.customMaxMinute.value = '40';
  ctx.customTitle.value = currentLang === 'en' ? 'Will the game reach {minute}:00?' : 'Продлится ли игра {minute}:00?';
  ctx.customYes.value = t('yes');
  ctx.customNo.value = t('no');
  updateCustomBuilderFieldVisibilityForProfile(profile);
}

function updateCustomBuilderFieldVisibilityForProfile(profile = 'own') {
  const ctx = predictionEditor(profile);
  const condition = ctx.customCondition.value || 'game_duration_at_least';
  const isDuration = condition === 'game_duration_at_least';
  const usesMinute = condition === 'game_duration_at_least' || condition === 'metric_by_minute';
  ctx.customMetric.closest('label').hidden = isDuration;
  ctx.customMin.closest('label').hidden = isDuration;
  ctx.customMax.closest('label').hidden = isDuration;
  ctx.customMinMinute.closest('label').hidden = !usesMinute;
  ctx.customMaxMinute.closest('label').hidden = !usesMinute;
}

function fillTemplate(template, typeConfig) {
  const gsi = snapshot?.state?.gsi || {};
  const players = snapshot?.state?.matchIntel?.players || [];
  const radiantPlayers = players.filter((player) => player.team === 'radiant').sort((left, right) => Number(left.slot) - Number(right.slot));
  const direPlayers = players.filter((player) => player.team === 'dire').sort((left, right) => Number(left.slot) - Number(right.slot));
  const target = midpoint(typeConfig.min, typeConfig.max) || 8;
  const minute = midpoint(typeConfig.minMinute, typeConfig.maxMinute) || 10;
  const values = {
    hero: gsi.heroName || 'Pudge',
    match_id: gsi.activeMatchId || gsi.matchId || '1234567890',
    radiant_team: gsi.radiantTeamName || 'Radiant',
    dire_team: gsi.direTeamName || 'Dire',
    winning_team: gsi.winTeam === 'radiant' ? (gsi.radiantTeamName || 'Radiant') : gsi.winTeam === 'dire' ? (gsi.direTeamName || 'Dire') : 'Radiant',
    radiant_heroes: previewHeroList(radiantPlayers, ['Pudge', 'Crystal Maiden', 'Lina', 'Axe', 'Lion']),
    dire_heroes: previewHeroList(direPlayers, ['Juggernaut', 'Shadow Fiend', 'Warlock', 'Drow Ranger', 'Rubick']),
    target,
    minute,
    clock_minutes: Number.isFinite(gsi.clockTime) ? Math.max(0, Math.floor(gsi.clockTime / 60)) : 12,
    kills: Number.isFinite(gsi.kills) ? gsi.kills : 3,
    deaths: Number.isFinite(gsi.deaths) ? gsi.deaths : 1,
    assists: Number.isFinite(gsi.assists) ? gsi.assists : 7,
    last_hits: Number.isFinite(gsi.lastHits) ? gsi.lastHits : 68,
    denies: Number.isFinite(gsi.denies) ? gsi.denies : 6,
    level: Number.isFinite(gsi.level) ? gsi.level : 11,
    team_kills: Number.isFinite(gsi.teamKills) ? gsi.teamKills : 18,
    team_deaths: Number.isFinite(gsi.teamDeaths) ? gsi.teamDeaths : 11,
    team_assists: Number.isFinite(gsi.teamAssists) ? gsi.teamAssists : 24,
    enemy_kills: Number.isFinite(gsi.enemyKills) ? gsi.enemyKills : 14,
    enemy_deaths: Number.isFinite(gsi.enemyDeaths) ? gsi.enemyDeaths : 16,
    enemy_assists: Number.isFinite(gsi.enemyAssists) ? gsi.enemyAssists : 21,
    radiant_kills: Number.isFinite(gsi.radiantKills) ? gsi.radiantKills : 18,
    radiant_deaths: Number.isFinite(gsi.radiantDeaths) ? gsi.radiantDeaths : 14,
    radiant_assists: Number.isFinite(gsi.radiantAssists) ? gsi.radiantAssists : 31,
    dire_kills: Number.isFinite(gsi.direKills) ? gsi.direKills : 14,
    dire_deaths: Number.isFinite(gsi.direDeaths) ? gsi.direDeaths : 18,
    dire_assists: Number.isFinite(gsi.direAssists) ? gsi.direAssists : 25,
    total_kills: Number.isFinite(gsi.totalKills) ? gsi.totalKills : 32,
    total_deaths: Number.isFinite(gsi.totalDeaths) ? gsi.totalDeaths : 27,
    total_assists: Number.isFinite(gsi.totalAssists) ? gsi.totalAssists : 45
  };
  addPreviewSlotValues(values, 'radiant', radiantPlayers, ['Pudge', 'Crystal Maiden', 'Lina', 'Axe', 'Lion']);
  addPreviewSlotValues(values, 'dire', direPlayers, ['Juggernaut', 'Shadow Fiend', 'Warlock', 'Drow Ranger', 'Rubick']);

  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{${key}}`, value);
  }, template);
}

function previewHeroList(players, fallbackHeroes) {
  const heroes = players.map((player) => readableHeroName(player.hero)).filter(Boolean);
  return (heroes.length ? heroes : fallbackHeroes).join(', ');
}

function addPreviewSlotValues(values, team, players, fallbackHeroes) {
  for (let index = 1; index <= 5; index += 1) {
    const player = players[index - 1] || {};
    values[`${team}_hero_${index}`] = readableHeroName(player.hero) || fallbackHeroes[index - 1] || '';
    values[`${team}_player_${index}`] = player.name || `${team === 'radiant' ? 'Radiant' : 'Dire'} ${index}`;
    values[`${team}_account_${index}`] = player.accountId || '';
  }
}

function readableHeroName(value) {
  const raw = String(value || '').replace(/^npc_dota_hero_/, '').replace(/_/g, ' ').trim();
  return raw ? raw.replace(/\b\w/g, (char) => char.toUpperCase()) : '';
}

function midpoint(min, max) {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return 0;
  if (!Number.isFinite(max) || max <= 0) return min;
  if (!Number.isFinite(min) || min <= 0) return max;
  return Math.round((min + max) / 2);
}

function rememberTemplateInput(input) {
  if (input instanceof HTMLInputElement && (
    input.matches('#predictionTypes input[data-field="titleTemplate"], #spectatorPredictionTypes input[data-field="titleTemplate"]')
    || input.matches('#predictionTypes input[data-field="yesTitle"], #spectatorPredictionTypes input[data-field="yesTitle"]')
    || input.matches('#predictionTypes input[data-field="noTitle"], #spectatorPredictionTypes input[data-field="noTitle"]')
    || input.matches('#customPredictionTitle, #spectatorCustomPredictionTitle')
    || input.matches('#customPredictionYes, #spectatorCustomPredictionYes')
    || input.matches('#customPredictionNo, #spectatorCustomPredictionNo')
  )) {
    lastTemplateInput = input;
  }
}

function insertVariable(variable) {
  const target = lastTemplateInput || document.querySelector('#predictionTypes input[data-field="titleTemplate"], #spectatorPredictionTypes input[data-field="titleTemplate"]') || els.customPredictionTitle;
  if (!target) return;
  target.focus();
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.setRangeText(variable, start, end, 'end');
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

function renderEvents(events) {
  els.events.innerHTML = '';
  for (const event of events.slice(0, 20)) {
    const row = document.createElement('div');
    row.className = 'event';
    row.textContent = `${new Date(event.at).toLocaleTimeString()} [${event.type}] ${event.message}`;
    els.events.append(row);
  }
}

function renderCustomNotablePlayers(players) {
  els.customNotablePlayersRows.innerHTML = '';
  let rowCount = 0;
  for (const player of Array.isArray(players) ? players : []) {
    const accountId = String(player.accountId || '').trim();
    if (!accountId) continue;
    const countryCode = normalizeCountryCode(player.countryCode);
    const row = document.createElement('div');
    row.className = 'notable-player-row';
    row.dataset.accountId = accountId;
    row.dataset.name = String(player.name || '').trim();
    row.dataset.countryCode = countryCode;

    const id = document.createElement('span');
    id.className = 'notable-player-id';
    id.textContent = accountId;
    const name = document.createElement('span');
    name.className = 'notable-player-name';
    name.textContent = row.dataset.name || '-';
    const country = document.createElement('span');
    country.className = 'notable-player-country';
    country.textContent = countryCode ? `${countryFlagEmoji(countryCode)} ${countryCode}` : '-';
    const actions = document.createElement('div');
    actions.className = 'notable-player-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'notable-player-edit';
    edit.dataset.action = 'edit-notable-player';
    edit.textContent = t('editNotablePlayer');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'notable-player-remove';
    remove.dataset.action = 'remove-notable-player';
    remove.textContent = t('removeNotablePlayer');
    actions.append(edit, remove);

    row.append(id, name, country, actions);
    els.customNotablePlayersRows.append(row);
    rowCount += 1;
  }
  if (!rowCount) {
    const empty = document.createElement('div');
    empty.className = 'notable-player-empty muted';
    empty.textContent = t('noCustomNotablePlayers');
    els.customNotablePlayersRows.append(empty);
  }
}

function customNotablePlayersFromForm() {
  return [...els.customNotablePlayersRows.querySelectorAll('.notable-player-row')]
    .map((row) => ({
      accountId: Number(row.dataset.accountId),
      name: row.dataset.name || '',
      countryCode: normalizeCountryCode(row.dataset.countryCode)
    }))
    .filter((player) => Number.isFinite(player.accountId) && player.accountId > 0);
}

function syncStreamerSettingsAccount(accounts, stats) {
  const normalizedAccounts = Array.isArray(accounts) ? accounts : [];
  const currentAccountId = String(stats.streamerAccountId || stats.lastStreamerAccountId || '').trim();
  const knownIds = new Set(normalizedAccounts.map((account) => String(account.accountId || '')).filter(Boolean));
  const now = Date.now();
  const lockedByUser = activeStreamerSettingsAccountTouchedAt > 0
    && now - activeStreamerSettingsAccountTouchedAt < STREAMER_SETTINGS_ACCOUNT_LOCK_MS;
  let selected = String(activeStreamerSettingsAccountId || '').trim();
  if (selected && !knownIds.has(selected) && selected !== currentAccountId) selected = '';
  if (currentAccountId && (!selected || !lockedByUser || selected === currentAccountId)) {
    selected = currentAccountId;
  }
  if (!selected) selected = normalizedAccounts[0]?.accountId || '';
  selected = String(selected || '').trim();
  activeStreamerSettingsAccountId = selected;
  localStorage.setItem('dsk.streamerSettingsAccount', selected);
  renderStreamerSettingsAccountOptions(normalizedAccounts, stats, selected);
  return selected;
}

function markStreamerSettingsAccountInteraction(accountId = activeStreamerSettingsAccountId) {
  activeStreamerSettingsAccountId = String(accountId || '').trim();
  activeStreamerSettingsAccountTouchedAt = Date.now();
  localStorage.setItem('dsk.streamerSettingsAccount', activeStreamerSettingsAccountId);
  localStorage.setItem('dsk.streamerSettingsAccountTouchedAt', String(activeStreamerSettingsAccountTouchedAt));
}

function renderStreamerSettingsAccountOptions(accounts, stats, selectedAccountId) {
  if (!els.streamerSettingsAccount) return;
  const currentAccountId = String(stats.streamerAccountId || stats.lastStreamerAccountId || '').trim();
  const previousValue = els.streamerSettingsAccount.value;
  els.streamerSettingsAccount.innerHTML = '';
  const seen = new Set();
  for (const account of Array.isArray(accounts) ? accounts : []) {
    const accountId = String(account.accountId || '').trim();
    if (!accountId || seen.has(accountId)) continue;
    seen.add(accountId);
    const option = document.createElement('option');
    option.value = accountId;
    const label = String(account.label || '').trim();
    option.textContent = `${label || accountId} (${accountId})${accountId === currentAccountId ? ` / ${t('streamerSettingsCurrentSuffix')}` : ''}`;
    els.streamerSettingsAccount.append(option);
  }
  if (currentAccountId && !seen.has(currentAccountId)) {
    const option = document.createElement('option');
    option.value = currentAccountId;
    option.textContent = `${currentAccountId} / ${t('streamerSettingsCurrentSuffix')}`;
    els.streamerSettingsAccount.append(option);
    seen.add(currentAccountId);
  }
  if (!els.streamerSettingsAccount.options.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = t('streamerSettingsFallback');
    els.streamerSettingsAccount.append(option);
  }
  els.streamerSettingsAccount.value = seen.has(selectedAccountId) ? selectedAccountId : '';
  if (previousValue !== els.streamerSettingsAccount.value) {
    activeStreamerSettingsAccountId = els.streamerSettingsAccount.value;
  }
}

function streamerMmrForSettingsAccount(settings, accountId) {
  const account = Array.isArray(settings.streamerAccounts) && accountId
    ? settings.streamerAccounts.find((item) => String(item.accountId || '') === String(accountId))
    : null;
  const value = account ? account.mmr : settings.streamerMmr;
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function streamerGoalMmrForSettingsAccount(settings, accountId) {
  const account = Array.isArray(settings.streamerAccounts) && accountId
    ? settings.streamerAccounts.find((item) => String(item.accountId || '') === String(accountId))
    : null;
  const number = Number(account ? account.goalMmr : settings.streamerGoalMmr || 0);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function streamerGoalStartMmrForSettingsAccount(settings, accountId) {
  const account = Array.isArray(settings.streamerAccounts) && accountId
    ? settings.streamerAccounts.find((item) => String(item.accountId || '') === String(accountId))
    : null;
  const number = Number(account ? account.goalStartMmr : settings.streamerGoalStartMmr || 0);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

function streamerAccountForSettingsAccount(settings, accountId) {
  return Array.isArray(settings.streamerAccounts) && accountId
    ? settings.streamerAccounts.find((item) => String(item.accountId || '') === String(accountId))
    : null;
}

function updateMenuMmrOcrUi(matchIntel, ocrState, support) {
  const isSupported = support?.supported !== false;
  if (els.streamerOcrControls) els.streamerOcrControls.hidden = !isSupported;
  const manualPicker = support?.picker === 'manual';
  if (els.pickMenuMmrOcrRegion) els.pickMenuMmrOcrRegion.hidden = manualPicker;
  if (els.menuMmrOcrManualRegion) els.menuMmrOcrManualRegion.hidden = !isSupported || !manualPicker;
  if (!els.menuMmrOcrRegionStatus) return;

  const region = matchIntel?.menuMmrOcrRegion;
  let status = t('menuMmrOcrRegionUnset');
  if (region && Number.isFinite(Number(region.width)) && Number.isFinite(Number(region.height))) {
    status = t('menuMmrOcrRegionSet')
      .replace('{width}', String(region.width))
      .replace('{height}', String(region.height))
      .replace('{x}', String(region.x))
      .replace('{y}', String(region.y));
    if (els.menuMmrOcrRegionX) setInputValue(els.menuMmrOcrRegionX, region.x);
    if (els.menuMmrOcrRegionY) setInputValue(els.menuMmrOcrRegionY, region.y);
    if (els.menuMmrOcrRegionWidth) setInputValue(els.menuMmrOcrRegionWidth, region.width);
    if (els.menuMmrOcrRegionHeight) setInputValue(els.menuMmrOcrRegionHeight, region.height);
  }
  if (manualPicker && isSupported) {
    status += ` · ${t('menuMmrOcrManualHint')}`;
  }
  if (ocrState?.lastMmr) {
    status += ` · ${t('menuMmrOcrLastRun').replace('{mmr}', String(ocrState.lastMmr))}`;
  }
  if (ocrState?.lastError) {
    status += ` · ${ocrState.lastError}`;
  }
  if (!isSupported && support?.reason) {
    status = support.reason;
  }
  els.menuMmrOcrRegionStatus.textContent = status;
}

async function saveMenuMmrOcrRegion() {
  const region = {
    x: Number(els.menuMmrOcrRegionX?.value),
    y: Number(els.menuMmrOcrRegionY?.value),
    width: Number(els.menuMmrOcrRegionWidth?.value),
    height: Number(els.menuMmrOcrRegionHeight?.value)
  };
  try {
    await api('/api/menu-mmr-ocr/set-region', region);
    const next = await fetch('/api/state').then((res) => res.json());
    snapshot = next;
    render(snapshot);
    alert(t('menuMmrOcrRegionSaved'));
  } catch (error) {
    alert(error.message || t('menuMmrOcrPickFailed'));
  }
}

async function clearMenuMmrOcrRegion() {
  try {
    await api('/api/menu-mmr-ocr/clear-region');
    const next = await fetch('/api/state').then((res) => res.json());
    snapshot = next;
    render(snapshot);
    alert(t('menuMmrOcrRegionCleared'));
  } catch (error) {
    alert(error.message || t('menuMmrOcrPickFailed'));
  }
}

async function pickMenuMmrOcrRegion() {
  if (!els.pickMenuMmrOcrRegion) return;
  const button = els.pickMenuMmrOcrRegion;
  const previousText = button.textContent;
  button.disabled = true;
  button.textContent = '...';
  try {
    alert(t('menuMmrOcrPickHint'));
    const response = await api('/api/menu-mmr-ocr/pick-region');
    if (response?.cancelled) return;
    if (response?.region) {
      const next = await fetch('/api/state').then((res) => res.json());
      snapshot = next;
      render(snapshot);
    }
  } catch (error) {
    alert(error.message || t('menuMmrOcrPickFailed'));
  } finally {
    button.disabled = false;
    button.textContent = previousText || t('pickMenuMmrOcrRegion');
  }
}

function renderStreamerStatsPreview(stats, settings, selectedAccountId = '') {
  const accountId = String(selectedAccountId || '').trim();
  const mmr = streamerMmrForSettingsAccount(settings, accountId);
  const goalMmr = streamerGoalMmrForSettingsAccount(settings, accountId);
  const medal = streamerPreviewMedal(stats, settings, accountId, mmr);
  const medalId = medal?.id ?? 0;
  const stars = Number(medal?.stars || 0);
  const accountSession = accountId ? stats.accountSessions?.[accountId] : null;
  els.streamerStatWins.textContent = String(accountId ? accountSession?.wins || 0 : stats.wins ?? 0);
  els.streamerStatLosses.textContent = String(accountId ? accountSession?.losses || 0 : stats.losses ?? 0);
  els.streamerCurrentAccount.textContent = accountId || '-';
  els.streamerMedalName.textContent = medal?.name || t('streamerMedalNoData');
  const details = [];
  if (medal?.source === 'account') details.push(t('streamerMedalByAccount'));
  if (medal?.source === 'mmr') details.push(t('streamerMedalByMmr'));
  if (stars > 0) details.push(t('streamerMedalStars').replace('{stars}', String(stars)));
  if (mmr > 0) details.push(`${Math.trunc(mmr)} MMR`);
  if (goalMmr > 0) details.push(`${t('streamerGoalMmr')} ${Math.trunc(goalMmr)}`);
  if (accountId) details.push(`ID ${accountId}`);
  els.streamerMedalDetails.textContent = details.join(' / ') || '-';
  const imageName = medalId === 'calibration' ? 'rank-medal-calibration.png' : `rank-medal-${Number(medalId) || 0}.png`;
  els.streamerMedalImage.src = `/assets/${imageName}`;
  els.streamerMedalPips.hidden = !(stars > 0 && Number(medalId) > 0 && Number(medalId) < 8);
  if (!els.streamerMedalPips.hidden) els.streamerMedalPips.src = `/assets/rank-pip-${Math.min(Math.max(stars, 1), 5)}.png`;
  els.streamerMedalCard.dataset.source = medal?.source || 'none';
  document.querySelectorAll('.streamer-preview-medal').forEach((preview) => {
    const medalImage = preview.querySelector('img:not(.streamer-preview-pips)');
    const pipsImage = preview.querySelector('.streamer-preview-pips');
    if (medalImage) medalImage.src = `/assets/${imageName}`;
    if (pipsImage) {
      pipsImage.hidden = els.streamerMedalPips.hidden;
      if (!pipsImage.hidden) pipsImage.src = els.streamerMedalPips.src;
    }
  });
}

function renderStreamerGoalPreview(stats, settings, selectedAccountId = '') {
  const goal = streamerGoalPreviewState(stats, settings, selectedAccountId);
  applyStreamerGoalCustomCss(streamerMmrGoalStyleFromSettings(settings).customCss);
  applyStreamerGoalPreview(els.streamerGoalPreview, goal, settings);
  const overlayGoal = streamerOverlayGoalPreviewState(stats, settings);
  document.querySelectorAll('.overlay-position-item.streamer-goal-preview').forEach((preview) => {
    applyStreamerGoalPreview(preview, overlayGoal, settings);
  });
}

function streamerGoalPreviewState(stats, settings, selectedAccountId = '', options = {}) {
  const useFormValues = options.useFormValues !== false;
  const accountId = String(selectedAccountId || '').trim();
  const account = streamerAccountForSettingsAccount(settings, accountId);
  const useSelectedAccountForm = useFormValues && String(accountId || '') === String(activeStreamerSettingsAccountId || '');
  const formCurrentMmr = useSelectedAccountForm ? Number(els.streamerMmr?.value || 0) : 0;
  const currentMmr = formCurrentMmr > 0
    ? Math.max(0, Math.trunc(formCurrentMmr))
    : streamerMmrForSettingsAccount(settings, accountId);
  const formGoalMmr = useSelectedAccountForm ? Number(els.streamerGoalMmr?.value || 0) : 0;
  const targetMmr = Math.max(0, Math.trunc(Number(formGoalMmr || (account ? account.goalMmr : settings.streamerGoalMmr) || 0)));
  const formStartMmr = useSelectedAccountForm ? Number(els.streamerGoalStartMmr?.value || 0) : 0;
  const startMmr = Math.max(0, Math.trunc(Number(useSelectedAccountForm ? formStartMmr : (account ? account.goalStartMmr : settings.streamerGoalStartMmr) || 0)));
  const goalRecord = accountId ? stats.accountGoalRecords?.[accountId] : null;
  const wins = Math.max(0, Math.trunc(Number(accountId ? (goalRecord?.wins ?? 0) : 0)));
  const losses = Math.max(0, Math.trunc(Number(accountId ? (goalRecord?.losses ?? 0) : 0)));
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : null;
  const distance = targetMmr - startMmr;
  const gained = currentMmr - startMmr;
  const progress = targetMmr > 0
    ? distance > 0
      ? Math.max(0, Math.min(100, Math.round((gained / distance) * 1000) / 10))
      : currentMmr >= targetMmr ? 100 : 0
    : 0;
  const remainingMmr = targetMmr > 0 ? Math.max(0, targetMmr - currentMmr) : 0;
  const winDelta = Math.max(1, Math.trunc(Number(settings.streamerMmrWinDelta || 25)));
  return {
    currentMmr,
    startMmr,
    targetMmr,
    remainingMmr,
    progress,
    wins,
    losses,
    winRate,
    requiredWins: remainingMmr > 0 ? Math.ceil(remainingMmr / winDelta) : 0
  };
}

function updateStreamerGoalResetButton(accountId = activeStreamerSettingsAccountId) {
  if (!els.resetStreamerGoalRecord) return;
  const hasAccount = Boolean(String(accountId || '').trim());
  els.resetStreamerGoalRecord.disabled = !hasAccount;
}

async function resetStreamerGoalRecordForSelectedAccount() {
  const accountId = String(activeStreamerSettingsAccountId || '').trim();
  if (!accountId) return;
  const next = await api('/api/streamer-stats/goal-reset', { accountId });
  snapshot = next;
  render(snapshot);
}

function applyStreamerGoalPreview(root, goal, settings) {
  if (!root) return;
  const previewRoot = root.classList?.contains('streamer-goal-preview')
    ? root
    : root.querySelector('.streamer-goal-preview') || root;
  const goalStyle = applyStreamerGoalPreviewStyle(previewRoot, settings);
  const percent = previewRoot.querySelector('#streamerGoalPreviewPercent, [data-goal-preview=\"percent\"]') || previewRoot.querySelector('.streamer-goal-preview-bar b');
  const bar = previewRoot.querySelector('#streamerGoalPreviewBar, [data-goal-preview=\"bar\"]') || previewRoot.querySelector('.streamer-goal-preview-bar');
  const fill = previewRoot.querySelector('#streamerGoalPreviewFill, [data-goal-preview=\"fill\"]') || previewRoot.querySelector('.streamer-goal-preview-bar span');
  const current = previewRoot.querySelector('#streamerGoalPreviewCurrent, [data-goal-preview=\"current\"]') || previewRoot.querySelector('.streamer-goal-preview-meta b');
  const start = previewRoot.querySelector('#streamerGoalPreviewStart, [data-goal-preview=\"start\"]') || previewRoot.querySelector('[data-goal-part="start"]');
  const target = previewRoot.querySelector('#streamerGoalPreviewTarget, [data-goal-preview=\"target\"]') || previewRoot.querySelector('[data-goal-part="target"]') || previewRoot.querySelector('.streamer-goal-preview-meta span');
  const delta = previewRoot.querySelector('#streamerGoalPreviewDelta, [data-goal-preview=\"delta\"]') || previewRoot.querySelector('.streamer-goal-preview-meta em');
  const record = previewRoot.querySelector('#streamerGoalPreviewRecord, [data-goal-preview=\"record\"]') || previewRoot.querySelector('.streamer-goal-preview-kpis span:nth-child(1)');
  const winRate = previewRoot.querySelector('#streamerGoalPreviewWinRate, [data-goal-preview=\"winrate\"]') || previewRoot.querySelector('.streamer-goal-preview-kpis span:nth-child(2)');
  const eta = previewRoot.querySelector('#streamerGoalPreviewEta, [data-goal-preview=\"eta\"]') || previewRoot.querySelector('.streamer-goal-preview-kpis span:nth-child(3)');
  const hasGoal = Number(goal?.targetMmr || 0) > 0;
  previewRoot.dataset.empty = hasGoal ? 'false' : 'true';
  previewRoot.dataset.backgroundHidden = settings.showStreamerMmrGoalBackground === false ? 'true' : 'false';
  previewRoot.classList.toggle('complete', hasGoal && Number(goal?.remainingMmr || 0) <= 0);
  setTextContent(percent, `${formatGoalPercent(goal?.progress || 0)}%`);
  setTextContent(current, formatGoalText(goalStyle.currentPrefix, formatStreamerMmr(goal?.currentMmr || 0), goalStyle.currentSuffix));
  setTextContent(start, formatGoalText(goalStyle.startPrefix, formatStreamerMmr(goal?.startMmr || 0), goalStyle.startSuffix));
  setTextContent(target, formatGoalText(goalStyle.targetPrefix, formatStreamerMmr(goal?.targetMmr || 0), goalStyle.targetSuffix));
  setTextContent(delta, hasGoal
    ? goal.remainingMmr > 0
      ? formatGoalText(goalStyle.deltaPrefix, formatStreamerMmr(goal.remainingMmr), goalStyle.deltaSuffix)
      : 'DONE'
    : formatGoalText(goalStyle.deltaPrefix, '0', goalStyle.deltaSuffix));
  setTextContent(record, `W ${goal?.wins || 0} - L ${goal?.losses || 0}`);
  setTextContent(winRate, goal?.winRate !== null && goal?.winRate !== undefined ? `${formatGoalPercent(goal.winRate)}% WR` : '- WR');
  setTextContent(eta, hasGoal ? goal.remainingMmr > 0 ? `${goal.requiredWins || 0}W` : 'DONE' : '0W');
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, Number(goal?.progress || 0)))}%`;
  toggleHidden(bar, settings.showStreamerMmrGoalProgress === false);
  toggleHidden(percent, settings.showStreamerMmrGoalProgress === false);
  toggleHidden(current, settings.showStreamerMmrGoalCurrent === false);
  toggleHidden(start, settings.showStreamerMmrGoalStart !== true);
  toggleHidden(target, settings.showStreamerMmrGoalTarget === false);
  toggleHidden(delta, settings.showStreamerMmrGoalDelta === false);
  toggleHidden(record, settings.showStreamerMmrGoalRecord === false);
  toggleHidden(winRate, settings.showStreamerMmrGoalWinRate === false);
  toggleHidden(eta, settings.showStreamerMmrGoalEta === false);
  const metaHidden = settings.showStreamerMmrGoalCurrent === false
    && settings.showStreamerMmrGoalStart !== true
    && settings.showStreamerMmrGoalTarget === false
    && settings.showStreamerMmrGoalDelta === false;
  const kpisHidden = settings.showStreamerMmrGoalRecord === false
    && settings.showStreamerMmrGoalWinRate === false
    && settings.showStreamerMmrGoalEta === false;
  toggleHidden(current?.parentElement, metaHidden);
  toggleHidden(record?.parentElement, kpisHidden);
}

function applyStreamerGoalPreviewStyle(root, settings) {
  if (!root) return;
  const style = streamerMmrGoalStyleFromSettings(settings);
  root.classList.remove(...streamerMmrGoalTemplateClasses);
  root.classList.add(`streamer-goal-template-${style.template}`);
  root.dataset.animated = style.animated ? 'true' : 'false';
  root.style.setProperty('--goal-fill-start', style.fillStart);
  root.style.setProperty('--goal-fill-end', style.fillEnd);
  root.style.setProperty('--goal-track', style.track);
  root.style.setProperty('--goal-accent', style.accent);
  root.style.setProperty('--goal-text', style.text);
  root.style.setProperty('--goal-bar-height', `${style.barHeight}px`);
  root.style.setProperty('--goal-bar-radius', `${style.barRadius}px`);
  root.style.setProperty('--goal-glow', `${style.glow}px`);
  root.style.setProperty('--goal-padding-top', `${style.paddingTop}px`);
  root.style.setProperty('--goal-padding-right', `${style.paddingRight}px`);
  root.style.setProperty('--goal-padding-bottom', `${style.paddingBottom}px`);
  root.style.setProperty('--goal-padding-left', `${style.paddingLeft}px`);
  root.style.setProperty('--goal-animation-scale', formatGoalAnimationScale(style.animationSpeed));
  applyGoalAnimationDurationProperties(root, style.animationSpeed);
  root.dataset.goalPart = root.dataset.goalPart || 'root';
  return style;
}

function streamerMmrGoalStyleFromSettings(settings = {}) {
  const template = streamerMmrGoalTemplates.includes(settings.streamerMmrGoalTemplate)
    ? settings.streamerMmrGoalTemplate
    : streamerMmrGoalStyleDefaults.template;
  return {
    template,
    fillStart: normalizeGoalColor(settings.streamerMmrGoalFillStart, streamerMmrGoalStyleDefaults.fillStart),
    fillEnd: normalizeGoalColor(settings.streamerMmrGoalFillEnd, streamerMmrGoalStyleDefaults.fillEnd),
    track: normalizeGoalColor(settings.streamerMmrGoalTrack, streamerMmrGoalStyleDefaults.track),
    accent: normalizeGoalColor(settings.streamerMmrGoalAccent, streamerMmrGoalStyleDefaults.accent),
    text: normalizeGoalColor(settings.streamerMmrGoalText, streamerMmrGoalStyleDefaults.text),
    barHeight: clampGoalInt(settings.streamerMmrGoalBarHeight, 8, 64, streamerMmrGoalStyleDefaults.barHeight),
    barRadius: clampGoalInt(settings.streamerMmrGoalBarRadius, 0, 40, streamerMmrGoalStyleDefaults.barRadius),
    glow: clampGoalInt(settings.streamerMmrGoalGlow, 0, 30, streamerMmrGoalStyleDefaults.glow),
    animationSpeed: clampGoalNumber(settings.streamerMmrGoalAnimationSpeed, 0.25, 3, streamerMmrGoalStyleDefaults.animationSpeed),
    paddingTop: clampGoalInt(settings.streamerMmrGoalPaddingTop, 0, 48, streamerMmrGoalStyleDefaults.paddingTop),
    paddingRight: clampGoalInt(settings.streamerMmrGoalPaddingRight, 0, 48, streamerMmrGoalStyleDefaults.paddingRight),
    paddingBottom: clampGoalInt(settings.streamerMmrGoalPaddingBottom, 0, 48, streamerMmrGoalStyleDefaults.paddingBottom),
    paddingLeft: clampGoalInt(settings.streamerMmrGoalPaddingLeft, 0, 48, streamerMmrGoalStyleDefaults.paddingLeft),
    animated: settings.streamerMmrGoalAnimated !== false,
    startPrefix: normalizeGoalTextPart(settings.streamerMmrGoalStartPrefix, streamerMmrGoalStyleDefaults.startPrefix),
    startSuffix: normalizeGoalTextPart(settings.streamerMmrGoalStartSuffix, streamerMmrGoalStyleDefaults.startSuffix),
    currentPrefix: normalizeGoalTextPart(settings.streamerMmrGoalCurrentPrefix, streamerMmrGoalStyleDefaults.currentPrefix),
    currentSuffix: normalizeGoalTextPart(settings.streamerMmrGoalCurrentSuffix, streamerMmrGoalStyleDefaults.currentSuffix),
    targetPrefix: normalizeGoalTextPart(settings.streamerMmrGoalTargetPrefix, streamerMmrGoalStyleDefaults.targetPrefix),
    targetSuffix: normalizeGoalTextPart(settings.streamerMmrGoalTargetSuffix, streamerMmrGoalStyleDefaults.targetSuffix),
    deltaPrefix: normalizeGoalTextPart(settings.streamerMmrGoalDeltaPrefix, streamerMmrGoalStyleDefaults.deltaPrefix),
    deltaSuffix: normalizeGoalTextPart(settings.streamerMmrGoalDeltaSuffix, streamerMmrGoalStyleDefaults.deltaSuffix),
    customCss: normalizeGoalCustomCss(settings.streamerMmrGoalCustomCss)
  };
}

function applyStreamerGoalCustomCss(css) {
  const id = 'streamerGoalCustomCssStyle';
  let style = document.querySelector(`#${id}`);
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.append(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function formatGoalText(prefix, value, suffix) {
  return `${prefix || ''}${value}${suffix || ''}`;
}

function normalizeGoalTextPart(value, fallback = '') {
  return String(value ?? fallback ?? '').slice(0, 24);
}

function normalizeGoalCustomCss(value) {
  return String(value || '').slice(0, 8000);
}

function streamerOverlayGoalPreviewState(stats, settings) {
  const liveGoal = stats?.mmrGoal;
  if (liveGoal && Number(liveGoal.targetMmr || 0) > 0) {
    return {
      currentMmr: Math.max(0, Math.trunc(Number(liveGoal.currentMmr || 0))),
      targetMmr: Math.max(0, Math.trunc(Number(liveGoal.targetMmr || 0))),
      remainingMmr: Math.max(0, Math.trunc(Number(liveGoal.remainingMmr || 0))),
      progress: Math.max(0, Math.min(100, Number(liveGoal.progress || 0))),
      wins: Math.max(0, Math.trunc(Number(liveGoal.wins || 0))),
      losses: Math.max(0, Math.trunc(Number(liveGoal.losses || 0))),
      winRate: liveGoal.winRate === null || liveGoal.winRate === undefined ? null : Number(liveGoal.winRate),
      requiredWins: Math.max(0, Math.trunc(Number(liveGoal.requiredWins || 0)))
    };
  }
  const fallbackAccount = Array.isArray(settings?.streamerAccounts) ? settings.streamerAccounts[0]?.accountId : '';
  const accountId = stats?.streamerAccountId || stats?.lastStreamerAccountId || fallbackAccount;
  return streamerGoalPreviewState(stats || {}, settings || {}, accountId ? String(accountId) : '', { useFormValues: false });
}

function normalizeStreamerWinLossPosition(value, fallback = 'left') {
  return ['left', 'right', 'bottom', 'top'].includes(value) ? value : fallback;
}

function normalizeGoalColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function clampGoalInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function clampGoalNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function formatGoalAnimationScale(speed) {
  return String(Math.round((1 / clampGoalNumber(speed, 0.25, 3, streamerMmrGoalStyleDefaults.animationSpeed)) * 1000) / 1000);
}

function formatGoalAnimationDuration(seconds, speed) {
  const duration = seconds * clampGoalNumber(formatGoalAnimationScale(speed), 1 / 3, 4, 1);
  return `${Number(duration.toFixed(3))}s`;
}

function applyGoalAnimationDurationProperties(root, speed) {
  const durations = {
    bubbles: 1.7,
    shine: 2.1,
    diagonal: 1.15,
    'diagonal-sweep': 1.7,
    eye: 3.8,
    scanner: 2.1,
    shimmer: 1.9,
    comet: 1.6,
    aurora: 3.4,
    pulse: 2.4,
    segments: 1.25,
    liquid: 2.8,
    equalizer: 1.2,
    heartbeat: 1.7,
    sparks: 1.4,
    glitch: 1.8,
    'custom-shine': 1.8,
    'custom-bubbles': 2.4,
    'custom-pulse': 1.8,
    'custom-diagonal': 1.15,
    'custom-diagonal-sweep': 1.7,
    'custom-eye': 3.8,
    'custom-scanner': 2.6,
    'custom-sparks': 1.7,
    'custom-glitch': 2.8
  };
  Object.entries(durations).forEach(([name, seconds]) => {
    root.style.setProperty(`--goal-duration-${name}`, formatGoalAnimationDuration(seconds, speed));
  });
}

function toggleHidden(element, hidden) {
  if (element) element.hidden = Boolean(hidden);
}

function setTextContent(element, value) {
  if (!element) return;
  const text = String(value ?? '');
  if (element.textContent !== text) element.textContent = text;
}

function formatGoalPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number % 1 === 0 ? String(Math.trunc(number)) : number.toFixed(1);
}

function formatStreamerMmr(value) {
  const number = Math.max(0, Math.trunc(Number(value) || 0));
  return number.toLocaleString('en-US');
}

function streamerPreviewMedal(stats, settings, accountId, mmr) {
  const overlayAccountId = String(stats.streamerAccountId || stats.lastStreamerAccountId || '').trim();
  if (
    accountId
    && accountId === overlayAccountId
    && settings.streamerMedalSource !== 'mmr'
    && stats.medal?.source === 'account'
  ) {
    return stats.medal;
  }
  if (settings.streamerMedalSource === 'account' && accountId === overlayAccountId && !mmr) {
    return stats.medal || null;
  }
  const medal = rankMedalFromMmrPreview(mmr);
  return medal ? { ...medal, id: medal.medal, source: 'mmr' } : null;
}

function rankMedalFromMmrPreview(mmr) {
  const value = Number(mmr);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value <= 0) return { medal: 'calibration', name: 'Calibration', minMmr: 0, stars: 0 };
  let current = previewRankMedalThresholds[1];
  for (const threshold of previewRankMedalThresholds.slice(1)) {
    if (value >= threshold.minMmr) current = threshold;
  }
  const stars = !current.starStep || current.medal <= 0 || current.medal >= 8
    ? 0
    : Math.min(Math.max(Math.floor((value - current.minMmr) / current.starStep) + 1, 1), 5);
  return { ...current, stars };
}

function renderStreamerAccounts(accounts, stats, selectedAccountId = '') {
  els.streamerAccountRows.innerHTML = '';
  const currentAccountId = String(stats.streamerAccountId || '').trim();
  const sessions = stats.accountSessions || {};
  let rowCount = 0;
  for (const account of Array.isArray(accounts) ? accounts : []) {
    const accountId = String(account.accountId || '').trim();
    if (!accountId) continue;
    const session = sessions[accountId] || {};
    const row = document.createElement('div');
    row.className = 'streamer-account-row';
    row.dataset.accountId = accountId;
    row.dataset.label = String(account.label || '').trim();
    row.dataset.mmr = Number.isFinite(Number(account.mmr)) ? String(Math.trunc(Number(account.mmr))) : '0';
    row.dataset.goalMmr = Number.isFinite(Number(account.goalMmr)) ? String(Math.trunc(Number(account.goalMmr))) : '0';
    row.dataset.goalStartMmr = Number.isFinite(Number(account.goalStartMmr)) ? String(Math.trunc(Number(account.goalStartMmr))) : '0';
    row.dataset.current = accountId === currentAccountId ? 'true' : 'false';
    row.dataset.selected = accountId === String(selectedAccountId || '') ? 'true' : 'false';

    const current = document.createElement('span');
    current.className = 'streamer-account-current';
    current.textContent = accountId === currentAccountId ? t('streamerAccountCurrentBadge') : '-';
    const id = document.createElement('span');
    id.className = 'streamer-account-id';
    id.textContent = accountId;
    const label = document.createElement('span');
    label.className = 'streamer-account-label';
    label.textContent = row.dataset.label || '-';
    const mmr = document.createElement('span');
    mmr.className = 'streamer-account-mmr';
    mmr.textContent = Number(row.dataset.mmr) > 0 ? row.dataset.mmr : '-';
    const wl = document.createElement('span');
    wl.className = 'streamer-account-session';
    wl.textContent = `${session.wins || 0}-${session.losses || 0}`;
    const actions = document.createElement('div');
    actions.className = 'streamer-account-actions';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.dataset.action = 'edit-streamer-account';
    edit.textContent = t('editStreamerAccount');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.dataset.action = 'remove-streamer-account';
    remove.textContent = t('removeStreamerAccount');
    actions.append(edit, remove);

    row.append(current, id, label, mmr, wl, actions);
    els.streamerAccountRows.append(row);
    rowCount += 1;
  }
  if (!rowCount) {
    const empty = document.createElement('div');
    empty.className = 'streamer-account-empty muted';
    empty.textContent = t('noStreamerAccounts');
    els.streamerAccountRows.append(empty);
  }
}

function streamerAccountsFromForm() {
  const selectedAccountId = String(activeStreamerSettingsAccountId || '').trim();
  const currentMmr = Math.max(0, Math.trunc(Number(els.streamerMmr.value) || 0));
  const currentGoalMmr = Math.max(0, Math.trunc(Number(els.streamerGoalMmr.value) || 0));
  const currentGoalStartMmr = Math.max(0, Math.trunc(Number(els.streamerGoalStartMmr.value) || 0));
  return [...els.streamerAccountRows.querySelectorAll('.streamer-account-row')]
    .map((row) => {
      const rowAccountId = String(row.dataset.accountId);
      const rowMmr = rowAccountId === selectedAccountId ? currentMmr : Number(row.dataset.mmr || 0);
      const rowGoalMmr = rowAccountId === selectedAccountId ? currentGoalMmr : Number(row.dataset.goalMmr || 0);
      const rowGoalStartMmr = rowAccountId === selectedAccountId ? currentGoalStartMmr : Number(row.dataset.goalStartMmr || 0);
      return {
        accountId: Number(row.dataset.accountId),
        label: row.dataset.label || '',
        mmr: rowMmr,
        goalMmr: rowGoalMmr,
        goalStartMmr: rowGoalMmr > 0 ? rowGoalStartMmr : 0
      };
    })
    .filter((account) => Number.isFinite(account.accountId) && account.accountId > 0);
}

function addStreamerAccount() {
  const accountId = normalizeDotaAccountIdInput(els.streamerAccountId.value);
  const label = els.streamerAccountLabel.value.trim();
  const existingAccounts = streamerAccountsFromForm();
  const fallbackMmr = Math.max(0, Math.trunc(Number(els.streamerMmr.value) || 0));
  const fallbackGoalMmr = Math.max(0, Math.trunc(Number(els.streamerGoalMmr.value) || 0));
  const fallbackGoalStartMmr = Math.max(0, Math.trunc(Number(els.streamerGoalStartMmr.value) || 0));
  const editorMmr = Math.max(0, Math.trunc(Number(els.streamerAccountMmr.value) || 0));
  const mmr = !editingStreamerAccountId && existingAccounts.length === 0 && editorMmr <= 0 ? fallbackMmr : editorMmr;
  if (!accountId) {
    alert(t('streamerAccountId'));
    return;
  }
  const previousAccountId = editingStreamerAccountId || accountId;
  const previousRow = previousAccountId
    ? els.streamerAccountRows.querySelector(`.streamer-account-row[data-account-id="${CSS.escape(previousAccountId)}"]`)
    : null;
  const previousGoalMmr = previousRow
    ? Number(previousRow.dataset.goalMmr || 0)
    : (!editingStreamerAccountId && existingAccounts.length === 0 ? fallbackGoalMmr : 0);
  const goalMmr = String(previousAccountId) === String(activeStreamerSettingsAccountId)
    ? Math.max(0, Math.trunc(Number(els.streamerGoalMmr.value) || 0))
    : previousGoalMmr;
  const previousGoalStartMmr = previousRow
    ? Number(previousRow.dataset.goalStartMmr || 0)
    : (!editingStreamerAccountId && existingAccounts.length === 0 ? fallbackGoalStartMmr : 0);
  const goalStartMmr = goalMmr > 0 && String(previousAccountId) === String(activeStreamerSettingsAccountId)
    ? Math.max(0, Math.trunc(Number(els.streamerGoalStartMmr.value) || 0))
    : goalMmr > 0
      ? previousGoalStartMmr
      : 0;
  const accounts = existingAccounts
    .filter((account) => String(account.accountId) !== previousAccountId && String(account.accountId) !== accountId);
  accounts.push({ accountId: Number(accountId), label, mmr, goalMmr, goalStartMmr });
  markStreamerSettingsAccountInteraction(accountId);
  renderStreamerSettingsAccountOptions(accounts, snapshot?.state?.streamerStats || {}, activeStreamerSettingsAccountId);
  els.streamerMmr.value = String(mmr);
  els.streamerGoalMmr.value = String(goalMmr);
  els.streamerGoalStartMmr.value = String(goalStartMmr);
  renderStreamerAccounts(accounts, snapshot?.state?.streamerStats || {}, activeStreamerSettingsAccountId);
  renderStreamerStatsPreview(snapshot?.state?.streamerStats || {}, { ...(snapshot?.config?.protection?.matchIntel || {}), streamerAccounts: accounts }, activeStreamerSettingsAccountId);
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, { ...(snapshot?.config?.protection?.matchIntel || {}), streamerAccounts: accounts }, activeStreamerSettingsAccountId);
  resetStreamerAccountEditor();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
}

function editStreamerAccount(row) {
  if (!row) return;
  editingStreamerAccountId = row.dataset.accountId || '';
  markStreamerSettingsAccountInteraction(editingStreamerAccountId);
  els.streamerAccountId.value = editingStreamerAccountId;
  els.streamerAccountLabel.value = row.dataset.label || '';
  els.streamerAccountMmr.value = row.dataset.mmr || '0';
  const matchIntel = snapshot?.config?.protection?.matchIntel || {};
  const stats = snapshot?.state?.streamerStats || {};
  renderStreamerSettingsAccountOptions(matchIntel.streamerAccounts || [], stats, activeStreamerSettingsAccountId);
  setInputValue(els.streamerMmr, streamerMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  setInputValue(els.streamerGoalMmr, streamerGoalMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  setInputValue(els.streamerGoalStartMmr, streamerGoalStartMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  renderStreamerStatsPreview(stats, matchIntel, activeStreamerSettingsAccountId);
  renderStreamerGoalPreview(stats, matchIntel, activeStreamerSettingsAccountId);
  renderStreamerAccounts(matchIntel.streamerAccounts || [], stats, activeStreamerSettingsAccountId);
  updateStreamerAccountEditorMode();
  els.streamerAccountId.focus();
}

function resetStreamerAccountEditor() {
  editingStreamerAccountId = '';
  els.streamerAccountId.value = '';
  els.streamerAccountLabel.value = '';
  els.streamerAccountMmr.value = '';
  updateStreamerAccountEditorMode();
}

function updateStreamerAccountEditorMode() {
  const editing = Boolean(editingStreamerAccountId);
  els.addStreamerAccount.textContent = editing ? t('saveStreamerAccount') : t('addStreamerAccount');
  els.cancelStreamerAccountEdit.hidden = !editing;
}

function addCustomNotablePlayer() {
  const accountId = normalizeDotaAccountIdInput(els.notablePlayerId.value);
  const name = els.notablePlayerName.value.trim();
  const countryCode = normalizeCountryCode(els.notablePlayerCountry.value);
  if (!accountId) {
    alert(t('notablePlayerId'));
    return;
  }
  if (!name) {
    alert(t('notablePlayerName'));
    return;
  }
  if (els.notablePlayerCountry.value.trim() && !countryCode) {
    alert(t('notablePlayerCountry'));
    return;
  }

  const previousAccountId = editingNotablePlayerAccountId || accountId;
  const players = customNotablePlayersFromForm()
    .filter((player) => String(player.accountId) !== previousAccountId && String(player.accountId) !== accountId);
  players.push({ accountId: Number(accountId), name, countryCode });
  renderCustomNotablePlayers(players);
  resetNotablePlayerEditor();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
}

function editCustomNotablePlayer(row) {
  if (!row) return;
  editingNotablePlayerAccountId = row.dataset.accountId || '';
  els.notablePlayerId.value = editingNotablePlayerAccountId;
  els.notablePlayerName.value = row.dataset.name || '';
  els.notablePlayerCountry.value = normalizeCountryCode(row.dataset.countryCode);
  updateNotablePlayerEditorMode();
  els.notablePlayerId.focus();
}

function resetNotablePlayerEditor() {
  editingNotablePlayerAccountId = '';
  els.notablePlayerId.value = '';
  els.notablePlayerName.value = '';
  els.notablePlayerCountry.value = '';
  updateNotablePlayerEditorMode();
}

function updateNotablePlayerEditorMode() {
  const editing = Boolean(editingNotablePlayerAccountId);
  els.addNotablePlayer.textContent = editing ? t('saveNotablePlayer') : t('addNotablePlayer');
  els.cancelNotablePlayerEdit.hidden = !editing;
}

function normalizeDotaAccountIdInput(value) {
  const raw = String(value || '').trim();
  if (!/^\d{1,20}$/.test(raw)) return '';
  try {
    const number = BigInt(raw);
    if (number <= 0n) return '';
    const steamOffset = 76561197960265728n;
    const accountId = number > steamOffset ? number - steamOffset : number;
    if (accountId <= 0n || accountId > 4294967295n) return '';
    return accountId.toString();
  } catch {
    return '';
  }
}

function normalizeCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : '';
}

function renderStreamerStatsStatus(stats, settings) {
  const mmr = Number(stats.currentMmr || settings.streamerMmr || 0);
  const stream = stats.effectiveStreamOnline === true
    ? t('streamerStatsOnline')
    : stats.effectiveStreamOnline === false
      ? t('streamerStatsOffline')
      : t('streamerStatsUnknown');
  let text = t('streamerStatsStatus')
    .replace('{wins}', String(stats.wins || 0))
    .replace('{losses}', String(stats.losses || 0))
    .replace('{mmr}', mmr > 0 ? String(Math.trunc(mmr)) : t('streamerStatsNoMmr'))
    .replace('{medal}', stats.medal?.name || t('streamerStatsNoMedal'))
    .replace('{stream}', stream);
  if (stats.previousSession) {
    text += t('streamerStatsPrevious')
      .replace('{wins}', String(stats.previousSession.wins || 0))
      .replace('{losses}', String(stats.previousSession.losses || 0));
  }
  els.streamerStatsStatus.textContent = text;
  els.restoreStreamerStats.disabled = !stats.previousSession;
}

function renderIntelSummary(settings) {
  const enabled = settings.enabled !== false;
  const notableEnabled = enabled && (settings.showPlayerRanks !== false || settings.showPlayerFlags === true);
  const timersEnabled = enabled && (settings.showAegisTimer !== false || settings.showRoshanTimer !== false);
  const positions = settings.overlayPositions || {};
  const customized = overlayPositionKeys.some((key) => {
    const offset = normalizeOverlayOffset(positions[key]);
    return offset.x !== 0 || offset.y !== 0;
  });
  setStatusText(els.intelMatchStatus, 'intelMatchStatus', enabled ? 'intelStatusOn' : 'intelStatusOff');
  setStatusText(els.intelNotableStatus, 'intelNotableStatus', notableEnabled ? 'intelStatusOn' : 'intelStatusOff');
  setStatusText(els.intelRoshanStatus, 'intelRoshanStatus', timersEnabled ? 'intelStatusOn' : 'intelStatusOff');
  setStatusText(els.intelPositionStatus, 'intelPositionStatus', customized ? 'intelStatusCustom' : 'intelStatusDefault');
}

function setStatusText(el, templateKey, valueKey) {
  if (!el) return;
  el.textContent = t(templateKey).replace('{value}', t(valueKey));
  el.dataset.active = valueKey === 'intelStatusOn' || valueKey === 'intelStatusCustom' ? 'true' : 'false';
}

function setOverlayPositionControls(positions) {
  const normalizedPositions = normalizeOverlayPositionsForForm(positions);
  for (const key of overlayPositionKeys) {
    const offset = normalizeOverlayOffset(normalizedPositions[key]);
    const box = overlayPreviewBoxes[key];
    const xInput = els[`${key}X`];
    const yInput = els[`${key}Y`];
    if (!box) continue;
    const base = overlayVisualBase(box);
    const range = overlayPositionRange(box);
    if (xInput) {
      xInput.min = '0';
      xInput.max = String(range.maxX);
      setInputValue(xInput, clampNumber(base.left + offset.x, 0, range.maxX, base.left));
    }
    if (yInput) {
      yInput.min = '0';
      yInput.max = String(range.maxY);
      setInputValue(yInput, clampNumber(base.top + offset.y, 0, range.maxY, base.top));
    }
  }
  renderOverlayPositionPreviews();
}

function overlayPositionsFromForm() {
  return Object.fromEntries(overlayPositionKeys.map((key) => {
    const box = overlayPreviewBoxes[key] || { left: 0, top: 0, width: 0, height: 0 };
    const base = overlayVisualBase(box);
    const range = overlayPositionRange(box);
    const x = clampNumber(els[`${key}X`]?.value, 0, range.maxX, base.left);
    const y = clampNumber(els[`${key}Y`]?.value, 0, range.maxY, base.top);
    return [key, {
      x: x - base.left,
      y: y - base.top
    }];
  }));
}

function normalizeOverlayPositionsForForm(positions) {
  const source = positions && typeof positions === 'object' ? positions : {};
  const legacyMmrGoal = normalizeOverlayOffset(source.streamerMmrGoal);
  return {
    ...source,
    streamerMmrGoalMenu: source.streamerMmrGoalMenu ? normalizeOverlayOffset(source.streamerMmrGoalMenu) : legacyMmrGoal,
    streamerMmrGoalGame: source.streamerMmrGoalGame ? normalizeOverlayOffset(source.streamerMmrGoalGame) : legacyMmrGoal
  };
}

function overlayVisualBase(box) {
  const anchor = box.anchor || { x: 0, y: 0 };
  return {
    left: Number(box.left || 0) + Number(anchor.x || 0),
    top: Number(box.top || 0) + Number(anchor.y || 0)
  };
}

function overlayPositionRange(box) {
  const visible = box.visible || { width: box.width || 0, height: box.height || 0 };
  return {
    maxX: Math.max(0, Math.trunc(1920 - Number(visible.width || 0))),
    maxY: Math.max(0, Math.trunc(1080 - Number(visible.height || 0)))
  };
}

function normalizeOverlayOffset(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    x: clampNumber(source.x, -1920, 1920, 0),
    y: clampNumber(source.y, -1080, 1080, 0)
  };
}

function clampNumber(value, min, max, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function renderOverlayPositionPreviews() {
  const positions = overlayPositionsFromForm();
  const background = els.overlayPreviewBackground?.value || 'screenshot';
  if (els.overlayPositionTarget && els.overlayPositionTarget.value !== activeOverlayPositionKey) {
    els.overlayPositionTarget.value = activeOverlayPositionKey;
  }
  for (const key of overlayPositionKeys) {
    const card = document.querySelector(`[data-position-preview="${key}"]`);
    const preview = card?.querySelector('.overlay-position-preview');
    const item = card?.querySelector('.overlay-position-item');
    const box = isStreamerMmrGoalPositionKey(key)
      ? streamerMmrGoalPreviewBox(protectionMatchIntelFromForm(), key)
      : overlayPreviewBoxes[key];
    if (!preview || !item || !box) continue;
    card.hidden = key !== activeOverlayPositionKey;
    if (card.hidden) continue;
    if (isStreamerMmrGoalPositionKey(key)) {
      renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, protectionMatchIntelFromForm(), activeStreamerSettingsAccountId);
    }
    const offset = normalizeOverlayOffset(positions[key]);
    const base = overlayVisualBase(box);
    const range = overlayPositionRange(box);
    const anchor = box.anchor || { x: 0, y: 0 };
    const x = clampNumber(base.left + offset.x, 0, range.maxX, base.left);
    const y = clampNumber(base.top + offset.y, 0, range.maxY, base.top);
    const previewScale = preview.clientWidth / 1920 || 0;
    preview.style.setProperty('--preview-scale', String(previewScale || 0.5));
    card.style.setProperty('--preview-height', `${preview.clientHeight || 260}px`);
    preview.dataset.bg = background;
    item.style.left = `${(x - Number(anchor.x || 0)) * previewScale}px`;
    item.style.top = `${(y - Number(anchor.y || 0)) * (preview.clientHeight / 1080 || 0)}px`;
    item.style.width = `${box.width * previewScale}px`;
    item.style.height = `${box.height * (preview.clientHeight / 1080 || 0)}px`;
    const xOutput = els[`${key}XValue`];
    const yOutput = els[`${key}YValue`];
    if (xOutput) xOutput.textContent = String(x);
    if (yOutput) yOutput.textContent = String(y);
  }
}

function scheduleOverlayPositionSave() {
  clearTimeout(overlayPositionSaveTimer);
  overlayPositionSaveTimer = setTimeout(() => {
    saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch((error) => console.error('Overlay position save failed', error));
  }, 250);
}

function streamerGoalMatchIntelPatchFromForm() {
  return {
    showStreamerMmrGoal: els.showStreamerMmrGoal.checked,
    showStreamerMmrGoalInMenu: els.showStreamerMmrGoalInMenu.checked,
    showStreamerMmrGoalDuringDraft: els.showStreamerMmrGoalDuringDraft.checked,
    showStreamerMmrGoalInGame: els.showStreamerMmrGoalInGame.checked,
    showStreamerMmrGoalProgress: els.showStreamerMmrGoalProgress.checked,
    showStreamerMmrGoalBackground: els.showStreamerMmrGoalBackground.checked,
    showStreamerMmrGoalCurrent: els.showStreamerMmrGoalCurrent.checked,
    showStreamerMmrGoalStart: els.showStreamerMmrGoalStart.checked,
    showStreamerMmrGoalTarget: els.showStreamerMmrGoalTarget.checked,
    showStreamerMmrGoalDelta: els.showStreamerMmrGoalDelta.checked,
    showStreamerMmrGoalRecord: els.showStreamerMmrGoalRecord.checked,
    showStreamerMmrGoalWinRate: els.showStreamerMmrGoalWinRate.checked,
    showStreamerMmrGoalEta: els.showStreamerMmrGoalEta.checked,
    streamerMmrGoalTemplate: els.streamerMmrGoalTemplate.value,
    streamerMmrGoalFillStart: els.streamerMmrGoalFillStart.value,
    streamerMmrGoalFillEnd: els.streamerMmrGoalFillEnd.value,
    streamerMmrGoalTrack: els.streamerMmrGoalTrack.value,
    streamerMmrGoalAccent: els.streamerMmrGoalAccent.value,
    streamerMmrGoalText: els.streamerMmrGoalText.value,
    streamerMmrGoalBarHeight: Number(els.streamerMmrGoalBarHeight.value),
    streamerMmrGoalBarRadius: Number(els.streamerMmrGoalBarRadius.value),
    streamerMmrGoalGlow: Number(els.streamerMmrGoalGlow.value),
    streamerMmrGoalAnimationSpeed: Number(els.streamerMmrGoalAnimationSpeed.value),
    streamerMmrGoalPaddingTop: Number(els.streamerMmrGoalPaddingTop.value),
    streamerMmrGoalPaddingRight: Number(els.streamerMmrGoalPaddingRight.value),
    streamerMmrGoalPaddingBottom: Number(els.streamerMmrGoalPaddingBottom.value),
    streamerMmrGoalPaddingLeft: Number(els.streamerMmrGoalPaddingLeft.value),
    streamerMmrGoalAnimated: els.streamerMmrGoalAnimated.checked,
    streamerMmrGoalStartPrefix: els.streamerMmrGoalStartPrefix.value,
    streamerMmrGoalStartSuffix: els.streamerMmrGoalStartSuffix.value,
    streamerMmrGoalCurrentPrefix: els.streamerMmrGoalCurrentPrefix.value,
    streamerMmrGoalCurrentSuffix: els.streamerMmrGoalCurrentSuffix.value,
    streamerMmrGoalTargetPrefix: els.streamerMmrGoalTargetPrefix.value,
    streamerMmrGoalTargetSuffix: els.streamerMmrGoalTargetSuffix.value,
    streamerMmrGoalDeltaPrefix: els.streamerMmrGoalDeltaPrefix.value,
    streamerMmrGoalDeltaSuffix: els.streamerMmrGoalDeltaSuffix.value,
    streamerMmrGoalCustomCss: els.streamerMmrGoalCustomCss.value,
    streamerAccounts: streamerAccountsFromForm()
  };
}

function applyPendingStreamerGoalMatchIntel(matchIntel) {
  if (!pendingStreamerGoalMatchIntel) return matchIntel;
  return {
    ...matchIntel,
    ...pendingStreamerGoalMatchIntel,
    streamerAccounts: pendingStreamerGoalMatchIntel.streamerAccounts || matchIntel.streamerAccounts
  };
}

function markPendingStreamerGoalMatchIntel() {
  pendingStreamerGoalMatchIntel = streamerGoalMatchIntelPatchFromForm();
  streamerGoalSaveRevision += 1;
  return streamerGoalSaveRevision;
}

function scheduleStreamerGoalSettingsSave(delay = 250) {
  markPendingStreamerGoalMatchIntel();
  clearTimeout(streamerGoalStyleSaveTimer);
  streamerGoalStyleSaveTimer = setTimeout(() => {
    flushStreamerGoalSettingsSave().catch((error) => console.error('Streamer goal settings save failed', error));
  }, delay);
}

async function flushStreamerGoalSettingsSave() {
  const revision = markPendingStreamerGoalMatchIntel();
  clearTimeout(streamerGoalStyleSaveTimer);
  await saveProtection({ matchIntel: protectionMatchIntelFromForm() });
  if (revision === streamerGoalSaveRevision) pendingStreamerGoalMatchIntel = null;
}

function isStreamerMmrGoalPositionKey(key) {
  return key === 'streamerMmrGoalMenu' || key === 'streamerMmrGoalGame';
}

function streamerMmrGoalPreviewBox(settings, key = 'streamerMmrGoalGame') {
  const base = overlayPreviewBoxes[key] || overlayPreviewBoxes.streamerMmrGoalGame;
  const style = streamerMmrGoalStyleFromSettings(settings || {});
  const width = Math.max(
    300,
    base.width
      + style.paddingLeft - streamerMmrGoalStyleDefaults.paddingLeft
      + style.paddingRight - streamerMmrGoalStyleDefaults.paddingRight
  );
  const height = Math.max(
    48,
    base.height
      + style.barHeight - streamerMmrGoalStyleDefaults.barHeight
      + style.paddingTop - streamerMmrGoalStyleDefaults.paddingTop
      + style.paddingBottom - streamerMmrGoalStyleDefaults.paddingBottom
  );
  return { ...base, width, height, visible: { ...base.visible, width, height } };
}

function scheduleStreamerGoalStyleSave() {
  scheduleStreamerGoalSettingsSave(250);
}

function insertStreamerGoalCss(text) {
  const textarea = els.streamerMmrGoalCustomCss;
  if (!textarea || !text) return;
  const currentValue = textarea.value || '';
  const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : currentValue.length;
  const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : start;
  const needsSpacing = currentValue.length > 0 && start > 0 && !currentValue.slice(0, start).endsWith('\n\n');
  const insertText = `${needsSpacing ? '\n\n' : ''}${text}`;
  textarea.value = `${currentValue.slice(0, start)}${insertText}${currentValue.slice(end)}`;
  const cursor = start + insertText.length;
  textarea.focus();
  textarea.setSelectionRange(cursor, cursor);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateStreamerGoalStyleOutputs() {
  if (els.streamerMmrGoalBarHeightValue) els.streamerMmrGoalBarHeightValue.textContent = String(els.streamerMmrGoalBarHeight?.value || streamerMmrGoalStyleDefaults.barHeight);
  if (els.streamerMmrGoalBarRadiusValue) els.streamerMmrGoalBarRadiusValue.textContent = String(els.streamerMmrGoalBarRadius?.value || streamerMmrGoalStyleDefaults.barRadius);
  if (els.streamerMmrGoalGlowValue) els.streamerMmrGoalGlowValue.textContent = String(els.streamerMmrGoalGlow?.value || streamerMmrGoalStyleDefaults.glow);
  if (els.streamerMmrGoalAnimationSpeedValue) {
    const speed = clampGoalNumber(els.streamerMmrGoalAnimationSpeed?.value, 0.25, 3, streamerMmrGoalStyleDefaults.animationSpeed);
    els.streamerMmrGoalAnimationSpeedValue.textContent = `${Number(speed.toFixed(2))}x`;
  }
  [
    ['PaddingTop', 'paddingTop'],
    ['PaddingRight', 'paddingRight'],
    ['PaddingBottom', 'paddingBottom'],
    ['PaddingLeft', 'paddingLeft']
  ].forEach(([elementKey, defaultKey]) => {
    const output = els[`streamerMmrGoal${elementKey}Value`];
    const input = els[`streamerMmrGoal${elementKey}`];
    if (output) output.textContent = `${input?.value || streamerMmrGoalStyleDefaults[defaultKey]}px`;
  });
}

function countryFlagEmoji(code) {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return '';
  return [...normalized].map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
}

async function saveProtection(patch) {
  await api('/api/protection', patch);
}

els.autoDraft.addEventListener('change', () => saveProtection({ autoDraft: els.autoDraft.checked }).catch(alert));
els.autoMinimap.addEventListener('change', () => saveProtection({ autoMinimap: els.autoMinimap.checked }).catch(alert));
els.autoQueue.addEventListener('change', () => saveProtection({ autoQueue: els.autoQueue.checked }).catch(alert));
els.queueAutoMode.addEventListener('change', () => saveProtection({ queueAutoMode: els.queueAutoMode.value }).catch(alert));
els.draftHideMode.addEventListener('change', () => saveProtection({ draftHideMode: els.draftHideMode.value }).catch(alert));
els.minimapSize.addEventListener('change', () => saveProtection({ minimapSize: els.minimapSize.value }).catch(alert));
els.minimapSide.addEventListener('change', () => saveProtection({ minimapSide: els.minimapSide.value }).catch(alert));
els.minimapStyle.addEventListener('change', () => saveProtection({ minimapStyle: els.minimapStyle.value }).catch(alert));
els.queueMode.addEventListener('change', () => saveProtection({ queueMode: els.queueMode.value }).catch(alert));
els.matchIntelEnabled.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});
els.showPlayerRanks.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});
els.showPlayerFlags.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});
els.showAegisTimer.addEventListener('change', () => saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert));
els.showRoshanTimer.addEventListener('change', () => saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert));
els.rankDisplayMode.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});
els.rankDisplayMinutes.addEventListener('change', () => saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert));
[
  els.spectatorMatchIntelEnabled,
  els.spectatorGameLabelEnabled,
  els.spectatorShowPlayerRanks,
  els.spectatorShowPlayerFlags,
  els.spectatorShowAegisTimer,
  els.spectatorShowRoshanTimer,
  els.spectatorRankDisplayMode
].filter(Boolean).forEach((input) => input.addEventListener('change', () => {
  updateSpectatorMatchIntelFieldVisibility();
  saveProtection({ spectatorMatchIntel: spectatorMatchIntelConfigFromForm() }).catch(alert);
}));
els.spectatorRankDisplayMinutes?.addEventListener('change', () => saveProtection({ spectatorMatchIntel: spectatorMatchIntelConfigFromForm() }).catch(alert));
els.spectatorGameLabelTemplate?.addEventListener('change', () => saveProtection({ spectatorMatchIntel: spectatorMatchIntelConfigFromForm() }).catch(alert));
[
  els.showStreamerStats,
  els.showStreamerRankMedal,
  els.showStreamerMmr,
  els.showStreamerWinLoss,
  els.streamerWinLossMenuPosition,
  els.streamerWinLossGamePosition,
  els.hideStreamerStatsDuringDraft,
  els.streamerMedalSource,
  els.autoUpdateStreamerMmr,
  els.menuMmrOcrEnabled
].forEach((input) => input?.addEventListener('change', () => {
  if (input === els.streamerMedalSource) markStreamerSettingsAccountInteraction();
  updateMatchIntelFieldVisibility();
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, protectionMatchIntelFromForm(), activeStreamerSettingsAccountId);
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
}));

els.pickMenuMmrOcrRegion?.addEventListener('click', () => {
  pickMenuMmrOcrRegion().catch(alert);
});

els.saveMenuMmrOcrRegion?.addEventListener('click', () => {
  saveMenuMmrOcrRegion().catch(alert);
});

els.clearMenuMmrOcrRegion?.addEventListener('click', () => {
  clearMenuMmrOcrRegion().catch(alert);
});

[
  els.showStreamerMmrGoal,
  els.showStreamerMmrGoalInMenu,
  els.showStreamerMmrGoalDuringDraft,
  els.showStreamerMmrGoalInGame,
  els.showStreamerMmrGoalProgress,
  els.showStreamerMmrGoalBackground,
  els.showStreamerMmrGoalCurrent,
  els.showStreamerMmrGoalStart,
  els.showStreamerMmrGoalTarget,
  els.showStreamerMmrGoalDelta,
  els.showStreamerMmrGoalRecord,
  els.showStreamerMmrGoalWinRate,
  els.showStreamerMmrGoalEta
].forEach((input) => input?.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, protectionMatchIntelFromForm(), activeStreamerSettingsAccountId);
  flushStreamerGoalSettingsSave().catch(alert);
}));

[
  els.streamerMmrGoalTemplate,
  els.streamerMmrGoalFillStart,
  els.streamerMmrGoalFillEnd,
  els.streamerMmrGoalTrack,
  els.streamerMmrGoalAccent,
  els.streamerMmrGoalText,
  els.streamerMmrGoalBarHeight,
  els.streamerMmrGoalBarRadius,
  els.streamerMmrGoalGlow,
  els.streamerMmrGoalAnimationSpeed,
  els.streamerMmrGoalPaddingTop,
  els.streamerMmrGoalPaddingRight,
  els.streamerMmrGoalPaddingBottom,
  els.streamerMmrGoalPaddingLeft,
  els.streamerMmrGoalAnimated,
  els.streamerMmrGoalStartPrefix,
  els.streamerMmrGoalStartSuffix,
  els.streamerMmrGoalCurrentPrefix,
  els.streamerMmrGoalCurrentSuffix,
  els.streamerMmrGoalTargetPrefix,
  els.streamerMmrGoalTargetSuffix,
  els.streamerMmrGoalDeltaPrefix,
  els.streamerMmrGoalDeltaSuffix,
  els.streamerMmrGoalCustomCss
].forEach((input) => {
  input?.addEventListener('input', () => {
    updateStreamerGoalStyleOutputs();
    renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, protectionMatchIntelFromForm(), activeStreamerSettingsAccountId);
    scheduleStreamerGoalStyleSave();
  });
  input?.addEventListener('change', () => {
    updateStreamerGoalStyleOutputs();
    renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, protectionMatchIntelFromForm(), activeStreamerSettingsAccountId);
    flushStreamerGoalSettingsSave().catch(alert);
  });
});
els.streamerGoalCssInsertButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    const selector = button.dataset.goalCssInsert;
    if (!selector) return;
    insertStreamerGoalCss(`${selector} {\n  \n}`);
  });
});
els.streamerGoalCssSnippetButtons?.forEach((button) => {
  button.addEventListener('click', () => {
    const snippet = streamerGoalCssSnippets[button.dataset.goalCssSnippet];
    if (snippet) insertStreamerGoalCss(snippet);
  });
});
els.streamerSettingsAccount.addEventListener('change', () => {
  markStreamerSettingsAccountInteraction(els.streamerSettingsAccount.value || '');
  const matchIntel = snapshot?.config?.protection?.matchIntel || {};
  const stats = snapshot?.state?.streamerStats || {};
  setInputValue(els.streamerMmr, streamerMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  setInputValue(els.streamerGoalMmr, streamerGoalMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  setInputValue(els.streamerGoalStartMmr, streamerGoalStartMmrForSettingsAccount(matchIntel, activeStreamerSettingsAccountId));
  renderStreamerStatsPreview(stats, matchIntel, activeStreamerSettingsAccountId);
  renderStreamerGoalPreview(stats, matchIntel, activeStreamerSettingsAccountId);
  renderStreamerAccounts(matchIntel.streamerAccounts || [], stats, activeStreamerSettingsAccountId);
  updateStreamerGoalResetButton(activeStreamerSettingsAccountId);
});
els.streamerMmr.addEventListener('input', () => {
  markStreamerSettingsAccountInteraction();
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, snapshot?.config?.protection?.matchIntel || {}, activeStreamerSettingsAccountId);
});
els.streamerMmr.addEventListener('change', () => {
  markStreamerSettingsAccountInteraction();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});
els.streamerGoalMmr.addEventListener('input', () => {
  markStreamerSettingsAccountInteraction();
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, snapshot?.config?.protection?.matchIntel || {}, activeStreamerSettingsAccountId);
  scheduleStreamerGoalSettingsSave();
});
els.streamerGoalMmr.addEventListener('change', () => {
  markStreamerSettingsAccountInteraction();
  flushStreamerGoalSettingsSave().catch(alert);
});
els.streamerGoalStartMmr.addEventListener('input', () => {
  markStreamerSettingsAccountInteraction();
  renderStreamerGoalPreview(snapshot?.state?.streamerStats || {}, snapshot?.config?.protection?.matchIntel || {}, activeStreamerSettingsAccountId);
  scheduleStreamerGoalSettingsSave();
});
els.streamerGoalStartMmr.addEventListener('change', () => {
  markStreamerSettingsAccountInteraction();
  flushStreamerGoalSettingsSave().catch(alert);
});
[els.streamerMmrWinDelta, els.streamerMmrLossDelta].forEach((input) => {
  input.addEventListener('change', () => saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert));
});
[
  els.streamerAccountId,
  els.streamerAccountLabel,
  els.streamerAccountMmr
].forEach((input) => input.addEventListener('input', () => {
  markStreamerSettingsAccountInteraction(editingStreamerAccountId || activeStreamerSettingsAccountId);
}));
els.pageTabs.forEach((tab) => {
  tab.addEventListener('click', () => setActivePage(tab.dataset.pageTarget));
});
els.addNotablePlayer.addEventListener('click', addCustomNotablePlayer);
els.cancelNotablePlayerEdit.addEventListener('click', resetNotablePlayerEditor);
els.addStreamerAccount.addEventListener('click', addStreamerAccount);
els.cancelStreamerAccountEdit.addEventListener('click', resetStreamerAccountEditor);
els.streamerAccountRows.addEventListener('click', (event) => {
  const row = event.target.closest('.streamer-account-row');
  if (!row) return;
  if (event.target.matches('[data-action="edit-streamer-account"]')) {
    editStreamerAccount(row);
    return;
  }
  if (event.target.matches('[data-action="remove-streamer-account"]')) {
    if (row.dataset.accountId === editingStreamerAccountId) resetStreamerAccountEditor();
    row.remove();
    saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
  }
});
els.customNotablePlayersRows.addEventListener('click', (event) => {
  const row = event.target.closest('.notable-player-row');
  if (!row) return;
  if (event.target.matches('[data-action="edit-notable-player"]')) {
    editCustomNotablePlayer(row);
    return;
  }
  if (event.target.matches('[data-action="remove-notable-player"]')) {
    if (row.dataset.accountId === editingNotablePlayerAccountId) resetNotablePlayerEditor();
    row.remove();
    saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
  }
});
els.manualDraft.addEventListener('click', () => saveProtection({ manualDraft: nextManualProtectionState('manualDraft', 'draft') }).catch(alert));
els.manualMinimap.addEventListener('click', () => saveProtection({ manualMinimap: nextManualProtectionState('manualMinimap', 'minimap') }).catch(alert));
els.manualTopBar.addEventListener('click', () => saveProtection({ manualTopBar: nextManualProtectionState('manualTopBar', 'topBar') }).catch(alert));
els.manualQueue.addEventListener('click', () => saveProtection({ manualQueue: nextManualProtectionState('manualQueue', 'queue') }).catch(alert));
els.resetStreamerStats.addEventListener('click', () => api('/api/streamer-stats/reset', {}).catch(alert));
els.resetStreamerGoalRecord.addEventListener('click', () => resetStreamerGoalRecordForSelectedAccount().catch(alert));
els.restoreStreamerStats.addEventListener('click', () => api('/api/streamer-stats/restore', {}).catch(alert));
els.overlayPreviewBackground.addEventListener('change', () => {
  localStorage.setItem('dsk.overlayPreviewBackground', els.overlayPreviewBackground.value);
  renderOverlayPositionPreviews();
});
els.overlayPositionTarget.addEventListener('change', () => {
  activeOverlayPositionKey = overlayPositionKeys.includes(els.overlayPositionTarget.value)
    ? els.overlayPositionTarget.value
    : 'streamerStatsGame';
  localStorage.setItem('dsk.overlayPositionTarget', activeOverlayPositionKey);
  renderOverlayPositionPreviews();
});
for (const key of overlayPositionKeys) {
  for (const axis of ['X', 'Y']) {
    const input = els[`${key}${axis}`];
    input?.addEventListener('input', () => {
      renderOverlayPositionPreviews();
      scheduleOverlayPositionSave();
    });
    input?.addEventListener('change', () => {
      renderOverlayPositionPreviews();
      saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
    });
  }
}
document.querySelectorAll('[data-reset-position]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.resetPosition;
    if (!overlayPositionKeys.includes(key)) return;
    const box = overlayPreviewBoxes[key] || { left: 0, top: 0 };
    const base = overlayVisualBase(box);
    els[`${key}X`].value = String(base.left);
    els[`${key}Y`].value = String(base.top);
    renderOverlayPositionPreviews();
    saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
  });
});
els.resetAllOverlayPositions.addEventListener('click', () => {
  for (const key of overlayPositionKeys) {
    const box = overlayPreviewBoxes[key] || { left: 0, top: 0 };
    const base = overlayVisualBase(box);
    if (els[`${key}X`]) els[`${key}X`].value = String(base.left);
    if (els[`${key}Y`]) els[`${key}Y`].value = String(base.top);
  }
  renderOverlayPositionPreviews();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
});

function protectionMatchIntelFromForm() {
  const selectedAccountId = String(activeStreamerSettingsAccountId || '').trim();
  const selectedAccountIsBound = selectedAccountId
    && Boolean(els.streamerAccountRows.querySelector(`.streamer-account-row[data-account-id="${CSS.escape(selectedAccountId)}"]`));
  const fallbackStreamerMmr = selectedAccountIsBound
    ? Number(snapshot?.config?.protection?.matchIntel?.streamerMmr || 0)
    : Number(els.streamerMmr.value);
  return {
    enabled: els.matchIntelEnabled.checked,
    showPlayerRanks: els.showPlayerRanks.checked,
    showPlayerFlags: els.showPlayerFlags.checked,
    showAegisTimer: els.showAegisTimer.checked,
    showRoshanTimer: els.showRoshanTimer.checked,
    rankDisplayMode: els.rankDisplayMode.value,
    rankDisplayMinutes: Number(els.rankDisplayMinutes.value),
    showStreamerStats: els.showStreamerStats.checked,
    showStreamerRankMedal: els.showStreamerRankMedal.checked,
    showStreamerMmr: els.showStreamerMmr.checked,
    showStreamerWinLoss: els.showStreamerWinLoss.checked,
    streamerWinLossPosition: els.streamerWinLossMenuPosition.value,
    streamerWinLossMenuPosition: els.streamerWinLossMenuPosition.value,
    streamerWinLossGamePosition: els.streamerWinLossGamePosition.value,
    hideStreamerStatsDuringDraft: els.hideStreamerStatsDuringDraft.checked,
    showStreamerMmrGoal: els.showStreamerMmrGoal.checked,
    showStreamerMmrGoalInMenu: els.showStreamerMmrGoalInMenu.checked,
    showStreamerMmrGoalDuringDraft: els.showStreamerMmrGoalDuringDraft.checked,
    showStreamerMmrGoalInGame: els.showStreamerMmrGoalInGame.checked,
    showStreamerMmrGoalProgress: els.showStreamerMmrGoalProgress.checked,
    showStreamerMmrGoalCurrent: els.showStreamerMmrGoalCurrent.checked,
    showStreamerMmrGoalStart: els.showStreamerMmrGoalStart.checked,
    showStreamerMmrGoalTarget: els.showStreamerMmrGoalTarget.checked,
    showStreamerMmrGoalRecord: els.showStreamerMmrGoalRecord.checked,
    showStreamerMmrGoalWinRate: els.showStreamerMmrGoalWinRate.checked,
    showStreamerMmrGoalEta: els.showStreamerMmrGoalEta.checked,
    showStreamerMmrGoalBackground: els.showStreamerMmrGoalBackground.checked,
    showStreamerMmrGoalDelta: els.showStreamerMmrGoalDelta.checked,
    streamerMmrGoalTemplate: els.streamerMmrGoalTemplate.value,
    streamerMmrGoalFillStart: els.streamerMmrGoalFillStart.value,
    streamerMmrGoalFillEnd: els.streamerMmrGoalFillEnd.value,
    streamerMmrGoalTrack: els.streamerMmrGoalTrack.value,
    streamerMmrGoalAccent: els.streamerMmrGoalAccent.value,
    streamerMmrGoalText: els.streamerMmrGoalText.value,
    streamerMmrGoalBarHeight: Number(els.streamerMmrGoalBarHeight.value),
    streamerMmrGoalBarRadius: Number(els.streamerMmrGoalBarRadius.value),
    streamerMmrGoalGlow: Number(els.streamerMmrGoalGlow.value),
    streamerMmrGoalAnimationSpeed: Number(els.streamerMmrGoalAnimationSpeed.value),
    streamerMmrGoalPaddingTop: Number(els.streamerMmrGoalPaddingTop.value),
    streamerMmrGoalPaddingRight: Number(els.streamerMmrGoalPaddingRight.value),
    streamerMmrGoalPaddingBottom: Number(els.streamerMmrGoalPaddingBottom.value),
    streamerMmrGoalPaddingLeft: Number(els.streamerMmrGoalPaddingLeft.value),
    streamerMmrGoalAnimated: els.streamerMmrGoalAnimated.checked,
    streamerMmrGoalStartPrefix: els.streamerMmrGoalStartPrefix.value,
    streamerMmrGoalStartSuffix: els.streamerMmrGoalStartSuffix.value,
    streamerMmrGoalCurrentPrefix: els.streamerMmrGoalCurrentPrefix.value,
    streamerMmrGoalCurrentSuffix: els.streamerMmrGoalCurrentSuffix.value,
    streamerMmrGoalTargetPrefix: els.streamerMmrGoalTargetPrefix.value,
    streamerMmrGoalTargetSuffix: els.streamerMmrGoalTargetSuffix.value,
    streamerMmrGoalDeltaPrefix: els.streamerMmrGoalDeltaPrefix.value,
    streamerMmrGoalDeltaSuffix: els.streamerMmrGoalDeltaSuffix.value,
    streamerMmrGoalCustomCss: els.streamerMmrGoalCustomCss.value,
    streamerMedalSource: els.streamerMedalSource.value,
    streamerMmr: fallbackStreamerMmr,
    streamerGoalMmr: selectedAccountIsBound
      ? Number(snapshot?.config?.protection?.matchIntel?.streamerGoalMmr || 0)
      : Number(els.streamerGoalMmr.value),
    streamerGoalStartMmr: selectedAccountIsBound
      ? Number(snapshot?.config?.protection?.matchIntel?.streamerGoalStartMmr || 0)
      : Number(els.streamerGoalStartMmr.value),
    autoUpdateStreamerMmr: els.autoUpdateStreamerMmr.checked,
    menuMmrOcrEnabled: els.menuMmrOcrEnabled?.checked === true,
    autoBindStreamerAccounts: true,
    streamerMmrWinDelta: Number(els.streamerMmrWinDelta.value),
    streamerMmrLossDelta: Number(els.streamerMmrLossDelta.value),
    overlayPositions: overlayPositionsFromForm(),
    streamerAccounts: streamerAccountsFromForm(),
    customPlayers: customNotablePlayersFromForm()
  };
}

function updateMatchIntelFieldVisibility() {
  const matchIntelEnabled = els.matchIntelEnabled.checked;
  const notablePlayersEnabled = matchIntelEnabled && (els.showPlayerRanks.checked || els.showPlayerFlags.checked);
  const streamerStatsEnabled = els.showStreamerStats.checked;
  const streamerGoalEnabled = streamerStatsEnabled && els.showStreamerMmrGoal.checked;
  els.showPlayerRanks.closest('label').hidden = !matchIntelEnabled;
  els.showPlayerFlags.closest('label').hidden = !matchIntelEnabled;
  els.showAegisTimer.closest('label').hidden = !matchIntelEnabled;
  els.showRoshanTimer.closest('label').hidden = !matchIntelEnabled;
  els.rankDisplayModeWrap.hidden = !notablePlayersEnabled;
  els.rankDisplayMinutesWrap.hidden = !notablePlayersEnabled || ['full_game', 'pre_game_only'].includes(els.rankDisplayMode.value);
  els.streamerStatsWrap.hidden = false;
  els.showStreamerRankMedal.closest('label').hidden = !streamerStatsEnabled;
  els.showStreamerMmr.closest('label').hidden = !streamerStatsEnabled;
  els.showStreamerWinLoss.closest('label').hidden = !streamerStatsEnabled;
  els.streamerWinLossMenuPositionWrap.hidden = !streamerStatsEnabled || !els.showStreamerWinLoss.checked;
  els.streamerWinLossGamePositionWrap.hidden = !streamerStatsEnabled || !els.showStreamerWinLoss.checked;
  els.hideStreamerStatsDuringDraft.closest('label').hidden = !streamerStatsEnabled;
  els.showStreamerMmrGoal.closest('label').hidden = !streamerStatsEnabled;
  els.showStreamerMmrGoalInMenu.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalDuringDraft.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalInGame.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalProgress.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalBackground.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalCurrent.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalStart.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalTarget.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalDelta.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalRecord.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalWinRate.closest('label').hidden = !streamerGoalEnabled;
  els.showStreamerMmrGoalEta.closest('label').hidden = !streamerGoalEnabled;
  els.resetStreamerGoalRecord.hidden = !streamerGoalEnabled;
  updateStreamerGoalResetButton(activeStreamerSettingsAccountId);
  [
    els.streamerMmrGoalTemplateWrap,
    els.streamerMmrGoalFillStartWrap,
    els.streamerMmrGoalFillEndWrap,
    els.streamerMmrGoalTrackWrap,
    els.streamerMmrGoalAccentWrap,
    els.streamerMmrGoalTextWrap,
    els.streamerMmrGoalBarHeightWrap,
    els.streamerMmrGoalBarRadiusWrap,
    els.streamerMmrGoalGlowWrap,
    els.streamerMmrGoalAnimationSpeedWrap,
    els.streamerMmrGoalPaddingTopWrap,
    els.streamerMmrGoalPaddingRightWrap,
    els.streamerMmrGoalPaddingBottomWrap,
    els.streamerMmrGoalPaddingLeftWrap,
    els.streamerMmrGoalAnimated?.closest('label'),
    els.streamerMmrGoalStartPrefixWrap,
    els.streamerMmrGoalStartSuffixWrap,
    els.streamerMmrGoalCurrentPrefixWrap,
    els.streamerMmrGoalCurrentSuffixWrap,
    els.streamerMmrGoalTargetPrefixWrap,
    els.streamerMmrGoalTargetSuffixWrap,
    els.streamerMmrGoalDeltaPrefixWrap,
    els.streamerMmrGoalDeltaSuffixWrap,
    els.streamerMmrGoalCustomCssWrap,
    els.streamerGoalCssTools
  ].forEach((element) => {
    if (element) element.hidden = !streamerGoalEnabled;
  });
  els.streamerMedalSourceWrap.hidden = !streamerStatsEnabled || !els.showStreamerRankMedal.checked;
  els.streamerMmrWrap.hidden = false;
  els.streamerGoalWrap.hidden = false;
  els.autoUpdateStreamerMmr.closest('label').hidden = false;
  els.streamerMmrWinDeltaWrap.hidden = !els.autoUpdateStreamerMmr.checked;
  els.streamerMmrLossDeltaWrap.hidden = !els.autoUpdateStreamerMmr.checked;
  els.streamerStatsStatus.hidden = !streamerStatsEnabled;
  els.resetStreamerStats.hidden = !streamerStatsEnabled;
  els.restoreStreamerStats.hidden = !streamerStatsEnabled;
  els.overlayPositionWrap.hidden = false;
  els.customNotablePlayersWrap.hidden = !notablePlayersEnabled;
}

function nextManualProtectionState(configKey, stateKey) {
  const manualEnabled = Boolean(snapshot?.config?.protection?.[configKey]);
  const effectiveEnabled = Boolean(snapshot?.state?.protection?.[stateKey]);
  if (manualEnabled) return false;
  if (effectiveEnabled) return false;
  return true;
}

els.clientId.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.deploymentMode.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.publicBaseUrl.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.twitchChannelMode.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.targetChannelLogin.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('blur', () => {
  els.clientSecret.value = '';
});
els.dotaPath.addEventListener('change', () => saveDotaConfig().catch(alert));
els.languageSelect.addEventListener('change', () => {
  currentLanguageSetting = els.languageSelect.value;
  currentLang = resolveLanguage(currentLanguageSetting);
  applyLanguage({ ui: { language: currentLanguageSetting } });
  predictionProfiles().forEach((profile) => renderPredictionTypePreviews(profile));
  saveUiConfig().catch(alert);
});

async function saveUiConfig() {
  await api('/api/config', {
    ui: {
      language: els.languageSelect.value
    }
  });
}

async function saveTwitchAppConfig() {
  await api('/api/config', {
    deployment: {
      mode: els.deploymentMode.value,
      publicBaseUrl: els.publicBaseUrl.value.trim()
    },
    twitch: {
      clientId: els.clientId.value.trim(),
      clientSecret: els.clientSecret.value.trim() || '********',
      channelMode: els.twitchChannelMode.value,
      targetChannelLogin: els.targetChannelLogin.value.trim()
    }
  });
}

async function saveDotaConfig() {
  await api('/api/config', {
    dota: {
      installPath: els.dotaPath.value.trim()
    }
  });
}

els.logoutTwitch.addEventListener('click', () => api('/api/twitch/logout').catch(alert));
els.resolveTwitchChannel.addEventListener('click', () => api('/api/twitch/resolve-channel', {
  login: els.targetChannelLogin.value.trim()
}).then((result) => {
  els.targetChannelLogin.value = result.user.login;
  alert(`${t('channelFound')} ${result.user.displayName} (${result.user.id})`);
}).catch(alert));

for (const profile of predictionProfiles()) {
  const ctx = predictionEditor(profile);
  ctx.form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await savePredictionConfig(profile).catch(alert);
  });
  ctx.typeForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await savePredictionConfig(profile).catch(alert);
  });
  ctx.customForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const template = customTemplateFromBuilder(profile);
      const config = predictionConfigFromForm(profile);
      config.customTemplates = [...config.customTemplates, template];
      config.selectedType = template.id;
      config.selectionMode = 'selected';
      await api('/api/config', { [ctx.configKey]: config });
      resetCustomBuilder(profile);
      alert(t('customTemplateSaved'));
    } catch (error) {
      alert(error);
    }
  });
}
document.addEventListener('focusin', (event) => rememberTemplateInput(event.target));
document.addEventListener('input', (event) => {
  if (event.target.closest?.('#predictionForm, #predictionTypeForm, #predictionTypes, #spectatorPredictionForm, #spectatorPredictionTypeForm, #spectatorPredictionTypes')) {
    const profile = predictionProfileFromElement(event.target);
    const card = event.target.closest('.prediction-type');
    if (card) updateCustomConditionFieldVisibility(card);
    renderPredictionTypePreviews(profile);
  }
});
document.addEventListener('change', (event) => {
  if (event.target.closest?.('#predictionForm, #predictionTypeForm, #predictionTypes, #spectatorPredictionForm, #spectatorPredictionTypeForm, #spectatorPredictionTypes')) {
    const profile = predictionProfileFromElement(event.target);
    const card = event.target.closest('.prediction-type');
    if (card) updateCustomConditionFieldVisibility(card);
    renderPredictionTypePreviews(profile);
    schedulePredictionConfigSave(profile);
  }
});
document.addEventListener('click', (event) => {
  const deleteButton = event.target.closest?.('[data-delete-template]');
  if (!deleteButton) return;
  const card = deleteButton.closest('.prediction-type');
  if (card?.dataset.type) removeCustomTemplate(card.dataset.type, predictionProfileFromElement(card));
});
for (const profile of predictionProfiles()) {
  const ctx = predictionEditor(profile);
  ctx.selectedType?.addEventListener('change', () => {
    renderPredictionTypeVisibility(profile);
    renderPredictionTypePreviews(profile);
    schedulePredictionConfigSave(profile);
  });
  ctx.selectionMode?.addEventListener('change', () => {
    renderPredictionTypeVisibility(profile);
    renderPredictionTypePreviews(profile);
    schedulePredictionConfigSave(profile);
  });
  ctx.forceStreamOnline?.addEventListener('change', () => {
    ctx.forceStreamOnlineHint.hidden = !ctx.forceStreamOnline.checked;
    schedulePredictionConfigSave(profile);
  });
  ctx.cancelUncontestedPrediction?.addEventListener('change', () => {
    ctx.cancelUncontestedHint.hidden = !ctx.cancelUncontestedPrediction.checked;
    schedulePredictionConfigSave(profile);
  });
  ctx.customCondition?.addEventListener('change', () => updateCustomBuilderFieldVisibilityForProfile(profile));
}
els.variableChips.forEach((button) => {
  button.addEventListener('click', () => insertVariable(button.dataset.var));
});

async function savePredictionConfig(profile = 'own') {
  const ctx = predictionEditor(profile);
  clearTimeout(predictionConfigSaveTimers[ctx.profile]);
  predictionConfigSaveTimers[ctx.profile] = null;
  predictionConfigSaveTimer = null;
  await api('/api/config', { [ctx.configKey]: predictionConfigFromForm(ctx.profile) });
}

function schedulePredictionConfigSave(profile = 'own') {
  const ctx = predictionEditor(profile);
  clearTimeout(predictionConfigSaveTimers[ctx.profile]);
  predictionConfigSaveTimers[ctx.profile] = setTimeout(() => {
    savePredictionConfig(ctx.profile).catch((error) => console.error('Prediction config autosave failed', error));
  }, 300);
}

function predictionConfigFromForm(profile = 'own') {
  const ctx = predictionEditor(profile);
  return {
    windowSeconds: Number(ctx.predictionWindow.value),
    autoCreate: ctx.autoCreate.checked,
    forceStreamOnline: ctx.forceStreamOnline.checked,
    autoResolve: ctx.autoResolve.checked,
    cancelUncontestedPrediction: ctx.cancelUncontestedPrediction.checked,
    autoCancelInvalidGame: ctx.autoCancelInvalidGame.checked,
    selectionMode: ctx.selectionMode.value,
    selectedType: ctx.selectedType.value,
    types: collectPredictionTypes(ctx.profile),
    customTemplates: collectCustomPredictionTemplates(ctx.profile)
  };
}

els.createPrediction.addEventListener('click', async () => {
  try {
    await savePredictionConfig('own');
    await api('/api/twitch/predictions', {});
  } catch (error) {
    alert(error);
  }
});
els.spectatorCreatePrediction?.addEventListener('click', async () => {
  try {
    await savePredictionConfig('spectator');
    await api('/api/twitch/predictions', { profile: 'spectator' });
  } catch (error) {
    alert(error);
  }
});

els.lockPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/lock`).catch(alert)));
els.cancelPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/cancel`).catch(alert)));
els.resolveWin.addEventListener('click', () => resolveKind('win'));
els.resolveLose.addEventListener('click', () => resolveKind('lose'));
els.spectatorLockPrediction?.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/lock`).catch(alert)));
els.spectatorCancelPrediction?.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/cancel`).catch(alert)));
els.spectatorResolveWin?.addEventListener('click', () => resolveKind('win'));
els.spectatorResolveLose?.addEventListener('click', () => resolveKind('lose'));
els.detectDota.addEventListener('click', () => detectDota().catch(alert));
els.installGsi.addEventListener('click', () => api('/api/install-gsi', {
  dotaPath: els.dotaPath.value.trim()
}).then((result) => {
  els.dotaPath.value = result.dotaPath || els.dotaPath.value;
  alert(`${t('gsiInstalled')}\n${result.cfgPath}\n\n${t('restartDota')}`);
}).catch(alert));
els.autoInstallUpdates.addEventListener('change', saveUpdateSettings);
els.checkUpdates.addEventListener('click', () => checkUpdates(true).catch(alert));
els.installUpdate.addEventListener('click', () => installUpdate().catch(alert));
els.appVersion?.addEventListener('click', (event) => {
  if (event.target?.closest('[data-install-update-inline]')) installUpdate().catch(alert);
});
els.updateStatus?.addEventListener('click', (event) => {
  if (event.target?.closest('[data-install-update-inline]')) installUpdate().catch(alert);
});
els.backupAll.addEventListener('change', syncBackupSectionToggles);
els.backupSections.addEventListener('change', () => {
  const selected = selectedBackupSections();
  els.backupAll.checked = selected.length === backupSectionInputs().length;
});
els.exportBackup.addEventListener('click', () => exportBackup().catch(alert));
els.importBackupFile.addEventListener('change', () => importBackup().catch(alert));
els.draftScreenshotAsset.addEventListener('change', () => uploadAsset('draft-screenshot.png', els.draftScreenshotAsset.files[0]).catch(alert));
els.queueScreenshotAsset.addEventListener('change', () => uploadAsset('queue-screenshot.png', els.queueScreenshotAsset.files[0]).catch(alert));

async function detectDota() {
  const result = await api('/api/dota/detect', null, 'GET');
  els.dotaPath.value = result.dotaPath || '';
  alert(`${t('dotaFound')}\n${result.dotaPath}`);
}

async function saveUpdateSettings() {
  await api('/api/config', {
    updates: {
      autoCheck: true,
      autoInstall: els.autoInstallUpdates.checked
    }
  });
}

async function checkUpdates(manual = false) {
  els.updateStatus.dataset.custom = 'true';
  els.updateStatus.textContent = t('updateChecking');
  const status = await api('/api/updates/check', null, 'GET');
  latestUpdateStatus = status;
  els.installUpdate.disabled = !status.updateAvailable;
  renderUpdateStatusText(status);
  if (status.updateAvailable && els.autoInstallUpdates.checked && !manual) {
    await installUpdate();
  }
  return status;
}

async function installUpdate() {
  if (!latestUpdateStatus) await checkUpdates(true);
  if (!latestUpdateStatus?.updateAvailable) return;
  const result = await api('/api/updates/install', { release: latestUpdateStatus });
  els.updateStatus.textContent = result.message || t('updateStarted');
  els.installUpdate.disabled = true;
  document.querySelectorAll('[data-install-update-inline]').forEach((button) => {
    button.disabled = true;
  });
}

function backupSectionInputs() {
  return [...els.backupSections.querySelectorAll('[data-backup-section]')];
}

function selectedBackupSections() {
  return backupSectionInputs()
    .filter((input) => input.checked)
    .map((input) => input.dataset.backupSection);
}

function syncBackupSectionToggles() {
  for (const input of backupSectionInputs()) input.checked = els.backupAll.checked;
}

async function exportBackup() {
  const sections = selectedBackupSections();
  if (!sections.length) return alert(t('backupHelp'));
  const response = await fetch(`/api/backup/export?sections=${encodeURIComponent(sections.join(','))}`);
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.error || `HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DotaStreamKit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  els.backupStatus.dataset.custom = 'true';
  els.backupStatus.textContent = t('backupExported');
}

async function importBackup() {
  const file = els.importBackupFile.files?.[0];
  if (!file) return;
  const backup = JSON.parse(await file.text());
  const sections = selectedBackupSections();
  if (!sections.length) return alert(t('backupHelp'));
  await api('/api/backup/import', { backup, sections });
  els.importBackupFile.value = '';
  els.backupStatus.dataset.custom = 'true';
  els.backupStatus.textContent = t('backupImported');
}

function withPrediction(fn) {
  const prediction = snapshot?.state?.activePrediction;
  if (!prediction) return alert(t('noActivePredictionAlert'));
  return fn(prediction);
}

function resolveKind(kind) {
  return withPrediction((prediction) => {
    const wanted = kind === 'win' ? 'yes' : kind === 'lose' ? 'no' : kind;
    const outcome = prediction.outcomes.find((item) => item.kind === wanted || item.kind === kind);
    if (!outcome) return alert(t('noOutcomeAlert'));
    return api(`/api/twitch/predictions/${prediction.id}/resolve`, { winningOutcomeId: outcome.id }).catch(alert);
  });
}

let assetRefresh = 0;

async function refreshAssets() {
  const now = Date.now();
  if (now - assetRefresh < 2000) return;
  assetRefresh = now;
  const status = await fetch('/api/assets').then((res) => res.json()).catch(() => null);
  if (!status) return;
  const slots = Array.from({ length: 10 }, (_, index) => status[`topbar-slot-${index}.png`]).filter((item) => item?.exists);
  const full = formatAssetStatus(status['draft-screenshot.png']);
  const minimap = formatAssetStatus(status['fake-minimap-vision-realistic.png']);
  const queue = formatAssetStatus(status['queue-screenshot.png']);
  const slotBytes = slots.reduce((sum, item) => sum + item.bytes, 0);
  els.assetStatus.textContent = `${t('assetSlots')}: ${slots.length}/10, ${Math.round(slotBytes / 1024)} KB | ${t('assetDraft')}: ${full} | ${t('assetQueue')}: ${queue} | ${t('assetMinimap')}: ${minimap}`;
}

function formatAssetStatus(asset) {
  if (!asset?.exists) return t('notAvailable');
  return `${asset.kilobytes || Math.round(asset.bytes / 1024)} KB`;
}

async function uploadAsset(name, file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error(t('neededImage'));
  const dataUrl = await readFileAsDataUrl(file);
  await api('/api/assets', { name, dataUrl });
  assetRefresh = 0;
  await refreshAssets();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(t('readFileFailed')));
    reader.readAsDataURL(file);
  });
}
