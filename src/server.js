import { createServer } from 'node:http';
import { copyFile, readFile, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename, dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const execFileAsync = promisify(execFile);
const rootDir = normalize(join(__dirname, '..'));
const publicDir = join(rootDir, 'public');
const dataDir = join(rootDir, 'data');
const assetDir = join(dataDir, 'assets');
const defaultAssetDir = join(publicDir, 'default-assets');
const configPath = join(dataDir, 'config.json');
const statePath = join(dataDir, 'state.json');
const twitchTokenPath = join(dataDir, 'twitch-token.json');

const port = Number(process.env.PORT || 37273);
const twitchApi = 'https://api.twitch.tv/helix';
const twitchId = 'https://id.twitch.tv/oauth2';
const twitchScopes = ['channel:manage:predictions', 'user:write:chat'];
const queueAutoOnDelayMs = 0;
const queueAutoOffDelayMs = 2500;
const queueAutoStaleKeepMs = 10 * 60 * 1000;
const autoPredictionRetryMs = 30000;
const inGameStatePattern = /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS|POST_GAME/i;
const queueSearchPattern = /queue|search|matchmaking|match_making|find.?match|finding.?match|game.?search|party.?search/i;
const dotaProcessName = 'dota2.exe';
const customPredictionConditions = ['game_duration_at_least', 'metric_reaches_target', 'metric_by_minute'];
const customPredictionMetrics = [
  'clock_minutes',
  'kills',
  'deaths',
  'assists',
  'last_hits',
  'denies',
  'level',
  'team_kills',
  'team_deaths',
  'team_assists',
  'enemy_kills',
  'enemy_deaths',
  'enemy_assists',
  'total_kills',
  'total_deaths',
  'total_assists'
];

const defaultConfig = {
  ui: {
    language: 'auto',
    predictionTemplateLanguage: ''
  },
  deployment: {
    mode: 'local',
    publicBaseUrl: ''
  },
  twitch: {
    clientId: '',
    clientSecret: '',
    redirectUri: `http://localhost:${port}/auth/twitch/callback`,
    channelMode: 'personal',
    targetChannelLogin: '',
    targetBroadcasterId: '',
    targetBroadcasterLogin: ''
  },
  dota: {
    installPath: '',
    cfgDir: '',
    detectionSource: ''
  },
  protection: {
    autoDraft: true,
    autoMinimap: true,
    autoQueue: true,
    manualDraft: false,
    manualMinimap: false,
    manualTopBar: false,
    manualQueue: false,
    queueMode: 'partial',
    queueAutoMode: 'menu_search',
    referenceSize: { width: 1920, height: 1080 },
    minimapSize: 'normal',
    minimapSide: 'left',
    minimapStyle: 'realistic',
    minimapOpacity: 0.92,
    minimapBoxes: {
      normal: { left: 8, bottom: 8, width: 264, height: 264 },
      large: { left: 0, bottom: 0, width: 326, height: 326 }
    },
    minimapContentAreas: {
      normal: { left: -3, top: 12, width: 96, height: 91 },
      large: { left: -3, top: 12, width: 91, height: 91 }
    },
    draftMaskParts: [
      { left: 0, top: 178, width: 1920, height: 692 },
      { left: 0, top: 870, width: 838, height: 194 },
      { left: 1324, top: 870, width: 596, height: 194 },
      { left: 0, top: 1064, width: 1920, height: 16 }
    ],
    queueProfileRight: 398,
    queueChatBox: { left: 616, top: 742, width: 688, height: 317 },
    topBarSlots: [
      { left: 208, top: 0, width: 122, height: 75, asset: 'topbar-slot-0.png' },
      { left: 333, top: 0, width: 122, height: 75, asset: 'topbar-slot-1.png' },
      { left: 457, top: 0, width: 122, height: 75, asset: 'topbar-slot-2.png' },
      { left: 581, top: 0, width: 122, height: 75, asset: 'topbar-slot-3.png' },
      { left: 706, top: 0, width: 122, height: 75, asset: 'topbar-slot-4.png' },
      { left: 1096, top: 0, width: 122, height: 75, asset: 'topbar-slot-5.png' },
      { left: 1220, top: 0, width: 122, height: 75, asset: 'topbar-slot-6.png' },
      { left: 1344, top: 0, width: 122, height: 75, asset: 'topbar-slot-7.png' },
      { left: 1468, top: 0, width: 122, height: 75, asset: 'topbar-slot-8.png' },
      { left: 1592, top: 0, width: 122, height: 75, asset: 'topbar-slot-9.png' }
    ]
  },
  predictions: {
    autoCreate: false,
    forceStreamOnline: false,
    autoLockAtGameSeconds: 60,
    autoResolve: false,
    cancelUncontestedPrediction: false,
    autoCancelInvalidGame: true,
    autoCancelDisconnectSeconds: 390,
    titleTemplate: 'Победа в этой игре?',
    winTitle: 'Победа',
    loseTitle: 'Поражение',
    windowSeconds: 180,
    selectionMode: 'selected',
    selectedType: 'win_loss',
    types: {
      win_loss: { enabled: true, weight: 3, titleTemplate: 'Победа на {hero}?', yesTitle: 'Победа', noTitle: 'Поражение' },
      streamer_kills: { enabled: true, weight: 2, min: 5, max: 12, titleTemplate: '{hero}: {target}+ киллов?', yesTitle: 'Да', noTitle: 'Нет' },
      streamer_deaths: { enabled: true, weight: 1, min: 4, max: 9, titleTemplate: '{hero}: {target}+ смертей?', yesTitle: 'Да', noTitle: 'Нет' },
      streamer_assists: { enabled: true, weight: 2, min: 8, max: 20, titleTemplate: '{hero}: {target}+ ассистов?', yesTitle: 'Да', noTitle: 'Нет' },
      no_death_until: { enabled: true, weight: 1, minMinute: 8, maxMinute: 15, titleTemplate: '{hero} не умрет до {minute}:00?', yesTitle: 'Не умрет', noTitle: 'Умрет' },
      last_hits_by_minute: { enabled: true, weight: 2, min: 45, max: 85, minMinute: 10, maxMinute: 10, titleTemplate: '{hero}: {target}+ ластхитов к {minute}:00?', yesTitle: 'Да', noTitle: 'Нет' }
    },
    customTemplates: []
  }
};

const runtime = {
  clients: new Set(),
  oauthStates: new Set(),
  queueAuto: { active: false, desired: false, desiredSince: 0 },
  dotaProcess: { running: null, checkedAt: null },
  twitchStreamStatus: { broadcasterId: null, checkedAt: 0, isLive: null, streamId: null, gameName: null, title: null },
  config: structuredClone(defaultConfig),
  state: {
    startedAt: new Date().toISOString(),
    gsi: {
      connected: false,
      lastSeenAt: null,
      gameState: null,
      clockTime: null,
      matchId: null,
      activeMatchId: null,
      playerActivity: null,
      playerTeam: null,
      winTeam: null,
      heroName: null,
      heroId: null,
      kills: null,
      deaths: null,
      assists: null,
      lastHits: null,
      denies: null,
      level: null,
      teamKills: null,
      teamDeaths: null,
      teamAssists: null,
      enemyKills: null,
      enemyDeaths: null,
      enemyAssists: null,
      totalKills: null,
      totalDeaths: null,
      totalAssists: null,
      playerHeroPicked: false,
      draftActiveTeam: null,
      ownPickPhaseEnded: false,
      draftCycle: 0,
      queueSearchSignal: false,
      inGameScreen: false,
      leftGameView: false
    },
    dota: {
      processRunning: null,
      processCheckedAt: null
    },
    protection: { draft: false, minimap: false, topBar: false, queue: false },
    twitch: { authenticated: false, broadcasterId: null, broadcasterLogin: null, tokenExpiresAt: null },
    activePrediction: null,
    activePredictionMatchId: null,
    activePredictionMeta: null,
    predictionCancelCandidate: null,
    lastAutoPredictionAttempt: null,
    autoPredictionCreatedKey: null,
    events: []
  }
};

await mkdir(dataDir, { recursive: true });
await mkdir(assetDir, { recursive: true });
await ensureGeneratedAssets();
runtime.config = await loadJson(configPath, defaultConfig);
await migrateConfig(runtime.config);
runtime.state = { ...runtime.state, ...(await loadJson(statePath, {})) };
runtime.state.twitchToken = runtime.state.twitchToken || await loadTwitchTokenBackup();
runtime.state.startedAt = new Date().toISOString();
runtime.state.gsi = {
  connected: false,
  lastSeenAt: null,
  gameState: null,
  clockTime: null,
  matchId: null,
  activeMatchId: null,
  playerActivity: null,
  playerTeam: null,
  winTeam: null,
  heroName: null,
  heroId: null,
  kills: null,
  deaths: null,
  assists: null,
  lastHits: null,
  denies: null,
  level: null,
  teamKills: null,
  teamDeaths: null,
  teamAssists: null,
  enemyKills: null,
  enemyDeaths: null,
  enemyAssists: null,
  totalKills: null,
  totalDeaths: null,
  totalAssists: null,
  playerHeroPicked: false,
  draftActiveTeam: null,
  ownPickPhaseEnded: false,
  draftCycle: 0,
  queueSearchSignal: false,
  inGameScreen: false,
  leftGameView: false
};
runtime.state.dota = {
  processRunning: null,
  processCheckedAt: null
};
runtime.state.lastAutoPredictionAttempt = null;
runtime.state.autoPredictionCreatedKey = null;
await refreshDotaProcessState();
runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
await restoreTwitchStatus();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);

    if (req.method === 'GET' && url.pathname === '/api/events') return handleEvents(req, res);
    if (req.method === 'GET' && url.pathname === '/api/state') return sendJson(res, publicState());
    if (req.method === 'GET' && url.pathname === '/api/assets') return await assetStatus(res);
    if (req.method === 'POST' && url.pathname === '/api/assets') return await uploadAsset(req, res);
    if (req.method === 'GET' && url.pathname === '/api/config') return sendJson(res, sanitizeConfig(runtime.config));
    if (req.method === 'POST' && url.pathname === '/api/config') return await updateConfig(req, res);
    if (req.method === 'POST' && url.pathname === '/api/protection') return await updateProtection(req, res);
    if (req.method === 'POST' && url.pathname === '/gsi/dota2') return await handleGsi(req, res);
    if (req.method === 'GET' && url.pathname === '/api/dota/detect') return await detectDotaApi(res);
    if (req.method === 'POST' && url.pathname === '/api/install-gsi') return await installGsi(req, res);
    if (req.method === 'GET' && url.pathname === '/auth/twitch') return startTwitchAuth(url, res);
    if (req.method === 'GET' && url.pathname === '/auth/twitch/callback') return await finishTwitchAuth(url, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/logout') return await twitchLogout(res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/resolve-channel') return await resolveTwitchChannelApi(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/chat') return await sendChatMessage(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/predictions') return await createPrediction(req, res);
    if (req.method === 'GET' && url.pathname === '/api/twitch/predictions') return await getPredictions(res);

    const predictionAction = url.pathname.match(/^\/api\/twitch\/predictions\/([^/]+)\/(lock|cancel|resolve)$/);
    if (req.method === 'POST' && predictionAction) {
      return await endPrediction(req, res, decodeURIComponent(predictionAction[1]), predictionAction[2]);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) return await serveAsset(url.pathname, res);

    return await serveStatic(url.pathname, res);
  } catch (error) {
    logEvent('error', error.message);
    return sendJson(res, { error: error.message }, 500);
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`DotaStreamKit is already running or port ${port} is busy.`);
    console.error(`Open http://localhost:${port} or run: npm run stop`);
    process.exit(1);
  }
  throw error;
});

const listenHost = runtime.config.deployment?.mode === 'server' ? '0.0.0.0' : '127.0.0.1';
server.listen(port, listenHost, () => {
  const dashboardUrl = effectiveBaseUrl();
  logEvent('system', `DotaStreamKit started on ${dashboardUrl}`);
  console.log(`DotaStreamKit: ${dashboardUrl}`);
  console.log(`OBS overlay:   ${dashboardUrl}/overlay.html`);
});

setInterval(() => {
  refreshRuntimePresence().catch((error) => logEvent('system', `Runtime presence check failed: ${error.message}`));
}, 5000);

