const els = {
  gsiStatus: document.querySelector('#gsiStatus'),
  twitchStatus: document.querySelector('#twitchStatus'),
  languageSelect: document.querySelector('#languageSelect'),
  autoDraft: document.querySelector('#autoDraft'),
  autoMinimap: document.querySelector('#autoMinimap'),
  autoQueue: document.querySelector('#autoQueue'),
  queueAutoMode: document.querySelector('#queueAutoMode'),
  minimapSize: document.querySelector('#minimapSize'),
  minimapSide: document.querySelector('#minimapSide'),
  minimapStyle: document.querySelector('#minimapStyle'),
  queueMode: document.querySelector('#queueMode'),
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
  dotaPath: document.querySelector('#dotaPath'),
  detectDota: document.querySelector('#detectDota'),
  installGsi: document.querySelector('#installGsi'),
  draftScreenshotAsset: document.querySelector('#draftScreenshotAsset'),
  queueScreenshotAsset: document.querySelector('#queueScreenshotAsset'),
  assetStatus: document.querySelector('#assetStatus'),
  events: document.querySelector('#events')
};

let snapshot = null;
let lastTemplateInput = null;

const translations = {
  ru: {
    languageLabel: 'Язык',
    sponsor: 'Спонсор',
    sitePrefix: 'Сайт: xyranet.pro',
    botPrefix: 'Бот: @XyraNet_bot',
    developer: 'Разработчик',
    supportDeveloper: 'Поддержать',
    subtitle: 'Локальная защита стрима и автоматизация Twitch Predictions.',
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
    partial: 'Только области поиска',
    full: 'Фуллскрин',
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
    subtitle: 'Local stream protection and Twitch Predictions automation.',
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
    partial: 'Queue areas only',
    full: 'Fullscreen',
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

let predictionTypeDefs = [...builtinPredictionTypeDefs];
let predictionTypeControlKey = '';

buildPredictionTypeControls();

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

function t(key) {
  return translations[currentLang]?.[key] || translations.ru[key] || key;
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
  const sponsorLinkSpans = document.querySelectorAll('.sponsor-links span');
  if (sponsorLinkSpans[0]) sponsorLinkSpans[0].textContent = t('sitePrefix');
  if (sponsorLinkSpans[1]) sponsorLinkSpans[1].textContent = t('botPrefix');
  setText('.top p', 'subtitle');

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
  setLabelText(els.queueMode.closest('label'), t('queueMode'));
  setOptionText(els.queueMode, 'partial', t('partial'));
  setOptionText(els.queueMode, 'full', t('full'));
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
  setText('.variable-summary span', 'variablesTitle');
  setText('.variable-guide p', 'variablesHelp');
  const variableKeys = ['varHero', 'varTarget', 'varMinute', 'varClockMinutes', 'varKills', 'varDeaths', 'varAssists', 'varLastHits', 'varDenies', 'varLevel', 'varTeamKills', 'varTeamDeaths', 'varTeamAssists', 'varEnemyKills', 'varEnemyDeaths', 'varEnemyAssists', 'varTotalKills', 'varTotalDeaths', 'varTotalAssists'];
  document.querySelectorAll('.variable-chip span').forEach((span, index) => {
    span.textContent = t(variableKeys[index]);
  });
  setLabelText(els.predictionWindow.closest('label'), t('windowSec'));
  setLabelText(els.autoCreate.closest('label'), t('autoCreate'));
  setLabelText(els.forceStreamOnline.closest('label'), t('forceStreamOnline'));
  els.forceStreamOnlineHint.textContent = t('forceStreamOnlineHint');
  setLabelText(els.autoResolve.closest('label'), t('autoResolve'));
  setLabelText(els.autoCancelInvalidGame.closest('label'), t('autoCancelInvalidGame'));
  setLabelText(els.predictionSelectionMode.closest('label'), t('typeMode'));
  setOptionText(els.predictionSelectionMode, 'selected', t('selectedMode'));
  setOptionText(els.predictionSelectionMode, 'random', t('randomMode'));
  setLabelText(els.selectedPredictionTypeWrap, t('selectedType'));
  els.predictionTypeForm.querySelector('button[type="submit"]').textContent = t('saveSettings');
  setText('.custom-builder h3', 'customBuilderTitle');
  setText('.custom-builder .section-head p', 'customBuilderHelp');
  setLabelText(els.customPredictionName.closest('label'), t('customName'));
  els.customPredictionName.placeholder = t('customNamePlaceholder');
  setLabelText(els.customPredictionCondition.closest('label'), t('condition'));
  setLabelText(els.customPredictionMetric.closest('label'), t('metric'));
  setLabelText(els.customPredictionMin.closest('label'), t('targetFrom'));
  setLabelText(els.customPredictionMax.closest('label'), t('targetTo'));
  setLabelText(els.customPredictionMinMinute.closest('label'), t('minuteFrom'));
  setLabelText(els.customPredictionMaxMinute.closest('label'), t('minuteTo'));
  setLabelText(els.customPredictionTitle.closest('label'), t('title'));
  setLabelText(els.customPredictionYes.closest('label'), t('yesOutcome'));
  setLabelText(els.customPredictionNo.closest('label'), t('noOutcome'));
  els.customPredictionForm.querySelector('button[type="submit"]').textContent = t('saveTemplate');
  applyConditionOptions(els.customPredictionCondition);
  applyMetricOptions(els.customPredictionMetric);
  updateCustomBuilderFieldVisibility();
  els.createPrediction.textContent = t('create');
  els.lockPrediction.textContent = t('lock');
  els.cancelPrediction.textContent = t('cancel');
  els.resolveWin.textContent = t('resolveYes');
  els.resolveLose.textContent = t('resolveNo');

  setText(els.dotaPath.closest('article').querySelector('h2'), 'dotaGsi');
  setLabelText(els.dotaPath.closest('label'), t('dotaFolder'));
  els.detectDota.textContent = t('findDota');
  els.installGsi.textContent = t('installGsi');
  els.installGsi.closest('article').querySelector('.muted').textContent = t('gsiHelp');

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
  select.value = current;
}

function applyMetricOptions(select) {
  if (!select) return;
  const current = select.value || 'clock_minutes';
  select.innerHTML = '';
  [
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
  ].forEach(([value, key]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    select.append(option);
  });
  select.value = current;
}

function render(data) {
  const { config, state } = data;
  applyLanguage(config);
  els.gsiStatus.textContent = state.gsi.connected ? 'Dota GSI online' : 'Dota GSI offline';
  els.gsiStatus.className = `pill ${state.gsi.connected ? 'ok' : 'bad'}`;
  const liveSuffix = state.twitch.isLive === true ? ' / live' : state.twitch.isLive === false ? ' / offline' : '';
  const forcedStreamSuffix = config.predictions?.forceStreamOnline ? ` / ${t('streamForcedShort')}` : '';
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
  els.queueMode.value = config.protection.queueMode || 'partial';
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
  setInputValue(els.predictionWindow, config.predictions.windowSeconds);
  els.autoCreate.checked = config.predictions.autoCreate;
  els.forceStreamOnline.checked = config.predictions.forceStreamOnline === true;
  els.forceStreamOnlineHint.hidden = !els.forceStreamOnline.checked;
  els.autoResolve.checked = config.predictions.autoResolve;
  els.autoCancelInvalidGame.checked = config.predictions.autoCancelInvalidGame ?? true;
  els.predictionSelectionMode.value = config.predictions.selectionMode || 'selected';
  syncPredictionTypeDefinitions(config.predictions);
  els.selectedPredictionType.value = config.predictions.selectedType || 'win_loss';
  renderPredictionTypes(config.predictions.types || {});
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();

  renderPrediction(state.activePrediction);
  renderEvents(state.events || []);
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

function renderPrediction(prediction) {
  if (!prediction) {
    els.activePrediction.textContent = t('noActivePrediction');
    return;
  }
  const outcomes = prediction.outcomes.map((item) => `${item.title}: ${item.channelPoints || 0}`).join(' | ');
  const type = prediction.type ? ` [${prediction.type}]` : '';
  els.activePrediction.textContent = `${prediction.title}${type} (${prediction.status}) ${outcomes}`;
}

function buildPredictionTypeControls() {
  els.selectedPredictionType.innerHTML = '';
  els.predictionTypes.innerHTML = '';
  for (const def of predictionTypeDefs) {
    const option = document.createElement('option');
    option.value = def.type;
    option.textContent = def.label || t(def.labelKey);
    els.selectedPredictionType.append(option);

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
        ${def.custom ? `<label data-field-label="metric">${t('metric')}<select data-field="metric"><option value="clock_minutes">${t('metricClockMinutes')}</option><option value="kills">${t('metricKills')}</option><option value="deaths">${t('metricDeaths')}</option><option value="assists">${t('metricAssists')}</option><option value="last_hits">${t('metricLastHits')}</option><option value="denies">${t('metricDenies')}</option><option value="level">${t('metricLevel')}</option><option value="team_kills">${t('metricTeamKills')}</option><option value="team_deaths">${t('metricTeamDeaths')}</option><option value="team_assists">${t('metricTeamAssists')}</option><option value="enemy_kills">${t('metricEnemyKills')}</option><option value="enemy_deaths">${t('metricEnemyDeaths')}</option><option value="enemy_assists">${t('metricEnemyAssists')}</option><option value="total_kills">${t('metricTotalKills')}</option><option value="total_deaths">${t('metricTotalDeaths')}</option><option value="total_assists">${t('metricTotalAssists')}</option></select></label>` : ''}
        ${def.ranges.includes('min') ? `<label data-field-label="min">${t('targetFrom')}<input data-field="min" type="number" min="0" max="999"></label>` : ''}
        ${def.ranges.includes('max') ? `<label data-field-label="max">${t('targetTo')}<input data-field="max" type="number" min="0" max="999"></label>` : ''}
        ${def.ranges.includes('minMinute') ? `<label data-field-label="minMinute">${t('minuteFrom')}<input data-field="minMinute" type="number" min="1" max="180"></label>` : ''}
        ${def.ranges.includes('maxMinute') ? `<label data-field-label="maxMinute">${t('minuteTo')}<input data-field="maxMinute" type="number" min="1" max="180"></label>` : ''}
        <label class="full" data-field-label="titleTemplate">${t('title')}<input data-field="titleTemplate" maxlength="120"></label>
        <label data-field-label="yesTitle">${t('yesOutcome')}<input data-field="yesTitle" maxlength="25"></label>
        <label data-field-label="noTitle">${t('noOutcome')}<input data-field="noTitle" maxlength="25"></label>
      </div>
    `;
    els.predictionTypes.append(card);
  }
  applyPredictionTypeLanguage();
}

function syncPredictionTypeDefinitions(predictions) {
  const customDefs = (predictions.customTemplates || []).map((template) => ({
    type: template.id,
    label: template.label || template.titleTemplate || template.id,
    descriptionKey: 'descCustom',
    ranges: ['min', 'max', 'minMinute', 'maxMinute'],
    custom: true,
    savedCustom: true
  }));
  const key = customDefs.map((def) => `${def.type}:${def.label}`).join('|');
  if (key === predictionTypeControlKey) return;
  predictionTypeControlKey = key;
  predictionTypeDefs = [...builtinPredictionTypeDefs, ...customDefs];
  buildPredictionTypeControls();
}

function applyPredictionTypeLanguage() {
  for (const def of predictionTypeDefs) {
    const option = els.selectedPredictionType.querySelector(`option[value="${def.type}"]`);
    if (option) option.textContent = def.label || t(def.labelKey);
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
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
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_kills', t('metricTotalKills'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_deaths', t('metricTotalDeaths'));
    setOptionText(card.querySelector('[data-field="metric"]'), 'total_assists', t('metricTotalAssists'));
    const previewLabel = card.querySelector('[data-preview-label]');
    if (previewLabel) previewLabel.textContent = t('preview');
    updateCustomConditionFieldVisibility(card);
  }
}

function renderPredictionTypes(types) {
  const customById = Object.fromEntries((snapshot?.config?.predictions?.customTemplates || []).map((template) => [template.id, template]));
  for (const def of predictionTypeDefs) {
    const config = types[def.type] || customById[def.type] || {};
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
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

function collectPredictionTypes() {
  const types = {};
  for (const def of predictionTypeDefs) {
    if (def.savedCustom) continue;
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
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

function collectCustomPredictionTemplates() {
  return predictionTypeDefs.filter((def) => def.savedCustom).map((def) => {
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
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

function removeCustomTemplate(type) {
  if (!confirm(t('confirmDeleteTemplate'))) return;
  const config = predictionConfigFromForm();
  config.customTemplates = config.customTemplates.filter((template) => template.id !== type);
  if (config.selectedType === type) config.selectedType = 'win_loss';
  api('/api/config', { predictions: config }).catch(alert);
}

function getTypeField(card, field) {
  const input = card?.querySelector(`[data-field="${field}"]`);
  if (!input) return null;
  return input.type === 'checkbox' ? input.checked : input.value;
}

function renderPredictionTypePreviews() {
  for (const def of predictionTypeDefs) {
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
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

function renderPredictionTypeVisibility() {
  const selectedMode = els.predictionSelectionMode.value === 'selected';
  const selectedType = els.selectedPredictionType.value || 'win_loss';
  els.selectedPredictionTypeWrap.hidden = !selectedMode;
  for (const card of els.predictionTypes.querySelectorAll('.prediction-type')) {
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
  const condition = els.customPredictionCondition.value || 'game_duration_at_least';
  const isDuration = condition === 'game_duration_at_least';
  const usesMinute = condition === 'game_duration_at_least' || condition === 'metric_by_minute';
  els.customPredictionMetric.closest('label').hidden = isDuration;
  els.customPredictionMin.closest('label').hidden = isDuration;
  els.customPredictionMax.closest('label').hidden = isDuration;
  els.customPredictionMinMinute.closest('label').hidden = !usesMinute;
  els.customPredictionMaxMinute.closest('label').hidden = !usesMinute;
}

function customTemplateFromBuilder() {
  const label = els.customPredictionName.value.trim() || els.customPredictionTitle.value.trim() || t('typeCustom');
  const min = Number(els.customPredictionMin.value || 0);
  const minMinute = Number(els.customPredictionMinMinute.value || 40);
  return {
    id: `custom_${Date.now().toString(36)}`,
    label,
    enabled: true,
    weight: 1,
    condition: els.customPredictionCondition.value || 'game_duration_at_least',
    metric: els.customPredictionMetric.value || 'clock_minutes',
    min,
    max: Number(els.customPredictionMax.value || min),
    minMinute,
    maxMinute: Number(els.customPredictionMaxMinute.value || minMinute),
    titleTemplate: els.customPredictionTitle.value.trim() || label,
    yesTitle: els.customPredictionYes.value.trim() || t('yes'),
    noTitle: els.customPredictionNo.value.trim() || t('no')
  };
}

function resetCustomBuilder() {
  els.customPredictionName.value = '';
  els.customPredictionCondition.value = 'game_duration_at_least';
  els.customPredictionMetric.value = 'clock_minutes';
  els.customPredictionMin.value = '40';
  els.customPredictionMax.value = '40';
  els.customPredictionMinMinute.value = '40';
  els.customPredictionMaxMinute.value = '40';
  els.customPredictionTitle.value = currentLang === 'en' ? 'Will the game reach {minute}:00?' : 'Продлится ли игра {minute}:00?';
  els.customPredictionYes.value = t('yes');
  els.customPredictionNo.value = t('no');
  updateCustomBuilderFieldVisibility();
}

function fillTemplate(template, typeConfig) {
  const gsi = snapshot?.state?.gsi || {};
  const target = midpoint(typeConfig.min, typeConfig.max) || 8;
  const minute = midpoint(typeConfig.minMinute, typeConfig.maxMinute) || 10;
  const values = {
    hero: gsi.heroName || 'Pudge',
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
    total_kills: Number.isFinite(gsi.totalKills) ? gsi.totalKills : 32,
    total_deaths: Number.isFinite(gsi.totalDeaths) ? gsi.totalDeaths : 27,
    total_assists: Number.isFinite(gsi.totalAssists) ? gsi.totalAssists : 45
  };

  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{${key}}`, value);
  }, template);
}

function midpoint(min, max) {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return 0;
  if (!Number.isFinite(max) || max <= 0) return min;
  if (!Number.isFinite(min) || min <= 0) return max;
  return Math.round((min + max) / 2);
}

function rememberTemplateInput(input) {
  if (input instanceof HTMLInputElement && (
    input.matches('#predictionTypes input[data-field="titleTemplate"]')
    || input.matches('#predictionTypes input[data-field="yesTitle"]')
    || input.matches('#predictionTypes input[data-field="noTitle"]')
    || input.matches('#customPredictionTitle')
    || input.matches('#customPredictionYes')
    || input.matches('#customPredictionNo')
  )) {
    lastTemplateInput = input;
  }
}

function insertVariable(variable) {
  const target = lastTemplateInput || document.querySelector('#predictionTypes input[data-field="titleTemplate"]') || els.customPredictionTitle;
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

async function saveProtection(patch) {
  await api('/api/protection', patch);
}

els.autoDraft.addEventListener('change', () => saveProtection({ autoDraft: els.autoDraft.checked }).catch(alert));
els.autoMinimap.addEventListener('change', () => saveProtection({ autoMinimap: els.autoMinimap.checked }).catch(alert));
els.autoQueue.addEventListener('change', () => saveProtection({ autoQueue: els.autoQueue.checked }).catch(alert));
els.queueAutoMode.addEventListener('change', () => saveProtection({ queueAutoMode: els.queueAutoMode.value }).catch(alert));
els.minimapSize.addEventListener('change', () => saveProtection({ minimapSize: els.minimapSize.value }).catch(alert));
els.minimapSide.addEventListener('change', () => saveProtection({ minimapSide: els.minimapSide.value }).catch(alert));
els.minimapStyle.addEventListener('change', () => saveProtection({ minimapStyle: els.minimapStyle.value }).catch(alert));
els.queueMode.addEventListener('change', () => saveProtection({ queueMode: els.queueMode.value }).catch(alert));
els.manualDraft.addEventListener('click', () => saveProtection({ manualDraft: nextManualProtectionState('manualDraft', 'draft') }).catch(alert));
els.manualMinimap.addEventListener('click', () => saveProtection({ manualMinimap: nextManualProtectionState('manualMinimap', 'minimap') }).catch(alert));
els.manualTopBar.addEventListener('click', () => saveProtection({ manualTopBar: nextManualProtectionState('manualTopBar', 'topBar') }).catch(alert));
els.manualQueue.addEventListener('click', () => saveProtection({ manualQueue: nextManualProtectionState('manualQueue', 'queue') }).catch(alert));

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
  renderPredictionTypePreviews();
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

els.predictionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await savePredictionConfig().catch(alert);
});
els.predictionTypeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await savePredictionConfig().catch(alert);
});
els.customPredictionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const template = customTemplateFromBuilder();
    const config = predictionConfigFromForm();
    config.customTemplates = [...config.customTemplates, template];
    config.selectedType = template.id;
    config.selectionMode = 'selected';
    await api('/api/config', { predictions: config });
    resetCustomBuilder();
    alert(t('customTemplateSaved'));
  } catch (error) {
    alert(error);
  }
});
document.addEventListener('focusin', (event) => rememberTemplateInput(event.target));
document.addEventListener('input', (event) => {
  if (event.target.closest?.('#predictionForm, #predictionTypeForm, #predictionTypes')) {
    const card = event.target.closest('.prediction-type');
    if (card) updateCustomConditionFieldVisibility(card);
    renderPredictionTypePreviews();
  }
});
document.addEventListener('change', (event) => {
  if (event.target.closest?.('#predictionForm, #predictionTypeForm, #predictionTypes')) {
    const card = event.target.closest('.prediction-type');
    if (card) updateCustomConditionFieldVisibility(card);
    renderPredictionTypePreviews();
  }
});
document.addEventListener('click', (event) => {
  const deleteButton = event.target.closest?.('[data-delete-template]');
  if (!deleteButton) return;
  const card = deleteButton.closest('.prediction-type');
  if (card?.dataset.type) removeCustomTemplate(card.dataset.type);
});
els.selectedPredictionType.addEventListener('change', () => {
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();
});
els.predictionSelectionMode.addEventListener('change', () => {
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();
});
els.forceStreamOnline.addEventListener('change', () => {
  els.forceStreamOnlineHint.hidden = !els.forceStreamOnline.checked;
});
els.customPredictionCondition.addEventListener('change', updateCustomBuilderFieldVisibility);
els.variableChips.forEach((button) => {
  button.addEventListener('click', () => insertVariable(button.dataset.var));
});

