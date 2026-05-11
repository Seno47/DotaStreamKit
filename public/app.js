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
  showStreamerStats: document.querySelector('#showStreamerStats'),
  showStreamerRankMedal: document.querySelector('#showStreamerRankMedal'),
  showStreamerMmr: document.querySelector('#showStreamerMmr'),
  showStreamerWinLoss: document.querySelector('#showStreamerWinLoss'),
  streamerMedalSourceWrap: document.querySelector('#streamerMedalSourceWrap'),
  streamerMedalSource: document.querySelector('#streamerMedalSource'),
  streamerMmrWrap: document.querySelector('#streamerMmrWrap'),
  streamerMmr: document.querySelector('#streamerMmr'),
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
  autoBindStreamerAccounts: document.querySelector('#autoBindStreamerAccounts'),
  streamerAccountIdWrap: document.querySelector('#streamerAccountIdWrap'),
  streamerAccountId: document.querySelector('#streamerAccountId'),
  streamerAccountLabelWrap: document.querySelector('#streamerAccountLabelWrap'),
  streamerAccountLabel: document.querySelector('#streamerAccountLabel'),
  addStreamerAccount: document.querySelector('#addStreamerAccount'),
  cancelStreamerAccountEdit: document.querySelector('#cancelStreamerAccountEdit'),
  streamerAccountListCurrent: document.querySelector('#streamerAccountListCurrent'),
  streamerAccountListId: document.querySelector('#streamerAccountListId'),
  streamerAccountListLabel: document.querySelector('#streamerAccountListLabel'),
  streamerAccountListActions: document.querySelector('#streamerAccountListActions'),
  streamerAccountRows: document.querySelector('#streamerAccountRows'),
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
  autoCheckUpdates: document.querySelector('#autoCheckUpdates'),
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
let activePage = localStorage.getItem('dsk.activePage') || 'protection';
let editingNotablePlayerAccountId = '';
let editingStreamerAccountId = '';
let activeOverlayPositionKey = localStorage.getItem('dsk.overlayPositionTarget') || 'streamerStatsGame';
let latestUpdateStatus = null;