async function refreshRuntimePresence() {
  const processChanged = await refreshDotaProcessState();
  const hasSeenGsi = Boolean(runtime.state.gsi.lastSeenAt);
  const connected = hasSeenGsi && Date.now() - Date.parse(runtime.state.gsi.lastSeenAt) < 15000;
  if (hasSeenGsi && !connected) {
    maybeCancelPredictionForGsiTimeout().catch((error) => logEvent('twitch', `Auto cancel failed: ${error.message}`));
  }
  const connectionChanged = runtime.state.gsi.connected !== connected;
  runtime.state.gsi.connected = connected;
  if (connectionChanged && !connected) {
    runtime.state.gsi.gameState = null;
    runtime.state.gsi.playerHeroPicked = false;
    runtime.state.gsi.draftActiveTeam = null;
    runtime.state.gsi.ownPickPhaseEnded = false;
    runtime.state.gsi.inGameScreen = false;
    runtime.state.gsi.leftGameView = false;
  }
  const protection = computeProtection(runtime.config, runtime.state.gsi);
  const protectionChanged = !sameProtection(runtime.state.protection, protection);
  if (processChanged || connectionChanged || protectionChanged) {
    runtime.state.protection = protection;
    persistState();
    broadcast();
  }
}

async function refreshDotaProcessState() {
  const running = await isDotaProcessRunning();
  const checkedAt = new Date().toISOString();
  const changed = runtime.dotaProcess.running !== running;
  runtime.dotaProcess = { running, checkedAt };
  runtime.state.dota = { processRunning: running, processCheckedAt: checkedAt };
  return changed;
}

async function isDotaProcessRunning() {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('tasklist', ['/FI', `IMAGENAME eq ${dotaProcessName}`, '/NH'], { windowsHide: true });
      return stdout.toLowerCase().includes(dotaProcessName);
    }
    const { stdout } = await execFileAsync('pgrep', ['-x', 'dota2'], { windowsHide: true });
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

setInterval(() => {
  refreshTwitchStreamStatus().catch((error) => logEvent('twitch', `Stream status check failed: ${error.message}`));
}, 60000);

refreshTwitchStreamStatus().catch((error) => logEvent('twitch', `Stream status check failed: ${error.message}`));

async function loadJson(path, fallback) {
  try {
    return merge(structuredClone(fallback), JSON.parse(await readFile(path, 'utf8')));
  } catch {
    await writeFile(path, JSON.stringify(fallback, null, 2));
    return structuredClone(fallback);
  }
}

function merge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = merge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function persistConfig() {
  await writeFile(configPath, JSON.stringify(runtime.config, null, 2));
}

async function migrateConfig(config) {
  let changed = false;
  const beforeUi = JSON.stringify(config.ui || {});
  config.ui = merge(structuredClone(defaultConfig.ui), config.ui || {});
  normalizeUiConfig(config.ui);
  if (JSON.stringify(config.ui) !== beforeUi) changed = true;

  const beforeDeployment = JSON.stringify(config.deployment || {});
  config.deployment = merge(structuredClone(defaultConfig.deployment), config.deployment || {});
  normalizeDeploymentConfig(config.deployment);
  if (JSON.stringify(config.deployment) !== beforeDeployment) changed = true;

  const beforeTwitch = JSON.stringify(config.twitch || {});
  config.twitch = merge(structuredClone(defaultConfig.twitch), config.twitch || {});
  normalizeTwitchConfig(config.twitch);
  if (JSON.stringify(config.twitch) !== beforeTwitch) changed = true;

  const beforePredictions = JSON.stringify(config.predictions || {});
  config.predictions = merge(structuredClone(defaultConfig.predictions), config.predictions || {});
  normalizePredictionSettings(config.predictions);
  if (JSON.stringify(config.predictions) !== beforePredictions) changed = true;
  const box = config.protection?.topBarBox;
  const hasOldCenteredTopBarBox = box?.left === 485 && box?.top === 0 && box?.width === 950 && box?.height === 86;
  const hasFullWidthTopBarBox = box?.left === 0 && box?.top === 0 && box?.width === 1920 && box?.height === 124;
  const topBarBoxes = config.protection?.topBarBoxes;
  const hasPixelSplitTopBarBoxes = Array.isArray(topBarBoxes)
    && topBarBoxes[0]?.left === 0
    && topBarBoxes[0]?.width === 780
    && topBarBoxes[1]?.left === 1080
    && topBarBoxes[1]?.width === 840;
  const hasRelativeSplitTopBarBoxes = Array.isArray(topBarBoxes)
    && topBarBoxes[0]?.left === '0%'
    && topBarBoxes[1]?.left === '57%';
  const hasTopBarSlots = Array.isArray(config.protection?.topBarSlots) && config.protection.topBarSlots.length === 10;
  const hasCurrentTopBarSlots = hasTopBarSlots
    && config.protection.topBarSlots.every((slot, index) => {
      const expected = defaultConfig.protection.topBarSlots[index];
      return slot.left === expected.left
        && slot.top === expected.top
        && slot.width === expected.width
        && slot.height === expected.height
        && slot.asset === expected.asset;
    });
  if (hasOldCenteredTopBarBox || hasFullWidthTopBarBox || hasPixelSplitTopBarBoxes || hasRelativeSplitTopBarBoxes || !hasCurrentTopBarSlots) {
    config.protection.topBarSlots = structuredClone(defaultConfig.protection.topBarSlots);
    delete config.protection.topBarBox;
    delete config.protection.topBarBoxes;
    changed = true;
  }

  const referenceWidth = Number(config.protection.referenceSize?.width);
  const referenceHeight = Number(config.protection.referenceSize?.height);
  if (!Number.isFinite(referenceWidth) || referenceWidth <= 0 || !Number.isFinite(referenceHeight) || referenceHeight <= 0) {
    config.protection.referenceSize = structuredClone(defaultConfig.protection.referenceSize);
    changed = true;
  }
  if (!['normal', 'large'].includes(config.protection.minimapSize)) {
    config.protection.minimapSize = defaultConfig.protection.minimapSize;
    changed = true;
  }
  if (!['left', 'right'].includes(config.protection.minimapSide)) {
    config.protection.minimapSide = defaultConfig.protection.minimapSide;
    changed = true;
  }
  if (!['realistic', 'simple', 'empty'].includes(config.protection.minimapStyle)) {
    config.protection.minimapStyle = defaultConfig.protection.minimapStyle;
    changed = true;
  }
  if (!Number.isFinite(Number(config.protection.minimapOpacity))) {
    config.protection.minimapOpacity = defaultConfig.protection.minimapOpacity;
    changed = true;
  } else if (Number(config.protection.minimapOpacity) < 0.8) {
    config.protection.minimapOpacity = defaultConfig.protection.minimapOpacity;
    changed = true;
  }
  if (!config.protection.minimapBoxes) {
    const legacyBox = config.protection.minimapBox;
    config.protection.minimapBoxes = structuredClone(defaultConfig.protection.minimapBoxes);
    if (legacyBox?.width >= 300) config.protection.minimapBoxes.large = legacyBox;
    changed = true;
  }
  if (config.protection.minimapBox) {
    delete config.protection.minimapBox;
    changed = true;
  }
  const areas = config.protection.minimapContentAreas;
  const expectedAreas = defaultConfig.protection.minimapContentAreas;
  const hasCurrentContentAreas = areas?.normal
    && areas?.large
    && areas.normal.top === expectedAreas.normal.top
    && areas.normal.width === expectedAreas.normal.width
    && areas.large.top === expectedAreas.large.top
    && areas.large.width === expectedAreas.large.width;
  if (!hasCurrentContentAreas) {
    config.protection.minimapContentAreas = structuredClone(defaultConfig.protection.minimapContentAreas);
    changed = true;
  }
  const hasOldRightChatDraftCutout = Array.isArray(config.protection.draftMaskParts)
    && config.protection.draftMaskParts.length === 4
    && Number(config.protection.draftMaskParts[1]?.left) === 0
    && Number(config.protection.draftMaskParts[1]?.top) === 870
    && Number(config.protection.draftMaskParts[1]?.width) === 1234
    && Number(config.protection.draftMaskParts[2]?.left) === 1720
    && Number(config.protection.draftMaskParts[2]?.top) === 870;
  if (!Array.isArray(config.protection.draftMaskParts) || config.protection.draftMaskParts.length !== 4 || hasOldRightChatDraftCutout) {
    config.protection.draftMaskParts = structuredClone(defaultConfig.protection.draftMaskParts);
    changed = true;
  }
  if (!['partial', 'full'].includes(config.protection.queueMode)) {
    config.protection.queueMode = defaultConfig.protection.queueMode;
    changed = true;
  }
  if (config.protection.queueAutoModeVersion !== 2) {
    if (['search', 'always'].includes(config.protection.queueAutoMode)) {
      config.protection.queueAutoMode = 'menu_search';
    }
    config.protection.queueAutoModeVersion = 2;
    changed = true;
  }
  if (!['search', 'menu_search'].includes(config.protection.queueAutoMode)) {
    config.protection.queueAutoMode = defaultConfig.protection.queueAutoMode;
    changed = true;
  }
  if (!Number.isFinite(Number(config.protection.queueProfileRight)) || Number(config.protection.queueProfileRight) < 0) {
    config.protection.queueProfileRight = defaultConfig.protection.queueProfileRight;
    changed = true;
  }
  if (config.protection.queueMaskParts) {
    delete config.protection.queueMaskParts;
    changed = true;
  }
  const queueChatBox = config.protection.queueChatBox;
  if (!queueChatBox || !Number.isFinite(Number(queueChatBox.left)) || !Number.isFinite(Number(queueChatBox.width))) {
    config.protection.queueChatBox = structuredClone(defaultConfig.protection.queueChatBox);
    changed = true;
  }

  if (changed) await persistConfig();
}

async function persistState() {
  const saved = { ...runtime.state, events: runtime.state.events.slice(0, 100) };
  await writeFile(statePath, JSON.stringify(saved, null, 2));
}

async function loadTwitchTokenBackup() {
  try {
    return JSON.parse(await readFile(twitchTokenPath, 'utf8'));
  } catch {
    return null;
  }
}

async function persistTwitchTokenBackup() {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) return;
  await writeFile(twitchTokenPath, JSON.stringify(token, null, 2));
}

async function deleteTwitchTokenBackup() {
  await rm(twitchTokenPath, { force: true });
}

async function ensureGeneratedAssets() {
  await seedDefaultAssets();
  await ensureBaseWardAssets();
  await rebuildMinimapAssets();
  try {
    await stat(join(assetDir, 'draft-screenshot.png'));
    await buildSlotsFromDraftScreenshot();
  } catch {
    await copyDefaultAsset('draft-screenshot.png');
    await buildSlotsFromDraftScreenshot();
  }
  try {
    await stat(join(assetDir, 'queue-screenshot.png'));
  } catch {
    await copyDefaultAsset('queue-screenshot.png');
  }
}

async function seedDefaultAssets() {
  for (const name of defaultSeedAssetNames()) {
    await copyDefaultAsset(name, false);
  }
}

async function copyDefaultAsset(name, skipIfExists = true) {
  const target = join(assetDir, name);
  if (skipIfExists) {
    try {
      await stat(target);
      return false;
    } catch {}
  }
  try {
    await copyFile(join(defaultAssetDir, name), target);
    return true;
  } catch {
    return false;
  }
}

async function ensureBaseWardAssets() {
  const wardCopied = await copyDefaultAsset('ward-eye.png');
  if (!wardCopied) {
    try {
      await stat(join(assetDir, 'ward-eye.png'));
    } catch {
      await writeFile(join(assetDir, 'ward-eye.png'), await generateWardEyePng());
    }
  }
  const sentryCopied = await copyDefaultAsset('sentry-eye.png');
  if (!sentryCopied) {
    try {
      await stat(join(assetDir, 'sentry-eye.png'));
    } catch {
      await writeFile(join(assetDir, 'sentry-eye.png'), await generateSentryEyePng());
    }
  }
}

async function rebuildMinimapAssets() {
  await writeFile(join(assetDir, 'ward-eye-green.png'), await makeDotaMinimapIcon(join(assetDir, 'ward-eye.png'), 64, 36));
  await writeFile(join(assetDir, 'sentry-eye-green.png'), await makeDotaMinimapIcon(join(assetDir, 'sentry-eye.png'), 64, 36));
  await writeFile(join(assetDir, 'minimap-wards.png'), await generateMinimapWardsPng());
  for (const style of ['realistic', 'simple', 'empty']) {
    await writeFile(join(assetDir, `fake-minimap-vision-${style}.png`), await generateFakeMinimapVisionPng(style));
  }
}