async function savePredictionConfig() {
  await api('/api/config', { predictions: predictionConfigFromForm() });
}

function predictionConfigFromForm() {
  return {
    windowSeconds: Number(els.predictionWindow.value),
    autoCreate: els.autoCreate.checked,
    forceStreamOnline: els.forceStreamOnline.checked,
    autoResolve: els.autoResolve.checked,
    autoCancelInvalidGame: els.autoCancelInvalidGame.checked,
    selectionMode: els.predictionSelectionMode.value,
    selectedType: els.selectedPredictionType.value,
    types: collectPredictionTypes(),
    customTemplates: collectCustomPredictionTemplates()
  };
}

els.createPrediction.addEventListener('click', async () => {
  try {
    await savePredictionConfig();
    await api('/api/twitch/predictions', {});
  } catch (error) {
    alert(error);
  }
});

els.lockPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/lock`).catch(alert)));
els.cancelPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/cancel`).catch(alert)));
els.resolveWin.addEventListener('click', () => resolveKind('win'));
els.resolveLose.addEventListener('click', () => resolveKind('lose'));
els.detectDota.addEventListener('click', () => detectDota().catch(alert));
els.installGsi.addEventListener('click', () => api('/api/install-gsi', {
  dotaPath: els.dotaPath.value.trim()
}).then((result) => {
  els.dotaPath.value = result.dotaPath || els.dotaPath.value;
  alert(`${t('gsiInstalled')}\n${result.cfgPath}\n\n${t('restartDota')}`);
}).catch(alert));
els.draftScreenshotAsset.addEventListener('change', () => uploadAsset('draft-screenshot.png', els.draftScreenshotAsset.files[0]).catch(alert));
els.queueScreenshotAsset.addEventListener('change', () => uploadAsset('queue-screenshot.png', els.queueScreenshotAsset.files[0]).catch(alert));

async function detectDota() {
  const result = await api('/api/dota/detect', null, 'GET');
  els.dotaPath.value = result.dotaPath || '';
  alert(`${t('dotaFound')}\n${result.dotaPath}`);
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