const overlayPositionKeys = ['streamerStatsMenu', 'streamerStatsGame', 'roshanTimer', 'predictionOverlay'];
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
    subtitle: 'Локальная защита стрима и автоматизация Twitch Predictions.',
    pageProtection: 'Защита',
    pageIntel: 'Match intel',
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
    streamerAccounts: 'Dota аккаунты стримера',
    streamerAccountsSectionSummary: 'Авто и ручная привязка',
    streamerAccountsHint: 'DotaStreamKit всегда смотрит, какой аккаунт сейчас прислал GSI. Автопривязка просто запоминает такие аккаунты в списке.',
    autoBindStreamerAccounts: 'Автоматически добавлять текущий аккаунт',
    streamerAccountId: 'Dota ID',
    streamerAccountLabel: 'Название',
    addStreamerAccount: 'Добавить',
    saveStreamerAccount: 'Сохранить',
    cancelStreamerAccountEdit: 'Отмена',
    editStreamerAccount: 'Редактировать',
    removeStreamerAccount: 'Удалить',
    streamerAccountListCurrent: 'Сейчас',
    streamerAccountListActions: 'Действия',
    streamerAccountCurrentBadge: 'активен',
    noStreamerAccounts: 'Привязанных аккаунтов пока нет.',
    showStreamerStats: 'Статистика стримера в overlay',
    showStreamerRankMedal: 'Медаль ранга',
    showStreamerMmr: 'MMR',
    showStreamerWinLoss: 'Win-Lose',
    streamerMedalSource: 'Источник медали',
    streamerMedalAuto: 'Аккаунт, затем MMR',
    streamerMedalAccount: 'Dota аккаунт',
    streamerMedalMmr: 'Указанный MMR',
    streamerMmr: 'Текущий MMR',
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
    autoCheckUpdates: 'Проверять обновления при открытии панели',
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
    subtitle: 'Local stream protection and Twitch Predictions automation.',
    pageProtection: 'Protection',
    pageIntel: 'Match intel',
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
    streamerAccounts: 'Streamer Dota accounts',
    streamerAccountsSectionSummary: 'Auto and manual binding',
    streamerAccountsHint: 'DotaStreamKit always tracks the account sent by GSI. Auto-binding only remembers those accounts in this list.',
    autoBindStreamerAccounts: 'Automatically add current account',
    streamerAccountId: 'Dota ID',
    streamerAccountLabel: 'Label',
    addStreamerAccount: 'Add',
    saveStreamerAccount: 'Save',
    cancelStreamerAccountEdit: 'Cancel',
    editStreamerAccount: 'Edit',
    removeStreamerAccount: 'Remove',
    streamerAccountListCurrent: 'Current',
    streamerAccountListActions: 'Actions',
    streamerAccountCurrentBadge: 'active',
    noStreamerAccounts: 'No bound accounts yet.',
    showStreamerStats: 'Streamer stats overlay',
    showStreamerRankMedal: 'Rank medal',
    showStreamerMmr: 'MMR',
    showStreamerWinLoss: 'Win-Lose',
    streamerMedalSource: 'Medal source',
    streamerMedalAuto: 'Account, then MMR',
    streamerMedalAccount: 'Dota account',
    streamerMedalMmr: 'Manual MMR',
    streamerMmr: 'Current MMR',
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
    autoCheckUpdates: 'Check for updates when dashboard opens',
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
  els.streamerMedalEyebrow.textContent = t('streamerMedalEyebrow');
  els.streamerStatWinsLabel.textContent = t('streamerStatWins');
  els.streamerStatLossesLabel.textContent = t('streamerStatLosses');
  els.streamerCurrentAccountLabel.textContent = t('streamerCurrentAccount');
  setLabelText(els.showStreamerStats.closest('label'), t('showStreamerStats'));
  setLabelText(els.showStreamerRankMedal.closest('label'), t('showStreamerRankMedal'));
  setLabelText(els.showStreamerMmr.closest('label'), t('showStreamerMmr'));
  setLabelText(els.showStreamerWinLoss.closest('label'), t('showStreamerWinLoss'));
  setLabelText(els.streamerMedalSourceWrap, t('streamerMedalSource'));
  setOptionText(els.streamerMedalSource, 'auto', t('streamerMedalAuto'));
  setOptionText(els.streamerMedalSource, 'account', t('streamerMedalAccount'));
  setOptionText(els.streamerMedalSource, 'mmr', t('streamerMedalMmr'));
  setLabelText(els.streamerMmrWrap, t('streamerMmr'));
  setLabelText(els.autoUpdateStreamerMmr.closest('label'), t('autoUpdateStreamerMmr'));
  setLabelText(els.streamerMmrWinDeltaWrap, t('streamerMmrWinDelta'));
  setLabelText(els.streamerMmrLossDeltaWrap, t('streamerMmrLossDelta'));
  els.resetStreamerStats.textContent = t('resetStreamerStats');
  els.restoreStreamerStats.textContent = t('restoreStreamerStats');
  els.streamerAccountsTitle.textContent = t('streamerAccounts');
  els.streamerAccountsSectionSummary.textContent = t('streamerAccountsSectionSummary');
  els.streamerAccountsHint.textContent = t('streamerAccountsHint');
  setLabelText(els.autoBindStreamerAccounts.closest('label'), t('autoBindStreamerAccounts'));
  setLabelText(els.streamerAccountIdWrap, t('streamerAccountId'));
  setLabelText(els.streamerAccountLabelWrap, t('streamerAccountLabel'));
  els.addStreamerAccount.textContent = editingStreamerAccountId ? t('saveStreamerAccount') : t('addStreamerAccount');
  els.cancelStreamerAccountEdit.textContent = t('cancelStreamerAccountEdit');
  els.streamerAccountListCurrent.textContent = t('streamerAccountListCurrent');
  els.streamerAccountListId.textContent = t('streamerAccountId');
  els.streamerAccountListLabel.textContent = t('streamerAccountLabel');
  els.streamerAccountListActions.textContent = t('streamerAccountListActions');
  els.overlayPositionTitle.textContent = t('overlayPositionTitle');
  els.overlayPositionHint.textContent = t('overlayPositionHint');
  setLabelText(els.overlayPositionTargetWrap, t('overlayPositionTarget'));
  setOptionText(els.overlayPositionTarget, 'streamerStatsMenu', t('streamerStatsMenuPosition'));
  setOptionText(els.overlayPositionTarget, 'streamerStatsGame', t('streamerStatsGamePosition'));
  setOptionText(els.overlayPositionTarget, 'roshanTimer', t('roshanTimerPosition'));
  setOptionText(els.overlayPositionTarget, 'predictionOverlay', t('predictionOverlayPosition'));
  setLabelText(els.overlayPreviewBackgroundWrap, t('overlayPreviewBackground'));
  setOptionText(els.overlayPreviewBackground, 'screenshot', t('overlayPreviewScreenshot'));
  setOptionText(els.overlayPreviewBackground, 'black', t('overlayPreviewBlack'));
  setOptionText(els.overlayPreviewBackground, 'white', t('overlayPreviewWhite'));
  els.streamerStatsMenuPositionTitle.textContent = t('streamerStatsMenuPosition');
  els.streamerStatsGamePositionTitle.textContent = t('streamerStatsGamePosition');
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
  setLabelText(els.autoCheckUpdates.closest('label'), t('autoCheckUpdates'));
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
  const control = label.querySelector('input, select');
  const textNode = document.createTextNode(control === label.firstElementChild ? ` ${text}` : text);
  if (!control) label.prepend(textNode);
  else if (control === label.firstElementChild) control.after(textNode);
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
  const available = update?.updateAvailable && update.latestVersion
    ? t('updateAvailableInline').replace('{version}', update.latestVersion)
    : '';
  els.appVersion.textContent = available ? `${base} / ${available}` : base;
  els.appVersion.classList.toggle('has-update', Boolean(available));
  els.appVersion.title = update?.error || (update?.checking ? t('updateChecking') : '');
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
    els.updateStatus.dataset.custom = 'true';
    els.updateStatus.textContent = update.updateAvailable
      ? t('updateAvailable').replace('{version}', update.latestVersion)
      : t('updateCurrent').replace('{version}', update.currentVersion);
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
  const matchIntel = config.protection.matchIntel || {};
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
  els.streamerMedalSource.value = matchIntel.streamerMedalSource || 'auto';
  setInputValue(els.streamerMmr, matchIntel.streamerMmr || 0);
  els.autoUpdateStreamerMmr.checked = matchIntel.autoUpdateStreamerMmr !== false;
  els.autoBindStreamerAccounts.checked = matchIntel.autoBindStreamerAccounts !== false;
  setInputValue(els.streamerMmrWinDelta, matchIntel.streamerMmrWinDelta ?? 25);
  setInputValue(els.streamerMmrLossDelta, matchIntel.streamerMmrLossDelta ?? 25);
  setOverlayPositionControls(matchIntel.overlayPositions || {});
  renderIntelSummary(matchIntel);
  renderStreamerStatsStatus(state.streamerStats || {}, matchIntel);
  renderStreamerStatsPreview(state.streamerStats || {}, matchIntel);
  renderStreamerAccounts(matchIntel.streamerAccounts || [], state.streamerStats || {});
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
  els.autoCheckUpdates.checked = config.updates?.autoCheck !== false;
  els.autoInstallUpdates.checked = config.updates?.autoInstall === true;
  renderServerUpdateStatus(state.update);

  renderPrediction(state.activePrediction);
  renderEvents(state.events || []);

  if (config.updates?.autoCheck !== false && !latestUpdateStatus && !sessionStorage.getItem('dsk.updateChecked')) {
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

function renderStreamerStatsPreview(stats, settings) {
  const medal = stats.medal || null;
  const accountId = String(stats.streamerAccountId || '').trim();
  const mmr = Number(stats.currentMmr || settings.streamerMmr || 0);
  const medalId = medal?.id ?? 0;
  const stars = Number(medal?.stars || 0);
  els.streamerStatWins.textContent = String(stats.wins || 0);
  els.streamerStatLosses.textContent = String(stats.losses || 0);
  els.streamerCurrentAccount.textContent = accountId || '-';
  els.streamerMedalName.textContent = medal?.name || t('streamerMedalNoData');
  const details = [];
  if (medal?.source === 'account') details.push(t('streamerMedalByAccount'));
  if (medal?.source === 'mmr') details.push(t('streamerMedalByMmr'));
  if (stars > 0) details.push(t('streamerMedalStars').replace('{stars}', String(stars)));
  if (mmr > 0) details.push(`${Math.trunc(mmr)} MMR`);
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

function renderStreamerAccounts(accounts, stats) {
  els.streamerAccountRows.innerHTML = '';
  const currentAccountId = String(stats.streamerAccountId || '').trim();
  let rowCount = 0;
  for (const account of Array.isArray(accounts) ? accounts : []) {
    const accountId = String(account.accountId || '').trim();
    if (!accountId) continue;
    const row = document.createElement('div');
    row.className = 'streamer-account-row';
    row.dataset.accountId = accountId;
    row.dataset.label = String(account.label || '').trim();
    row.dataset.current = accountId === currentAccountId ? 'true' : 'false';

    const current = document.createElement('span');
    current.className = 'streamer-account-current';
    current.textContent = accountId === currentAccountId ? t('streamerAccountCurrentBadge') : '-';
    const id = document.createElement('span');
    id.className = 'streamer-account-id';
    id.textContent = accountId;
    const label = document.createElement('span');
    label.className = 'streamer-account-label';
    label.textContent = row.dataset.label || '-';
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

    row.append(current, id, label, actions);
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
  return [...els.streamerAccountRows.querySelectorAll('.streamer-account-row')]
    .map((row) => ({
      accountId: Number(row.dataset.accountId),
      label: row.dataset.label || ''
    }))
    .filter((account) => Number.isFinite(account.accountId) && account.accountId > 0);
}

function addStreamerAccount() {
  const accountId = normalizeDotaAccountIdInput(els.streamerAccountId.value);
  const label = els.streamerAccountLabel.value.trim();
  if (!accountId) {
    alert(t('streamerAccountId'));
    return;
  }
  const previousAccountId = editingStreamerAccountId || accountId;
  const accounts = streamerAccountsFromForm()
    .filter((account) => String(account.accountId) !== previousAccountId && String(account.accountId) !== accountId);
  accounts.push({ accountId: Number(accountId), label });
  renderStreamerAccounts(accounts, snapshot?.state?.streamerStats || {});
  resetStreamerAccountEditor();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
}

function editStreamerAccount(row) {
  if (!row) return;
  editingStreamerAccountId = row.dataset.accountId || '';
  els.streamerAccountId.value = editingStreamerAccountId;
  els.streamerAccountLabel.value = row.dataset.label || '';
  updateStreamerAccountEditorMode();
  els.streamerAccountId.focus();
}

function resetStreamerAccountEditor() {
  editingStreamerAccountId = '';
  els.streamerAccountId.value = '';
  els.streamerAccountLabel.value = '';
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
  for (const key of overlayPositionKeys) {
    const offset = normalizeOverlayOffset(positions[key]);
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
    const box = overlayPreviewBoxes[key];
    if (!preview || !item || !box) continue;
    card.hidden = key !== activeOverlayPositionKey;
    if (card.hidden) continue;
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
  els.streamerMedalSource,
  els.autoUpdateStreamerMmr,
  els.autoBindStreamerAccounts
].forEach((input) => input.addEventListener('change', () => {
  updateMatchIntelFieldVisibility();
  saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert);
}));
[els.streamerMmr, els.streamerMmrWinDelta, els.streamerMmrLossDelta].forEach((input) => {
  input.addEventListener('change', () => saveProtection({ matchIntel: protectionMatchIntelFromForm() }).catch(alert));
});
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
    streamerMedalSource: els.streamerMedalSource.value,
    streamerMmr: Number(els.streamerMmr.value),
    autoUpdateStreamerMmr: els.autoUpdateStreamerMmr.checked,
    autoBindStreamerAccounts: els.autoBindStreamerAccounts.checked,
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
  els.streamerMedalSourceWrap.hidden = !streamerStatsEnabled || !els.showStreamerRankMedal.checked;
  els.streamerMmrWrap.hidden = !streamerStatsEnabled || (!els.showStreamerMmr.checked && els.streamerMedalSource.value === 'account');
  els.autoUpdateStreamerMmr.closest('label').hidden = !streamerStatsEnabled;
  els.streamerMmrWinDeltaWrap.hidden = !streamerStatsEnabled || !els.autoUpdateStreamerMmr.checked;
  els.streamerMmrLossDeltaWrap.hidden = !streamerStatsEnabled || !els.autoUpdateStreamerMmr.checked;
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
els.autoCheckUpdates.addEventListener('change', saveUpdateSettings);
els.autoInstallUpdates.addEventListener('change', saveUpdateSettings);
els.checkUpdates.addEventListener('click', () => checkUpdates(true).catch(alert));
els.installUpdate.addEventListener('click', () => installUpdate().catch(alert));
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
      autoCheck: els.autoCheckUpdates.checked,
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
  els.updateStatus.textContent = status.updateAvailable
    ? t('updateAvailable').replace('{version}', status.latestVersion)
    : t('updateCurrent').replace('{version}', status.currentVersion);
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