async function generateWardEyePng() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="18" viewBox="0 0 32 18">
    <path d="M2 9C5.9 3.1 10.7 1.2 16 1.2S26.1 3.1 30 9c-3.9 5.9-8.7 7.8-14 7.8S5.9 14.9 2 9Z" fill="#1cff22"/>
    <path d="M4.7 9C8.2 4.9 12 3.5 16 3.5S23.8 4.9 27.3 9c-3.5 4.1-7.3 5.5-11.3 5.5S8.2 13.1 4.7 9Z" fill="#75ff61"/>
    <ellipse cx="16" cy="9" rx="6.4" ry="5.2" fill="#0b1c12"/>
    <ellipse cx="16" cy="9" rx="3.4" ry="2.8" fill="#020604"/>
    <circle cx="18.4" cy="7.2" r="1.2" fill="#caffbc" opacity="0.9"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

async function generateSentryEyePng() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="18" viewBox="0 0 32 18">
    <path d="M16 2.2L29 9L16 15.8L3 9Z" fill="#1cff22"/>
    <path d="M16 4.2L25 9L16 13.8L7 9Z" fill="#78ff62"/>
    <path d="M16 6.2L21 9L16 11.8L11 9Z" fill="#06140b" opacity="0.8"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

async function generateMinimapWardsPng() {
  const points = minimapWardPoints();
  const sentryPoints = points.filter((_, index) => index % 4 === 1 || index % 7 === 0);
  const observerPoints = points.filter((point) => !sentryPoints.includes(point));
  const vision = observerPoints.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="38" fill="#c9ffd4" opacity="0.14"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="transparent"/>
    ${vision}
  </svg>`;
  const base = sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true });
  const wardIcon = await makeDotaMinimapIcon(join(assetDir, 'ward-eye.png'), 24, 14);
  const sentryIcon = await makeDotaMinimapIcon(join(assetDir, 'sentry-eye.png'), 24, 14);
  const observerComposites = observerPoints.map(([x, y], index) => ({
    input: wardIcon,
    left: Math.max(0, Math.round(x - 12 + (index % 3) - 1)),
    top: Math.max(0, Math.round(y - 7 + (index % 2)))
  }));
  const sentryComposites = sentryPoints.map(([x, y], index) => ({
    input: sentryIcon,
    left: Math.max(0, Math.round(x - 12 + (index % 3) - 1)),
    top: Math.max(0, Math.round(y - 7 + (index % 2)))
  }));
  return base.composite([...observerComposites, ...sentryComposites]).toBuffer();
}

async function generateFakeMinimapVisionPng(style = 'realistic') {
  const basePath = style === 'simple'
    ? join(assetDir, 'minimap-base-simple.png')
    : join(assetDir, 'minimap-base-realistic.png');
  let baseBuffer;
  if (style !== 'empty') {
    try {
      baseBuffer = await readFile(basePath);
    } catch {
      baseBuffer = await generateFallbackMinimapBasePng(style);
      await writeFile(basePath, baseBuffer);
    }
  }

  const baseLayer = style === 'empty' ? null : await makeTransparentMinimapBase(baseBuffer, style);
  const wardIcon = await makeDotaMinimapIcon(join(assetDir, 'ward-eye.png'), 25, 15);
  const sentryIcon = await makeDotaMinimapIcon(join(assetDir, 'sentry-eye.png'), 23, 14);
  const points = minimapWardPoints();
  const sentryPoints = points.filter((_, index) => index % 4 === 1 || index % 7 === 0);
  const observerPoints = points.filter((point) => !sentryPoints.includes(point));

  const glowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="transparent"/>
    ${observerPoints.map(([x, y]) => `<radialGradient id="g${x}_${y}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#d6ffe3" stop-opacity="${style === 'empty' ? '0.22' : '0.18'}"/>
      <stop offset="45%" stop-color="#a8f5d7" stop-opacity="${style === 'empty' ? '0.11' : '0.085'}"/>
      <stop offset="100%" stop-color="#78cfc2" stop-opacity="0"/>
    </radialGradient><circle cx="${x}" cy="${y}" r="${style === 'empty' ? 30 : 27}" fill="url(#g${x}_${y})"/>`).join('')}
  </svg>`;

  const glows = await sharp(Buffer.from(glowSvg))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const observerComposites = observerPoints.map(([x, y], index) => ({
    input: wardIcon,
    left: clampInt(Math.round(x - 12 + (index % 3) - 1), 0, 487),
    top: clampInt(Math.round(y - 7 + (index % 2)), 0, 497)
  }));
  const sentryComposites = sentryPoints.map(([x, y], index) => ({
    input: sentryIcon,
    left: clampInt(Math.round(x - 11 + (index % 3) - 1), 0, 489),
    top: clampInt(Math.round(y - 7 + (index % 2)), 0, 498)
  }));

  return sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      ...(baseLayer ? [{ input: baseLayer, left: 0, top: 0 }] : []),
      { input: glows, left: 0, top: 0 },
      ...observerComposites,
      ...sentryComposites
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function minimapWardPoints() {
  return [
    [42, 34], [102, 42], [172, 30], [248, 48], [328, 36], [414, 42], [474, 58],
    [56, 92], [132, 82], [218, 104], [304, 88], [386, 96], [456, 126],
    [40, 164], [104, 150], [186, 166], [272, 150], [350, 174], [438, 162],
    [74, 232], [150, 218], [236, 238], [318, 222], [404, 234], [468, 252],
    [48, 312], [126, 292], [212, 312], [294, 300], [382, 316], [454, 294],
    [72, 378], [156, 362], [242, 382], [326, 362], [410, 386], [470, 360],
    [48, 448], [132, 430], [222, 454], [312, 434], [402, 450], [468, 430],
    [88, 52], [272, 36], [372, 58],
    [82, 126], [252, 116], [420, 118],
    [144, 190], [224, 194], [384, 198],
    [108, 258], [278, 264], [430, 276],
    [172, 336], [344, 338],
    [94, 404], [270, 414], [438, 408]
  ];
}

async function makeTransparentMinimapBase(buffer, style) {
  const { data, info } = await sharp(buffer)
    .resize(512, 512, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .modulate({
      brightness: style === 'simple' ? 0.86 : 0.9,
      saturation: style === 'simple' ? 0.48 : 0.72
    })
    .tint({ r: 150, g: 200, b: 202 })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const brightness = (r + g + b) / 3;
    const darkCutoff = Math.max(0, Math.min(1, (brightness - 16) / 36));
    const alpha = Math.round((style === 'simple' ? 150 : 178) * darkCutoff);
    data[offset] = Math.min(255, Math.round(r * 1.08 + 8));
    data[offset + 1] = Math.min(255, Math.round(g * 1.08 + 10));
    data[offset + 2] = Math.min(255, Math.round(b * 1.08 + 12));
    data[offset + 3] = alpha;
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function generateFallbackMinimapBasePng(style = 'realistic') {
  const trees = style === 'simple' ? '' : `
    <circle cx="90" cy="118" r="9" fill="#314f45" opacity="0.62"/>
    <circle cx="168" cy="340" r="8" fill="#385542" opacity="0.58"/>
    <circle cx="392" cy="142" r="10" fill="#2f4d48" opacity="0.5"/>
    <circle cx="424" cy="404" r="9" fill="#405d42" opacity="0.55"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="#24343a"/>
    <path d="M34 396 C128 350 192 316 246 254 C306 188 356 120 488 82" stroke="#6aa5aa" stroke-width="54" fill="none" opacity="0.65"/>
    <path d="M26 418 C164 352 264 250 490 118" stroke="#b9c6bf" stroke-width="22" fill="none" opacity="0.45"/>
    <path d="M76 112 C180 104 244 110 346 86" stroke="#b9c6bf" stroke-width="18" fill="none" opacity="0.32"/>
    <path d="M104 470 C198 420 304 388 446 390" stroke="#b9c6bf" stroke-width="18" fill="none" opacity="0.28"/>
    ${trees}
  </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

async function makeDotaMinimapIcon(path, width, height) {
  const { data, info } = await sharp(await readFile(path))
    .resize({ width, height, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3];
    if (alpha < 8) {
      data[offset] = 0;
      data[offset + 1] = 0;
      data[offset + 2] = 0;
      data[offset + 3] = 0;
      continue;
    }

    const brightness = (data[offset] + data[offset + 1] + data[offset + 2]) / 3;
    if (brightness > 70) {
      const strength = Math.min(1, Math.max(0.35, (brightness - 70) / 185));
      data[offset] = Math.round(24 + 18 * strength);
      data[offset + 1] = Math.round(205 + 50 * strength);
      data[offset + 2] = Math.round(18 + 20 * strength);
    } else {
      data[offset] = 0;
      data[offset + 1] = 13;
      data[offset + 2] = 3;
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function sendJson(res, payload, status = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  res.end(body);
}

function sendText(res, text, status = 200, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  res.end(text);
}

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

async function serveStatic(pathname, res) {
  const path = pathname === '/' ? '/index.html' : pathname;
  const filePath = normalize(join(publicDir, path));
  if (!filePath.startsWith(publicDir)) return sendText(res, 'Forbidden', 403);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return sendText(res, 'Not found', 404);
  } catch {
    return sendText(res, 'Not found', 404);
  }

  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  res.writeHead(200, {
    'content-type': types[extname(filePath)] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
}

async function serveAsset(pathname, res) {
  const basename = pathname.split('/').pop();
  if (!assetNames().includes(basename)) return sendText(res, 'Not found', 404);

  const filePath = join(assetDir, basename);
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return sendText(res, 'Not found', 404);
  } catch {
    return sendText(res, 'Not found', 404);
  }

  res.writeHead(200, {
    'content-type': 'image/png',
    'cache-control': 'no-store'
  });
  createReadStream(filePath).pipe(res);
}

async function assetStatus(res) {
  const status = {};
  for (const name of assetNames()) {
    try {
      const fileStat = await stat(join(assetDir, name));
      status[name] = { exists: fileStat.isFile(), bytes: fileStat.size, kilobytes: Math.round(fileStat.size / 1024) };
    } catch {
      status[name] = { exists: false, bytes: 0 };
    }
  }
  sendJson(res, status);
}

async function uploadAsset(req, res) {
  const body = await readBody(req);
  if (!['draft-screenshot.png', 'queue-screenshot.png'].includes(body.name)) {
    throw new Error('Only draft-screenshot.png or queue-screenshot.png can be uploaded from the dashboard');
  }
  const match = String(body.dataUrl || '').match(/^data:image\/(?:png|jpeg|webp);base64,([a-z0-9+/=]+)$/i);
  if (!match) throw new Error('Upload a PNG, JPEG or WebP image');

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > 30 * 1024 * 1024) throw new Error('Image is too large');

  const optimized = await optimizeDraftScreenshot(buffer);
  await writeFile(join(assetDir, body.name), optimized);
  if (body.name === 'draft-screenshot.png') await buildSlotsFromDraftScreenshot(optimized);
  logEvent('system', `Overlay asset optimized: ${body.name}`, {
    originalBytes: buffer.length,
    optimizedBytes: optimized.length
  });
  await assetStatus(res);
}

async function optimizeDraftScreenshot(buffer) {
  return sharp(buffer, { failOn: 'warning' })
    .rotate()
    .resize({
      width: 1920,
      height: 1080,
      fit: 'fill',
      kernel: sharp.kernel.lanczos3
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      quality: 90
    })
    .toBuffer();
}

async function buildSlotsFromDraftScreenshot(buffer = null) {
  const input = buffer || await readFile(join(assetDir, 'draft-screenshot.png'));
  for (const slot of defaultConfig.protection.topBarSlots) {
    await sharp(input)
      .extract({ left: slot.left, top: slot.top, width: slot.width, height: slot.height })
      .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90 })
      .toFile(join(assetDir, slot.asset));
  }
  logEvent('system', 'Top draft hero slots rebuilt from full screenshot');
}

function assetNames() {
  return [
    'ward-eye.png',
    'sentry-eye.png',
    'ward-eye-green.png',
    'sentry-eye-green.png',
    'minimap-wards.png',
    'minimap-base-realistic.png',
    'minimap-base-simple.png',
    'fake-minimap-vision-realistic.png',
    'fake-minimap-vision-simple.png',
    'fake-minimap-vision-empty.png',
    'draft-screenshot.png',
    'queue-screenshot.png',
    ...Array.from({ length: 10 }, (_, index) => `topbar-slot-${index}.png`)
  ];
}

function defaultSeedAssetNames() {
  return [
    'draft-screenshot.png',
    'ward-eye.png',
    'sentry-eye.png',
    'minimap-base-realistic.png',
    'minimap-base-simple.png'
  ];
}

function publicState() {
  const { twitchToken, ...safeRuntimeState } = runtime.state;
  return {
    config: sanitizeConfig(runtime.config),
    state: {
      ...safeRuntimeState,
      twitch: { ...runtime.state.twitch },
      events: runtime.state.events.slice(0, 50)
    }
  };
}

function sanitizeConfig(config) {
  return {
    ...config,
    twitch: {
      ...config.twitch,
      clientSecret: config.twitch.clientSecret ? '********' : ''
    }
  };
}

function hydrateTwitchStatus() {
  const token = runtime.state.twitchToken;
  const scopes = normalizeScopes(token?.scopes || []);
  const missingScopes = token?.accessToken ? twitchScopes.filter((scope) => !scopes.includes(scope)) : [];
  const streamStatus = runtime.twitchStreamStatus || {};
  const target = twitchTargetChannel();
  runtime.state.twitch = {
    authenticated: Boolean(token?.accessToken),
    broadcasterId: token?.broadcasterId || null,
    broadcasterLogin: token?.broadcasterLogin || null,
    channelMode: runtime.config.twitch.channelMode,
    targetBroadcasterId: runtime.config.twitch.targetBroadcasterId || null,
    targetBroadcasterLogin: runtime.config.twitch.targetBroadcasterLogin || runtime.config.twitch.targetChannelLogin || null,
    effectiveBroadcasterId: target.broadcasterId || null,
    effectiveBroadcasterLogin: target.broadcasterLogin || null,
    targetMatchesToken: target.broadcasterId && token?.broadcasterId ? String(target.broadcasterId) === String(token.broadcasterId) : null,
    effectiveRedirectUri: effectiveRedirectUri(),
    tokenExpiresAt: token?.expiresAt || null,
    scopes,
    missingScopes,
    needsReconnect: missingScopes.length > 0,
    isLive: streamStatus.isLive,
    streamId: streamStatus.streamId || null,
    streamGameName: streamStatus.gameName || null,
    streamTitle: streamStatus.title || null,
    streamCheckedAt: streamStatus.checkedAt ? new Date(streamStatus.checkedAt).toISOString() : null
  };
}

async function restoreTwitchStatus() {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) {
    hydrateTwitchStatus();
    return;
  }

  try {
    if (Date.parse(token.expiresAt || 0) - Date.now() <= 60000) {
      await refreshTokenIfNeeded();
      hydrateTwitchStatus();
      await persistTwitchTokenBackup();
      await persistState();
      return;
    }

    const validation = await validateToken(token.accessToken);
    runtime.state.twitchToken = {
      ...token,
      broadcasterId: validation.user_id || token.broadcasterId,
      broadcasterLogin: validation.login || token.broadcasterLogin,
      scopes: validation.scopes || token.scopes || [],
      expiresAt: validation.expires_in
        ? new Date(Date.now() + validation.expires_in * 1000).toISOString()
        : token.expiresAt
    };
    hydrateTwitchStatus();
    await persistTwitchTokenBackup();
    await persistState();
  } catch (error) {
    try {
      await refreshTokenIfNeeded(true);
      hydrateTwitchStatus();
      await persistTwitchTokenBackup();
      await persistState();
    } catch {
      hydrateTwitchStatus();
      runtime.state.twitch.authenticated = false;
      runtime.state.twitch.needsReconnect = true;
      runtime.state.twitch.authError = error.message;
      await persistState();
      logEvent('twitch', `Saved Twitch token could not be restored: ${error.message}`);
    }
  }
}

function logEvent(type, message, data = null) {
  runtime.state.events.unshift({ at: new Date().toISOString(), type, message, data });
  runtime.state.events = runtime.state.events.slice(0, 200);
  persistState().catch(() => {});
  broadcast();
}

function broadcast() {
  const payload = `data: ${JSON.stringify(publicState())}\n\n`;
  for (const client of runtime.clients) {
    client.write(payload);
  }
}

function handleEvents(req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive'
  });
  res.write(`data: ${JSON.stringify(publicState())}\n\n`);
  runtime.clients.add(res);
  req.on('close', () => runtime.clients.delete(res));
}

async function updateConfig(req, res) {
  const body = await readBody(req);
  const next = merge(structuredClone(runtime.config), body);
  if (body.twitch?.clientSecret === '********') {
    next.twitch.clientSecret = runtime.config.twitch.clientSecret;
  }
  normalizeDeploymentConfig(next.deployment);
  normalizeUiConfig(next.ui);
  normalizeTwitchConfig(next.twitch);
  next.predictions.windowSeconds = clampInt(next.predictions.windowSeconds, 30, 1800);
  next.predictions.autoLockAtGameSeconds = clampInt(next.predictions.autoLockAtGameSeconds, 0, 3600);
  next.predictions.autoCancelDisconnectSeconds = clampInt(next.predictions.autoCancelDisconnectSeconds, 300, 1800);
  normalizePredictionSettings(next.predictions);
  runtime.config = next;
  if (body.twitch?.channelMode || body.twitch?.targetChannelLogin) {
    resetTwitchStreamStatus();
    await resolveConfiguredTwitchChannel();
  }
  hydrateTwitchStatus();
  runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
  await persistConfig();
  await persistState();
  logEvent('config', 'Settings updated');
  sendJson(res, publicState());
}

async function updateProtection(req, res) {
  const body = await readBody(req);
  for (const key of ['manualDraft', 'manualMinimap', 'manualTopBar', 'manualQueue']) {
    if (typeof body[key] === 'boolean') runtime.config.protection[key] = body[key];
  }
  for (const key of ['autoDraft', 'autoMinimap', 'autoQueue']) {
    if (typeof body[key] === 'boolean') runtime.config.protection[key] = body[key];
  }
  if (['partial', 'full'].includes(body.queueMode)) {
    runtime.config.protection.queueMode = body.queueMode;
  }
  if (['search', 'menu_search'].includes(body.queueAutoMode)) {
    runtime.config.protection.queueAutoMode = body.queueAutoMode;
    runtime.config.protection.queueAutoModeVersion = 2;
  }
  if (['normal', 'large'].includes(body.minimapSize)) {
    runtime.config.protection.minimapSize = body.minimapSize;
  }
  if (['left', 'right'].includes(body.minimapSide)) {
    runtime.config.protection.minimapSide = body.minimapSide;
  }
  if (['realistic', 'simple', 'empty'].includes(body.minimapStyle)) {
    runtime.config.protection.minimapStyle = body.minimapStyle;
  }
  runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
  await persistConfig();
  await persistState();
  broadcast();
  sendJson(res, publicState());
}

async function handleGsi(req, res) {
  const payload = await readBody(req);
  const previous = { ...runtime.state.gsi };
  const map = payload.map || {};
  const player = payload.player || {};
  const hero = payload.hero || {};
  const draft = payload.draft || {};
  const gameState = map.game_state || null;
  const matchId = map.matchid || map.match_id || null;
  const lifecycle = inferGsiLifecycle(previous, gameState, matchId);
  const playerActivity = player.activity || null;
  const playerTeam = normalizeTeam(player.team_name || player.team || player.activity);
  const teamStats = collectTeamStats(payload, playerTeam);
  const heroName = hero.name || hero.localized_name || (!lifecycle.newDraft ? previous.heroName : null) || null;
  const heroId = hero.id ?? hero.hero_id ?? (!lifecycle.newDraft ? previous.heroId : null) ?? null;
  const kills = statNumber(player.kills, previous.kills);
  const deaths = statNumber(player.deaths, previous.deaths);
  const assists = statNumber(player.assists, previous.assists);
  const lastHits = statNumber(player.last_hits ?? player.lastHits, previous.lastHits);
  const denies = statNumber(player.denies, previous.denies);
  const level = statNumber(hero.level, previous.level);
  const playerHeroPicked = inferPlayerHeroPicked(previous, gameState, hero, lifecycle);
  const draftActiveTeam = inferDraftActiveTeam(draft);
  const ownPickPhaseEnded = inferOwnPickPhaseEnded({ previous, gameState, playerHeroPicked, draftActiveTeam, playerTeam, lifecycle });
  const activeMatchId = inferActiveMatchId(previous, gameState, matchId, lifecycle);
  const queueSearchSignal = inferQueueSearchSignal(payload);
  const inGameScreen = inferInGameScreen(gameState, playerActivity);
  const leftGameView = inferLeftGameView({
    connected: true,
    activeMatchId,
    gameState,
    playerActivity,
    hasLivePayload: Boolean(payload.hero || payload.abilities || payload.items)
  });
  const gsi = {
    connected: true,
    lastSeenAt: new Date().toISOString(),
    gameState,
    clockTime: Number.isFinite(map.clock_time) ? map.clock_time : null,
    matchId,
    activeMatchId,
    playerActivity,
    playerTeam,
    winTeam: normalizeTeam(map.win_team),
    heroName,
    heroId,
    kills,
    deaths,
    assists,
    lastHits,
    denies,
    level,
    ...teamStats,
    playerHeroPicked,
    draftActiveTeam,
    ownPickPhaseEnded,
    draftCycle: lifecycle.draftCycle,
    queueSearchSignal,
    inGameScreen,
    leftGameView
  };

  runtime.state.gsi = gsi;
  runtime.state.protection = computeProtection(runtime.config, gsi);
  await maybeAutomatePrediction(previous, gsi);
  await persistState();
  broadcast();
  sendJson(res, { ok: true });
}

function computeProtection(config, gsi) {
  const gameState = String(gsi.gameState || '');
  const connected = Boolean(gsi.connected);
  const heroSelection = connected && /HERO_SELECTION/i.test(gameState);
  const draftByState = heroSelection && !gsi.ownPickPhaseEnded;
  const topBarByState = heroSelection && gsi.ownPickPhaseEnded;
  const gameByState = connected && !gsi.leftGameView && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState);
  const queueByState = stableQueueAutoState(config, gsi);
  return {
    draft: Boolean(config.protection.manualDraft || (config.protection.autoDraft && draftByState)),
    minimap: Boolean(config.protection.manualMinimap || (config.protection.autoMinimap && gameByState)),
    topBar: Boolean(config.protection.manualTopBar || (config.protection.autoDraft && topBarByState)),
    queue: Boolean(config.protection.manualQueue || (config.protection.autoQueue && queueByState))
  };
}

function stableQueueAutoState(config, gsi) {
  if (!config.protection.autoQueue) {
    resetQueueAuto(false);
    return false;
  }
  if (runtime.dotaProcess.running === false) {
    resetQueueAuto(false);
    return false;
  }

  const desired = inferQueueSearchScreen(gsi);
  const now = Date.now();
  if (runtime.queueAuto.desired !== desired) {
    runtime.queueAuto.desired = desired;
    runtime.queueAuto.desiredSince = now;
  }

  const delay = desired ? queueAutoOnDelayMs : queueAutoOffDelayMs;
  if (now - runtime.queueAuto.desiredSince >= delay) {
    runtime.queueAuto.active = desired;
  }
  return runtime.queueAuto.active;
}

function resetQueueAuto(active) {
  runtime.queueAuto.active = active;
  runtime.queueAuto.desired = active;
  runtime.queueAuto.desiredSince = Date.now();
}

function sameProtection(left, right) {
  return Boolean(left)
    && Boolean(right)
    && left.draft === right.draft
    && left.minimap === right.minimap
    && left.topBar === right.topBar
    && left.queue === right.queue;
}

function inferQueueSearchScreen(gsi) {
  if (runtime.dotaProcess.running === false) return false;
  const state = String(gsi.gameState || '');
  if (inGameStatePattern.test(state)) return false;
  if (gsi.queueSearchSignal) return true;
  if (runtime.config.protection.queueAutoMode === 'search') return false;

  if (runtime.dotaProcess.running === true && !gsi.lastSeenAt) return true;

  const lastSeenAt = Date.parse(gsi.lastSeenAt || '');
  const hasSeenGsi = Number.isFinite(lastSeenAt);
  if (!hasSeenGsi) return false;
  if (Date.now() - lastSeenAt > queueAutoStaleKeepMs) return false;

  if (gsi.leftGameView) return true;
  if (gsi.connected) return !gsi.inGameScreen;
  return runtime.queueAuto.active || runtime.queueAuto.desired;
}

function inferQueueSearchSignal(payload) {
  const candidates = [
    payload?.map?.game_state,
    payload?.map?.state,
    payload?.map?.activity,
    payload?.player?.activity,
    payload?.provider?.game_state,
    payload?.provider?.activity,
    payload?.matchmaking?.state,
    payload?.matchmaking?.status,
    payload?.queue?.state,
    payload?.queue?.status,
    payload?.lobby?.state,
    payload?.lobby?.status
  ];
  if (candidates.some((value) => queueSearchPattern.test(String(value || '')))) return true;
  return objectHasQueueSearchSignal(payload, 0);
}

function objectHasQueueSearchSignal(value, depth) {
  if (!value || depth > 3) return false;
  if (typeof value !== 'object') return queueSearchPattern.test(String(value));
  if (Array.isArray(value)) return value.some((item) => objectHasQueueSearchSignal(item, depth + 1));
  return Object.entries(value).some(([key, item]) => queueSearchPattern.test(key) || objectHasQueueSearchSignal(item, depth + 1));
}

function inferGsiLifecycle(previous, gameState, matchId) {
  const previousState = String(previous.gameState || '');
  const state = String(gameState || '');
  const heroSelection = /HERO_SELECTION/i.test(state);
  const wasHeroSelection = /HERO_SELECTION/i.test(previousState);
  const matchChanged = Boolean(matchId && previous.activeMatchId && String(matchId) !== String(previous.activeMatchId));
  const returnedToDraft = heroSelection && !wasHeroSelection;
  const newDraft = heroSelection && (returnedToDraft || matchChanged || !previous.connected);
  return {
    matchChanged,
    returnedToDraft,
    newDraft,
    draftCycle: newDraft ? Number(previous.draftCycle || 0) + 1 : Number(previous.draftCycle || 0)
  };
}

function inferPlayerHeroPicked(previous, gameState, hero, lifecycle = {}) {
  if (/POST_GAME/i.test(String(gameState || ''))) return false;
  const hasHero = Boolean(hero?.name || hero?.localized_name || hero?.id || hero?.hero_id);
  if (/HERO_SELECTION/i.test(String(gameState || '')) && lifecycle.newDraft && !hasHero) return false;
  const inheritedHero = !lifecycle.newDraft && Boolean(previous.playerHeroPicked || previous.heroName || previous.heroId);
  return hasHero || inheritedHero;
}

function inferDraftActiveTeam(draft) {
  if (!draft || typeof draft !== 'object') return null;
  const direct = draft.active_team ?? draft.activeteam ?? draft.activeTeam ?? draft.pick_team ?? draft.pickTeam;
  const normalizedDirect = normalizeDraftTeam(direct);
  if (normalizedDirect) return normalizedDirect;
  for (const [key, value] of Object.entries(draft)) {
    if (!/active.*team|team.*active|pick.*team/i.test(key)) continue;
    const normalized = normalizeDraftTeam(value);
    if (normalized) return normalized;
  }
  return null;
}

function inferOwnPickPhaseEnded({ previous, gameState, playerHeroPicked, draftActiveTeam, playerTeam, lifecycle = {} }) {
  const state = String(gameState || '');
  if (!/HERO_SELECTION/i.test(state)) {
    if (/STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state) && playerHeroPicked && !lifecycle.newDraft) return true;
    return false;
  }
  if (!playerHeroPicked) return false;
  if (draftActiveTeam && playerTeam) return draftActiveTeam !== playerTeam;
  return true;
}

function inferActiveMatchId(previous, gameState, matchId, lifecycle = {}) {
  if (/POST_GAME/i.test(String(gameState || ''))) return null;
  if (matchId) return matchId;
  if (lifecycle.newDraft) return null;
  return previous.activeMatchId || previous.matchId || null;
}

function inferInGameScreen(gameState, playerActivity) {
  const state = String(gameState || '');
  const activity = String(playerActivity || '').toLowerCase();
  if (/DISCONNECT|POST_GAME/i.test(state)) return false;
  if (activity && !['playing', 'spectating'].includes(activity)) return false;
  return inGameStatePattern.test(state) && !/POST_GAME/i.test(state);
}

function collectTeamStats(payload, playerTeam) {
  const players = Object.values(payload.allplayers || payload.players || {}).filter((item) => item && typeof item === 'object');
  const empty = {
    teamKills: null,
    teamDeaths: null,
    teamAssists: null,
    enemyKills: null,
    enemyDeaths: null,
    enemyAssists: null,
    totalKills: null,
    totalDeaths: null,
    totalAssists: null
  };
  if (!players.length) return empty;

  const totals = {
    teamKills: 0,
    teamDeaths: 0,
    teamAssists: 0,
    enemyKills: 0,
    enemyDeaths: 0,
    enemyAssists: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0
  };
  let hasTeam = false;
  let hasEnemy = false;

  for (const player of players) {
    const team = normalizeTeam(player.team_name || player.team || player.team_slot || player.player_slot);
    const kills = statNumber(player.kills, 0) || 0;
    const deaths = statNumber(player.deaths, 0) || 0;
    const assists = statNumber(player.assists, 0) || 0;
    totals.totalKills += kills;
    totals.totalDeaths += deaths;
    totals.totalAssists += assists;
    if (playerTeam && team === playerTeam) {
      totals.teamKills += kills;
      totals.teamDeaths += deaths;
      totals.teamAssists += assists;
      hasTeam = true;
    } else if (playerTeam && team && team !== playerTeam) {
      totals.enemyKills += kills;
      totals.enemyDeaths += deaths;
      totals.enemyAssists += assists;
      hasEnemy = true;
    }
  }

  return {
    teamKills: hasTeam ? totals.teamKills : null,
    teamDeaths: hasTeam ? totals.teamDeaths : null,
    teamAssists: hasTeam ? totals.teamAssists : null,
    enemyKills: hasEnemy ? totals.enemyKills : null,
    enemyDeaths: hasEnemy ? totals.enemyDeaths : null,
    enemyAssists: hasEnemy ? totals.enemyAssists : null,
    totalKills: totals.totalKills,
    totalDeaths: totals.totalDeaths,
    totalAssists: totals.totalAssists
  };
}

function inferLeftGameView({ connected, activeMatchId, gameState, playerActivity, hasLivePayload }) {
  if (!connected || !activeMatchId) return false;
  const state = String(gameState || '');
  const activity = String(playerActivity || '').toLowerCase();
  if (/POST_GAME/i.test(state)) return false;
  if (/DISCONNECT/i.test(state)) return true;
  if (activity && !['playing', 'spectating'].includes(activity)) return true;
  if (!inGameStatePattern.test(state)) return true;
  if (/GAME_IN_PROGRESS|PRE_GAME/i.test(state) && activity === 'playing' && !hasLivePayload) return true;
  return false;
}

async function maybeAutomatePrediction(previous, gsi) {
  const settings = runtime.config.predictions;
  if (!runtime.state.twitchToken?.accessToken) return;

  syncActivePredictionMatchId(gsi);
  const active = runtime.state.activePrediction;
  if (active && ['ACTIVE', 'LOCKED'].includes(active.status)) {
    if (settings.autoCancelInvalidGame) {
      await maybeCancelPredictionForInvalidGame(previous, gsi);
    }

    const latestAfterCancel = runtime.state.activePrediction;
    if (latestAfterCancel && ['ACTIVE', 'LOCKED'].includes(latestAfterCancel.status)) {
      if (latestAfterCancel.status === 'ACTIVE' && settings.autoLockAtGameSeconds > 0 && gsi.clockTime >= settings.autoLockAtGameSeconds) {
        try {
          await twitchEndPrediction(latestAfterCancel.id, 'LOCKED');
          logEvent('twitch', 'Prediction locked automatically');
        } catch (error) {
          logEvent('twitch', `Auto lock failed: ${error.message}`);
        }
      }

      const result = inferPredictionResult(gsi);
      if (settings.autoResolve && result) {
        let latestActive = runtime.state.activePrediction || latestAfterCancel;
        if (settings.cancelUncontestedPrediction) {
          try {
            latestActive = await refreshActivePredictionFromTwitch(latestActive);
            if (isPredictionUncontested(latestActive)) {
              await twitchEndPrediction(latestActive.id, 'CANCELED');
              logEvent('twitch', 'Prediction canceled automatically: one or more outcomes have no channel points');
              return;
            }
          } catch (error) {
            logEvent('twitch', `Uncontested prediction check failed: ${error.message}`);
            return;
          }
        }
        const outcome = latestActive.outcomes.find((item) => item.kind === result
          || (result === 'yes' && item.kind === 'win')
          || (result === 'no' && item.kind === 'lose'));
        if (outcome) {
          try {
            await twitchEndPrediction(latestActive.id, 'RESOLVED', outcome.id);
            logEvent('twitch', `Prediction resolved automatically: ${outcome.title}`);
          } catch (error) {
            logEvent('twitch', `Auto resolve failed: ${error.message}`);
          }
        }
      }
    }
  } else {
    clearPredictionCancelCandidate();
  }

  if (settings.autoCreate && !runtime.state.activePrediction && shouldAutoCreatePredictionAfterPick(previous, gsi) && shouldRetryAutoPrediction(gsi)) {
    markAutoPredictionAttempt(gsi);
    try {
      const isLive = settings.forceStreamOnline || await isBroadcasterLive();
      if (!isLive) {
        logEvent('twitch', 'Auto prediction skipped: Twitch stream is offline');
      } else {
        if (settings.forceStreamOnline) {
          logEvent('twitch', 'Auto prediction stream status override is enabled');
        }
        await createPredictionFromSettings({}, { automatic: true });
      }
    } catch (error) {
      logEvent('twitch', `Auto prediction failed: ${error.message}`);
    }
  }
}

function inferPredictionResult(gsi) {
  const meta = runtime.state.activePredictionMeta;
  if (!meta?.type || meta.type === 'win_loss' || meta.type === 'manual') {
    const result = inferResult(gsi);
    return result === 'win' ? 'yes' : result === 'lose' ? 'no' : null;
  }

  if (meta.type === 'custom_condition') {
    return inferCustomConditionResult(meta, gsi);
  }

  const stat = predictionStatValue(meta.type, gsi);
  if (['streamer_kills', 'streamer_deaths', 'streamer_assists'].includes(meta.type)) {
    if (Number.isFinite(stat) && stat >= meta.target) return 'yes';
    if (/POST_GAME/i.test(String(gsi.gameState || ''))) return 'no';
    return null;
  }

  if (meta.type === 'no_death_until') {
    if (Number(gsi.deaths || 0) > 0) return 'no';
    if (Number(gsi.clockTime) >= meta.deadlineSeconds) return 'yes';
    return null;
  }

  if (meta.type === 'last_hits_by_minute') {
    if (Number(gsi.clockTime) < meta.deadlineSeconds) return null;
    return Number(gsi.lastHits || 0) >= meta.target ? 'yes' : 'no';
  }

  return null;
}

function predictionStatValue(type, gsi) {
  if (type === 'streamer_kills') return Number(gsi.kills);
  if (type === 'streamer_deaths') return Number(gsi.deaths);
  if (type === 'streamer_assists') return Number(gsi.assists);
  return NaN;
}

function inferCustomConditionResult(meta, gsi) {
  const state = String(gsi.gameState || '');
  const target = Number(meta.target || 0);
  const deadlineSeconds = Number(meta.deadlineSeconds || 0);
  const metricValue = predictionMetricValue(meta.metric, gsi);

  if (meta.condition === 'game_duration_at_least') {
    if (Number(gsi.clockTime || 0) >= deadlineSeconds) return 'yes';
    if (/POST_GAME/i.test(state)) return 'no';
    return null;
  }

  if (meta.condition === 'metric_reaches_target') {
    if (Number.isFinite(metricValue) && metricValue >= target) return 'yes';
    if (/POST_GAME/i.test(state)) return 'no';
    return null;
  }

  if (meta.condition === 'metric_by_minute') {
    if (/POST_GAME/i.test(state) && Number(gsi.clockTime || 0) < deadlineSeconds) return 'no';
    if (Number(gsi.clockTime || 0) < deadlineSeconds) return null;
    return Number.isFinite(metricValue) && metricValue >= target ? 'yes' : 'no';
  }

  return null;
}

function predictionMetricValue(metric, gsi) {
  if (metric === 'clock_minutes') return Number(gsi.clockTime || 0) / 60;
  if (metric === 'kills') return Number(gsi.kills);
  if (metric === 'deaths') return Number(gsi.deaths);
  if (metric === 'assists') return Number(gsi.assists);
  if (metric === 'last_hits') return Number(gsi.lastHits);
  if (metric === 'denies') return Number(gsi.denies);
  if (metric === 'level') return Number(gsi.level);
  if (metric === 'team_kills') return Number(gsi.teamKills);
  if (metric === 'team_deaths') return Number(gsi.teamDeaths);
  if (metric === 'team_assists') return Number(gsi.teamAssists);
  if (metric === 'enemy_kills') return Number(gsi.enemyKills);
  if (metric === 'enemy_deaths') return Number(gsi.enemyDeaths);
  if (metric === 'enemy_assists') return Number(gsi.enemyAssists);
  if (metric === 'total_kills') return Number(gsi.totalKills);
  if (metric === 'total_deaths') return Number(gsi.totalDeaths);
  if (metric === 'total_assists') return Number(gsi.totalAssists);
  return NaN;
}

function shouldAutoCreatePredictionAfterPick(previous, gsi) {
  if (!gsi.playerHeroPicked || !gsi.ownPickPhaseEnded) return false;
  const state = String(gsi.gameState || '');
  return /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state);
}

function shouldRetryAutoPrediction(gsi) {
  const key = autoPredictionKey(gsi);
  if (runtime.state.autoPredictionCreatedKey === key) return false;
  const attempt = runtime.state.lastAutoPredictionAttempt;
  if (!attempt || attempt.key !== key) return true;
  const attemptedAt = Date.parse(attempt.at || '');
  return !Number.isFinite(attemptedAt) || Date.now() - attemptedAt >= autoPredictionRetryMs;
}

function markAutoPredictionAttempt(gsi) {
  runtime.state.lastAutoPredictionAttempt = {
    key: autoPredictionKey(gsi),
    matchId: gsi.activeMatchId || gsi.matchId || null,
    draftCycle: Number(gsi.draftCycle || 0),
    at: new Date().toISOString()
  };
}

function markAutoPredictionCreated(gsi) {
  runtime.state.autoPredictionCreatedKey = autoPredictionKey(gsi);
}

function autoPredictionKey(gsi) {
  const matchId = gsi.activeMatchId || gsi.matchId;
  if (matchId) return `match:${matchId}`;
  return `draft:${Number(gsi.draftCycle || 0)}`;
}

function syncActivePredictionMatchId(gsi) {
  if (!runtime.state.activePrediction || runtime.state.activePredictionMatchId) return;
  const matchId = gsi.activeMatchId || gsi.matchId;
  if (matchId) runtime.state.activePredictionMatchId = matchId;
}

async function maybeCancelPredictionForInvalidGame(previous, gsi) {
  const candidate = inferPredictionCancelCandidate(previous, gsi);
  if (!candidate) {
    clearPredictionCancelCandidate();
    return false;
  }
  return await applyPredictionCancelCandidate(candidate);
}

async function maybeCancelPredictionForGsiTimeout() {
  const settings = runtime.config.predictions;
  const active = runtime.state.activePrediction;
  if (!settings.autoCancelInvalidGame || !active || !['ACTIVE', 'LOCKED'].includes(active.status)) return false;
  if (!runtime.state.gsi.activeMatchId && !runtime.state.activePredictionMatchId) return false;
  const candidate = {
    reason: 'GSI stopped during an active match',
    delaySeconds: settings.autoCancelDisconnectSeconds,
    matchId: runtime.state.activePredictionMatchId || runtime.state.gsi.activeMatchId || runtime.state.gsi.matchId || null
  };
  return await applyPredictionCancelCandidate(candidate);
}

function inferPredictionCancelCandidate(previous, gsi) {
  const active = runtime.state.activePrediction;
  if (!active) return null;

  const settings = runtime.config.predictions;
  const state = String(gsi.gameState || '');
  const currentMatchId = gsi.activeMatchId || gsi.matchId || null;
  const predictionMatchId = runtime.state.activePredictionMatchId;
  if (predictionMatchId && currentMatchId && predictionMatchId !== currentMatchId) {
    return {
      reason: `new match started before prediction was closed (${predictionMatchId} -> ${currentMatchId})`,
      delaySeconds: 0,
      matchId: predictionMatchId
    };
  }

  if (/DISCONNECT/i.test(state)) {
    return {
      reason: 'Dota reported disconnect during an active match',
      delaySeconds: settings.autoCancelDisconnectSeconds,
      matchId: predictionMatchId || currentMatchId
    };
  }

  if (/POST_GAME/i.test(state) && !gsi.winTeam && wasShortOrUnscoredGame(previous, gsi)) {
    return {
      reason: 'post-game reached without a winner for a short/unscored match',
      delaySeconds: 60,
      matchId: predictionMatchId || currentMatchId
    };
  }

  return null;
}

function wasShortOrUnscoredGame(previous, gsi) {
  const times = [previous.clockTime, gsi.clockTime].filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!times.length) return true;
  return Math.max(...times) < 300;
}

async function applyPredictionCancelCandidate(candidate) {
  const active = runtime.state.activePrediction;
  if (!active || !['ACTIVE', 'LOCKED'].includes(active.status)) return false;

  const now = Date.now();
  const existing = runtime.state.predictionCancelCandidate;
  const sameCandidate = existing
    && existing.reason === candidate.reason
    && String(existing.matchId || '') === String(candidate.matchId || '');
  const startedAt = sameCandidate ? Date.parse(existing.since) : now;
  runtime.state.predictionCancelCandidate = {
    reason: candidate.reason,
    matchId: candidate.matchId || null,
    delaySeconds: candidate.delaySeconds,
    since: sameCandidate ? existing.since : new Date(now).toISOString()
  };
  if (!sameCandidate) {
    await persistState();
    broadcast();
  }

  const elapsedSeconds = (now - startedAt) / 1000;
  if (elapsedSeconds < candidate.delaySeconds) return false;

  try {
    await twitchEndPrediction(active.id, 'CANCELED');
    logEvent('twitch', `Prediction canceled automatically: ${candidate.reason}`);
    return true;
  } catch (error) {
    logEvent('twitch', `Auto cancel failed: ${error.message}`);
    return false;
  }
}

function clearPredictionCancelCandidate() {
  if (runtime.state.predictionCancelCandidate) runtime.state.predictionCancelCandidate = null;
}

async function refreshActivePredictionFromTwitch(active) {
  if (!active?.id) return active;
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const params = new URLSearchParams({ broadcaster_id: broadcaster, id: active.id });
  const result = await twitchRequest(`/predictions?${params}`);
  const item = result.data?.[0];
  if (!item) throw new Error('Twitch did not return the active prediction');
  const meta = runtime.state.activePredictionMeta;
  const normalized = normalizePrediction(item, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
  runtime.state.activePrediction = normalized;
  await persistState();
  broadcast();
  return normalized;
}

function isPredictionUncontested(prediction) {
  const outcomes = Array.isArray(prediction?.outcomes) ? prediction.outcomes : [];
  return outcomes.length >= 2 && outcomes.some((outcome) => Number(outcome.channelPoints || 0) <= 0);
}

function inferResult(gsi) {
  if (!gsi.winTeam || !gsi.playerTeam) return null;
  if (!/POST_GAME/i.test(String(gsi.gameState || '')) && !gsi.winTeam) return null;
  return gsi.winTeam === gsi.playerTeam ? 'win' : 'lose';
}

function normalizeTeam(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('radiant') || raw === '2') return 'radiant';
  if (raw.includes('dire') || raw === '3') return 'dire';
  return null;
}

function normalizeDeploymentConfig(config) {
  if (!['local', 'server'].includes(config.mode)) config.mode = 'local';
  config.publicBaseUrl = normalizeBaseUrl(config.publicBaseUrl);
}

function normalizeUiConfig(config) {
  if (!['auto', 'ru', 'en'].includes(config.language)) config.language = 'auto';
  if (!['', 'ru', 'en'].includes(config.predictionTemplateLanguage)) config.predictionTemplateLanguage = '';
}

function normalizeTwitchConfig(config) {
  if (!['personal', 'separate'].includes(config.channelMode)) config.channelMode = 'personal';
  config.targetChannelLogin = String(config.targetChannelLogin || '').trim().replace(/^@/, '').toLowerCase();
  config.targetBroadcasterId = String(config.targetBroadcasterId || '').trim();
  config.targetBroadcasterLogin = String(config.targetBroadcasterLogin || '').trim().replace(/^@/, '').toLowerCase();
}

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

function effectiveBaseUrl() {
  if (runtime.config.deployment?.mode === 'server' && runtime.config.deployment.publicBaseUrl) {
    return runtime.config.deployment.publicBaseUrl;
  }
  return `http://localhost:${port}`;
}

function effectiveRedirectUri() {
  if (runtime.config.deployment?.mode === 'server' && runtime.config.deployment.publicBaseUrl) {
    return `${runtime.config.deployment.publicBaseUrl}/auth/twitch/callback`;
  }
  return runtime.config.twitch.redirectUri || `http://localhost:${port}/auth/twitch/callback`;
}

function twitchTargetChannel() {
  const token = runtime.state.twitchToken || {};
  if (runtime.config.twitch.channelMode === 'separate') {
    return {
      broadcasterId: runtime.config.twitch.targetBroadcasterId || null,
      broadcasterLogin: runtime.config.twitch.targetBroadcasterLogin || runtime.config.twitch.targetChannelLogin || null
    };
  }
  return {
    broadcasterId: token.broadcasterId || null,
    broadcasterLogin: token.broadcasterLogin || null
  };
}

function resetTwitchStreamStatus() {
  runtime.twitchStreamStatus = { broadcasterId: null, checkedAt: 0, isLive: null, streamId: null, gameName: null, title: null };
}

function normalizePredictionSettings(settings) {
  if (!['selected', 'random'].includes(settings.selectionMode)) settings.selectionMode = 'selected';
  settings.forceStreamOnline = settings.forceStreamOnline === true;
  settings.cancelUncontestedPrediction = settings.cancelUncontestedPrediction === true;
  settings.titleTemplate = predictionTextOrDefault(settings.titleTemplate, defaultConfig.predictions.titleTemplate, 120);
  settings.winTitle = predictionTextOrDefault(settings.winTitle, defaultConfig.predictions.winTitle, 25);
  settings.loseTitle = predictionTextOrDefault(settings.loseTitle, defaultConfig.predictions.loseTitle, 25);
  settings.types = merge(structuredClone(defaultConfig.predictions.types), settings.types || {});
  delete settings.types.custom_condition;
  for (const type of Object.keys(settings.types)) {
    if (!defaultConfig.predictions.types[type]) delete settings.types[type];
  }
  settings.customTemplates = normalizeCustomPredictionTemplates(settings.customTemplates);
  if (!allPredictionTypes(settings)[settings.selectedType]) settings.selectedType = 'win_loss';
  for (const [type, config] of Object.entries(settings.types)) {
    config.enabled = config.enabled !== false;
    config.weight = clampInt(config.weight, 1, 100);
    if (['streamer_kills', 'streamer_deaths', 'streamer_assists', 'last_hits_by_minute'].includes(type)) {
      config.min = clampInt(config.min, 0, 999);
      config.max = clampInt(config.max, config.min, 999);
    }
    if (['no_death_until', 'last_hits_by_minute'].includes(type)) {
      config.minMinute = clampInt(config.minMinute, 1, 180);
      config.maxMinute = clampInt(config.maxMinute, config.minMinute, 180);
    }
    const defaults = defaultConfig.predictions.types[type] || {};
    config.titleTemplate = predictionTextOrDefault(config.titleTemplate, defaults.titleTemplate || '', 120);
    config.yesTitle = predictionTextOrDefault(config.yesTitle, defaults.yesTitle || 'Да', 25);
    config.noTitle = predictionTextOrDefault(config.noTitle, defaults.noTitle || 'Нет', 25);
  }
}

function predictionTextOrDefault(value, fallback, maxLength) {
  const text = String(value || '');
  if (!text.trim() || looksLikeCorruptedText(text)) return String(fallback || '').slice(0, maxLength);
  return text.slice(0, maxLength);
}

function looksLikeCorruptedText(value) {
  return /\?{2,}/.test(String(value || ''));
}

function normalizeCustomPredictionTemplates(templates) {
  if (!Array.isArray(templates)) return [];
  return templates.slice(0, 30).map((template, index) => {
    const id = normalizeCustomPredictionId(template.id) || `custom_${Date.now().toString(36)}_${index}`;
    const condition = customPredictionConditions.includes(template.condition) ? template.condition : 'game_duration_at_least';
    const metric = customPredictionMetrics.includes(template.metric) ? template.metric : 'clock_minutes';
    const min = clampInt(template.min, 0, 999);
    const minMinute = clampInt(template.minMinute, 1, 180);
    return {
      id,
      label: String(template.label || template.titleTemplate || 'Custom prediction').slice(0, 60),
      enabled: template.enabled !== false,
      weight: clampInt(template.weight, 1, 100),
      min,
      max: clampInt(template.max, min, 999),
      minMinute,
      maxMinute: clampInt(template.maxMinute, minMinute, 180),
      condition,
      metric,
      titleTemplate: predictionTextOrDefault(template.titleTemplate, 'Custom prediction?', 120),
      yesTitle: predictionTextOrDefault(template.yesTitle, 'Да', 25),
      noTitle: predictionTextOrDefault(template.noTitle, 'Нет', 25)
    };
  });
}

function normalizeCustomPredictionId(value) {
  const id = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').replace(/^_+|_+$/g, '');
  if (!id || id === 'custom_condition') return '';
  return id.startsWith('custom_') ? id.slice(0, 48) : `custom_${id}`.slice(0, 48);
}

function normalizeDraftTeam(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric >= 0 && numeric < 128) return 'radiant';
    if (numeric >= 128) return 'dire';
  }
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('radiant') || raw.includes('good') || raw === '2' || raw === 'team2') return 'radiant';
  if (raw.includes('dire') || raw.includes('bad') || raw === '3' || raw === 'team3') return 'dire';
  return null;
}

function statNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampInt(value, min, max) {
  const int = Number.parseInt(value, 10);
  if (!Number.isFinite(int)) return min;
  return Math.max(min, Math.min(max, int));
}

async function startTwitchAuth(url, res) {
  if (!runtime.config.twitch.clientId || !runtime.config.twitch.clientSecret) {
    return sendText(res, 'Set Twitch Client ID and Client Secret in the local dashboard first.', 400);
  }
  hydrateTwitchStatus();
  if (runtime.state.twitch.authenticated && !runtime.state.twitch.needsReconnect && url.searchParams.get('force') !== '1') {
    return redirect(res, '/?twitch=connected');
  }

  const state = randomBytes(16).toString('hex');
  runtime.oauthStates.add(state);
  const params = new URLSearchParams({
    client_id: runtime.config.twitch.clientId,
    redirect_uri: effectiveRedirectUri(),
    response_type: 'code',
    scope: twitchScopes.join(' '),
    state
  });
  if (url.searchParams.get('force') === '1') params.set('force_verify', 'true');
  redirect(res, `${twitchId}/authorize?${params}`);
}

async function finishTwitchAuth(url, res) {
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error_description') || url.searchParams.get('error');
  if (error) return sendText(res, `Twitch auth error: ${error}`, 400);
  if (!state || !runtime.oauthStates.has(state)) return sendText(res, 'Invalid OAuth state', 400);
  runtime.oauthStates.delete(state);
  if (!code) return sendText(res, 'Missing OAuth code', 400);

  const params = new URLSearchParams({
    client_id: runtime.config.twitch.clientId,
    client_secret: runtime.config.twitch.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: effectiveRedirectUri()
  });
  const response = await fetch(`${twitchId}/token`, { method: 'POST', body: params });
  const token = await parseTwitchResponse(response);
  await saveToken(token);
  redirect(res, '/?twitch=connected');
}

async function saveToken(token) {
  const validation = await validateToken(token.access_token);
  const previous = runtime.state.twitchToken || {};
  runtime.state.twitchToken = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || previous.refreshToken || null,
    expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    broadcasterId: validation.user_id,
    broadcasterLogin: validation.login,
    scopes: normalizeScopes(token.scope || validation.scopes || [])
  };
  if (runtime.config.twitch.channelMode === 'personal') {
    runtime.config.twitch.targetBroadcasterId = validation.user_id;
    runtime.config.twitch.targetBroadcasterLogin = validation.login;
    runtime.config.twitch.targetChannelLogin = validation.login;
    await persistConfig();
  }
  hydrateTwitchStatus();
  await persistTwitchTokenBackup();
  await persistState();
  logEvent('twitch', `Authenticated as ${validation.login}`);
}

function normalizeScopes(scopes) {
  if (Array.isArray(scopes)) return scopes.map(String).filter(Boolean);
  return String(scopes || '').split(/\s+/).filter(Boolean);
}

async function validateToken(accessToken) {
  const response = await fetch(`${twitchId}/validate`, {
    headers: { Authorization: `OAuth ${accessToken}` }
  });
  return parseTwitchResponse(response);
}

async function refreshTokenIfNeeded(force = false) {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) throw new Error('Twitch is not authenticated');
  if (!force && Date.parse(token.expiresAt) - Date.now() > 60000) return token.accessToken;
  if (!token.refreshToken) throw new Error('Twitch token expired and has no refresh token');

  const params = new URLSearchParams({
    client_id: runtime.config.twitch.clientId,
    client_secret: runtime.config.twitch.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken
  });
  const response = await fetch(`${twitchId}/token`, { method: 'POST', body: params });
  const refreshed = await parseTwitchResponse(response);
  await saveToken(refreshed);
  return runtime.state.twitchToken.accessToken;
}

function requireTwitchScopes(scopes) {
  if (!runtime.state.twitchToken?.accessToken) {
    throw new Error('Twitch is not authenticated. Connect Twitch from the dashboard.');
  }
  const granted = runtime.state.twitchToken?.scopes || [];
  const missing = scopes.filter((scope) => !granted.includes(scope));
  if (missing.length > 0) {
    throw new Error(`Twitch token is missing scope(s): ${missing.join(', ')}. Reconnect Twitch from the dashboard.`);
  }
}

function requireTwitchTargetBroadcaster() {
  if (!runtime.state.twitchToken?.accessToken) {
    throw new Error('Twitch is not authenticated. Connect Twitch from the dashboard.');
  }
  const target = twitchTargetChannel();
  if (!target.broadcasterId) {
    throw new Error('Target Twitch channel is not resolved. Save or resolve the streamer login first.');
  }
  return target.broadcasterId;
}

async function twitchRequest(path, options = {}) {
  const accessToken = await refreshTokenIfNeeded();
  const response = await fetch(`${twitchApi}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': runtime.config.twitch.clientId,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return parseTwitchResponse(response);
}

async function parseTwitchResponse(response) {
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = json.message || json.error || response.statusText;
    throw new Error(`Twitch ${response.status}: ${message}`);
  }
  return json;
}

async function twitchLogout(res) {
  delete runtime.state.twitchToken;
  runtime.state.activePrediction = null;
  hydrateTwitchStatus();
  await deleteTwitchTokenBackup();
  await persistState();
  logEvent('twitch', 'Logged out');
  sendJson(res, publicState());
}

async function sendChatMessage(req, res) {
  const body = await readBody(req);
  const message = String(body.message || '').trim();
  if (!message) throw new Error('Message is required');
  if (message.length > 500) throw new Error('Message is too long');

  const result = await twitchSendChatMessage(message);
  logEvent('twitch', `Chat message sent: ${message}`);
  sendJson(res, result);
}

async function twitchSendChatMessage(message) {
  requireTwitchScopes(['user:write:chat']);
  const broadcaster = requireTwitchTargetBroadcaster();
  const sender = runtime.state.twitchToken?.broadcasterId;
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const result = await twitchRequest('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({
      broadcaster_id: broadcaster,
      sender_id: sender,
      message
    })
  });
  const item = result.data?.[0];
  if (item && item.is_sent === false) {
    throw new Error(item.drop_reason?.message || 'Twitch did not send the chat message');
  }
  return result;
}

async function resolveTwitchChannelApi(req, res) {
  const body = await readBody(req);
  const login = String(body.login || runtime.config.twitch.targetChannelLogin || '').trim().replace(/^@/, '').toLowerCase();
  if (!login) return sendJson(res, { error: 'Streamer login is required' }, 400);
  const user = await resolveTwitchUserByLogin(login);
  runtime.config.twitch.channelMode = 'separate';
  runtime.config.twitch.targetChannelLogin = user.login;
  runtime.config.twitch.targetBroadcasterLogin = user.login;
  runtime.config.twitch.targetBroadcasterId = user.id;
  resetTwitchStreamStatus();
  await persistConfig();
  hydrateTwitchStatus();
  await persistState();
  logEvent('twitch', `Target channel resolved: ${user.login} (${user.id})`);
  sendJson(res, { ok: true, user });
}

async function resolveConfiguredTwitchChannel() {
  if (runtime.config.twitch.channelMode === 'personal') {
    const token = runtime.state.twitchToken;
    if (token?.broadcasterId) {
      runtime.config.twitch.targetChannelLogin = token.broadcasterLogin || '';
      runtime.config.twitch.targetBroadcasterLogin = token.broadcasterLogin || '';
      runtime.config.twitch.targetBroadcasterId = token.broadcasterId || '';
    }
    return;
  }
  if (!runtime.config.twitch.targetChannelLogin || !runtime.state.twitchToken?.accessToken) return;
  try {
    const user = await resolveTwitchUserByLogin(runtime.config.twitch.targetChannelLogin);
    runtime.config.twitch.targetChannelLogin = user.login;
    runtime.config.twitch.targetBroadcasterLogin = user.login;
    runtime.config.twitch.targetBroadcasterId = user.id;
    logEvent('twitch', `Target channel resolved: ${user.login} (${user.id})`);
  } catch (error) {
    logEvent('twitch', `Target channel resolve failed: ${error.message}`);
  }
}

async function resolveTwitchUserByLogin(login) {
  const normalized = String(login || '').trim().replace(/^@/, '').toLowerCase();
  if (!normalized) throw new Error('Streamer login is required');
  const result = await twitchRequest(`/users?login=${encodeURIComponent(normalized)}`);
  const user = result.data?.[0];
  if (!user?.id) throw new Error(`Twitch user not found: ${normalized}`);
  return { id: user.id, login: user.login, displayName: user.display_name || user.login };
}

async function isBroadcasterLive(force = false) {
  const broadcaster = twitchTargetChannel().broadcasterId;
  if (!broadcaster) return false;

  const now = Date.now();
  const cached = runtime.twitchStreamStatus;
  if (!force
    && String(cached.broadcasterId || '') === String(broadcaster)
    && cached.checkedAt
    && now - cached.checkedAt < 60000
    && typeof cached.isLive === 'boolean') {
    return cached.isLive;
  }

  const result = await twitchRequest(`/streams?user_id=${encodeURIComponent(broadcaster)}&first=1`);
  const stream = (result.data || []).find((item) => String(item.user_id) === String(broadcaster) && item.type === 'live') || null;
  runtime.twitchStreamStatus = {
    broadcasterId: broadcaster,
    checkedAt: now,
    isLive: Boolean(stream),
    streamId: stream?.id || null,
    gameName: stream?.game_name || null,
    title: stream?.title || null
  };
  hydrateTwitchStatus();
  await persistState();
  broadcast();
  return runtime.twitchStreamStatus.isLive;
}

async function refreshTwitchStreamStatus() {
  if (!runtime.state.twitchToken?.accessToken || runtime.state.twitch.needsReconnect) return;
  await isBroadcasterLive(true);
}

async function createPrediction(req, res) {
  const body = await readBody(req);
  const prediction = await createPredictionFromSettings(body);
  sendJson(res, prediction);
}

async function createPredictionFromSettings(overrides = {}, options = {}) {
  if (runtime.state.activePrediction && ['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction.status)) {
    throw new Error('A prediction is already active or locked');
  }
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated. Connect Twitch from the dashboard.');
  const draft = buildPredictionDraft(overrides);
  const predictionWindow = clampInt(overrides.windowSeconds ?? runtime.config.predictions.windowSeconds, 30, 1800);
  const body = {
    broadcaster_id: broadcaster,
    title: draft.title,
    outcomes: [{ title: draft.yesTitle }, { title: draft.noTitle }],
    prediction_window: predictionWindow
  };
  const result = await twitchRequest('/predictions', { method: 'POST', body: JSON.stringify(body) });
  const item = result.data?.[0];
  if (!item) throw new Error('Twitch did not return a prediction');
  runtime.state.activePredictionMeta = draft.meta;
  runtime.state.activePrediction = normalizePrediction(item, draft.yesTitle, draft.noTitle, draft.meta);
  runtime.state.activePredictionMatchId = runtime.state.gsi.activeMatchId || runtime.state.gsi.matchId || null;
  runtime.state.predictionCancelCandidate = null;
  if (options.automatic) markAutoPredictionCreated(runtime.state.gsi);
  await persistState();
  logEvent('twitch', `Prediction created: ${draft.title}`);
  broadcast();
  return runtime.state.activePrediction;
}

function buildPredictionDraft(overrides = {}) {
  if (overrides.title) {
    const yesTitle = String(overrides.winTitle || runtime.config.predictions.winTitle || 'Да').slice(0, 25);
    const noTitle = String(overrides.loseTitle || runtime.config.predictions.loseTitle || 'Нет').slice(0, 25);
    return {
      title: String(overrides.title).slice(0, 45),
      yesTitle,
      noTitle,
      meta: {
        type: 'manual',
        variables: predictionVariables(),
        outcomes: { yesTitle, noTitle }
      }
    };
  }

  const settings = runtime.config.predictions;
  const type = choosePredictionType(settings);
  const typeConfig = allPredictionTypes(settings)[type] || defaultConfig.predictions.types.win_loss;
  const target = randomRange(typeConfig.min, typeConfig.max);
  const minute = randomRange(typeConfig.minMinute, typeConfig.maxMinute);
  const variables = predictionVariables({ target, minute, type });
  const yesTitle = renderTemplate(typeConfig.yesTitle || 'Да', variables).slice(0, 25);
  const noTitle = renderTemplate(typeConfig.noTitle || 'Нет', variables).slice(0, 25);
  const title = renderTemplate(typeConfig.titleTemplate || settings.titleTemplate, variables).slice(0, 45);
  return {
    title,
    yesTitle,
    noTitle,
    meta: {
      type: typeConfig.baseType || type,
      typeId: type,
      typeLabel: typeConfig.label || null,
      condition: typeConfig.condition || null,
      metric: typeConfig.metric || null,
      target,
      minute,
      deadlineSeconds: minute ? minute * 60 : null,
      variables,
      outcomes: { yesTitle, noTitle }
    }
  };
}

function choosePredictionType(settings) {
  const types = allPredictionTypes(settings);
  if (settings.selectionMode === 'selected' && types[settings.selectedType]?.enabled !== false) return settings.selectedType;
  const enabled = Object.entries(types).filter(([, config]) => config?.enabled !== false);
  if (!enabled.length) return 'win_loss';
  const total = enabled.reduce((sum, [, config]) => sum + Math.max(1, Number(config.weight) || 1), 0);
  let roll = Math.random() * total;
  for (const [type, config] of enabled) {
    roll -= Math.max(1, Number(config.weight) || 1);
    if (roll <= 0) return type;
  }
  return enabled[0][0];
}

function allPredictionTypes(settings) {
  const types = { ...(settings.types || {}) };
  for (const template of settings.customTemplates || []) {
    types[template.id] = {
      ...template,
      baseType: 'custom_condition',
      label: template.label || template.titleTemplate || template.id
    };
  }
  return types;
}

function predictionVariables(extra = {}) {
  const gsi = runtime.state.gsi;
  const hero = formatHeroName(gsi.heroName || gsi.heroId || 'герой');
  return {
    hero,
    hero_raw: gsi.heroName || '',
    hero_id: gsi.heroId || '',
    target: extra.target ?? '',
    minute: extra.minute ?? '',
    clock_minutes: Math.max(0, Math.floor(Number(gsi.clockTime || 0) / 60)),
    kills: gsi.kills ?? 0,
    deaths: gsi.deaths ?? 0,
    assists: gsi.assists ?? 0,
    last_hits: gsi.lastHits ?? 0,
    denies: gsi.denies ?? 0,
    level: gsi.level ?? 0,
    team_kills: gsi.teamKills ?? 0,
    team_deaths: gsi.teamDeaths ?? 0,
    team_assists: gsi.teamAssists ?? 0,
    enemy_kills: gsi.enemyKills ?? 0,
    enemy_deaths: gsi.enemyDeaths ?? 0,
    enemy_assists: gsi.enemyAssists ?? 0,
    total_kills: gsi.totalKills ?? 0,
    total_deaths: gsi.totalDeaths ?? 0,
    total_assists: gsi.totalAssists ?? 0,
    team: gsi.playerTeam || '',
    type: extra.type || ''
  };
}

function renderTemplate(template, variables) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => variables[key] ?? '');
}

function formatHeroName(value) {
  const raw = String(value || '').replace(/^npc_dota_hero_/, '').replace(/_/g, ' ').trim();
  if (!raw) return 'герой';
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

function randomRange(min, max) {
  const low = Number(min);
  const high = Number(max);
  if (!Number.isFinite(low) && !Number.isFinite(high)) return null;
  const from = Number.isFinite(low) ? low : high;
  const to = Number.isFinite(high) ? high : from;
  const minValue = Math.min(from, to);
  const maxValue = Math.max(from, to);
  return Math.floor(minValue + Math.random() * (maxValue - minValue + 1));
}

async function getPredictions(res) {
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const result = await twitchRequest(`/predictions?broadcaster_id=${encodeURIComponent(broadcaster)}`);
  sendJson(res, result);
}

async function endPrediction(req, res, id, action) {
  const body = await readBody(req);
  const status = action === 'lock' ? 'LOCKED' : action === 'cancel' ? 'CANCELED' : 'RESOLVED';
  const result = await twitchEndPrediction(id, status, body.winningOutcomeId);
  logEvent('twitch', `Prediction ${status.toLowerCase()}`);
  sendJson(res, result);
}

async function twitchEndPrediction(id, status, winningOutcomeId = null) {
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const params = new URLSearchParams({ broadcaster_id: broadcaster, id, status });
  if (status === 'RESOLVED') {
    if (!winningOutcomeId) throw new Error('winningOutcomeId is required');
    params.set('winning_outcome_id', winningOutcomeId);
  }
  const result = await twitchRequest(`/predictions?${params}`, { method: 'PATCH' });
  const item = result.data?.[0];
  if (item) {
    const meta = runtime.state.activePredictionMeta;
    runtime.state.activePrediction = normalizePrediction(item, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
    if (['RESOLVED', 'CANCELED'].includes(item.status)) {
      runtime.state.activePrediction = null;
      runtime.state.activePredictionMatchId = null;
      runtime.state.activePredictionMeta = null;
      runtime.state.predictionCancelCandidate = null;
    }
    await persistState();
    broadcast();
  }
  return result;
}

function normalizePrediction(item, yesTitle = runtime.config.predictions.winTitle, noTitle = runtime.config.predictions.loseTitle, meta = null) {
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    createdAt: item.created_at,
    lockedAt: item.locked_at,
    type: meta?.typeLabel || meta?.typeId || meta?.type || null,
    target: meta?.target || null,
    minute: meta?.minute || null,
    outcomes: (item.outcomes || []).map((outcome) => ({
      id: outcome.id,
      title: outcome.title,
      users: outcome.users,
      channelPoints: outcome.channel_points,
      color: outcome.color,
      kind: outcome.title === yesTitle ? 'yes' : outcome.title === noTitle ? 'no' : null
    }))
  };
}

async function detectDotaApi(res) {
  const detected = await detectDotaInstall();
  if (!detected) {
    return sendJson(res, {
      ok: false,
      error: 'Dota 2 was not found automatically. Set the Dota 2 folder manually.'
    }, 404);
  }

  runtime.config.dota.installPath = detected.dotaPath;
  runtime.config.dota.cfgDir = detected.cfgDir;
  runtime.config.dota.detectionSource = detected.source;
  await persistConfig();
  logEvent('system', `Dota 2 found: ${detected.dotaPath}`);
  sendJson(res, { ok: true, ...detected });
}

async function installGsi(req, res) {
  const body = await readBody(req);
  const requestedPath = String(body.dotaPath || body.cfgDir || runtime.config.dota?.installPath || runtime.config.dota?.cfgDir || '').trim();
  let target = requestedPath ? await resolveDotaGsiTarget(requestedPath, 'manual') : null;

  if (!target) {
    target = await detectDotaInstall();
  }

  if (!target) {
    return sendJson(res, {
      error: 'Dota 2 was not found. Set the Dota 2 folder manually, for example: C:\\SteamLibrary\\steamapps\\common\\dota 2 beta'
    }, 400);
  }

  const cfgDir = target.cfgDir;
  await mkdir(cfgDir, { recursive: true });
  const cfgPath = join(cfgDir, 'gamestate_integration_dotastreamkit.cfg');
  const cfg = makeGsiConfig();
  await writeFile(cfgPath, cfg, 'utf8');

  runtime.config.dota.installPath = target.dotaPath;
  runtime.config.dota.cfgDir = target.cfgDir;
  runtime.config.dota.detectionSource = target.source;
  await persistConfig();

  logEvent('system', `Dota GSI config installed: ${cfgPath}`);
  sendJson(res, { ok: true, cfgPath, dotaPath: target.dotaPath, cfgDir: target.cfgDir, source: target.source });
}

async function detectDotaInstall() {
  const libraryRoots = await findSteamLibraryRoots();
  const checked = new Set();

  for (const libraryRoot of libraryRoots) {
    const normalizedRoot = normalize(libraryRoot);
    if (checked.has(normalizedRoot.toLowerCase())) continue;
    checked.add(normalizedRoot.toLowerCase());

    const target = await resolveDotaGsiTarget(join(normalizedRoot, 'steamapps', 'common', 'dota 2 beta'), `Steam library: ${normalizedRoot}`);
    if (target) return target;
  }

  const commonDotaPaths = [
    'C:\\SteamLibrary\\steamapps\\common\\dota 2 beta',
    'D:\\SteamLibrary\\steamapps\\common\\dota 2 beta',
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta',
    'C:\\Program Files\\Steam\\steamapps\\common\\dota 2 beta'
  ];

  for (const path of commonDotaPaths) {
    const target = await resolveDotaGsiTarget(path, 'common path');
    if (target) return target;
  }

  return null;
}

async function findSteamLibraryRoots() {
  const roots = new Set();
  const steamPaths = await findSteamInstallPaths();

  for (const steamPath of steamPaths) {
    roots.add(normalize(steamPath));
    const vdfPath = join(steamPath, 'steamapps', 'libraryfolders.vdf');
    try {
      const vdf = await readFile(vdfPath, 'utf8');
      for (const path of parseSteamLibraryFolders(vdf)) {
        roots.add(normalize(path));
      }
    } catch {}
  }

  for (const fallback of ['C:\\SteamLibrary', 'D:\\SteamLibrary', 'C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam']) {
    roots.add(normalize(fallback));
  }

  return Array.from(roots);
}

async function findSteamInstallPaths() {
  const paths = new Set();
  const registryQueries = [
    ['HKCU\\Software\\Valve\\Steam', ['SteamPath', 'SteamExe']],
    ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', ['InstallPath']],
    ['HKLM\\SOFTWARE\\Valve\\Steam', ['InstallPath']]
  ];

  for (const [key, names] of registryQueries) {
    for (const name of names) {
      const value = await readRegistryValue(key, name);
      if (!value) continue;
      paths.add(normalize(name === 'SteamExe' ? dirname(value) : value));
    }
  }

  paths.add(normalize('C:\\Program Files (x86)\\Steam'));
  paths.add(normalize('C:\\Program Files\\Steam'));
  return Array.from(paths);
}

async function readRegistryValue(key, name) {
  try {
    const { stdout } = await execFileAsync('reg', ['query', key, '/v', name], { windowsHide: true });
    const line = stdout.split(/\r?\n/).find((item) => item.includes(name) && item.includes('REG_'));
    return line?.match(/\s+REG_\w+\s+(.+?)\s*$/)?.[1]?.trim() || null;
  } catch {
    return null;
  }
}

function parseSteamLibraryFolders(vdf) {
  const paths = [];
  for (const match of vdf.matchAll(/"path"\s+"([^"]+)"/g)) {
    paths.push(match[1].replace(/\\\\/g, '\\'));
  }
  return paths;
}

async function resolveDotaGsiTarget(inputPath, source = 'manual') {
  if (!inputPath) return null;
  const input = normalize(inputPath.replace(/^"+|"+$/g, ''));
  const candidates = candidateDotaPaths(input);

  for (const candidate of candidates) {
    const dotaPath = candidate.dotaPath;
    const cfgDir = candidate.cfgDir;
    if (await looksLikeDotaInstall(dotaPath)) {
      return { dotaPath, cfgDir, source };
    }
  }

  const directCfgDir = normalize(input);
  if (basename(directCfgDir).toLowerCase() === 'gamestate_integration') {
    const dotaPath = normalize(join(directCfgDir, '..', '..', '..', '..'));
    return { dotaPath, cfgDir: directCfgDir, source };
  }

  return null;
}

function candidateDotaPaths(input) {
  return [
    {
      dotaPath: input,
      cfgDir: join(input, 'game', 'dota', 'cfg', 'gamestate_integration')
    },
    {
      dotaPath: normalize(join(input, '..', '..')),
      cfgDir: join(input, 'cfg', 'gamestate_integration')
    },
    {
      dotaPath: normalize(join(input, '..', '..', '..', '..')),
      cfgDir: input
    }
  ];
}

async function looksLikeDotaInstall(dotaPath) {
  if (!dotaPath) return false;
  return await pathExists(join(dotaPath, 'game', 'dota'))
    || await pathExists(join(dotaPath, 'game', 'bin'))
    || await pathExists(join(dotaPath, 'game', 'dota', 'pak01_dir.vpk'));
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function makeGsiConfig() {
  return `"DotaStreamKit"
{
  "uri" "http://127.0.0.1:${port}/gsi/dota2"
  "timeout" "5.0"
  "buffer" "0.1"
  "throttle" "0.1"
  "heartbeat" "30.0"
  "data"
  {
    "provider" "1"
    "map" "1"
    "player" "1"
    "hero" "1"
    "allplayers" "1"
    "draft" "1"
  }
}
`;
}
