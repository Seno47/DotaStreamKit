import { createServer } from 'node:http';
import { chmod, copyFile, open, readFile, writeFile, mkdir, stat, rm, readdir, rename } from 'node:fs/promises';
import { createReadStream, rmSync } from 'node:fs';
import { basename, dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir, tmpdir } from 'node:os';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import {
  hasCompletePredictionOutcomePoints,
  hasPointsOnEveryPredictionOutcome,
  isLeftActiveGameViewCancelSignal,
  isPredictionProfileCompatibleWithActivity,
  isPredictionUncontested,
  shouldContinueLeftGameViewCancelCandidate
} from './prediction-safety.js';
import {
  collectMatchPlayers,
  normalizeAccountId,
  notablePlayersFromRankCache,
  updateMatchIntel
} from './game-intel.js';
import { inferOwnPickPhase } from './draft-phase.js';
import {
  applyStreamerMatchResult,
  normalizeStreamerStatsConfig,
  normalizeStreamerStatsState,
  repairMojibakeText,
  resetStreamerGoalRecord,
  resetStreamerSession,
  restorePreviousStreamerSession,
  selectStreamerMedal,
  updateStreamerSessionPresence
} from './streamer-stats.js';
import { merge } from './safe-merge.js';
import { explainMenuOcrSkip, pickScreenRegion, recognizeMenuMmr, setMenuMmrOcrCachePath } from './menu-mmr-ocr.js';
import { getScreenCaptureSupport, normalizeRegion } from './screen-capture.js';
import {
  inferPredictionResult as inferPredictionResultForMeta,
  latchPredictionResult
} from './prediction-result.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const execFileAsync = promisify(execFile);
const rootDir = normalize(join(__dirname, '..'));
const publicDir = join(rootDir, 'public');
const dataDir = resolveDataDir();
const assetDir = join(dataDir, 'assets');
const defaultAssetDir = join(publicDir, 'default-assets');
const configPath = join(dataDir, 'config.json');
const statePath = join(dataDir, 'state.json');
const twitchTokenPath = join(dataDir, 'twitch-token.json');
const appPackage = JSON.parse(await readFile(join(rootDir, 'package.json'), 'utf8'));
const appVersion = String(appPackage.version || '0.0.0');
setMenuMmrOcrCachePath(join(dataDir, 'tesseract-cache'));

const port = Number(process.env.PORT || 37273);
const githubRepoOwner = 'Seno47';
const githubRepoName = 'DotaStreamKit';
const githubLatestReleaseApi = `https://api.github.com/repos/${githubRepoOwner}/${githubRepoName}/releases/latest`;
const twitchApi = 'https://api.twitch.tv/helix';
const twitchId = 'https://id.twitch.tv/oauth2';
const twitchScopes = ['channel:manage:predictions', 'user:write:chat'];
const serverAuthPassword = String(process.env.DOTASTREAMKIT_SERVER_PASSWORD || '');

function resolveDataDir() {
  if (process.env.DOTASTREAMKIT_DATA_DIR) return normalize(process.env.DOTASTREAMKIT_DATA_DIR);
  if (process.env.DOTASTREAMKIT_LAUNCHER === '1' && isInsideProtectedInstallDir(rootDir)) {
    const base = process.env.APPDATA || process.env.LOCALAPPDATA || process.env.USERPROFILE;
    if (base) return normalize(join(base, 'DotaStreamKit'));
  }
  return join(rootDir, 'data');
}

function isInsideProtectedInstallDir(path) {
  if (process.platform !== 'win32') return false;
  const normalizedPath = normalize(path).toLowerCase();
  const protectedRoots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
    .filter(Boolean)
    .map((value) => normalize(value).toLowerCase());
  return protectedRoots.some((protectedRoot) => normalizedPath === protectedRoot || normalizedPath.startsWith(`${protectedRoot}\\`));
}

const queueAutoOnDelayMs = 0;
const queueAutoOffDelayMs = 2500;
const queueAutoStaleKeepMs = 10 * 60 * 1000;
const gsiConnectedTimeoutMs = 60 * 1000;
const autoPredictionRetryMs = 30000;
const activePredictionSyncMs = 15000;
const twitchRequestTimeoutMs = 10000;
const twitchValidationIntervalMs = 60 * 60 * 1000;
const oauthStateTtlMs = 10 * 60 * 1000;
const leftGameViewPredictionCancelDelaySeconds = 15;
const playerRankCacheTtlMs = 12 * 60 * 60 * 1000;
const playerRankFailureTtlMs = 15 * 60 * 1000;
const inGameStatePattern = /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS|POST_GAME/i;
const queueSearchPattern = /queue|search|matchmaking|match_making|find.?match|finding.?match|game.?search|party.?search/i;
const heroDemoPattern = /hero.?demo|demo.?hero/i;
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
const dotaHeroNamesById = {
  1: 'Anti-Mage',
  2: 'Axe',
  3: 'Bane',
  4: 'Bloodseeker',
  5: 'Crystal Maiden',
  6: 'Drow Ranger',
  7: 'Earthshaker',
  8: 'Juggernaut',
  9: 'Mirana',
  10: 'Morphling',
  11: 'Shadow Fiend',
  12: 'Phantom Lancer',
  13: 'Puck',
  14: 'Pudge',
  15: 'Razor',
  16: 'Sand King',
  17: 'Storm Spirit',
  18: 'Sven',
  19: 'Tiny',
  20: 'Vengeful Spirit',
  21: 'Windranger',
  22: 'Zeus',
  23: 'Kunkka',
  25: 'Lina',
  26: 'Lion',
  27: 'Shadow Shaman',
  28: 'Slardar',
  29: 'Tidehunter',
  30: 'Witch Doctor',
  31: 'Lich',
  32: 'Riki',
  33: 'Enigma',
  34: 'Tinker',
  35: 'Sniper',
  36: 'Necrophos',
  37: 'Warlock',
  38: 'Beastmaster',
  39: 'Queen of Pain',
  40: 'Venomancer',
  41: 'Faceless Void',
  42: 'Wraith King',
  43: 'Death Prophet',
  44: 'Phantom Assassin',
  45: 'Pugna',
  46: 'Templar Assassin',
  47: 'Viper',
  48: 'Luna',
  49: 'Dragon Knight',
  50: 'Dazzle',
  51: 'Clockwerk',
  52: 'Leshrac',
  53: "Nature's Prophet",
  54: 'Lifestealer',
  55: 'Dark Seer',
  56: 'Clinkz',
  57: 'Omniknight',
  58: 'Enchantress',
  59: 'Huskar',
  60: 'Night Stalker',
  61: 'Broodmother',
  62: 'Bounty Hunter',
  63: 'Weaver',
  64: 'Jakiro',
  65: 'Batrider',
  66: 'Chen',
  67: 'Spectre',
  68: 'Ancient Apparition',
  69: 'Doom',
  70: 'Ursa',
  71: 'Spirit Breaker',
  72: 'Gyrocopter',
  73: 'Alchemist',
  74: 'Invoker',
  75: 'Silencer',
  76: 'Outworld Devourer',
  77: 'Lycan',
  78: 'Brewmaster',
  79: 'Shadow Demon',
  80: 'Lone Druid',
  81: 'Chaos Knight',
  82: 'Meepo',
  83: 'Treant Protector',
  84: 'Ogre Magi',
  85: 'Undying',
  86: 'Rubick',
  87: 'Disruptor',
  88: 'Nyx Assassin',
  89: 'Naga Siren',
  90: 'Keeper of the Light',
  91: 'Io',
  92: 'Visage',
  94: 'Medusa',
  95: 'Troll Warlord',
  96: 'Centaur Warrunner',
  97: 'Magnus',
  98: 'Timbersaw',
  99: 'Bristleback',
  100: 'Tusk',
  101: 'Skywrath Mage',
  102: 'Abaddon',
  103: 'Elder Titan',
  104: 'Legion Commander',
  105: 'Techies',
  106: 'Ember Spirit',
  107: 'Earth Spirit',
  108: 'Underlord',
  109: 'Terrorblade',
  110: 'Phoenix',
  111: 'Oracle',
  112: 'Winter Wyvern',
  113: 'Arc Warden',
  114: 'Monkey King',
  119: 'Dark Willow',
  120: 'Pangolier',
  121: 'Grimstroke',
  123: 'Hoodwink',
  126: 'Void Spirit',
  128: 'Snapfire',
  129: 'Mars',
  131: 'Ringmaster',
  135: 'Dawnbreaker',
  136: 'Marci',
  137: 'Primal Beast',
  138: 'Muerta',
  145: 'Kez',
  155: 'Largo'
};
const dotaHeroNamesByNpc = {
  npc_dota_hero_antimage: 'Anti-Mage',
  npc_dota_hero_nevermore: 'Shadow Fiend',
  npc_dota_hero_furion: "Nature's Prophet",
  npc_dota_hero_life_stealer: 'Lifestealer',
  npc_dota_hero_rattletrap: 'Clockwerk',
  npc_dota_hero_skeleton_king: 'Wraith King',
  npc_dota_hero_zuus: 'Zeus',
  npc_dota_hero_necrolyte: 'Necrophos',
  npc_dota_hero_obsidian_destroyer: 'Outworld Devourer',
  npc_dota_hero_magnataur: 'Magnus',
  npc_dota_hero_shredder: 'Timbersaw',
  npc_dota_hero_wisp: 'Io',
  npc_dota_hero_abyssal_underlord: 'Underlord',
  npc_dota_hero_bird_samurai: 'Kez',
  npc_dota_hero_ring_master: 'Ringmaster'
};

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
    detectionSource: '',
    gsiToken: ''
  },
  updates: {
    autoCheck: true,
    autoInstall: false
  },
  protection: {
    autoDraft: true,
    autoMinimap: true,
    autoQueue: true,
    draftHideMode: 'all',
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
      normal: { left: 0, bottom: 0, width: 272, height: 280 },
      large: { left: 0, bottom: 0, width: 326, height: 326 }
    },
    minimapContentAreas: {
      normal: { left: -3, top: 12, width: 96, height: 91 },
      large: { left: -3, top: 12, width: 91, height: 91 }
    },
    draftMaskParts: [
      { left: 0, top: 128, width: 1920, height: 742 },
      { left: 0, top: 870, width: 838, height: 194 },
      { left: 1324, top: 870, width: 596, height: 194 },
      { left: 0, top: 1064, width: 1920, height: 16 }
    ],
    queueProfileRight: 398,
    queueChatBox: { left: 616, top: 742, width: 688, height: 317 },
    matchIntel: {
      enabled: true,
      showPlayerRanks: true,
      showPlayerFlags: false,
      showAegisTimer: true,
      showRoshanTimer: true,
      showStreamerStats: true,
      showStreamerRankMedal: true,
      showStreamerMmr: true,
      showStreamerWinLoss: true,
      streamerWinLossPosition: 'left',
      streamerWinLossMenuPosition: 'left',
      streamerWinLossGamePosition: 'left',
      hideStreamerStatsDuringDraft: true,
      showStreamerMmrGoal: true,
      showStreamerMmrGoalInMenu: true,
      showStreamerMmrGoalDuringDraft: true,
      showStreamerMmrGoalInGame: true,
      showStreamerMmrGoalProgress: true,
      showStreamerMmrGoalCurrent: true,
      showStreamerMmrGoalStart: false,
      showStreamerMmrGoalTarget: true,
      showStreamerMmrGoalRecord: true,
      showStreamerMmrGoalWinRate: true,
      showStreamerMmrGoalEta: true,
      showStreamerMmrGoalDelta: true,
      showStreamerMmrGoalBackground: true,
      streamerMmrGoalTemplate: 'classic',
      streamerMmrGoalFillStart: '#63c9ff',
      streamerMmrGoalFillEnd: '#8df0a1',
      streamerMmrGoalTrack: '#101720',
      streamerMmrGoalAccent: '#ffdf91',
      streamerMmrGoalText: '#f8f1df',
      streamerMmrGoalBarHeight: 13,
      streamerMmrGoalBarRadius: 7,
      streamerMmrGoalGlow: 12,
      streamerMmrGoalAnimationSpeed: 1,
      streamerMmrGoalPaddingTop: 10,
      streamerMmrGoalPaddingRight: 10,
      streamerMmrGoalPaddingBottom: 10,
      streamerMmrGoalPaddingLeft: 10,
      streamerMmrGoalAnimated: true,
      streamerMmrGoalStartPrefix: '',
      streamerMmrGoalStartSuffix: ' → ',
      streamerMmrGoalCurrentPrefix: '',
      streamerMmrGoalCurrentSuffix: '',
      streamerMmrGoalTargetPrefix: '/ ',
      streamerMmrGoalTargetSuffix: '',
      streamerMmrGoalDeltaPrefix: '+',
      streamerMmrGoalDeltaSuffix: '',
      streamerMmrGoalCustomCss: '',
      streamerMedalSource: 'auto',
      streamerMmr: 0,
      streamerGoalMmr: 0,
      streamerGoalStartMmr: 0,
      autoUpdateStreamerMmr: true,
      menuMmrOcrEnabled: false,
      menuMmrOcrRegion: null,
      autoBindStreamerAccounts: true,
      streamerAccounts: [],
      streamerMmrWinDelta: 25,
      streamerMmrLossDelta: 25,
      streamerMmrGoalSplitPositionsMigrated: false,
      overlayPositions: {
        streamerStatsMenu: { x: 0, y: 0 },
        streamerStatsGame: { x: 0, y: 0 },
        streamerMmrGoalMenu: { x: 0, y: 0 },
        streamerMmrGoalGame: { x: 0, y: 0 },
        streamerMmrGoal: { x: 0, y: 0 },
        roshanTimer: { x: 0, y: 0 },
        predictionOverlay: { x: 0, y: 0 }
      },
      rankDisplayMode: 'minutes',
      rankDisplayMinutes: 12,
      customPlayers: []
    },
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
    ],
    matchIntelSlots: [
      { left: 548, top: 0, width: 62, height: 40 },
      { left: 610, top: 0, width: 62, height: 40 },
      { left: 672, top: 0, width: 62, height: 40 },
      { left: 734, top: 0, width: 62, height: 40 },
      { left: 796, top: 0, width: 62, height: 40 },
      { left: 1064, top: 0, width: 62, height: 40 },
      { left: 1126, top: 0, width: 62, height: 40 },
      { left: 1188, top: 0, width: 62, height: 40 },
      { left: 1250, top: 0, width: 62, height: 40 },
      { left: 1312, top: 0, width: 62, height: 40 }
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

defaultConfig.spectatorPredictions = {
  ...structuredClone(defaultConfig.predictions),
  titleTemplate: 'Ставка на просматриваемую игру?',
  types: {
    radiant_win: { enabled: true, weight: 3, titleTemplate: 'Победа {radiant_team}?', yesTitle: 'Да', noTitle: 'Нет' },
    dire_win: { enabled: true, weight: 3, titleTemplate: 'Победа {dire_team}?', yesTitle: 'Да', noTitle: 'Нет' },
    game_duration_at_least: { enabled: true, weight: 2, minMinute: 35, maxMinute: 55, titleTemplate: 'Игра продлится {minute}:00?', yesTitle: 'Да', noTitle: 'Нет' },
    total_kills_by_minute: { enabled: true, weight: 2, min: 20, max: 45, minMinute: 20, maxMinute: 35, titleTemplate: 'К {minute}:00 будет {target}+ убийств?', yesTitle: 'Да', noTitle: 'Нет' },
    radiant_kills_by_minute: { enabled: true, weight: 1, min: 10, max: 25, minMinute: 20, maxMinute: 35, titleTemplate: '{radiant_team}: {target}+ убийств к {minute}:00?', yesTitle: 'Да', noTitle: 'Нет' },
    dire_kills_by_minute: { enabled: true, weight: 1, min: 10, max: 25, minMinute: 20, maxMinute: 35, titleTemplate: '{dire_team}: {target}+ убийств к {minute}:00?', yesTitle: 'Да', noTitle: 'Нет' }
  },
  customTemplates: []
};

defaultConfig.protection.spectatorMatchIntel = {
  ...structuredClone(defaultConfig.protection.matchIntel),
  showSpectatorGameLabel: true,
  spectatorGameLabelTemplate: 'Spectating game: {game_id}',
  showStreamerStats: false
};

const runtime = {
  clients: new Set(),
  oauthStates: new Map(),
  queueAuto: { active: false, desired: false, desiredSince: 0 },
  dotaProcess: { running: null, checkedAt: null },
  updateInstallStarted: false,
  twitchStreamStatus: { broadcasterId: null, checkedAt: 0, isLive: null, streamId: null, gameName: null, title: null },
  twitchStreamStatusPromise: null,
  twitchTokenRefreshPromise: null,
  twitchLastValidatedAt: 0,
  twitchAuthGeneration: 0,
  twitchAuthMutation: null,
  playerRankCache: new Map(),
  pendingPlayerRankFetches: new Map(),
  predictionActionAttempts: new Map(),
  predictionCreation: null,
  predictionAutomationRunning: false,
  predictionAutomationQueue: [],
  menuMmrOcrInFlight: false,
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
      matchContextKey: null,
      playerActivity: null,
      playerActivitySource: null,
      activityDebug: null,
      playerTeam: null,
      radiantTeamName: null,
      direTeamName: null,
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
      radiantKills: null,
      radiantDeaths: null,
      radiantAssists: null,
      direKills: null,
      direDeaths: null,
      direAssists: null,
      totalKills: null,
      totalDeaths: null,
      totalAssists: null,
      playerHeroPicked: false,
      draftActiveTeam: null,
      ownPickPhaseEnded: false,
      ownTeamPickedHeroCount: null,
      enemyTeamPickedHeroCount: null,
      ownPickPhaseTargetCount: null,
      ownPickPhaseSource: null,
      draftCycle: 0,
      spectatorCycle: 0,
      queueSearchSignal: false,
      inGameScreen: false,
      leftGameView: false,
      heroDemoMode: false,
      lifecycleSeed: null
    },
    matchIntel: {
      contextKey: null,
      matchId: null,
      players: [],
      notablePlayers: [],
      roshan: null,
      roshanStatus: null,
      aegis: null,
      expiredAegisHolderKey: '',
      aegisHolderAbsenceConfirmed: false
    },
    streamerStats: normalizeStreamerStatsState({}),
    dota: {
      processRunning: null,
      processCheckedAt: null
    },
    protection: { draft: false, minimap: false, topBar: false, queue: false },
    twitch: { authenticated: false, broadcasterId: null, broadcasterLogin: null, tokenExpiresAt: null },
    update: {
      checking: false,
      checkedAt: null,
      currentVersion: appVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: '',
      error: ''
    },
    activePrediction: null,
    activePredictionMatchId: null,
    activePredictionMeta: null,
    activePredictionRecovery: null,
    predictionCancelCandidate: null,
    lastAutoPredictionAttempt: null,
    autoPredictionCreatedKey: null,
    autoPredictionSuppressedKey: null,
    activePredictionSyncedAt: null,
    events: []
  }
};

let configWriteQueue = Promise.resolve();
let stateWriteQueue = Promise.resolve();
let twitchTokenWriteQueue = Promise.resolve();
let scheduledStatePersist = null;
let instanceLockHandle = null;
let effectiveServerNetworking = false;
const instanceLockPath = join(dataDir, '.instance.lock');

await mkdir(dataDir, { recursive: true, mode: 0o700 });
if (process.platform !== 'win32') await chmod(dataDir, 0o700);
await acquireInstanceLock();
await mkdir(assetDir, { recursive: true });
await migrateLegacyLocalDataDir();
runtime.config = await loadJson(configPath, defaultConfig);
await migrateConfig(runtime.config);
effectiveServerNetworking = runtime.config.deployment?.mode === 'server' && Boolean(serverAuthPassword);
runtime.state = { ...runtime.state, ...(await loadJson(statePath, {})) };
const legacyStateTwitchToken = runtime.state.twitchToken || null;
const dedicatedTwitchToken = await loadTwitchTokenBackup();
runtime.state.twitchToken = dedicatedTwitchToken || legacyStateTwitchToken;
if (legacyStateTwitchToken) {
  if (!dedicatedTwitchToken) await persistTwitchTokenBackup();
  await persistState({ backup: false });
  await rm(`${statePath}.bak`, { force: true });
}
runtime.state.startedAt = new Date().toISOString();
const persistedGsi = runtime.state.gsi && typeof runtime.state.gsi === 'object' ? runtime.state.gsi : {};
const persistedGsiLifecycleSeed = persistedGsi.lifecycleSeed && typeof persistedGsi.lifecycleSeed === 'object'
  ? persistedGsi.lifecycleSeed
  : {
      gameState: persistedGsi.gameState || null,
      playerActivity: persistedGsi.playerActivity || null,
      clockTime: Number.isFinite(Number(persistedGsi.clockTime)) ? Number(persistedGsi.clockTime) : null,
      matchId: persistedGsi.matchId || null,
      activeMatchId: persistedGsi.activeMatchId || null,
      lastSeenAt: persistedGsi.lastSeenAt || null
    };
runtime.state.gsi = {
  connected: false,
  lastSeenAt: null,
  gameState: null,
  clockTime: null,
  matchId: null,
  activeMatchId: null,
  matchContextKey: null,
  playerActivity: null,
  playerActivitySource: null,
  activityDebug: null,
  playerTeam: null,
  radiantTeamName: null,
  direTeamName: null,
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
  radiantKills: null,
  radiantDeaths: null,
  radiantAssists: null,
  direKills: null,
  direDeaths: null,
  direAssists: null,
  totalKills: null,
  totalDeaths: null,
  totalAssists: null,
  playerHeroPicked: false,
  draftActiveTeam: null,
  ownPickPhaseEnded: false,
  ownTeamPickedHeroCount: null,
  enemyTeamPickedHeroCount: null,
  ownPickPhaseTargetCount: null,
  ownPickPhaseSource: null,
  draftCycle: Math.max(0, Math.trunc(Number(persistedGsi.draftCycle || 0))),
  spectatorCycle: Math.max(0, Math.trunc(Number(persistedGsi.spectatorCycle || 0))),
  queueSearchSignal: false,
  inGameScreen: false,
  leftGameView: false,
  heroDemoMode: false,
  lifecycleSeed: persistedGsiLifecycleSeed
};
runtime.state.dota = {
  processRunning: null,
  processCheckedAt: null
};
runtime.state.update = normalizeUpdateState(runtime.state.update);
const persistedMatchIntel = runtime.state.matchIntel && typeof runtime.state.matchIntel === 'object'
  ? runtime.state.matchIntel
  : {};
runtime.state.matchIntel = {
  contextKey: persistedMatchIntel.contextKey || null,
  matchId: persistedMatchIntel.matchId || null,
  players: [],
  notablePlayers: [],
  roshan: null,
  roshanStatus: null,
  aegis: null,
  expiredAegisHolderKey: persistedMatchIntel.expiredAegisHolderKey || '',
  aegisHolderAbsenceConfirmed: persistedMatchIntel.aegisHolderAbsenceConfirmed === true,
  lastAegisPickupEventKey: persistedMatchIntel.lastAegisPickupEventKey || null,
  aegisPickupSignalActive: persistedMatchIntel.aegisPickupSignalActive === true,
  lastRoshanEventKey: persistedMatchIntel.lastRoshanEventKey || null,
  roshanSignalActive: persistedMatchIntel.roshanSignalActive === true
};
runtime.state.streamerStats = normalizeStreamerStatsState(runtime.state.streamerStats);
runtime.state.activePredictionRecovery = runtime.state.activePredictionRecovery || null;
runtime.state.lastAutoPredictionAttempt = null;
runtime.state.autoPredictionCreatedKey = typeof runtime.state.autoPredictionCreatedKey === 'string'
  ? runtime.state.autoPredictionCreatedKey
  : null;
runtime.state.autoPredictionSuppressedKey = null;
runtime.state.activePredictionSyncedAt = null;
runtime.state.menuMmrOcr = runtime.state.menuMmrOcr && typeof runtime.state.menuMmrOcr === 'object'
  ? runtime.state.menuMmrOcr
  : { lastRunAt: null, lastMmr: null, lastRawText: null, lastError: null };
await ensureGeneratedAssets();
await refreshInstalledGsiConfig();
await refreshDotaProcessState();
runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
hydrateTwitchStatus();
restoreTwitchStatus().catch((error) => logEvent('twitch', `Saved Twitch token restore failed: ${error.message}`));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
    enforceRequestSecurity(req, url);

    if (req.method === 'GET' && url.pathname === '/api/events') return handleEvents(req, res);
    if (req.method === 'GET' && url.pathname === '/api/state') return sendJson(res, publicState());
    if (req.method === 'GET' && url.pathname === '/api/assets') return await assetStatus(res);
    if (req.method === 'POST' && url.pathname === '/api/assets') return await uploadAsset(req, res);
    if (req.method === 'GET' && url.pathname === '/api/config') return sendJson(res, sanitizeConfig(runtime.config));
    if (req.method === 'POST' && url.pathname === '/api/config') return await updateConfig(req, res);
    if (req.method === 'GET' && url.pathname === '/api/backup/export') return await exportBackupApi(url, res);
    if (req.method === 'POST' && url.pathname === '/api/backup/import') return await importBackupApi(req, res);
    if (req.method === 'GET' && url.pathname === '/api/updates/check') return await checkUpdatesApi(res);
    if (req.method === 'POST' && url.pathname === '/api/updates/install') return await installUpdateApi(req, res);
    if (req.method === 'POST' && url.pathname === '/api/protection') return await updateProtection(req, res);
    if (req.method === 'POST' && url.pathname === '/api/streamer-stats/reset') return await resetStreamerStatsApi(res);
    if (req.method === 'POST' && url.pathname === '/api/streamer-stats/goal-reset') return await resetStreamerGoalRecordApi(req, res);
    if (req.method === 'POST' && url.pathname === '/api/streamer-stats/restore') return await restoreStreamerStatsApi(res);
    if (req.method === 'POST' && url.pathname === '/api/menu-mmr-ocr/pick-region') return await pickMenuMmrOcrRegionApi(res);
    if (req.method === 'POST' && url.pathname === '/api/menu-mmr-ocr/set-region') return await setMenuMmrOcrRegionApi(req, res);
    if (req.method === 'POST' && url.pathname === '/api/menu-mmr-ocr/clear-region') return await clearMenuMmrOcrRegionApi(res);
    if (req.method === 'POST' && url.pathname === '/gsi/dota2') return await handleGsi(req, res);
    if (req.method === 'GET' && url.pathname === '/api/dota/detect') return await detectDotaApi(res);
    if (req.method === 'POST' && url.pathname === '/api/install-gsi') return await installGsi(req, res);
    if (req.method === 'GET' && url.pathname === '/auth/twitch') return startTwitchAuth(url, res);
    if (req.method === 'GET' && url.pathname === '/auth/twitch/callback') return await finishTwitchAuth(url, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/logout') return await twitchLogout(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/resolve-channel') return await resolveTwitchChannelApi(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/chat') return await sendChatMessage(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/predictions') return await createPrediction(req, res);
    if (req.method === 'POST' && url.pathname === '/api/twitch/predictions/active/refresh') return await refreshActivePredictionApi(res);
    if (req.method === 'GET' && url.pathname === '/api/twitch/predictions') return await getPredictions(res);

    const predictionAction = url.pathname.match(/^\/api\/twitch\/predictions\/([^/]+)\/(lock|cancel|resolve)$/);
    if (req.method === 'POST' && predictionAction) {
      return await endPrediction(req, res, decodeURIComponent(predictionAction[1]), predictionAction[2]);
    }

    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) return await serveAsset(url.pathname, res);

    return await serveStatic(url.pathname, res);
  } catch (error) {
    logEvent('error', error.message);
    if (error.requireBasicAuth && !res.headersSent) {
      res.setHeader('www-authenticate', 'Basic realm="DotaStreamKit", charset="UTF-8"');
    }
    return sendJson(res, { error: error.message }, Number(error.statusCode) || 500);
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

const listenHost = serverNetworkingEnabled() ? '0.0.0.0' : '127.0.0.1';
server.listen(port, listenHost, () => {
  const dashboardUrl = effectiveBaseUrl();
  logEvent('system', `DotaStreamKit started on ${dashboardUrl}`);
  console.log(`DotaStreamKit: ${dashboardUrl}`);
  console.log(`OBS overlay:   ${dashboardUrl}/overlay.html`);
  if (runtime.config.deployment?.mode === 'server' && !serverNetworkingEnabled()) {
    logEvent('system', 'Server mode stayed on loopback because DOTASTREAMKIT_SERVER_PASSWORD is not set');
    console.warn('Server mode requires DOTASTREAMKIT_SERVER_PASSWORD; listening on loopback only.');
  }
  scheduleStartupUpdateCheck();
});

setInterval(() => {
  refreshRuntimePresence().catch((error) => logEvent('system', `Runtime presence check failed: ${error.message}`));
}, 5000);

async function refreshRuntimePresence() {
  const processChanged = await refreshDotaProcessState();
  syncOwnedActivePredictionFromTwitch().catch((error) => logEvent('twitch', `Active prediction sync failed: ${error.message}`));
  const hasSeenGsi = Boolean(runtime.state.gsi.lastSeenAt);
  const connected = hasSeenGsi && Date.now() - Date.parse(runtime.state.gsi.lastSeenAt) < gsiConnectedTimeoutMs;
  if (hasSeenGsi && !connected) {
    maybeCancelPredictionForGsiTimeout().catch((error) => logEvent('twitch', `Auto cancel failed: ${error.message}`));
  }
  const connectionChanged = runtime.state.gsi.connected !== connected;
  runtime.state.gsi.connected = connected;
  if (connectionChanged && !connected) {
    runtime.state.gsi.gameState = null;
    runtime.state.gsi.playerActivity = null;
    runtime.state.gsi.playerActivitySource = null;
    runtime.state.gsi.activityDebug = null;
    runtime.state.gsi.playerHeroPicked = false;
    runtime.state.gsi.draftActiveTeam = null;
    runtime.state.gsi.ownPickPhaseEnded = false;
    runtime.state.gsi.ownTeamPickedHeroCount = null;
    runtime.state.gsi.enemyTeamPickedHeroCount = null;
    runtime.state.gsi.ownPickPhaseTargetCount = null;
    runtime.state.gsi.ownPickPhaseSource = null;
    runtime.state.gsi.inGameScreen = false;
    runtime.state.gsi.leftGameView = false;
    runtime.state.gsi.heroDemoMode = false;
  }
  const protection = computeProtection(runtime.config, runtime.state.gsi);
  const protectionChanged = !sameProtection(runtime.state.protection, protection);
  const streamerSessionChanged = syncStreamerSessionPresence();
  if (processChanged || connectionChanged || protectionChanged || streamerSessionChanged) {
    runtime.state.protection = protection;
    if (streamerSessionChanged) await persistState();
    else scheduleStatePersist();
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

setInterval(() => {
  maybeRunMenuMmrOcr().catch((error) => logEvent('system', `Menu MMR OCR failed: ${error.message}`));
}, 10_000);

refreshTwitchStreamStatus().catch((error) => logEvent('twitch', `Stream status check failed: ${error.message}`));

async function loadJson(path, fallback) {
  try {
    return merge(structuredClone(fallback), JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      try {
        const backupContents = await readFile(`${path}.bak`, 'utf8');
        const recovered = merge(structuredClone(fallback), JSON.parse(backupContents));
        await writeFileAtomic(path, backupContents, { backup: false });
        console.warn(`Recovered missing JSON from ${path}.bak`);
        return recovered;
      } catch (backupError) {
        if (!(backupError instanceof SyntaxError) && backupError?.code !== 'ENOENT') throw backupError;
      }
      await writeFileAtomic(path, JSON.stringify(fallback, null, 2), { backup: false });
      return structuredClone(fallback);
    }
    if (!(error instanceof SyntaxError)) throw error;

    const backupPath = `${path}.bak`;
    try {
      const backupContents = await readFile(backupPath, 'utf8');
      const recovered = merge(structuredClone(fallback), JSON.parse(backupContents));
      await preserveCorruptJson(path);
      await writeFileAtomic(path, backupContents, { backup: false });
      console.warn(`Recovered invalid JSON from ${backupPath}`);
      return recovered;
    } catch (backupError) {
      if (backupError instanceof SyntaxError || backupError?.code === 'ENOENT') {
        await preserveCorruptJson(path);
        await writeFileAtomic(path, JSON.stringify(fallback, null, 2), { backup: false });
        console.warn(`Invalid JSON was preserved and ${path} was reset to defaults`);
        return structuredClone(fallback);
      }
      throw backupError;
    }
  }
}

async function acquireInstanceLock() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      instanceLockHandle = await open(instanceLockPath, 'wx', 0o600);
      await instanceLockHandle.writeFile(JSON.stringify({ pid: process.pid, port, startedAt: new Date().toISOString() }));
      await instanceLockHandle.sync();
      await instanceLockHandle.close();
      instanceLockHandle = null;
      process.once('exit', releaseInstanceLockSync);
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
      const owner = await readInstanceLockOwner();
      if (owner?.pid && isProcessAlive(owner.pid)) {
        console.error(`DotaStreamKit is already running (PID ${owner.pid}, port ${owner.port || port}).`);
        process.exit(1);
      }
      await rm(instanceLockPath, { force: true });
    }
  }
  throw new Error('Could not acquire the DotaStreamKit instance lock');
}

async function readInstanceLockOwner() {
  try {
    return JSON.parse(await readFile(instanceLockPath, 'utf8'));
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  const numericPid = Number(pid);
  if (!Number.isInteger(numericPid) || numericPid <= 0) return false;
  try {
    process.kill(numericPid, 0);
    return true;
  } catch {
    return false;
  }
}

function releaseInstanceLockSync() {
  try {
    rmSync(instanceLockPath, { force: true });
  } catch {}
}

async function preserveCorruptJson(path) {
  const suffix = new Date().toISOString().replace(/[:.]/g, '-');
  await rename(path, `${path}.corrupt-${suffix}`);
}

async function writeFileAtomic(path, contents, options = {}) {
  const temporaryPath = `${path}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
  const mode = options.mode ?? 0o600;
  let handle = null;
  try {
    handle = await open(temporaryPath, 'w', mode);
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = null;
    if (options.backup !== false) {
      try {
        await copyFile(path, `${path}.bak`);
        if (process.platform !== 'win32') await chmod(`${path}.bak`, mode);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    try {
      await rename(temporaryPath, path);
    } catch (error) {
      if (!['EEXIST', 'EPERM'].includes(error?.code)) throw error;
      await rm(path, { force: true });
      await rename(temporaryPath, path);
    }
    if (process.platform !== 'win32') await chmod(path, mode);
  } finally {
    await handle?.close().catch(() => {});
    await rm(temporaryPath, { force: true });
  }
}

async function persistConfig() {
  const contents = JSON.stringify(runtime.config, null, 2);
  configWriteQueue = configWriteQueue.catch(() => {}).then(() => writeFileAtomic(configPath, contents));
  return configWriteQueue;
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

  const beforeDota = JSON.stringify(config.dota || {});
  config.dota = merge(structuredClone(defaultConfig.dota), config.dota || {});
  if (!/^[a-f0-9]{64}$/i.test(String(config.dota.gsiToken || ''))) {
    config.dota.gsiToken = randomBytes(32).toString('hex');
  }
  if (JSON.stringify(config.dota) !== beforeDota) changed = true;

  const beforeTwitch = JSON.stringify(config.twitch || {});
  config.twitch = merge(structuredClone(defaultConfig.twitch), config.twitch || {});
  normalizeTwitchConfig(config.twitch);
  if (JSON.stringify(config.twitch) !== beforeTwitch) changed = true;

  const beforePredictions = JSON.stringify(config.predictions || {});
  config.predictions = merge(structuredClone(defaultConfig.predictions), config.predictions || {});
  normalizePredictionSettings(config.predictions, defaultConfig.predictions);
  if (JSON.stringify(config.predictions) !== beforePredictions) changed = true;

  const beforeSpectatorPredictions = JSON.stringify(config.spectatorPredictions || {});
  config.spectatorPredictions = merge(structuredClone(defaultConfig.spectatorPredictions), config.spectatorPredictions || {});
  normalizePredictionSettings(config.spectatorPredictions, defaultConfig.spectatorPredictions);
  if (JSON.stringify(config.spectatorPredictions) !== beforeSpectatorPredictions) changed = true;

  const beforeUpdates = JSON.stringify(config.updates || {});
  config.updates = merge(structuredClone(defaultConfig.updates), config.updates || {});
  normalizeUpdateConfig(config.updates);
  if (JSON.stringify(config.updates) !== beforeUpdates) changed = true;

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
  if (!Array.isArray(config.protection.matchIntelSlots) || config.protection.matchIntelSlots.length !== 10) {
    config.protection.matchIntelSlots = structuredClone(defaultConfig.protection.matchIntelSlots);
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
  if (!['all', 'streamer_team'].includes(config.protection.draftHideMode)) {
    config.protection.draftHideMode = defaultConfig.protection.draftHideMode;
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
  const normalMinimapBox = config.protection.minimapBoxes?.normal;
  const expectedNormalMinimapBox = defaultConfig.protection.minimapBoxes.normal;
  const hasOldNormalMinimapBox = normalMinimapBox
    && Number(normalMinimapBox.left) === 8
    && Number(normalMinimapBox.bottom) === 8
    && Number(normalMinimapBox.width) === 264
    && Number(normalMinimapBox.height) === 264;
  if (hasOldNormalMinimapBox) {
    config.protection.minimapBoxes.normal = structuredClone(expectedNormalMinimapBox);
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
  const hasOldLowDraftTop = Array.isArray(config.protection.draftMaskParts)
    && config.protection.draftMaskParts.length === 4
    && Number(config.protection.draftMaskParts[0]?.left) === 0
    && Number(config.protection.draftMaskParts[0]?.top) === 178
    && Number(config.protection.draftMaskParts[0]?.width) === 1920
    && Number(config.protection.draftMaskParts[0]?.height) === 692;
  if (!Array.isArray(config.protection.draftMaskParts) || config.protection.draftMaskParts.length !== 4 || hasOldRightChatDraftCutout || hasOldLowDraftTop) {
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
  if (!config.protection.matchIntel || typeof config.protection.matchIntel !== 'object') {
    config.protection.matchIntel = structuredClone(defaultConfig.protection.matchIntel);
    changed = true;
  } else {
    const beforeMatchIntel = JSON.stringify(config.protection.matchIntel);
    const rawMatchIntel = config.protection.matchIntel;
    const hadAegisTimer = Object.prototype.hasOwnProperty.call(rawMatchIntel, 'showAegisTimer');
    const hadRoshanTimer = Object.prototype.hasOwnProperty.call(rawMatchIntel, 'showRoshanTimer');
    config.protection.matchIntel = merge(structuredClone(defaultConfig.protection.matchIntel), rawMatchIntel);
    if (!hadAegisTimer && rawMatchIntel.showAegisRoshan === false) config.protection.matchIntel.showAegisTimer = false;
    if (!hadRoshanTimer && rawMatchIntel.showAegisRoshan === false) config.protection.matchIntel.showRoshanTimer = false;
    normalizeMatchIntelConfig(config.protection.matchIntel);
    if (JSON.stringify(config.protection.matchIntel) !== beforeMatchIntel) changed = true;
  }
  if (!config.protection.spectatorMatchIntel || typeof config.protection.spectatorMatchIntel !== 'object') {
    config.protection.spectatorMatchIntel = structuredClone(defaultConfig.protection.spectatorMatchIntel);
    changed = true;
  } else {
    const beforeSpectatorMatchIntel = JSON.stringify(config.protection.spectatorMatchIntel);
    config.protection.spectatorMatchIntel = merge(structuredClone(defaultConfig.protection.spectatorMatchIntel), config.protection.spectatorMatchIntel);
    normalizeMatchIntelConfig(config.protection.spectatorMatchIntel, { spectatorLabel: true });
    if (JSON.stringify(config.protection.spectatorMatchIntel) !== beforeSpectatorMatchIntel) changed = true;
  }

  if (changed) await persistConfig();
}

async function persistState(options = {}) {
  const { twitchToken, ...stateWithoutSecrets } = runtime.state;
  const saved = { ...stateWithoutSecrets, events: runtime.state.events.slice(0, 100) };
  const contents = JSON.stringify(saved, null, 2);
  stateWriteQueue = stateWriteQueue.catch(() => {}).then(() => writeFileAtomic(statePath, contents, options));
  return stateWriteQueue;
}

function scheduleStatePersist(delayMs = 1000) {
  if (scheduledStatePersist) return;
  scheduledStatePersist = setTimeout(() => {
    scheduledStatePersist = null;
    persistState().catch((error) => console.error(`State persistence failed: ${error.message}`));
  }, delayMs);
  scheduledStatePersist.unref?.();
}

async function loadTwitchTokenBackup() {
  try {
    return JSON.parse(await readFile(twitchTokenPath, 'utf8'));
  } catch {
    try {
      return JSON.parse(await readFile(`${twitchTokenPath}.bak`, 'utf8'));
    } catch {
      return null;
    }
  }
}

async function persistTwitchTokenBackup() {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) return;
  const contents = JSON.stringify(token, null, 2);
  twitchTokenWriteQueue = twitchTokenWriteQueue.catch(() => {}).then(() => writeFileAtomic(twitchTokenPath, contents));
  await twitchTokenWriteQueue;
}

async function deleteTwitchTokenBackup() {
  twitchTokenWriteQueue = twitchTokenWriteQueue.catch(() => {}).then(async () => {
    await rm(twitchTokenPath, { force: true });
    await rm(`${twitchTokenPath}.bak`, { force: true });
  });
  await twitchTokenWriteQueue;
}

async function migrateLegacyLocalDataDir() {
  const legacyDataDir = join(rootDir, 'data');
  if (samePath(legacyDataDir, dataDir)) return;
  try {
    await stat(legacyDataDir);
  } catch {
    return;
  }

  for (const name of ['config.json', 'state.json', 'twitch-token.json']) {
    await copyFileIfMissing(join(legacyDataDir, name), join(dataDir, name));
  }
  await copyDirectoryFilesIfMissing(join(legacyDataDir, 'assets'), assetDir);
}

async function copyFileIfMissing(source, target) {
  try {
    await stat(target);
    return false;
  } catch {}
  try {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    return true;
  } catch {
    return false;
  }
}

async function copyDirectoryFilesIfMissing(sourceDir, targetDir) {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }
  await mkdir(targetDir, { recursive: true });
  for (const entry of entries) {
    const source = join(sourceDir, entry.name);
    const target = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryFilesIfMissing(source, target);
    } else if (entry.isFile()) {
      await copyFileIfMissing(source, target);
    }
  }
}

function samePath(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}

async function ensureGeneratedAssets() {
  await seedDefaultAssets();
  await ensureBaseWardAssets();
  await rebuildMinimapAssets();
  try {
    await stat(join(assetDir, 'draft-screenshot.png'));
    await buildSlotsFromDraftScreenshot();
  } catch {
    await copyDefaultAsset('draft-screenshot.png', false);
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

async function readBody(req, maxBytes = 2 * 1024 * 1024) {
  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of req) {
    receivedBytes += chunk.length;
    if (receivedBytes > maxBytes) {
      const error = new Error('Request body is too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    throw error;
  }
}

function enforceRequestSecurity(req, url) {
  const requestHost = requestHostname(req.headers.host);
  const socketAddress = String(req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
  const hasForwardedAddress = Boolean(
    String(req.headers['x-forwarded-for'] || '').trim()
    || String(req.headers.forwarded || '').trim()
    || String(req.headers['x-real-ip'] || '').trim()
  );
  const remoteIsLoopback = isLoopbackHostname(socketAddress) && !hasForwardedAddress;
  if (!serverNetworkingEnabled() && (!isLoopbackHostname(requestHost) || !remoteIsLoopback)) {
    const error = new Error('Local mode only accepts loopback Host headers');
    error.statusCode = 403;
    throw error;
  }
  if (serverNetworkingEnabled() && !remoteIsLoopback && !hasValidServerAuthorization(req.headers.authorization)) {
    const error = new Error('Server authentication is required');
    error.statusCode = 401;
    error.requireBasicAuth = true;
    throw error;
  }

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(req.method || '').toUpperCase())) return;
  if (String(req.headers['sec-fetch-site'] || '').toLowerCase() === 'cross-site') {
    const error = new Error('Cross-site requests are not allowed');
    error.statusCode = 403;
    throw error;
  }

  const origin = String(req.headers.origin || '').trim();
  if (origin && !isAllowedRequestOrigin(origin, req.headers.host)) {
    const error = new Error('Request origin is not allowed');
    error.statusCode = 403;
    throw error;
  }

  const hasBody = Number(req.headers['content-length'] || 0) > 0 || Boolean(req.headers['transfer-encoding']);
  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (hasBody && !contentType.startsWith('application/json')) {
    const error = new Error('JSON requests must use application/json');
    error.statusCode = 415;
    throw error;
  }
}

function serverNetworkingEnabled() {
  return effectiveServerNetworking;
}

function hasValidServerAuthorization(header) {
  const match = String(header || '').match(/^Basic\s+(.+)$/i);
  if (!match) return false;
  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    const password = separator >= 0 ? decoded.slice(separator + 1) : '';
    const actual = Buffer.from(password);
    const expected = Buffer.from(serverAuthPassword);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function requestHostname(hostHeader) {
  try {
    return new URL(`http://${hostHeader || ''}`).hostname;
  } catch {
    return '';
  }
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function isAllowedRequestOrigin(origin, hostHeader) {
  try {
    const parsed = new URL(origin);
    if (!serverNetworkingEnabled()) return isLoopbackHostname(parsed.hostname);
    const configuredOrigin = runtime.config.deployment.publicBaseUrl
      ? new URL(runtime.config.deployment.publicBaseUrl).origin
      : '';
    return parsed.host === String(hostHeader || '') || (configuredOrigin && parsed.origin === configuredOrigin);
  } catch {
    return false;
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
  if (filePath !== publicDir && !filePath.startsWith(`${publicDir}${sep}`)) return sendText(res, 'Forbidden', 403);

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
  pipeFileResponse(filePath, res);
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
  pipeFileResponse(filePath, res);
}

function pipeFileResponse(filePath, res) {
  const stream = createReadStream(filePath);
  stream.on('error', (error) => {
    if (!res.headersSent) sendText(res, 'Not found', 404);
    else res.destroy(error);
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
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
  const body = await readBody(req, 42 * 1024 * 1024);
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
    ...Array.from({ length: 9 }, (_, index) => `rank-medal-${index}.png`),
    'rank-medal-calibration.png',
    ...Array.from({ length: 5 }, (_, index) => `rank-pip-${index + 1}.png`),
    'rank-immortal.png',
    'aegis.png',
    'roshan.png',
    'game1.png',
    'game2.png',
    'draft-screenshot.png',
    'queue-screenshot.png',
    ...Array.from({ length: 10 }, (_, index) => `topbar-slot-${index}.png`)
  ];
}

function defaultSeedAssetNames() {
  return [
    'ward-eye.png',
    'sentry-eye.png',
    ...Array.from({ length: 9 }, (_, index) => `rank-medal-${index}.png`),
    'rank-medal-calibration.png',
    ...Array.from({ length: 5 }, (_, index) => `rank-pip-${index + 1}.png`),
    'rank-immortal.png',
    'aegis.png',
    'roshan.png',
    'game1.png',
    'game2.png',
    'minimap-base-realistic.png',
    'minimap-base-simple.png'
  ];
}

function publicState() {
  const { twitchToken, ...safeRuntimeState } = runtime.state;
  const streamerStats = publicStreamerStats();
  return {
    version: appVersion,
    platform: process.platform,
    serverNetworkingEnabled: serverNetworkingEnabled(),
    menuMmrOcrSupport: getScreenCaptureSupport(),
    config: sanitizeConfig(runtime.config),
    state: {
      ...safeRuntimeState,
      streamerStats,
      twitch: { ...runtime.state.twitch },
      events: runtime.state.events.slice(0, 50)
    }
  };
}

function publicStreamerStats() {
  const stats = normalizeStreamerStatsState(runtime.state.streamerStats);
  const settings = runtime.config.protection.matchIntel || {};
  const overlayAccountId = streamerOverlayAccountId(settings, stats);
  const configuredMmr = streamerMmrForAccount(settings, overlayAccountId);
  const account = streamerAccountForAccount(settings, overlayAccountId);
  const accountSession = overlayAccountId ? stats.accountSessions?.[String(overlayAccountId)] : null;
  const accountWins = overlayAccountId ? accountSession?.wins || 0 : stats.wins;
  const accountLosses = overlayAccountId ? accountSession?.losses || 0 : stats.losses;
  const goalRecord = overlayAccountId ? stats.accountGoalRecords?.[String(overlayAccountId)] : null;
  const goalWins = overlayAccountId ? goalRecord?.wins || 0 : 0;
  const goalLosses = overlayAccountId ? goalRecord?.losses || 0 : 0;
  const medalMmr = settings.streamerMedalSource === 'account' && stats.accountRankTier
    ? null
    : Math.max(0, configuredMmr);
  const medal = selectStreamerMedal({
    source: settings.streamerMedalSource || 'auto',
    accountRankTier: stats.accountRankTier,
    mmr: medalMmr
  });
  return {
    ...stats,
    streamerAccountId: overlayAccountId,
    wins: accountWins,
    losses: accountLosses,
    currentMmr: configuredMmr,
    mmrGoal: streamerMmrGoalState({
      account: account || (!overlayAccountId ? fallbackStreamerGoalAccount(settings) : null),
      accountId: overlayAccountId,
      currentMmr: configuredMmr,
      wins: goalWins,
      losses: goalLosses,
      winDelta: settings.streamerMmrWinDelta
    }),
    medal: medal ? {
      id: medal.medal,
      name: medal.name,
      minMmr: medal.minMmr,
      stars: medal.stars || 0,
      source: settings.streamerMedalSource === 'mmr'
        ? 'mmr'
        : stats.accountRankTier && settings.streamerMedalSource !== 'mmr'
          ? 'account'
          : 'mmr'
    } : null,
    effectiveStreamOnline: effectiveStreamerStreamOnline()
  };
}

function streamerOverlayAccountId(settings, stats) {
  const currentAccountId = stats.streamerAccountId || stats.lastStreamerAccountId;
  if (currentAccountId) return currentAccountId;
  const accounts = Array.isArray(settings.streamerAccounts) ? settings.streamerAccounts : [];
  return accounts.length === 1 ? accounts[0]?.accountId || null : null;
}

function streamerAccountForAccount(settings, accountId) {
  return Array.isArray(settings.streamerAccounts) && accountId
    ? settings.streamerAccounts.find((item) => String(item?.accountId || '') === String(accountId))
    : null;
}

function fallbackStreamerGoalAccount(settings) {
  return {
    goalMmr: settings.streamerGoalMmr,
    goalStartMmr: settings.streamerGoalStartMmr
  };
}

function streamerMmrForAccount(settings, accountId) {
  const account = streamerAccountForAccount(settings, accountId);
  const value = account ? account.mmr : settings.streamerMmr;
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

async function pickMenuMmrOcrRegionApi(res) {
  const support = getScreenCaptureSupport();
  if (!support.supported) {
    return sendJson(res, { error: support.reason || 'Screen capture is not available' }, 400);
  }
  if (support.picker === 'manual') {
    return sendJson(res, { error: 'Interactive region picker is not available. Enter coordinates manually.' }, 400);
  }
  const region = await pickScreenRegion();
  if (!region) return sendJson(res, { cancelled: true });
  runtime.config.protection.matchIntel.menuMmrOcrRegion = region;
  normalizeMatchIntelConfig(runtime.config.protection.matchIntel);
  await persistConfig();
  broadcast();
  return sendJson(res, { region });
}

async function setMenuMmrOcrRegionApi(req, res) {
  const body = await readBody(req);
  const region = normalizeRegion(body);
  if (!region) return sendJson(res, { error: 'Invalid screen region' }, 400);
  runtime.config.protection.matchIntel.menuMmrOcrRegion = region;
  normalizeMatchIntelConfig(runtime.config.protection.matchIntel);
  await persistConfig();
  broadcast();
  return sendJson(res, { region });
}

async function clearMenuMmrOcrRegionApi(res) {
  runtime.config.protection.matchIntel.menuMmrOcrRegion = null;
  normalizeMatchIntelConfig(runtime.config.protection.matchIntel);
  await persistConfig();
  broadcast();
  return sendJson(res, { ok: true });
}

async function maybeRunMenuMmrOcr() {
  const settings = runtime.config.protection.matchIntel || {};
  const skipReason = explainMenuOcrSkip(
    settings,
    runtime.state.gsi,
    runtime.dotaProcess,
    runtime.menuMmrOcrInFlight
  );
  if (skipReason) return;

  runtime.menuMmrOcrInFlight = true;
  try {
    const result = await recognizeMenuMmr(settings.menuMmrOcrRegion);
    runtime.state.menuMmrOcr = {
      lastRunAt: new Date().toISOString(),
      lastMmr: result?.mmr ?? null,
      lastRawText: result?.rawText ?? null,
      lastError: null
    };

    if (result?.mmr) {
      const accountId = streamerOverlayAccountId(settings, runtime.state.streamerStats);
      const currentMmr = streamerMmrForAccount(settings, accountId);
      if (result.mmr !== currentMmr) {
        applyMenuMmrOcrResult(result.mmr, accountId);
        await persistConfig();
        logEvent('system', `Menu OCR MMR updated: from ${currentMmr} to ${result.mmr}`);
        broadcast();
      }
    }
    await persistState();
  } catch (error) {
    runtime.state.menuMmrOcr = {
      ...(runtime.state.menuMmrOcr || {}),
      lastRunAt: new Date().toISOString(),
      lastError: error.message
    };
    await persistState();
    throw error;
  } finally {
    runtime.menuMmrOcrInFlight = false;
  }
}

function applyMenuMmrOcrResult(mmr, accountId) {
  const settings = runtime.config.protection.matchIntel;
  const accounts = Array.isArray(settings.streamerAccounts) ? [...settings.streamerAccounts] : [];
  const accountIndex = accountId
    ? accounts.findIndex((item) => String(item?.accountId || '') === String(accountId))
    : -1;

  if (accountIndex >= 0) {
    accounts[accountIndex] = { ...accounts[accountIndex], mmr };
    settings.streamerAccounts = accounts;
  } else if (accounts.length === 1) {
    accounts[0] = { ...accounts[0], mmr };
    settings.streamerAccounts = accounts;
  } else {
    settings.streamerMmr = mmr;
  }
  normalizeMatchIntelConfig(settings);
}

function streamerMmrGoalState({ account, accountId, currentMmr, wins, losses, winDelta }) {
  const targetMmr = Math.max(0, Math.trunc(Number(account?.goalMmr || 0)));
  if (!targetMmr || !currentMmr) return null;
  const startMmr = Math.max(0, Math.trunc(Number(account?.goalStartMmr || 0)));
  const total = Math.max(0, Number(wins || 0) + Number(losses || 0));
  const winRate = total > 0 ? Math.round((Number(wins || 0) / total) * 1000) / 10 : null;
  const distance = targetMmr - startMmr;
  const gained = currentMmr - startMmr;
  const progress = distance > 0
    ? Math.max(0, Math.min(100, Math.round((gained / distance) * 1000) / 10))
    : currentMmr >= targetMmr ? 100 : 0;
  const remainingMmr = Math.max(0, targetMmr - currentMmr);
  const delta = Math.max(1, Math.trunc(Number(winDelta || 25)));
  return {
    accountId: accountId || null,
    startMmr,
    currentMmr,
    targetMmr,
    remainingMmr,
    progress,
    wins: Math.max(0, Math.trunc(Number(wins || 0))),
    losses: Math.max(0, Math.trunc(Number(losses || 0))),
    totalMatches: Math.trunc(total),
    winRate,
    requiredWins: remainingMmr > 0 ? Math.ceil(remainingMmr / delta) : 0
  };
}

function sanitizeConfig(config) {
  return {
    ...config,
    dota: {
      ...config.dota,
      gsiToken: config.dota?.gsiToken ? '********' : ''
    },
    twitch: {
      ...config.twitch,
      clientSecret: config.twitch.clientSecret ? '********' : ''
    }
  };
}

function backupSectionKeys() {
  return ['ui', 'deployment', 'twitch', 'dota', 'updates', 'protection', 'predictions', 'spectatorPredictions', 'streamerStats', 'customAssets'];
}

async function buildBackup(sections) {
  const selected = new Set(sections.filter((section) => backupSectionKeys().includes(section)));
  const backup = {
    app: 'DotaStreamKit',
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    version: appVersion,
    sections: {}
  };
  for (const key of ['ui', 'deployment', 'twitch', 'dota', 'updates', 'protection', 'predictions', 'spectatorPredictions']) {
    if (selected.has(key)) backup.sections[key] = structuredClone(runtime.config[key] || {});
  }
  if (selected.has('streamerStats')) {
    backup.sections.streamerStats = structuredClone(runtime.state.streamerStats || {});
  }
  if (selected.has('customAssets')) {
    backup.sections.customAssets = await exportCustomAssets();
  }
  return backup;
}

function buildImportedConfig(baseConfig, source, selected) {
  const imported = [];
  const nextConfig = structuredClone(baseConfig);

  for (const key of ['ui', 'deployment', 'twitch', 'dota', 'updates', 'protection', 'predictions', 'spectatorPredictions']) {
    if (!selected.has(key) || source[key] === undefined) continue;
    nextConfig[key] = key === 'protection' || key === 'predictions' || key === 'spectatorPredictions'
      ? merge(structuredClone(defaultConfig[key]), source[key])
      : merge(structuredClone(nextConfig[key] || defaultConfig[key]), source[key]);
    imported.push(key);
  }

  normalizeDeploymentConfig(nextConfig.deployment);
  normalizeUiConfig(nextConfig.ui);
  normalizeTwitchConfig(nextConfig.twitch);
  if (!/^[a-f0-9]{64}$/i.test(String(nextConfig.dota?.gsiToken || ''))) {
    nextConfig.dota.gsiToken = baseConfig.dota.gsiToken || randomBytes(32).toString('hex');
  }
  normalizeUpdateConfig(nextConfig.updates);
  normalizePredictionSettings(nextConfig.predictions, defaultConfig.predictions);
  normalizePredictionSettings(nextConfig.spectatorPredictions, defaultConfig.spectatorPredictions);
  if (nextConfig.protection?.matchIntel) normalizeMatchIntelConfig(nextConfig.protection.matchIntel);
  if (nextConfig.protection?.spectatorMatchIntel) normalizeMatchIntelConfig(nextConfig.protection.spectatorMatchIntel, { spectatorLabel: true });
  return { nextConfig, imported };
}

async function applyBackup(backup, sections) {
  const source = backup?.sections && typeof backup.sections === 'object' ? backup.sections : backup;
  if (!source || typeof source !== 'object') throw new Error('Invalid backup file');
  const selected = new Set(sections.filter((section) => backupSectionKeys().includes(section)));
  const resolvedUsers = new Map();
  let imported = [];
  let nextConfig = null;
  let twitchClientChanged = false;
  let twitchChannelChanged = false;
  let deploymentModeChanged = false;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = runtime.config;
    const currentFingerprint = JSON.stringify(current);
    const built = buildImportedConfig(current, source, selected);
    const candidate = built.nextConfig;
    const changes = twitchConfigChanges(candidate, current);
    requireMutableTwitchSettings(
      changes.channelChanged,
      changes.clientChanged,
      'Resolve or cancel the active prediction before importing different Twitch settings'
    );

    if (changes.channelChanged && candidate.twitch.channelMode === 'separate') {
      candidate.twitch.targetBroadcasterId = '';
      candidate.twitch.targetBroadcasterLogin = '';
      if (candidate.twitch.targetChannelLogin && runtime.state.twitchToken?.accessToken && !changes.clientChanged) {
        const login = candidate.twitch.targetChannelLogin;
        const user = resolvedUsers.get(login) || await resolveTwitchUserByLogin(login);
        resolvedUsers.set(login, user);
        candidate.twitch.targetChannelLogin = user.login;
        candidate.twitch.targetBroadcasterLogin = user.login;
        candidate.twitch.targetBroadcasterId = user.id;
      }
    } else if (changes.channelChanged && candidate.twitch.channelMode === 'personal') {
      candidate.twitch.targetChannelLogin = runtime.state.twitchToken?.broadcasterLogin || '';
      candidate.twitch.targetBroadcasterLogin = runtime.state.twitchToken?.broadcasterLogin || '';
      candidate.twitch.targetBroadcasterId = runtime.state.twitchToken?.broadcasterId || '';
    }

    requireMutableTwitchSettings(
      changes.channelChanged,
      changes.clientChanged,
      'A prediction started while Twitch settings were being imported; import was not applied'
    );
    if (JSON.stringify(runtime.config) !== currentFingerprint) continue;
    nextConfig = candidate;
    imported = built.imported;
    twitchClientChanged = changes.clientChanged;
    twitchChannelChanged = changes.channelChanged;
    deploymentModeChanged = candidate.deployment.mode !== current.deployment.mode;
    break;
  }

  if (!nextConfig) {
    const error = new Error('Settings changed concurrently; retry importing the backup');
    error.statusCode = 409;
    throw error;
  }
  if (twitchClientChanged || twitchChannelChanged) runtime.twitchAuthGeneration += 1;
  runtime.config = nextConfig;
  if (twitchClientChanged && runtime.state.twitchToken?.accessToken) {
    delete runtime.state.twitchToken;
    runtime.twitchLastValidatedAt = 0;
    await deleteTwitchTokenBackup();
  }
  if (twitchClientChanged || twitchChannelChanged) resetTwitchStreamStatus();

  if (selected.has('streamerStats') && source.streamerStats !== undefined) {
    runtime.state.streamerStats = normalizeStreamerStatsState(source.streamerStats);
    imported.push('streamerStats');
  }

  if (selected.has('customAssets') && source.customAssets !== undefined) {
    await importCustomAssets(source.customAssets);
    imported.push('customAssets');
  }

  hydrateTwitchStatus();
  runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
  syncStreamerSessionPresence();
  await persistConfig();
  await persistState();
  await refreshInstalledGsiConfig();
  return { imported, restartRequired: deploymentModeChanged };
}

async function exportCustomAssets() {
  const names = ['draft-screenshot.png', 'queue-screenshot.png', ...Array.from({ length: 10 }, (_, index) => `topbar-slot-${index}.png`)];
  const files = {};
  for (const name of names) {
    try {
      const buffer = await readFile(join(assetDir, name));
      files[name] = buffer.toString('base64');
    } catch {
      // Missing user-generated assets are skipped.
    }
  }
  return { files };
}

async function importCustomAssets(value) {
  const files = value?.files && typeof value.files === 'object' ? value.files : {};
  const allowed = new Set(['draft-screenshot.png', 'queue-screenshot.png', ...Array.from({ length: 10 }, (_, index) => `topbar-slot-${index}.png`)]);
  await mkdir(assetDir, { recursive: true });
  for (const [name, encoded] of Object.entries(files)) {
    if (!allowed.has(name)) continue;
    const buffer = Buffer.from(String(encoded || ''), 'base64');
    if (buffer.length > 30 * 1024 * 1024) continue;
    await writeFile(join(assetDir, name), buffer);
  }
}

async function fetchLatestRelease() {
  return await fetchWithTimeout(githubLatestReleaseApi, {
    headers: {
      'accept': 'application/vnd.github+json',
      'user-agent': `DotaStreamKit/${appVersion}`
    }
  }, 15000, async (response) => {
    if (!response.ok) throw new Error(`GitHub update check failed: ${response.status}`);
    return JSON.parse(await readResponseText(response, 2 * 1024 * 1024));
  });
}

function normalizeUpdateRelease(release) {
  const latestVersion = normalizeReleaseVersion(release?.tag_name || release?.name || '');
  const assets = Array.isArray(release?.assets) ? release.assets.map((asset) => ({
    name: asset.name,
    url: asset.browser_download_url,
    size: asset.size,
    platform: classifyUpdateAsset(asset.name)
  })).filter((asset) => asset.platform && asset.url) : [];
  return {
    currentVersion: appVersion,
    latestVersion,
    updateAvailable: !release?.draft && !release?.prerelease && compareVersions(latestVersion, appVersion) > 0,
    releaseOnly: true,
    draft: release?.draft === true,
    prerelease: release?.prerelease === true,
    releaseUrl: release?.html_url || '',
    publishedAt: release?.published_at || null,
    notes: String(release?.body || '').slice(0, 8000),
    assets
  };
}

function normalizeReleaseVersion(value) {
  return String(value || '').trim().replace(/^v/i, '');
}

function compareVersions(left, right) {
  const a = normalizeReleaseVersion(left).split(/[.-]/).map((part) => Number(part) || 0);
  const b = normalizeReleaseVersion(right).split(/[.-]/).map((part) => Number(part) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function classifyUpdateAsset(name) {
  const value = String(name || '').toLowerCase();
  if (value.includes('win-x64') && value.endsWith('.zip')) return 'win32-x64';
  if (value.includes('linux-x64') && value.endsWith('.tar.gz')) return 'linux-x64';
  if (value.includes('darwin-arm64') && value.endsWith('.tar.gz')) return 'darwin-arm64';
  if (value.includes('darwin-x64') && value.endsWith('.tar.gz')) return 'darwin-x64';
  return null;
}

function currentUpdatePlatform() {
  const arch = process.arch === 'x64' ? 'x64' : process.arch;
  return `${process.platform}-${arch}`;
}

async function findUpdaterExecutable() {
  const names = process.platform === 'win32'
    ? ['DotaStreamKitUpdater.exe']
    : ['DotaStreamKitUpdater'];
  const candidates = [
    ...names.map((name) => join(rootDir, '..', name)),
    ...names.map((name) => join(rootDir, name))
  ];
  for (const candidate of candidates) {
    try {
      const fileStat = await stat(candidate);
      if (fileStat.isFile()) return candidate;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function hydrateTwitchStatus() {
  const token = runtime.state.twitchToken;
  const authenticated = Boolean(token?.accessToken);
  const scopes = normalizeScopes(token?.scopes || []);
  const missingScopes = token?.accessToken ? twitchScopes.filter((scope) => !scopes.includes(scope)) : [];
  const streamStatus = runtime.twitchStreamStatus || {};
  const target = twitchTargetChannel();
  const streamStatusMatchesTarget = Boolean(
    authenticated
    && target.broadcasterId
    && streamStatus.broadcasterId
    && String(target.broadcasterId) === String(streamStatus.broadcasterId)
  );
  runtime.state.twitch = {
    authenticated,
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
    isLive: streamStatusMatchesTarget ? streamStatus.isLive : null,
    streamId: streamStatusMatchesTarget ? streamStatus.streamId || null : null,
    streamGameName: streamStatusMatchesTarget ? streamStatus.gameName || null : null,
    streamTitle: streamStatusMatchesTarget ? streamStatus.title || null : null,
    streamCheckedAt: streamStatusMatchesTarget && streamStatus.checkedAt ? new Date(streamStatus.checkedAt).toISOString() : null
  };
}

async function restoreTwitchStatus() {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) {
    hydrateTwitchStatus();
    return;
  }
  const authGeneration = runtime.twitchAuthGeneration;
  const accessToken = token.accessToken;
  try {
    await refreshTokenIfNeeded(token.clientId && token.clientId !== runtime.config.twitch.clientId);
    if (authGeneration !== runtime.twitchAuthGeneration) return;
    hydrateTwitchStatus();
  } catch (error) {
    if (authGeneration !== runtime.twitchAuthGeneration
      || runtime.state.twitchToken?.accessToken !== accessToken) return;
    hydrateTwitchStatus();
    runtime.state.twitch.authError = error.message;
    await persistState();
    logEvent('twitch', `Saved Twitch token could not be restored: ${error.message}`);
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
    writeSsePayload(client, payload);
  }
}

function writeSsePayload(client, payload) {
  if (!client || client.destroyed || client.writableEnded) {
    runtime.clients.delete(client);
    return;
  }
  if (client.dskWaitingForDrain) {
    client.dskPendingPayload = payload;
    return;
  }
  if (client.write(payload)) return;
  client.dskWaitingForDrain = true;
  client.once('drain', () => {
    client.dskWaitingForDrain = false;
    const pending = client.dskPendingPayload;
    client.dskPendingPayload = null;
    if (pending) writeSsePayload(client, pending);
  });
}

function handleEvents(req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive'
  });
  runtime.clients.add(res);
  writeSsePayload(res, `data: ${JSON.stringify(publicState())}\n\n`);
  req.on('close', () => runtime.clients.delete(res));
  res.on('error', () => runtime.clients.delete(res));
}

function buildNormalizedConfigUpdate(baseConfig, body) {
  const next = merge(structuredClone(baseConfig), body);
  if (body.twitch?.clientSecret === '********') {
    next.twitch.clientSecret = baseConfig.twitch.clientSecret;
  }
  normalizeDeploymentConfig(next.deployment);
  normalizeUiConfig(next.ui);
  normalizeTwitchConfig(next.twitch);
  normalizeUpdateConfig(next.updates);
  next.predictions.windowSeconds = clampInt(next.predictions.windowSeconds, 30, 1800);
  next.predictions.autoLockAtGameSeconds = clampInt(next.predictions.autoLockAtGameSeconds, 0, 3600);
  next.predictions.autoCancelDisconnectSeconds = clampInt(next.predictions.autoCancelDisconnectSeconds, 300, 1800);
  normalizePredictionSettings(next.predictions, defaultConfig.predictions);
  next.spectatorPredictions.windowSeconds = clampInt(next.spectatorPredictions.windowSeconds, 30, 1800);
  next.spectatorPredictions.autoLockAtGameSeconds = clampInt(next.spectatorPredictions.autoLockAtGameSeconds, 0, 3600);
  next.spectatorPredictions.autoCancelDisconnectSeconds = clampInt(next.spectatorPredictions.autoCancelDisconnectSeconds, 300, 1800);
  normalizePredictionSettings(next.spectatorPredictions, defaultConfig.spectatorPredictions);
  if (next.protection?.matchIntel) normalizeMatchIntelConfig(next.protection.matchIntel);
  if (next.protection?.spectatorMatchIntel) normalizeMatchIntelConfig(next.protection.spectatorMatchIntel, { spectatorLabel: true });
  return next;
}

function twitchConfigChanges(next, current) {
  return {
    channelChanged: next.twitch.channelMode !== current.twitch.channelMode
      || next.twitch.targetChannelLogin !== current.twitch.targetChannelLogin,
    clientChanged: next.twitch.clientId !== current.twitch.clientId
  };
}

function requireMutableTwitchSettings(channelChanged, clientChanged, message) {
  if ((channelChanged || clientChanged)
    && (runtime.twitchAuthMutation
      || runtime.predictionCreation
      || ['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction?.status))) {
    const error = new Error(message);
    error.statusCode = 409;
    throw error;
  }
}

async function updateConfig(req, res) {
  const body = await readBody(req);
  const resolvedUsers = new Map();
  let next = null;
  let twitchChannelChanged = false;
  let twitchClientChanged = false;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = runtime.config;
    const currentFingerprint = JSON.stringify(current);
    const candidate = buildNormalizedConfigUpdate(current, body);
    const changes = twitchConfigChanges(candidate, current);
    requireMutableTwitchSettings(
      changes.channelChanged,
      changes.clientChanged,
      'Resolve or cancel the active prediction before changing Twitch channel or Client ID'
    );

    if (changes.channelChanged && candidate.twitch.channelMode === 'separate') {
      candidate.twitch.targetBroadcasterId = '';
      candidate.twitch.targetBroadcasterLogin = '';
      if (candidate.twitch.targetChannelLogin && runtime.state.twitchToken?.accessToken && !changes.clientChanged) {
        const login = candidate.twitch.targetChannelLogin;
        const user = resolvedUsers.get(login) || await resolveTwitchUserByLogin(login);
        resolvedUsers.set(login, user);
        candidate.twitch.targetChannelLogin = user.login;
        candidate.twitch.targetBroadcasterLogin = user.login;
        candidate.twitch.targetBroadcasterId = user.id;
      }
    } else if (changes.channelChanged && candidate.twitch.channelMode === 'personal') {
      candidate.twitch.targetChannelLogin = runtime.state.twitchToken?.broadcasterLogin || '';
      candidate.twitch.targetBroadcasterLogin = runtime.state.twitchToken?.broadcasterLogin || '';
      candidate.twitch.targetBroadcasterId = runtime.state.twitchToken?.broadcasterId || '';
    }

    requireMutableTwitchSettings(
      changes.channelChanged,
      changes.clientChanged,
      'A prediction started while Twitch settings were being resolved; settings were not applied'
    );
    if (JSON.stringify(runtime.config) !== currentFingerprint) continue;
    next = candidate;
    twitchChannelChanged = changes.channelChanged;
    twitchClientChanged = changes.clientChanged;
    break;
  }

  if (!next) {
    const error = new Error('Settings changed concurrently; retry saving this section');
    error.statusCode = 409;
    throw error;
  }
  if (twitchChannelChanged || twitchClientChanged) runtime.twitchAuthGeneration += 1;
  runtime.config = next;
  if (twitchClientChanged && runtime.state.twitchToken?.accessToken) {
    delete runtime.state.twitchToken;
    runtime.twitchLastValidatedAt = 0;
    resetTwitchStreamStatus();
    await deleteTwitchTokenBackup();
    logEvent('twitch', 'Twitch Client ID changed; reconnect Twitch');
  }
  if (twitchChannelChanged) {
    resetTwitchStreamStatus();
  }
  hydrateTwitchStatus();
  runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
  syncStreamerSessionPresence();
  await persistConfig();
  await persistState();
  logEvent('config', 'Settings updated');
  sendJson(res, publicState());
}

async function exportBackupApi(url, res) {
  const requestedSections = String(url.searchParams.get('sections') || 'all')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const sections = requestedSections.includes('all') ? backupSectionKeys() : requestedSections;
  const backup = await buildBackup(sections);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const body = JSON.stringify(backup, null, 2);
  res.writeHead(200, {
    'content-type': 'application/json; charset=utf-8',
    'content-disposition': `attachment; filename="DotaStreamKit-backup-${stamp}.json"`,
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  res.end(body);
}

async function importBackupApi(req, res) {
  const body = await readBody(req, 100 * 1024 * 1024);
  const backup = body.backup && typeof body.backup === 'object' ? body.backup : body;
  const requestedSections = Array.isArray(body.sections) ? body.sections : backupSectionKeys();
  const sections = requestedSections.includes('all') ? backupSectionKeys() : requestedSections;
  const result = await applyBackup(backup, sections);
  logEvent('config', `Settings imported: ${result.imported.join(', ') || 'nothing'}`);
  sendJson(res, { ok: true, ...result, state: publicState() });
}

async function checkUpdatesApi(res) {
  try {
    const release = await fetchLatestRelease();
    const status = normalizeUpdateRelease(release);
    setUpdateStatus(status);
    sendJson(res, status);
  } catch (error) {
    setUpdateCheckError(error);
    throw error;
  }
}

async function installUpdateApi(req, res) {
  await readBody(req);
  const release = await fetchLatestRelease();
  const status = normalizeUpdateRelease(release);
  if (!status.updateAvailable) return sendJson(res, { ok: true, message: 'Already up to date', status });
  if (!status.assets.find((item) => item.platform === currentUpdatePlatform())) {
    return sendJson(res, { error: 'No update asset is available for this platform', status }, 400);
  }
  if (!await findUpdaterExecutable()) {
    return sendJson(res, { error: 'Updater is not available in this build', status }, 400);
  }
  const result = await beginUpdateInstall(status);
  sendJson(res, result);
}

function scheduleStartupUpdateCheck() {
  runtime.state.update = {
    ...normalizeUpdateState(runtime.state.update),
    checking: true,
    error: ''
  };
  setTimeout(() => {
    startupUpdateCheck().catch((error) => {
      setUpdateCheckError(error);
      logEvent('system', `Startup update check failed: ${error.message}`);
      broadcast();
    });
  }, 2000).unref();
}

async function startupUpdateCheck() {
  const release = await fetchLatestRelease();
  const status = normalizeUpdateRelease(release);
  setUpdateStatus(status);
  if (!status.updateAvailable) {
    logEvent('system', `Startup update check: ${appVersion} is current`);
    broadcast();
    return status;
  }

  logEvent('system', `Startup update check: ${status.latestVersion} is available`);
  broadcast();
  if (runtime.config.updates?.autoInstall === false) return status;

  const asset = status.assets.find((item) => item.platform === currentUpdatePlatform());
  if (!asset) throw new Error(`No update asset is available for ${currentUpdatePlatform()}`);
  const updater = await findUpdaterExecutable();
  if (!updater) throw new Error('Updater is not available in this build');
  return await beginUpdateInstall(status);
}

async function beginUpdateInstall(status) {
  if (runtime.updateInstallStarted) {
    return { ok: true, status, message: 'Update is already running. DotaStreamKit will restart when the update is installed.' };
  }

  runtime.updateInstallStarted = true;
  try {
    const asset = status.assets.find((item) => item.platform === currentUpdatePlatform());
    if (!asset) throw new Error('No update asset is available for this platform');
    const updater = await findUpdaterExecutable();
    if (!updater) throw new Error('Updater is not available in this build');
    const archivePath = await downloadUpdateAsset(asset);
    const args = [
      '--app-root', rootDir,
      '--download-url', asset.url,
      '--archive-path', archivePath,
      '--delete-archive', '1',
      '--version', status.latestVersion,
      '--asset-name', asset.name,
      '--pid', String(process.pid)
    ];
    const launcherPid = Number(process.env.DOTASTREAMKIT_LAUNCHER_PID || 0);
    if (launcherPid > 0) args.push('--launcher-pid', String(launcherPid));
    const child = spawn(updater, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    logEvent('system', `Update started: ${status.latestVersion}`);
    setTimeout(() => process.exit(47), 1000).unref();
    return { ok: true, status, message: 'Update started. DotaStreamKit will restart when the update is installed.' };
  } catch (error) {
    runtime.updateInstallStarted = false;
    throw error;
  }
}

function normalizeUpdateState(value = {}) {
  return {
    checking: value.checking === true,
    checkedAt: value.checkedAt || null,
    currentVersion: appVersion,
    latestVersion: value.latestVersion || null,
    updateAvailable: value.updateAvailable === true,
    releaseUrl: value.releaseUrl || '',
    error: value.error || ''
  };
}

function setUpdateStatus(status) {
  runtime.state.update = {
    checking: false,
    checkedAt: new Date().toISOString(),
    currentVersion: status.currentVersion || appVersion,
    latestVersion: status.latestVersion || null,
    updateAvailable: status.updateAvailable === true,
    releaseUrl: status.releaseUrl || '',
    error: ''
  };
}

function setUpdateCheckError(error) {
  runtime.state.update = {
    ...normalizeUpdateState(runtime.state.update),
    checking: false,
    checkedAt: new Date().toISOString(),
    error: error?.message || 'Update check failed'
  };
}

async function downloadUpdateAsset(asset) {
  if (Number(asset?.size) > 500 * 1024 * 1024) throw new Error('Update archive is unexpectedly large');
  const tempRoot = join(tmpdir(), `DotaStreamKit-update-${randomBytes(8).toString('hex')}`);
  await mkdir(tempRoot, { recursive: true });
  const archivePath = join(tempRoot, basename(asset.name || 'update.zip') || 'update.zip');
  return await fetchWithTimeout(asset.url, {
    headers: {
      'user-agent': `DotaStreamKit/${appVersion}`
    }
  }, 120000, async (response) => {
    if (!response.ok) throw new Error(`Update download failed: ${response.status}`);
    const buffer = await readResponseBuffer(response, 500 * 1024 * 1024);
    if (!buffer.length) throw new Error('Update download failed: empty archive');
    await writeFile(archivePath, buffer);
    return archivePath;
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = twitchRequestTimeoutMs, consumeResponse) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const forwardAbort = () => controller.abort(externalSignal?.reason);
  if (externalSignal) {
    if (externalSignal.aborted) forwardAbort();
    else externalSignal.addEventListener('abort', forwardAbort, { once: true });
  }
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new Error('Request timed out'));
  }, timeoutMs);
  timeout.unref?.();
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (typeof consumeResponse !== 'function') throw new Error('A response consumer is required');
    return await consumeResponse(response);
  } catch (error) {
    if (timedOut) {
      throw new Error(`Request timed out after ${timeoutMs} ms`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    controller.abort();
    externalSignal?.removeEventListener?.('abort', forwardAbort);
  }
}

async function readResponseText(response, maxBytes) {
  return (await readResponseBuffer(response, maxBytes)).toString('utf8');
}

async function readResponseBuffer(response, maxBytes) {
  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of response.body || []) {
    const buffer = Buffer.from(chunk);
    receivedBytes += buffer.length;
    if (receivedBytes > maxBytes) throw new Error('Response body is too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
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
  if (['all', 'streamer_team'].includes(body.draftHideMode)) {
    runtime.config.protection.draftHideMode = body.draftHideMode;
  }
  if (body.matchIntel && typeof body.matchIntel === 'object') {
    runtime.config.protection.matchIntel = merge(
      structuredClone(runtime.config.protection.matchIntel || defaultConfig.protection.matchIntel),
      body.matchIntel
    );
    normalizeMatchIntelConfig(runtime.config.protection.matchIntel);
    runtime.state.matchIntel = buildMatchIntel({}, runtime.state.gsi, runtime.state.matchIntel?.players || []);
  }
  if (body.spectatorMatchIntel && typeof body.spectatorMatchIntel === 'object') {
    runtime.config.protection.spectatorMatchIntel = merge(
      structuredClone(runtime.config.protection.spectatorMatchIntel || defaultConfig.protection.spectatorMatchIntel),
      body.spectatorMatchIntel
    );
    normalizeMatchIntelConfig(runtime.config.protection.spectatorMatchIntel, { spectatorLabel: true });
    runtime.state.matchIntel = buildMatchIntel({}, runtime.state.gsi, runtime.state.matchIntel?.players || []);
  }
  runtime.state.protection = computeProtection(runtime.config, runtime.state.gsi);
  syncStreamerSessionPresence();
  await persistConfig();
  await persistState();
  broadcast();
  sendJson(res, publicState());
}

async function resetStreamerStatsApi(res) {
  const result = resetStreamerSession(runtime.state.streamerStats);
  runtime.state.streamerStats = result.state;
  await persistState();
  broadcast();
  sendJson(res, publicState());
}

async function resetStreamerGoalRecordApi(req, res) {
  const body = await readBody(req);
  const result = resetStreamerGoalRecord(runtime.state.streamerStats, body.accountId);
  runtime.state.streamerStats = result.state;
  await persistState();
  broadcast();
  sendJson(res, publicState());
}

async function restoreStreamerStatsApi(res) {
  const result = restorePreviousStreamerSession(runtime.state.streamerStats);
  runtime.state.streamerStats = result.state;
  await persistState();
  broadcast();
  sendJson(res, publicState());
}

async function handleGsi(req, res) {
  const payload = await readBody(req);
  if (String(payload?.auth?.token || '') !== String(runtime.config.dota?.gsiToken || '')) {
    const error = new Error('Invalid Dota GSI token; reinstall the GSI config from Setup');
    error.statusCode = 403;
    throw error;
  }
  const previous = { ...runtime.state.gsi };
  const lifecyclePrevious = gsiLifecyclePrevious(previous);
  const map = payload.map || {};
  const player = payload.player || {};
  const hero = payload.hero || {};
  const draft = payload.draft || {};
  const gameState = map.game_state || null;
  const matchId = map.matchid || map.match_id || null;
  const matchPlayers = collectMatchPlayers(payload);
  const localPlayerPayload = hasLocalPlayerPayload(payload);
  const streamerMatchPlayer = findStreamerMatchPlayer(payload, matchPlayers);
  const activitySignal = extractActivitySignal(payload);
  const playerActivity = inferPlayerActivity({
    previous: lifecyclePrevious,
    activitySignal,
    gameState,
    matchId,
    localPlayerPayload,
    streamerInMatch: Boolean(streamerMatchPlayer)
  });
  const lifecycle = inferGsiLifecycle(
    lifecyclePrevious,
    gameState,
    matchId,
    map.clock_time,
    playerActivity
  );
  const activityDebug = buildActivityDebug({
    payload,
    activitySignal,
    playerActivity,
    localPlayerPayload,
    streamerMatchPlayer,
    matchPlayers
  });
  const isStreamerPlaying = playerActivity === 'playing';
  const canInheritPlayerState = shouldInheritPlayerState({ previous, gameState, matchId, playerActivity, localPlayerPayload, lifecycle });
  const playerStateLifecycle = {
    ...lifecycle,
    inheritPlayerState: canInheritPlayerState,
    fallbackHeroName: isStreamerPlaying ? streamerMatchPlayer?.hero : ''
  };
  const playerTeam = inferLocalPlayerTeam({
    player,
    streamerMatchPlayer,
    previous,
    lifecycle: playerStateLifecycle,
    isStreamerPlaying
  });
  const playerSlotRaw = isStreamerPlaying ? (player.player_slot ?? player.playerSlot ?? null) : null;
  const playerTeamSlotRaw = isStreamerPlaying ? (player.team_slot ?? player.teamSlot ?? null) : null;
  const teamStats = collectTeamStats(payload, playerTeam);
  const playerStatsPayload = isStreamerPlaying ? player : {};
  const heroPayload = isStreamerPlaying ? hero : {};
  const previousPlayerState = canInheritPlayerState ? previous : {};
  const heroId = heroPayload.id ?? heroPayload.hero_id ?? previousPlayerState.heroId ?? null;
  const heroName = resolveHeroName(heroPayload, heroId, previousPlayerState, playerStateLifecycle);
  const kills = statNumber(playerStatsPayload.kills, previousPlayerState.kills);
  const deaths = statNumber(playerStatsPayload.deaths, previousPlayerState.deaths);
  const assists = statNumber(playerStatsPayload.assists, previousPlayerState.assists);
  const lastHits = statNumber(playerStatsPayload.last_hits ?? playerStatsPayload.lastHits, previousPlayerState.lastHits);
  const denies = statNumber(playerStatsPayload.denies, previousPlayerState.denies);
  const level = statNumber(heroPayload.level, previousPlayerState.level);
  const playerHeroPicked = inferPlayerHeroPicked(previousPlayerState, gameState, heroPayload, playerStateLifecycle);
  const draftActiveTeam = inferDraftActiveTeam(draft);
  const ownPickPhase = inferOwnPickPhase({ previous: previousPlayerState, payload, gameState, playerHeroPicked, playerTeam, lifecycle: playerStateLifecycle });
  const ownPickPhaseEnded = ownPickPhase.ownPickPhaseEnded;
  const spectatorCycle = inferSpectatorCycle(lifecyclePrevious, {
    playerActivity,
    gameState,
    matchId,
    clockTime: map.clock_time
  });
  const activeMatchId = inferActiveMatchId(lifecyclePrevious, gameState, matchId, {
    ...lifecycle,
    playerActivity,
    spectatorCycle
  });
  const matchContextKey = activeMatchId || matchId
    ? `match:${activeMatchId || matchId}`
    : playerActivity === 'spectating'
      ? `spectator:${spectatorCycle}`
      : `draft:${lifecycle.draftCycle}`;
  const queueSearchSignal = inferQueueSearchSignal(payload);
  const inGameScreen = inferInGameScreen(gameState, playerActivity);
  const matchTeams = inferMatchTeams(payload, matchPlayers);
  const rosterDebug = buildRosterDebug(payload);
  const heroDemoMode = inferHeroDemoMode(payload);
  const leftGameView = inferLeftGameView({
    connected: true,
    activeMatchId,
    gameState,
    playerActivity,
    hasLivePayload: localPlayerPayload || Boolean(streamerMatchPlayer)
  });
  const gsi = {
    connected: true,
    lastSeenAt: new Date().toISOString(),
    gameState,
    clockTime: Number.isFinite(map.clock_time) ? map.clock_time : null,
    matchId,
    activeMatchId,
    playerActivity,
    playerActivitySource: activityDebug.source,
    activityDebug,
    playerTeam,
    radiantTeamName: matchTeams.radiant,
    direTeamName: matchTeams.dire,
    playerSlotRaw,
    playerTeamSlotRaw,
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
    ownTeamPickedHeroCount: ownPickPhase.ownTeamPickedHeroCount,
    enemyTeamPickedHeroCount: ownPickPhase.enemyTeamPickedHeroCount,
    ownPickPhaseTargetCount: ownPickPhase.ownPickPhaseTargetCount,
    ownPickPhaseSource: ownPickPhase.ownPickPhaseSource,
    draftCycle: lifecycle.draftCycle,
    spectatorCycle,
    matchContextKey,
    queueSearchSignal,
    inGameScreen,
    leftGameView,
    heroDemoMode,
    rosterDebug,
    lifecycleSeed: {
      gameState: gameState || lifecyclePrevious.gameState || null,
      playerActivity: playerActivity || (/PRE_GAME|GAME_IN_PROGRESS|HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE/i.test(String(gameState || ''))
        ? lifecyclePrevious.playerActivity || null
        : null),
      clockTime: Number.isFinite(map.clock_time) ? map.clock_time : lifecyclePrevious.clockTime ?? null,
      matchId: matchId || null,
      activeMatchId: activeMatchId || null,
      lastSeenAt: new Date().toISOString()
    }
  };

  runtime.state.gsi = gsi;
  migrateAutoPredictionContextKey(gsi);
  runtime.state.matchIntel = buildMatchIntel(payload, gsi, matchPlayers);
  const streamerIdentityUpdate = updateStreamerStatsIdentity(payload, {
    playerActivity,
    localPlayerPayload
  });
  runtime.state.protection = computeProtection(runtime.config, gsi);
  refreshNotablePlayerRanks(matchPlayers).catch((error) => logEvent('system', `Player rank lookup failed: ${error.message}`));
  refreshStreamerAccountRank().catch((error) => logEvent('system', `Streamer rank lookup failed: ${error.message}`));
  const streamerStatsUpdate = applyStreamerStatsMatchResult(previous, gsi);
  schedulePredictionAutomation(previous, gsi);
  if (streamerStatsUpdate.configChanged || streamerIdentityUpdate.configChanged) await persistConfig();
  if (streamerStatsUpdate.changed || streamerIdentityUpdate.stateChanged) await persistState();
  else scheduleStatePersist();
  broadcast();
  sendJson(res, { ok: true });
}

function schedulePredictionAutomation(previous, gsi) {
  const entry = {
    previous: structuredClone(previous),
    gsi: structuredClone(gsi),
    predictionId: runtime.state.activePrediction?.id || null,
    critical: isCriticalPredictionAutomationTransition(previous, gsi)
  };
  const queue = runtime.predictionAutomationQueue;
  if (!entry.critical && queue.length > 0 && queue.at(-1)?.critical !== true) queue[queue.length - 1] = entry;
  else queue.push(entry);
  while (queue.length > 32) {
    const disposableIndex = queue.findIndex((item) => !item.critical);
    queue.splice(disposableIndex >= 0 ? disposableIndex : 0, 1);
  }
  if (runtime.predictionAutomationRunning) return;
  runtime.predictionAutomationRunning = true;
  queueMicrotask(async () => {
    try {
      while (runtime.predictionAutomationQueue.length > 0) {
        const next = runtime.predictionAutomationQueue.shift();
        await maybeAutomatePrediction(next.previous, next.gsi, { expectedPredictionId: next.predictionId });
      }
    } catch (error) {
      logEvent('twitch', `Prediction automation failed: ${error.message}`);
    } finally {
      runtime.predictionAutomationRunning = false;
    }
  });
}

function isCriticalPredictionAutomationTransition(previous, gsi) {
  const previousResult = inferPredictionResultForMeta(runtime.state.activePredictionMeta, previous, inferResult);
  const nextResult = inferPredictionResultForMeta(runtime.state.activePredictionMeta, gsi, inferResult);
  if (nextResult && nextResult !== previousResult) return true;
  if (isLeftActiveGameViewCancelSignal(previous, gsi)) return true;
  return /POST_GAME/i.test(String(gsi.gameState || ''))
    && !/POST_GAME/i.test(String(previous.gameState || ''));
}

function buildMatchIntel(payload, gsi, players) {
  const settings = matchIntelSettingsForGsi(gsi);
  if (!settings?.enabled || isMatchIntelFinished(gsi) || gsi.leftGameView) {
    return {
      contextKey: gsi.matchContextKey || null,
      matchId: gsi.activeMatchId || gsi.matchId || null,
      players,
      notablePlayers: [],
      roshan: null,
      roshanStatus: null,
      aegis: null
    };
  }

  const intel = updateMatchIntel(runtime.state.matchIntel, payload, gsi, players);
  if (shouldShowNotablePlayers()) {
    intel.notablePlayers = buildNotablePlayers(players);
  } else {
    intel.notablePlayers = [];
  }
  if (!/GAME_IN_PROGRESS/i.test(String(gsi.gameState || ''))) {
    intel.roshan = null;
    intel.roshanStatus = null;
    intel.aegis = null;
  }
  if (!settings.showRoshanTimer) {
    intel.roshan = null;
    intel.roshanStatus = null;
  }
  if (!settings.showAegisTimer) {
    intel.aegis = null;
  }
  return intel;
}

function updateStreamerStatsIdentity(payload, context = {}) {
  if (context.playerActivity !== 'playing' || context.localPlayerPayload !== true) {
    return { stateChanged: false, configChanged: false };
  }
  const accountId = normalizeAccountId(
    payload?.player?.accountid
    ?? payload?.player?.account_id
    ?? payload?.player?.accountId
    ?? payload?.player?.steamid
    ?? payload?.player?.steam_id
  );
  if (!accountId) return { stateChanged: false, configChanged: false };
  const previous = runtime.state.streamerStats || {};
  const stateChanged = String(previous.streamerAccountId || '') !== String(accountId);
  if (stateChanged) {
    runtime.state.streamerStats = {
      ...normalizeStreamerStatsState(previous),
      streamerAccountId: accountId,
      lastStreamerAccountId: accountId,
      accountRankTier: null,
      accountLeaderboardRank: null,
      accountRankCheckedAt: null
    };
  }
  const settings = runtime.config.protection.matchIntel || {};
  let configChanged = false;
  const accounts = Array.isArray(settings.streamerAccounts) ? settings.streamerAccounts : [];
  if (!accounts.some((item) => String(item?.accountId || '') === String(accountId))) {
    const inheritFallback = accounts.length === 0;
    settings.streamerAccounts = [
      ...accounts,
      {
        accountId,
        label: streamerAccountLabelFromPayload(payload),
        mmr: inheritFallback && Number(settings.streamerMmr || 0) > 0 ? Math.trunc(Number(settings.streamerMmr || 0)) : 0,
        goalMmr: inheritFallback && Number(settings.streamerGoalMmr || 0) > 0 ? Math.trunc(Number(settings.streamerGoalMmr || 0)) : 0,
        goalStartMmr: inheritFallback && Number(settings.streamerGoalStartMmr || 0) > 0 ? Math.trunc(Number(settings.streamerGoalStartMmr || 0)) : 0,
        boundAt: new Date().toISOString()
      }
    ];
    normalizeMatchIntelConfig(settings);
    configChanged = true;
    logEvent('system', `Streamer Dota account bound: ${accountId}`);
  }
  return { stateChanged, configChanged };
}

function streamerAccountLabelFromPayload(payload) {
  return repairMojibakeText(
    payload?.player?.name
    || payload?.player?.player_name
    || payload?.player?.personaname
    || ''
  ).slice(0, 40);
}

function applyStreamerStatsMatchResult(previous, gsi) {
  const settings = runtime.config.protection.matchIntel;
  const result = inferResult(gsi);
  const matchId = gsi.matchId || gsi.activeMatchId || previous.matchId || previous.activeMatchId;
  const applied = applyStreamerMatchResult(runtime.state.streamerStats, settings, result, matchId);
  runtime.state.streamerStats = applied.state;
  if (applied.configChanged) {
    runtime.config.protection.matchIntel = {
      ...runtime.config.protection.matchIntel,
      ...applied.config
    };
    normalizeMatchIntelConfig(runtime.config.protection.matchIntel);
  }
  if (applied.changed) {
    const delta = Number(runtime.state.streamerStats.lastMmrChange || 0);
    const mmrText = delta ? `, MMR ${delta > 0 ? '+' : ''}${delta}` : '';
    logEvent('system', `Streamer stats updated: ${result}${mmrText}`);
  }
  return { changed: applied.changed, configChanged: applied.configChanged };
}

async function refreshStreamerAccountRank() {
  const settings = runtime.config.protection.matchIntel;
  if (!settings?.showStreamerStats || !settings.showStreamerRankMedal) return;
  if (!['auto', 'account'].includes(settings.streamerMedalSource || 'auto')) return;
  const accountId = runtime.state.streamerStats?.streamerAccountId;
  if (!accountId) return;
  const cacheKey = String(accountId);
  const cached = getCachedPlayerRank(cacheKey);
  if (!shouldRefreshPlayerRank(cacheKey)) {
    if (!cached) return;
    runtime.state.streamerStats = {
      ...normalizeStreamerStatsState(runtime.state.streamerStats),
      accountRankTier: cached.rankTier || null,
      accountLeaderboardRank: cached.leaderboardRank || null,
      accountRankCheckedAt: runtime.state.streamerStats?.accountRankCheckedAt || new Date().toISOString()
    };
    return;
  }
  const rank = await fetchAndCachePlayerRank(cacheKey);
  if (String(runtime.state.streamerStats?.streamerAccountId || '') !== String(accountId)) return;
  runtime.state.streamerStats = {
    ...normalizeStreamerStatsState(runtime.state.streamerStats),
    accountRankTier: rank?.rankTier || null,
    accountLeaderboardRank: rank?.leaderboardRank || null,
    accountRankCheckedAt: new Date().toISOString()
  };
  await persistState();
  broadcast();
}

function syncStreamerSessionPresence() {
  if (!runtime.config.protection.matchIntel?.showStreamerStats) return false;
  const result = updateStreamerSessionPresence(runtime.state.streamerStats, effectiveStreamerStreamOnline());
  runtime.state.streamerStats = result.state;
  return result.changed;
}

function effectiveStreamerStreamOnline() {
  if (runtime.config.predictions?.forceStreamOnline) return true;
  if (typeof runtime.state.twitch?.isLive === 'boolean') return runtime.state.twitch.isLive;
  const targetBroadcasterId = twitchTargetChannel().broadcasterId;
  if (targetBroadcasterId
    && String(runtime.twitchStreamStatus?.broadcasterId || '') === String(targetBroadcasterId)
    && typeof runtime.twitchStreamStatus?.isLive === 'boolean') {
    return runtime.twitchStreamStatus.isLive;
  }
  return null;
}

function buildRosterDebug(payload) {
  return Object.entries(payload?.allplayers || payload?.players || {})
    .filter(([key, player]) => !isIgnoredGsiPlayerKey(key) && player && typeof player === 'object')
    .map(([key, player]) => ({
      key,
      accountId: normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id),
      name: String(player.name || player.player_name || player.personaname || '').slice(0, 40),
      hero: String(player.hero_name || player.heroName || player.hero || '').slice(0, 60),
      team: normalizePlayerTeam(player) || normalizeTeam(player.activity || ''),
      playerSlot: player.player_slot ?? player.playerSlot ?? null,
      teamSlot: player.team_slot ?? player.teamSlot ?? null
    }))
    .sort((left, right) => String(left.key).localeCompare(String(right.key), undefined, { numeric: true }));
}

function findStreamerMatchPlayer(payload, players) {
  const streamerAccountId = normalizeAccountId(runtime.state.streamerStats?.streamerAccountId);
  if (!streamerAccountId) return null;
  const normalizedPlayer = Array.isArray(players)
    ? players.find((player) => String(player?.accountId || '') === String(streamerAccountId))
    : null;
  if (normalizedPlayer) return normalizedPlayer;

  const source = payload?.allplayers || payload?.players || {};
  for (const [key, player] of Object.entries(source)) {
    if (isIgnoredGsiPlayerKey(key)) continue;
    if (!player || typeof player !== 'object') continue;
    const accountId = normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id);
    if (String(accountId || '') !== String(streamerAccountId)) continue;
    return {
      accountId,
      team: normalizePlayerTeam(player),
      hero: String(player.hero_name || player.heroName || player.hero || '').slice(0, 60)
    };
  }
  return null;
}

function getCachedPlayerRank(accountId) {
  const cached = runtime.playerRankCache.get(String(accountId));
  if (!cached || cached.failedAt) return null;
  return cached;
}

async function refreshNotablePlayerRanks(players) {
  if (!shouldShowNotablePlayers()) return;
  if (isMatchIntelFinished(runtime.state.gsi)) return;
  if (runtime.state.gsi.leftGameView) return;
  const gameState = String(runtime.state.gsi.gameState || '');
  const preGameState = /PRE_GAME/i.test(gameState);
  const spectatingMatch = isSpectatingMatch(runtime.state.gsi, players);
  const clockTime = Number(runtime.state.gsi.clockTime);
  const settings = matchIntelSettingsForGsi(runtime.state.gsi);
  const rankCutoff = Number(settings.rankDisplayMinutes || 12) * 60;
  const fullGameRanks = settings.rankDisplayMode === 'full_game';
  const preGameOnlyRanks = settings.rankDisplayMode === 'pre_game_only';
  if (preGameOnlyRanks && !preGameState) return;
  if (!preGameState && (!Number.isFinite(clockTime) || clockTime < 0) && !spectatingMatch) return;
  if (!preGameState && !fullGameRanks && Number.isFinite(clockTime) && clockTime > rankCutoff) return;
  const accountIds = [...new Set(players.map((player) => player.accountId).filter(Boolean).map(String))];
  if (!accountIds.length) return;

  const staleIds = accountIds.filter((accountId) => shouldRefreshPlayerRank(accountId));
  for (const accountId of staleIds) {
    fetchAndCachePlayerRank(accountId).catch((error) => {
      runtime.playerRankCache.set(accountId, { checkedAt: Date.now(), failedAt: Date.now(), error: error.message });
      runtime.pendingPlayerRankFetches.delete(accountId);
    });
  }

  const notablePlayers = buildNotablePlayers(players);
  if (!sameJson(runtime.state.matchIntel.notablePlayers, notablePlayers)) {
    runtime.state.matchIntel.notablePlayers = notablePlayers;
    await persistState();
    broadcast();
  }
}

function isMatchIntelFinished(gsi) {
  return /POST_GAME|GAME_END|DISCONNECT/i.test(String(gsi?.gameState || ''));
}

function isSpectatingMatch(gsi, players = []) {
  const activity = String(gsi?.playerActivity || '').toLowerCase();
  const gameState = String(gsi?.gameState || '');
  return activity === 'spectating'
    && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState)
    && Array.isArray(players)
    && players.some((player) => player?.accountId);
}

function isSpectatingGsi(gsi) {
  return String(gsi?.playerActivity || '').toLowerCase() === 'spectating';
}

function matchIntelSettingsForGsi(gsi) {
  return isSpectatingGsi(gsi)
    ? runtime.config.protection.spectatorMatchIntel || runtime.config.protection.matchIntel
    : runtime.config.protection.matchIntel;
}

function shouldShowNotablePlayers() {
  const settings = matchIntelSettingsForGsi(runtime.state.gsi);
  return Boolean(settings?.enabled && (settings.showPlayerRanks || settings.showPlayerFlags));
}

function buildNotablePlayers(players) {
  return notablePlayersFromRankCache(
    players,
    getCachedPlayerRank,
    runtime.config.protection.matchIntel?.customPlayers || []
  );
}

function shouldRefreshPlayerRank(accountId) {
  if (runtime.pendingPlayerRankFetches.has(accountId)) return false;
  const cached = runtime.playerRankCache.get(accountId);
  if (!cached) return true;
  const ttl = cached.failedAt ? playerRankFailureTtlMs : playerRankCacheTtlMs;
  return Date.now() - Number(cached.checkedAt || 0) > ttl;
}

async function fetchAndCachePlayerRank(accountId) {
  const pending = runtime.pendingPlayerRankFetches.get(accountId);
  if (pending) return pending;
  const request = fetchOpenDotaPlayer(accountId)
    .then((data) => {
      const leaderboardRank = Number(data?.leaderboard_rank);
      const rankTier = Number(data?.rank_tier);
      const cacheEntry = {
        checkedAt: Date.now(),
        leaderboardRank: Number.isFinite(leaderboardRank) && leaderboardRank > 0 ? Math.trunc(leaderboardRank) : null,
        rankTier: Number.isFinite(rankTier) && rankTier > 0 ? Math.trunc(rankTier) : null,
        countryCode: normalizeCountryCode(data?.profile?.loccountrycode),
        name: String(data?.profile?.name || data?.profile?.personaname || '').slice(0, 40)
      };
      runtime.playerRankCache.set(accountId, cacheEntry);
      runtime.pendingPlayerRankFetches.delete(accountId);
      if (String(runtime.state.streamerStats?.streamerAccountId || '') === String(accountId)) {
        runtime.state.streamerStats = {
          ...normalizeStreamerStatsState(runtime.state.streamerStats),
          accountRankTier: cacheEntry.rankTier,
          accountLeaderboardRank: cacheEntry.leaderboardRank,
          accountRankCheckedAt: new Date().toISOString()
        };
      }
      const players = runtime.state.matchIntel?.players || [];
      const notablePlayers = buildNotablePlayers(players);
      if (!sameJson(runtime.state.matchIntel.notablePlayers, notablePlayers)) {
        runtime.state.matchIntel.notablePlayers = notablePlayers;
        persistState().catch(() => {});
        broadcast();
      }
      return cacheEntry;
    })
    .catch((error) => {
      runtime.playerRankCache.set(accountId, { checkedAt: Date.now(), failedAt: Date.now(), error: error.message });
      runtime.pendingPlayerRankFetches.delete(accountId);
      throw error;
    });
  runtime.pendingPlayerRankFetches.set(accountId, request);
  return request;
}

async function fetchOpenDotaPlayer(accountId) {
  const normalized = normalizeAccountId(accountId);
  if (!normalized) throw new Error(`Invalid Dota account id: ${accountId}`);
  return await fetchWithTimeout(
    `https://api.opendota.com/api/players/${encodeURIComponent(normalized)}`,
    {
      headers: { 'User-Agent': 'DotaStreamKit/1.0' }
    },
    7000,
    async (response) => {
      if (!response.ok) throw new Error(`OpenDota ${response.status}`);
      return JSON.parse(await readResponseText(response, 2 * 1024 * 1024));
    }
  );
}

function sameJson(left, right) {
  return JSON.stringify(left || null) === JSON.stringify(right || null);
}

function normalizeCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function computeProtection(config, gsi) {
  const gameState = String(gsi.gameState || '');
  const connected = Boolean(gsi.connected);
  const spectating = isSpectatingGsi(gsi);
  const heroSelection = connected && /HERO_SELECTION/i.test(gameState);
  const draftByState = !spectating && heroSelection && !gsi.ownPickPhaseEnded;
  const topBarByState = !spectating && heroSelection && gsi.ownPickPhaseEnded;
  const gameByState = !spectating && connected && !gsi.leftGameView && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState);
  const queueByState = stableQueueAutoState(config, gsi);
  return {
    draft: !spectating && Boolean(config.protection.manualDraft || (config.protection.autoDraft && draftByState)),
    minimap: !spectating && Boolean(config.protection.manualMinimap || (config.protection.autoMinimap && gameByState)),
    topBar: !spectating && Boolean(config.protection.manualTopBar || (config.protection.autoDraft && topBarByState)),
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

function inferHeroDemoMode(payload) {
  const map = payload?.map || {};
  const candidates = [
    map.name,
    map.map_name,
    map.mapName,
    map.customgamename,
    map.custom_game_name,
    map.customGameName,
    map.game_mode,
    map.gameMode,
    payload?.provider?.map,
    payload?.provider?.map_name,
    payload?.provider?.mapName,
    payload?.provider?.customgamename,
    payload?.provider?.custom_game_name,
    payload?.provider?.customGameName
  ];
  return candidates.some((value) => heroDemoPattern.test(String(value || '')));
}

function gsiLifecyclePrevious(previous) {
  const seed = previous?.lifecycleSeed && typeof previous.lifecycleSeed === 'object'
    ? previous.lifecycleSeed
    : {};
  const currentClockTime = optionalGsiNumber(previous?.clockTime);
  const seededClockTime = optionalGsiNumber(seed.clockTime);
  return {
    ...previous,
    connected: previous?.connected === true || Boolean(seed.lastSeenAt),
    gameState: previous?.gameState || seed.gameState || null,
    playerActivity: previous?.playerActivity || seed.playerActivity || null,
    clockTime: Number.isFinite(currentClockTime)
      ? currentClockTime
      : Number.isFinite(seededClockTime) ? seededClockTime : null,
    matchId: previous?.matchId || seed.matchId || null,
    activeMatchId: previous?.activeMatchId || seed.activeMatchId || null
  };
}

function inferGsiLifecycle(previous, gameState, matchId, clockTime, playerActivity) {
  const previousState = String(previous.gameState || '');
  const state = String(gameState || '');
  const heroSelection = /HERO_SELECTION/i.test(state);
  const wasHeroSelection = /HERO_SELECTION/i.test(previousState);
  const previousMatchId = previous?.activeMatchId || previous?.matchId || null;
  const matchChanged = Boolean(matchId && previousMatchId && String(matchId) !== String(previousMatchId));
  const returnedToDraft = heroSelection && !wasHeroSelection;
  const currentClockTime = optionalGsiNumber(clockTime);
  const previousClockTime = optionalGsiNumber(previous?.clockTime);
  const clockRestarted = Number.isFinite(currentClockTime)
    && Number.isFinite(previousClockTime)
    && currentClockTime + 30 < previousClockTime;
  const currentOwnLive = playerActivity === 'playing'
    && /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state);
  const previousOwnLive = previous?.playerActivity === 'playing'
    && /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(previousState);
  const ownClockRestarted = currentOwnLive
    && previousOwnLive
    && clockRestarted
    && !(matchId && previousMatchId && String(matchId) === String(previousMatchId));
  const newDraft = (heroSelection && returnedToDraft)
    || (currentOwnLive && matchChanged)
    || ownClockRestarted;
  return {
    matchChanged,
    returnedToDraft,
    newDraft,
    draftCycle: newDraft ? Number(previous.draftCycle || 0) + 1 : Number(previous.draftCycle || 0)
  };
}

function inferPlayerHeroPicked(previous, gameState, hero, lifecycle = {}) {
  if (/POST_GAME/i.test(String(gameState || ''))) return false;
  const hasHero = Boolean(hero?.name || hero?.localized_name || hero?.id || hero?.hero_id || lifecycle.fallbackHeroName);
  if (/HERO_SELECTION/i.test(String(gameState || '')) && lifecycle.newDraft && !hasHero) return false;
  const inheritedHero = lifecycle.inheritPlayerState && Boolean(previous.playerHeroPicked || previous.heroName || previous.heroId);
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

function inferActiveMatchId(previous, gameState, matchId, lifecycle = {}) {
  if (/POST_GAME/i.test(String(gameState || ''))) return null;
  if (matchId) return matchId;
  if (lifecycle.newDraft) return null;
  if (lifecycle.playerActivity === 'spectating') {
    const sameSpectatorCycle = Number(previous.spectatorCycle || 0) === Number(lifecycle.spectatorCycle || 0);
    if (sameSpectatorCycle && previous.playerActivity === 'spectating') {
      return previous.activeMatchId || previous.matchId || null;
    }
    return null;
  }
  if (!previous.connected) return null;
  return previous.activeMatchId || previous.matchId || null;
}

function inferInGameScreen(gameState, playerActivity) {
  const state = String(gameState || '');
  const activity = String(playerActivity || '').toLowerCase();
  if (/DISCONNECT|POST_GAME/i.test(state)) return false;
  if (activity && !['playing', 'spectating'].includes(activity)) return false;
  return inGameStatePattern.test(state) && !/POST_GAME/i.test(state);
}

function extractActivitySignal(payload) {
  const candidates = activityCandidates(payload);
  for (const candidate of candidates) {
    const normalized = normalizeActivityValue(candidate.value);
    if (normalized) return { ...candidate, normalized };
  }
  return {
    source: 'fallback',
    value: '',
    normalized: null,
    candidates
  };
}

function activityCandidates(payload) {
  return [
    activityCandidate('player.activity', payload?.player?.activity),
    activityCandidate('player.status', payload?.player?.status),
    activityCandidate('player.state', payload?.player?.state),
    activityCandidate('provider.activity', payload?.provider?.activity),
    activityCandidate('provider.status', payload?.provider?.status),
    activityCandidate('provider.player_activity', payload?.provider?.player_activity),
    activityCandidate('provider.playerActivity', payload?.provider?.playerActivity),
    activityCandidate('map.activity', payload?.map?.activity),
    activityCandidate('map.status', payload?.map?.status),
    activityCandidate('map.player_activity', payload?.map?.player_activity),
    activityCandidate('map.playerActivity', payload?.map?.playerActivity)
  ].filter(Boolean);
}

function activityCandidate(source, value) {
  const text = String(value ?? '').trim();
  return text ? { source, value: text } : null;
}

function normalizeActivityValue(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  if (/spectat|watch/.test(text)) return 'spectating';
  if (/play|player|ingame|in_game|in-game/.test(text)) return 'playing';
  if (/menu|idle|none|away|afk|disconnect|offline|unknown/.test(text)) return text.replace(/[^a-z0-9_ -]/g, '').slice(0, 40) || null;
  return text.replace(/[^a-z0-9_ -]/g, '').slice(0, 40) || null;
}

function inferPlayerActivity({ previous, activitySignal, gameState, matchId, localPlayerPayload, streamerInMatch }) {
  const explicitActivity = activitySignal?.normalized;
  if (explicitActivity === 'spectating') return 'spectating';
  if (explicitActivity === 'playing') return 'playing';
  if (explicitActivity) return explicitActivity;

  const state = String(gameState || '');
  const previousMatchId = previous?.activeMatchId || previous?.matchId || null;
  const sameMatch = Boolean(matchId && previousMatchId && String(matchId) === String(previousMatchId));
  if (!/HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state)) return null;

  if (localPlayerPayload || streamerInMatch) return 'playing';
  if (sameMatch && previous.connected && String(previous?.playerActivity || '').toLowerCase() === 'playing') return 'playing';
  if (!/PRE_GAME|GAME_IN_PROGRESS/i.test(state)) return null;
  return 'spectating';
}

function buildActivityDebug({ payload, activitySignal, playerActivity, localPlayerPayload, streamerMatchPlayer, matchPlayers }) {
  const streamerAccountId = normalizeAccountId(runtime.state.streamerStats?.streamerAccountId);
  return {
    inferred: playerActivity || null,
    source: activitySignal?.source || 'fallback',
    explicitValue: activitySignal?.value || '',
    explicitNormalized: activitySignal?.normalized || null,
    candidates: (activitySignal?.candidates || activityCandidates(payload)).slice(0, 20),
    fallback: {
      localPlayerPayload,
      streamerAccountId,
      streamerInMatch: Boolean(streamerMatchPlayer),
      streamerMatchHero: streamerMatchPlayer?.hero || '',
      streamerMatchTeam: streamerMatchPlayer?.team || null,
      matchPlayerCount: Array.isArray(matchPlayers) ? matchPlayers.length : 0
    },
    payloadKeys: Object.keys(payload || {}).sort().slice(0, 50),
    provider: pickDebugFields(payload?.provider, ['name', 'appid', 'version', 'timestamp', 'activity', 'status', 'player_activity', 'playerActivity']),
    map: pickDebugFields(payload?.map, ['name', 'matchid', 'match_id', 'game_state', 'clock_time', 'activity', 'status', 'player_activity', 'playerActivity']),
    player: pickDebugFields(payload?.player, ['activity', 'status', 'state', 'team_name', 'team', 'accountid', 'account_id', 'steamid', 'player_slot', 'team_slot'])
  };
}

function pickDebugFields(source, keys) {
  const result = {};
  if (!source || typeof source !== 'object') return result;
  for (const key of keys) {
    if (source[key] === undefined || source[key] === null) continue;
    result[key] = String(source[key]).slice(0, 120);
  }
  result.keys = Object.keys(source).sort().slice(0, 30);
  return result;
}

function shouldInheritPlayerState({ previous, gameState, matchId, playerActivity, localPlayerPayload, lifecycle = {} }) {
  if (playerActivity !== 'playing') return false;
  const previousMatchId = previous?.activeMatchId || previous?.matchId || null;
  if (lifecycle.matchChanged || lifecycle.newDraft) return false;
  if (matchId && previousMatchId && String(matchId) !== String(previousMatchId)) return false;
  if (localPlayerPayload) return true;
  if (!/HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(String(gameState || ''))) return false;
  return String(previous?.playerActivity || '').toLowerCase() === 'playing';
}

function inferSpectatorCycle(previous, current) {
  const previousCycle = Number(previous?.spectatorCycle || 0);
  const spectating = current.playerActivity === 'spectating';
  const liveState = /PRE_GAME|GAME_IN_PROGRESS/i.test(String(current.gameState || ''));
  if (!spectating || !liveState) return previousCycle;

  const wasSpectating = previous?.playerActivity === 'spectating';
  const wasLiveState = /PRE_GAME|GAME_IN_PROGRESS/i.test(String(previous?.gameState || ''));
  const clockTime = optionalGsiNumber(current.clockTime);
  const previousClockTime = optionalGsiNumber(previous?.clockTime);
  const clockRestarted = Number.isFinite(clockTime)
    && Number.isFinite(previousClockTime)
    && clockTime + 30 < previousClockTime;
  const previousMatchId = previous?.activeMatchId || previous?.matchId || null;
  const matchChanged = Boolean(
    current.matchId
    && previousMatchId
    && String(current.matchId) !== String(previousMatchId)
  );
  return !wasSpectating || !wasLiveState || clockRestarted || matchChanged
    ? previousCycle + 1
    : previousCycle;
}

function optionalGsiNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function inferLocalPlayerTeam({ player, streamerMatchPlayer, previous, lifecycle = {}, isStreamerPlaying }) {
  if (!isStreamerPlaying) return null;
  const direct = normalizeTeam(player?.team_name || player?.team || streamerMatchPlayer?.team || player?.activity);
  if (direct) return direct;

  const playerSlotTeam = normalizePlayerSlotTeam(player?.player_slot ?? player?.playerSlot);
  if (playerSlotTeam) return playerSlotTeam;

  const previousTeam = lifecycle.inheritPlayerState ? normalizeTeam(previous?.playerTeam) : null;
  if (previousTeam) return previousTeam;

  return normalizeTeamSlotTeam(player?.team_slot ?? player?.teamSlot);
}

function normalizePlayerSlotTeam(value) {
  const slot = Number(value);
  if (!Number.isFinite(slot)) return null;
  if (slot >= 128) return 'dire';
  if (slot >= 0 && slot < 5) return 'radiant';
  if (slot >= 5 && slot < 10) return 'dire';
  return null;
}

function normalizeTeamSlotTeam(value) {
  const slot = Number(value);
  if (!Number.isFinite(slot)) return null;
  if (slot >= 5 && slot < 10) return 'dire';
  if (slot >= 0 && slot < 5) return 'radiant';
  return null;
}

function hasLocalPlayerPayload(payload) {
  const player = payload?.player || {};
  const hero = payload?.hero || {};
  const hasPlayerIdentity = Boolean(
    player.team
      || player.team_name
      || player.accountid
      || player.account_id
      || player.accountId
      || player.steamid
      || player.steam_id
      || player.player_slot !== undefined
      || player.playerSlot !== undefined
      || player.team_slot !== undefined
      || player.teamSlot !== undefined
  );
  const hasPlayerStats = Boolean(
    player.kills !== undefined
      || player.deaths !== undefined
      || player.assists !== undefined
      || player.last_hits !== undefined
      || player.lastHits !== undefined
      || player.denies !== undefined
  );
  const hasHeroState = Boolean(
    hero.id !== undefined
      || hero.hero_id !== undefined
      || hero.name
      || hero.localized_name
      || hero.level !== undefined
  );
  return Boolean(
    hasPlayerIdentity
      || hasPlayerStats
      || hasHeroState
  );
}

function collectTeamStats(payload, playerTeam) {
  const players = Object.entries(payload.allplayers || payload.players || {})
    .filter(([key, item]) => !isIgnoredGsiPlayerKey(key) && item && typeof item === 'object')
    .map(([, item]) => item);
  const empty = {
    teamKills: null,
    teamDeaths: null,
    teamAssists: null,
    enemyKills: null,
    enemyDeaths: null,
    enemyAssists: null,
    radiantKills: null,
    radiantDeaths: null,
    radiantAssists: null,
    direKills: null,
    direDeaths: null,
    direAssists: null,
    totalKills: null,
    totalDeaths: null,
    totalAssists: null
  };
  if (!players.length) return empty;

  const rosterSlots = players.map(normalizeGsiRosterSlot);
  const radiantSlots = new Set(rosterSlots.filter((slot) => slot !== null && slot < 5));
  const direSlots = new Set(rosterSlots.filter((slot) => slot !== null && slot >= 5));
  const radiantRosterComplete = radiantSlots.size === 5 && players.filter((player) => normalizePlayerTeam(player) === 'radiant').length === 5;
  const direRosterComplete = direSlots.size === 5 && players.filter((player) => normalizePlayerTeam(player) === 'dire').length === 5;
  const groupRosterComplete = {
    radiant: radiantRosterComplete,
    dire: direRosterComplete,
    total: radiantRosterComplete && direRosterComplete,
    team: playerTeam === 'radiant' ? radiantRosterComplete : playerTeam === 'dire' ? direRosterComplete : false,
    enemy: playerTeam === 'radiant' ? direRosterComplete : playerTeam === 'dire' ? radiantRosterComplete : false
  };

  const totals = {
    teamKills: 0,
    teamDeaths: 0,
    teamAssists: 0,
    enemyKills: 0,
    enemyDeaths: 0,
    enemyAssists: 0,
    radiantKills: 0,
    radiantDeaths: 0,
    radiantAssists: 0,
    direKills: 0,
    direDeaths: 0,
    direAssists: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalAssists: 0
  };
  let hasTeam = false;
  let hasEnemy = false;
  let hasRadiant = false;
  let hasDire = false;
  const expected = { team: 0, enemy: 0, radiant: 0, dire: 0, total: players.length };
  const known = {
    teamKills: 0, teamDeaths: 0, teamAssists: 0,
    enemyKills: 0, enemyDeaths: 0, enemyAssists: 0,
    radiantKills: 0, radiantDeaths: 0, radiantAssists: 0,
    direKills: 0, direDeaths: 0, direAssists: 0,
    totalKills: 0, totalDeaths: 0, totalAssists: 0
  };

  for (const player of players) {
    const team = normalizePlayerTeam(player);
    const kills = statNumber(player.kills, null);
    const deaths = statNumber(player.deaths, null);
    const assists = statNumber(player.assists, null);
    if (Number.isFinite(kills)) {
      totals.totalKills += kills;
      known.totalKills += 1;
    }
    if (Number.isFinite(deaths)) {
      totals.totalDeaths += deaths;
      known.totalDeaths += 1;
    }
    if (Number.isFinite(assists)) {
      totals.totalAssists += assists;
      known.totalAssists += 1;
    }
    if (team === 'radiant') {
      expected.radiant += 1;
      if (Number.isFinite(kills)) { totals.radiantKills += kills; known.radiantKills += 1; }
      if (Number.isFinite(deaths)) { totals.radiantDeaths += deaths; known.radiantDeaths += 1; }
      if (Number.isFinite(assists)) { totals.radiantAssists += assists; known.radiantAssists += 1; }
      hasRadiant = true;
    } else if (team === 'dire') {
      expected.dire += 1;
      if (Number.isFinite(kills)) { totals.direKills += kills; known.direKills += 1; }
      if (Number.isFinite(deaths)) { totals.direDeaths += deaths; known.direDeaths += 1; }
      if (Number.isFinite(assists)) { totals.direAssists += assists; known.direAssists += 1; }
      hasDire = true;
    }
    if (playerTeam && team === playerTeam) {
      expected.team += 1;
      if (Number.isFinite(kills)) { totals.teamKills += kills; known.teamKills += 1; }
      if (Number.isFinite(deaths)) { totals.teamDeaths += deaths; known.teamDeaths += 1; }
      if (Number.isFinite(assists)) { totals.teamAssists += assists; known.teamAssists += 1; }
      hasTeam = true;
    } else if (playerTeam && team && team !== playerTeam) {
      expected.enemy += 1;
      if (Number.isFinite(kills)) { totals.enemyKills += kills; known.enemyKills += 1; }
      if (Number.isFinite(deaths)) { totals.enemyDeaths += deaths; known.enemyDeaths += 1; }
      if (Number.isFinite(assists)) { totals.enemyAssists += assists; known.enemyAssists += 1; }
      hasEnemy = true;
    }
  }

  const complete = (name, group) => groupRosterComplete[group]
    && expected[group] > 0
    && known[name] === expected[group];

  return {
    teamKills: hasTeam && complete('teamKills', 'team') ? totals.teamKills : null,
    teamDeaths: hasTeam && complete('teamDeaths', 'team') ? totals.teamDeaths : null,
    teamAssists: hasTeam && complete('teamAssists', 'team') ? totals.teamAssists : null,
    enemyKills: hasEnemy && complete('enemyKills', 'enemy') ? totals.enemyKills : null,
    enemyDeaths: hasEnemy && complete('enemyDeaths', 'enemy') ? totals.enemyDeaths : null,
    enemyAssists: hasEnemy && complete('enemyAssists', 'enemy') ? totals.enemyAssists : null,
    radiantKills: hasRadiant && complete('radiantKills', 'radiant') ? totals.radiantKills : null,
    radiantDeaths: hasRadiant && complete('radiantDeaths', 'radiant') ? totals.radiantDeaths : null,
    radiantAssists: hasRadiant && complete('radiantAssists', 'radiant') ? totals.radiantAssists : null,
    direKills: hasDire && complete('direKills', 'dire') ? totals.direKills : null,
    direDeaths: hasDire && complete('direDeaths', 'dire') ? totals.direDeaths : null,
    direAssists: hasDire && complete('direAssists', 'dire') ? totals.direAssists : null,
    totalKills: complete('totalKills', 'total') ? totals.totalKills : null,
    totalDeaths: complete('totalDeaths', 'total') ? totals.totalDeaths : null,
    totalAssists: complete('totalAssists', 'total') ? totals.totalAssists : null
  };
}

function normalizeGsiRosterSlot(player) {
  const teamSlot = Number(player?.team_slot ?? player?.teamSlot);
  if (Number.isInteger(teamSlot) && teamSlot >= 0 && teamSlot < 5) {
    return normalizePlayerTeam(player) === 'dire' ? teamSlot + 5 : teamSlot;
  }
  if (Number.isInteger(teamSlot) && teamSlot >= 5 && teamSlot < 10) return teamSlot;

  const playerSlot = Number(player?.player_slot ?? player?.playerSlot);
  if (Number.isInteger(playerSlot) && playerSlot >= 0 && playerSlot < 5) return playerSlot;
  if (Number.isInteger(playerSlot) && playerSlot >= 128 && playerSlot < 133) return playerSlot - 123;
  return null;
}

function isIgnoredGsiPlayerKey(key) {
  const normalized = String(key || '').trim().toLowerCase();
  return normalized === '0' || normalized === 'player0';
}

function inferMatchTeams(payload, players = []) {
  const radiant = firstNonEmpty(
    payload?.map?.radiant_team_name,
    payload?.map?.radiantTeamName,
    payload?.map?.radiant_team,
    payload?.map?.radiant,
    payload?.draft?.radiant_team_name,
    payload?.draft?.radiantTeamName,
    teamNameFromRoster(payload, players, 'radiant')
  );
  const dire = firstNonEmpty(
    payload?.map?.dire_team_name,
    payload?.map?.direTeamName,
    payload?.map?.dire_team,
    payload?.map?.dire,
    payload?.draft?.dire_team_name,
    payload?.draft?.direTeamName,
    teamNameFromRoster(payload, players, 'dire')
  );
  return {
    radiant: sanitizeTeamName(radiant, 'Radiant'),
    dire: sanitizeTeamName(dire, 'Dire')
  };
}

function teamNameFromRoster(payload, players, team) {
  const slotTeam = team === 'dire' ? 'dire' : 'radiant';
  const source = payload?.allplayers || payload?.players || {};
  for (const [key, player] of Object.entries(source)) {
    if (isIgnoredGsiPlayerKey(key)) continue;
    if (!player || typeof player !== 'object') continue;
    const normalized = normalizePlayerTeam(player);
    if (normalized !== slotTeam) continue;
    const teamName = firstNonEmpty(player.team_display_name, player.teamDisplayName, player.team_tag, player.teamTag, player.team_clan_name, player.teamClanName);
    if (teamName) return teamName;
  }
  const player = players.find((item) => item?.team === slotTeam);
  return player?.teamName || null;
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value || '').trim()) || null;
}

function sanitizeTeamName(value, fallback) {
  if (value && typeof value === 'object') {
    return sanitizeTeamName(value.name || value.team_name || value.tag || value.team_tag, fallback);
  }
  const text = String(value || '').trim();
  if (!text || /^(radiant|dire|good|bad|2|3)$/i.test(text)) return fallback;
  return text.slice(0, 40);
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

async function maybeAutomatePrediction(previous, gsi, context = {}) {
  const profile = predictionProfileForGsi(gsi);
  const settings = predictionSettingsForProfile(profile);
  if (!runtime.state.twitchToken?.accessToken) return;
  const expectedPredictionId = context.expectedPredictionId || null;
  const activeBeforeSync = runtime.state.activePrediction;
  if (expectedPredictionId
    ? !samePredictionId(activeBeforeSync, expectedPredictionId)
    : Boolean(activeBeforeSync)) return;

  if (isCurrentGsiAutomationContext(gsi)) syncActivePredictionMatchId(gsi);
  await syncOwnedActivePredictionFromTwitch();
  const active = runtime.state.activePrediction;
  if (active && ['ACTIVE', 'LOCKED'].includes(active.status)) {
    if (!expectedPredictionId || !samePredictionId(active, expectedPredictionId)) return;
    const activeSettings = predictionSettingsForProfile(predictionProfileFromMeta(runtime.state.activePredictionMeta));
    if (activeSettings.autoCancelInvalidGame) {
      await maybeCancelPredictionForInvalidGame(previous, gsi, expectedPredictionId);
    }

    const latestAfterCancel = runtime.state.activePrediction;
    if (latestAfterCancel && ['ACTIVE', 'LOCKED'].includes(latestAfterCancel.status)) {
      if (
        latestAfterCancel.status === 'ACTIVE'
        && activeSettings.autoLockAtGameSeconds > 0
        && gsi.clockTime >= activeSettings.autoLockAtGameSeconds
        && activePredictionMatchesGsi(gsi)
        && claimPredictionActionAttempt('lock', latestAfterCancel.id)
      ) {
        try {
          if (isCurrentOwnedPredictionId(latestAfterCancel.id)) await twitchEndPrediction(latestAfterCancel.id, 'LOCKED');
          logEvent('twitch', 'Prediction locked automatically');
        } catch (error) {
          logEvent('twitch', `Auto lock failed: ${error.message}`);
        }
      }

      let result = null;
      if (activePredictionMatchesGsi(gsi)) {
        const evaluatedResult = latchPredictionResult(runtime.state.activePredictionMeta, gsi, inferResult);
        result = evaluatedResult.result;
        if (evaluatedResult.changed) {
          runtime.state.activePredictionMeta = evaluatedResult.meta;
          rememberOwnedPrediction(runtime.state.activePrediction, evaluatedResult.meta);
          await persistState();
        }
      }
      if (activeSettings.autoResolve
        && result
        && activePredictionMatchesGsi(gsi)
        && claimPredictionActionAttempt('resolve', latestAfterCancel.id)) {
        const resolvingPredictionId = latestAfterCancel.id;
        let latestActive = runtime.state.activePrediction || latestAfterCancel;
        if (activeSettings.cancelUncontestedPrediction) {
          try {
            latestActive = await refreshActivePredictionFromTwitch(latestActive);
            if (!samePredictionId(latestActive, resolvingPredictionId) || !isCurrentOwnedPredictionId(resolvingPredictionId)) return;
            if (!hasCompletePredictionOutcomePoints(latestActive)) {
              logEvent('twitch', 'Uncontested prediction check skipped: Twitch returned incomplete channel point totals');
              return;
            }
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
            if (!samePredictionId(latestActive, resolvingPredictionId)
              || !isCurrentOwnedPredictionId(resolvingPredictionId)
              || !activePredictionMatchesGsi(gsi)) return;
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

  if (expectedPredictionId) return;
  if (settings.autoCreate && !runtime.state.activePrediction && shouldAutoCreatePrediction(previous, gsi, profile) && shouldRetryAutoPrediction(gsi, profile)) {
    if (!isCurrentGsiAutomationContext(gsi)) return;
    markAutoPredictionAttempt(gsi, profile);
    try {
      const isLive = settings.forceStreamOnline || await isBroadcasterLive();
      if (!isCurrentGsiAutomationContext(gsi)) return;
      if (!isLive) {
        logEvent('twitch', 'Auto prediction skipped: Twitch stream is offline');
      } else {
        if (settings.forceStreamOnline) {
          logEvent('twitch', 'Auto prediction stream status override is enabled');
        }
        if (await suppressAutoPredictionWhenExternalPredictionExists(gsi, profile)) return;
        if (!isCurrentGsiAutomationContext(gsi)) return;
        await createPredictionFromSettings({}, {
          automatic: true,
          profile,
          expectedContextKey: predictionOwnershipContextKey(gsi, profile),
          sourceGsi: structuredClone(gsi)
        });
      }
    } catch (error) {
      logEvent('twitch', `Auto prediction failed: ${error.message}`);
    }
  }
}

function predictionProfileForGsi(gsi) {
  return isSpectatingGsi(gsi) ? 'spectator' : 'own';
}

function predictionProfileFromMeta(meta) {
  return meta?.profile === 'spectator' ? 'spectator' : 'own';
}

function predictionSettingsForProfile(profile) {
  return profile === 'spectator'
    ? runtime.config.spectatorPredictions || runtime.config.predictions
    : runtime.config.predictions;
}

function inferPredictionResult(gsi) {
  return inferPredictionResultForMeta(runtime.state.activePredictionMeta, gsi, inferResult);
}

function predictionAutomationGsiKey(gsi) {
  const profile = predictionProfileForGsi(gsi);
  const fallbackCycle = profile === 'spectator'
    ? `spectator:${Number(gsi?.spectatorCycle || 0)}`
    : `draft:${Number(gsi?.draftCycle || 0)}`;
  const matchKey = gsi?.activeMatchId || gsi?.matchId || fallbackCycle;
  const state = String(gsi?.gameState || '');
  const eligibility = [
    state,
    String(gsi?.playerActivity || ''),
    gsi?.leftGameView === true ? 'left' : 'present',
    gsi?.heroDemoMode === true ? 'demo' : 'normal',
    gsi?.playerHeroPicked === true ? 'hero' : 'nohero',
    gsi?.ownPickPhaseEnded === true ? 'picked' : 'picking'
  ].join(':');
  return `${profile}:${matchKey}:${eligibility}`;
}

function isCurrentGsiAutomationContext(gsi) {
  return predictionAutomationGsiKey(gsi) === predictionAutomationGsiKey(runtime.state.gsi);
}

function activePredictionMatchesGsi(gsi) {
  const meta = runtime.state.activePredictionMeta;
  if (meta && !predictionMetaMatchesGsiProfile(meta, gsi)) return false;
  const metaContextKey = meta?.contextKey;
  if (metaContextKey) {
    return metaContextKey === predictionOwnershipContextKey(gsi, predictionProfileFromMeta(meta));
  }
  const predictionMatchId = runtime.state.activePredictionMatchId;
  const gsiMatchId = gsi?.activeMatchId || gsi?.matchId;
  return !predictionMatchId || !gsiMatchId || String(predictionMatchId) === String(gsiMatchId);
}

function predictionOwnershipContextKey(gsi, profile = predictionProfileForGsi(gsi)) {
  return autoPredictionKey(gsi || {}, profile);
}

function predictionMetaMatchesGsiProfile(meta, gsi) {
  return isPredictionProfileCompatibleWithActivity(
    predictionProfileFromMeta(meta),
    gsi?.playerActivity
  );
}

function matchIdCompatibleWithPredictionMeta(meta, gsi) {
  const matchId = gsi?.activeMatchId || gsi?.matchId || null;
  if (!matchId || (meta && !predictionMetaMatchesGsiProfile(meta, gsi))) return null;
  const contextKey = meta?.contextKey;
  if (!contextKey) return matchId;
  const profile = predictionProfileFromMeta(meta);
  const fallbackContextKey = profile === 'spectator'
    ? `${profile}:cycle:${Number(gsi?.spectatorCycle || 0)}`
    : `${profile}:draft:${Number(gsi?.draftCycle || 0)}`;
  const matchContextKey = `${profile}:match:${matchId}`;
  return contextKey === fallbackContextKey || contextKey === matchContextKey ? matchId : null;
}

function predictionContextMatches(expectedContextKey, gsi, profile) {
  const currentContextKey = predictionOwnershipContextKey(gsi, profile);
  if (expectedContextKey === currentContextKey) return true;
  const fallbackContextKey = profile === 'spectator'
    ? `${profile}:cycle:${Number(gsi?.spectatorCycle || 0)}`
    : `${profile}:draft:${Number(gsi?.draftCycle || 0)}`;
  return expectedContextKey === fallbackContextKey && currentContextKey.startsWith(`${profile}:match:`);
}

function shouldAutoCreatePredictionAfterPick(previous, gsi) {
  if (!gsi.playerHeroPicked || !gsi.ownPickPhaseEnded) return false;
  const state = String(gsi.gameState || '');
  return /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state);
}

function shouldAutoCreatePrediction(previous, gsi, profile) {
  if (gsi.heroDemoMode) return false;
  if (profile === 'spectator') return shouldAutoCreateSpectatorPrediction(gsi);
  return shouldAutoCreatePredictionAfterPick(previous, gsi);
}

function shouldAutoCreateSpectatorPrediction(gsi) {
  if (!isSpectatingGsi(gsi) || gsi.leftGameView) return false;
  const state = String(gsi.gameState || '');
  if (!/PRE_GAME|GAME_IN_PROGRESS/i.test(state)) return false;
  return Boolean(gsi.activeMatchId || gsi.matchId || Number.isFinite(optionalGsiNumber(gsi.clockTime)));
}

function shouldRetryAutoPrediction(gsi, profile = predictionProfileForGsi(gsi)) {
  const key = autoPredictionKey(gsi, profile);
  if (runtime.state.autoPredictionCreatedKey === key) return false;
  if (runtime.state.autoPredictionSuppressedKey === key) return false;
  const attempt = runtime.state.lastAutoPredictionAttempt;
  if (!attempt || attempt.key !== key) return true;
  const attemptedAt = Date.parse(attempt.at || '');
  return !Number.isFinite(attemptedAt) || Date.now() - attemptedAt >= autoPredictionRetryMs;
}

async function suppressAutoPredictionWhenExternalPredictionExists(gsi, profile = predictionProfileForGsi(gsi)) {
  const external = await fetchActiveTwitchPrediction();
  if (!external || isCurrentOwnedPredictionId(external.id)) return false;

  runtime.state.autoPredictionSuppressedKey = autoPredictionKey(gsi, profile);
  await persistState();
  logEvent('twitch', `Auto prediction skipped: another Twitch prediction is already active (${external.title || external.id})`);
  return true;
}

function markAutoPredictionAttempt(gsi, profile = predictionProfileForGsi(gsi)) {
  runtime.state.lastAutoPredictionAttempt = {
    key: autoPredictionKey(gsi, profile),
    profile,
    matchId: gsi.activeMatchId || gsi.matchId || null,
    draftCycle: Number(gsi.draftCycle || 0),
    at: new Date().toISOString()
  };
}

function markAutoPredictionCreated(gsi, profile = predictionProfileForGsi(gsi)) {
  runtime.state.autoPredictionCreatedKey = autoPredictionKey(gsi, profile);
}

function autoPredictionKey(gsi, profile = predictionProfileForGsi(gsi)) {
  const matchId = gsi.activeMatchId || gsi.matchId;
  if (matchId) return `${profile}:match:${matchId}`;
  if (profile === 'spectator') return `${profile}:cycle:${Number(gsi.spectatorCycle || 0)}`;
  return `${profile}:draft:${Number(gsi.draftCycle || 0)}`;
}

function migrateAutoPredictionContextKey(gsi) {
  const matchId = gsi?.activeMatchId || gsi?.matchId;
  if (!matchId) return false;
  const profile = predictionProfileForGsi(gsi);
  const fallbackKey = profile === 'spectator'
    ? `${profile}:cycle:${Number(gsi?.spectatorCycle || 0)}`
    : `${profile}:draft:${Number(gsi?.draftCycle || 0)}`;
  const matchKey = `${profile}:match:${matchId}`;
  let changed = false;
  if (runtime.state.autoPredictionCreatedKey === fallbackKey) {
    runtime.state.autoPredictionCreatedKey = matchKey;
    changed = true;
  }
  if (runtime.state.autoPredictionSuppressedKey === fallbackKey) {
    runtime.state.autoPredictionSuppressedKey = matchKey;
    changed = true;
  }
  if (runtime.state.lastAutoPredictionAttempt?.key === fallbackKey) {
    runtime.state.lastAutoPredictionAttempt = {
      ...runtime.state.lastAutoPredictionAttempt,
      key: matchKey,
      matchId
    };
    changed = true;
  }
  return changed;
}

function syncActivePredictionMatchId(gsi) {
  if (!runtime.state.activePrediction || runtime.state.activePredictionMatchId) return;
  const meta = runtime.state.activePredictionMeta;
  const matchId = matchIdCompatibleWithPredictionMeta(meta, gsi);
  if (matchId) {
    const profile = predictionProfileFromMeta(meta);
    const fallbackContextKey = profile === 'spectator'
      ? `${profile}:cycle:${Number(gsi.spectatorCycle || 0)}`
      : `${profile}:draft:${Number(gsi.draftCycle || 0)}`;
    if (meta?.contextKey === fallbackContextKey) {
      meta.contextKey = `${profile}:match:${matchId}`;
    }
    migrateAutoPredictionContextKey(gsi);
    runtime.state.activePredictionMatchId = matchId;
    rememberOwnedPrediction(runtime.state.activePrediction, runtime.state.activePredictionMeta);
    scheduleStatePersist();
  }
}

async function syncOwnedActivePredictionFromTwitch({ force = false } = {}) {
  const active = runtime.state.activePrediction;
  if (!active?.id || !['ACTIVE', 'LOCKED'].includes(active.status)) {
    return await recoverOwnedActivePredictionFromTwitch({ force }) || active || null;
  }

  const lastSync = Date.parse(runtime.state.activePredictionSyncedAt || '');
  if (!force && Number.isFinite(lastSync) && Date.now() - lastSync < activePredictionSyncMs) return active;
  runtime.state.activePredictionSyncedAt = new Date().toISOString();

  let latest;
  try {
    latest = await fetchPredictionById(active.id);
  } catch (error) {
    logEvent('twitch', `Active prediction sync failed: ${error.message}`);
    return active;
  }

  if (!isCurrentOwnedPredictionId(active.id)) {
    return runtime.state.activePrediction || null;
  }

  runtime.state.activePredictionSyncedAt = new Date().toISOString();
  if (!latest) {
    clearActivePredictionState({ keepRecovery: false });
    await persistState();
    broadcast();
    logEvent('twitch', `Our prediction disappeared on Twitch: ${active.title || active.id}`);
    return null;
  }

  const meta = runtime.state.activePredictionMeta;
  const normalized = normalizePrediction(latest, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
  if (['RESOLVED', 'CANCELED'].includes(normalized.status)) {
    clearActivePredictionState({ keepRecovery: false });
    await persistState();
    broadcast();
    logEvent('twitch', `Our prediction was ${normalized.status.toLowerCase()} outside DotaStreamKit: ${normalized.title}`);
    return null;
  }

  runtime.state.activePrediction = normalized;
  rememberOwnedPrediction(normalized, meta);
  await persistState();
  broadcast();
  return normalized;
}

async function recoverOwnedActivePredictionFromTwitch({ force = false } = {}) {
  const recovery = runtime.state.activePredictionRecovery;
  if (!recovery?.id) return null;
  const rememberedAt = Date.parse(recovery.rememberedAt || recovery.createdAt || '');
  if (Number.isFinite(rememberedAt) && Date.now() - rememberedAt > 24 * 60 * 60 * 1000) {
    clearActivePredictionState({ keepRecovery: false });
    await persistState();
    broadcast();
    return null;
  }

  const lastSync = Date.parse(runtime.state.activePredictionSyncedAt || '');
  if (!force && Number.isFinite(lastSync) && Date.now() - lastSync < activePredictionSyncMs) return null;

  let latest;
  try {
    latest = await fetchPredictionById(recovery.id);
  } catch (error) {
    runtime.state.activePredictionSyncedAt = new Date().toISOString();
    logEvent('twitch', `Owned prediction recovery check failed: ${error.message}`);
    return null;
  }

  runtime.state.activePredictionSyncedAt = new Date().toISOString();
  if (!samePredictionId(runtime.state.activePredictionRecovery, recovery.id)) return null;
  if (runtime.state.activePrediction) return runtime.state.activePrediction;
  if (!latest || !['ACTIVE', 'LOCKED'].includes(latest.status)) {
    clearActivePredictionState({ keepRecovery: false });
    await persistState();
    broadcast();
    return null;
  }

  const meta = recovery.meta || null;
  const normalized = normalizePrediction(latest, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
  runtime.state.activePrediction = normalized;
  runtime.state.activePredictionMeta = meta;
  runtime.state.activePredictionMatchId = recovery.matchId || null;
  rememberOwnedPrediction(normalized, meta);
  await persistState();
  broadcast();
  logEvent('twitch', `Recovered bot-owned prediction from Twitch: ${normalized.title}`);
  return normalized;
}

async function maybeCancelPredictionForInvalidGame(previous, gsi, expectedPredictionId = null) {
  if (expectedPredictionId && !isCurrentOwnedPredictionId(expectedPredictionId)) return false;
  let candidate = inferPredictionCancelCandidate(previous, gsi);
  if (!candidate && shouldContinueLeftGameViewCancelCandidate(runtime.state.predictionCancelCandidate, gsi)) {
    candidate = { ...runtime.state.predictionCancelCandidate };
  }
  if (!candidate) {
    clearPredictionCancelCandidate();
    return false;
  }
  candidate.predictionId = expectedPredictionId || runtime.state.activePrediction?.id || candidate.predictionId || null;
  return await applyPredictionCancelCandidate(candidate);
}

async function maybeCancelPredictionForGsiTimeout() {
  const active = runtime.state.activePrediction;
  const settings = predictionSettingsForProfile(predictionProfileFromMeta(runtime.state.activePredictionMeta));
  if (!settings.autoCancelInvalidGame || !active || !['ACTIVE', 'LOCKED'].includes(active.status)) return false;
  if (!runtime.state.gsi.activeMatchId && !runtime.state.activePredictionMatchId) return false;
  const candidate = {
    predictionId: active.id,
    reason: 'GSI stopped during an active match',
    delaySeconds: settings.autoCancelDisconnectSeconds,
    protectContested: true,
    matchId: runtime.state.activePredictionMatchId || runtime.state.gsi.activeMatchId || runtime.state.gsi.matchId || null
  };
  return await applyPredictionCancelCandidate(candidate);
}

function inferPredictionCancelCandidate(previous, gsi) {
  const active = runtime.state.activePrediction;
  if (!active) return null;

  const meta = runtime.state.activePredictionMeta;
  const profile = predictionProfileFromMeta(meta);
  const settings = predictionSettingsForProfile(profile);
  const state = String(gsi.gameState || '');
  const currentMatchId = gsi.activeMatchId || gsi.matchId || null;
  const predictionMatchId = runtime.state.activePredictionMatchId;
  const predictionContextKey = meta?.contextKey;
  if (meta && !predictionMetaMatchesGsiProfile(meta, gsi)) {
    return {
      reason: `prediction profile changed before it was closed (${profile} -> ${predictionProfileForGsi(gsi)})`,
      delaySeconds: 0,
      protectContested: true,
      matchId: predictionMatchId
    };
  }
  const currentContextKey = predictionOwnershipContextKey(gsi, profile);
  if (predictionContextKey && predictionContextKey !== currentContextKey) {
    return {
      reason: `new game context started before prediction was closed (${predictionContextKey} -> ${currentContextKey})`,
      delaySeconds: 0,
      protectContested: true,
      matchId: predictionMatchId
    };
  }
  if (predictionMatchId && currentMatchId && predictionMatchId !== currentMatchId) {
    return {
      reason: `new match started before prediction was closed (${predictionMatchId} -> ${currentMatchId})`,
      delaySeconds: 0,
      protectContested: true,
      matchId: predictionMatchId
    };
  }

  if (isLeftActiveGameViewCancelSignal(previous, gsi)) {
    return {
      kind: 'left_game_view',
      reason: 'streamer left the active game view before prediction was resolved',
      delaySeconds: leftGameViewPredictionCancelDelaySeconds,
      matchId: predictionMatchId || currentMatchId
    };
  }

  if (/DISCONNECT/i.test(state)) {
    return {
      reason: 'Dota reported disconnect during an active match',
      delaySeconds: settings.autoCancelDisconnectSeconds,
      protectContested: true,
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
  if (candidate.predictionId && !samePredictionId(active, candidate.predictionId)) return false;

  const now = Date.now();
  const existing = runtime.state.predictionCancelCandidate;
  const sameCandidate = existing
    && String(existing.predictionId || '') === String(candidate.predictionId || '')
    && existing.reason === candidate.reason
    && String(existing.matchId || '') === String(candidate.matchId || '');
  const startedAt = sameCandidate ? Date.parse(existing.since) : now;
  runtime.state.predictionCancelCandidate = {
    predictionId: candidate.predictionId || active.id,
    kind: candidate.kind || null,
    reason: candidate.reason,
    matchId: candidate.matchId || null,
    delaySeconds: candidate.delaySeconds,
    protectContested: candidate.protectContested === true,
    since: sameCandidate ? existing.since : new Date(now).toISOString()
  };
  if (!sameCandidate) {
    await persistState();
    broadcast();
  }

  const elapsedSeconds = (now - startedAt) / 1000;
  if (elapsedSeconds < candidate.delaySeconds) return false;
  if (!claimPredictionActionAttempt('cancel', active.id)) return false;

  try {
    const expectedPredictionId = active.id;
    const latestActive = await refreshActivePredictionBeforeAutomaticCancel(active, candidate);
    if (!samePredictionId(latestActive, expectedPredictionId) || !isCurrentOwnedPredictionId(expectedPredictionId)) return false;
    await twitchEndPrediction(latestActive.id, 'CANCELED');
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

async function refreshActivePredictionBeforeAutomaticCancel(active, candidate) {
  let latestActive;
  try {
    latestActive = await refreshActivePredictionFromTwitch(active);
  } catch (error) {
    logEvent('twitch', `Auto cancel skipped: could not refresh active prediction (${error.message})`);
    return null;
  }

  if (!isCurrentOwnedPredictionId(active.id)) return null;

  if (!latestActive || !['ACTIVE', 'LOCKED'].includes(latestActive.status)) {
    clearActivePredictionState({ keepRecovery: false });
    await persistState();
    broadcast();
    logEvent('twitch', 'Auto cancel skipped: active prediction is no longer active on Twitch');
    return null;
  }

  if (!candidate.protectContested) return latestActive;

  if (!hasCompletePredictionOutcomePoints(latestActive)) {
    logEvent('twitch', `Auto cancel skipped: Twitch did not return complete channel point totals for ${candidate.reason}`);
    return null;
  }

  if (hasPointsOnEveryPredictionOutcome(latestActive)) {
    clearPredictionCancelCandidate();
    await persistState();
    broadcast();
    logEvent('twitch', `Auto cancel skipped: ${candidate.reason}; prediction has channel points on every outcome`);
    return null;
  }

  return latestActive;
}

async function refreshActivePredictionFromTwitch(active) {
  if (!active?.id) return active;
  const item = await fetchPredictionById(active.id);
  if (!isCurrentOwnedPredictionId(active.id)) {
    return null;
  }
  if (!item) throw new Error('Twitch did not return the active prediction');
  const meta = runtime.state.activePredictionMeta;
  const normalized = normalizePrediction(item, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
  runtime.state.activePrediction = normalized;
  runtime.state.activePredictionSyncedAt = new Date().toISOString();
  rememberOwnedPrediction(normalized, meta);
  await persistState();
  broadcast();
  return normalized;
}

async function fetchPredictionById(id) {
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const params = new URLSearchParams({ broadcaster_id: broadcaster, id });
  const result = await twitchRequest(`/predictions?${params}`);
  return result.data?.[0] || null;
}

async function fetchActiveTwitchPrediction() {
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated');
  const params = new URLSearchParams({ broadcaster_id: broadcaster, first: '20' });
  const result = await twitchRequest(`/predictions?${params}`);
  return (result.data || []).find((item) => ['ACTIVE', 'LOCKED'].includes(item.status)) || null;
}

function clearActivePredictionState({ keepRecovery = true } = {}) {
  const clearedPredictionId = runtime.state.activePrediction?.id || runtime.state.activePredictionRecovery?.id || null;
  if (keepRecovery) {
    rememberOwnedPrediction(runtime.state.activePrediction, runtime.state.activePredictionMeta);
  } else {
    runtime.state.activePredictionRecovery = null;
  }
  runtime.state.activePrediction = null;
  runtime.state.activePredictionMatchId = null;
  runtime.state.activePredictionMeta = null;
  runtime.state.predictionCancelCandidate = null;
  runtime.state.activePredictionSyncedAt = null;
  if (clearedPredictionId) {
    for (const key of runtime.predictionActionAttempts.keys()) {
      if (key.endsWith(`:${clearedPredictionId}`)) runtime.predictionActionAttempts.delete(key);
    }
  }
}

function claimPredictionActionAttempt(action, predictionId, retryAfterMs = activePredictionSyncMs) {
  if (!predictionId) return false;
  const key = `${action}:${predictionId}`;
  const now = Date.now();
  const previous = Number(runtime.predictionActionAttempts.get(key) || 0);
  if (previous > 0 && now - previous < retryAfterMs) return false;
  runtime.predictionActionAttempts.set(key, now);
  return true;
}

function rememberOwnedPrediction(prediction, meta = runtime.state.activePredictionMeta) {
  if (!prediction?.id) return;
  runtime.state.activePredictionRecovery = {
    id: prediction.id,
    title: prediction.title || null,
    status: prediction.status || null,
    matchId: runtime.state.activePredictionMatchId || matchIdCompatibleWithPredictionMeta(meta, runtime.state.gsi),
    createdAt: prediction.createdAt || null,
    rememberedAt: new Date().toISOString(),
    meta: meta || null
  };
}

function inferResult(gsi) {
  if (!gsi.winTeam || !gsi.playerTeam) return null;
  if (!/POST_GAME/i.test(String(gsi.gameState || ''))) return null;
  return gsi.winTeam === gsi.playerTeam ? 'win' : 'lose';
}

function normalizeTeam(value) {
  const raw = String(value || '').toLowerCase();
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    if (numeric === 2) return 'radiant';
    if (numeric === 3) return 'dire';
  }
  if (raw.includes('radiant') || raw.includes('good') || raw === '2' || raw === 'team2') return 'radiant';
  if (raw.includes('dire') || raw.includes('bad') || raw === '3' || raw === 'team3') return 'dire';
  return null;
}

function normalizePlayerTeam(player) {
  const direct = normalizeTeam(player?.team_name || player?.team);
  if (direct) return direct;
  const slot = Number(player?.team_slot ?? player?.player_slot);
  if (!Number.isFinite(slot)) return null;
  if (slot >= 0 && slot < 5) return 'radiant';
  if (slot >= 5 && slot < 10) return 'dire';
  if (slot >= 128) return 'dire';
  return 'radiant';
}

function normalizeDeploymentConfig(config) {
  if (!['local', 'server'].includes(config.mode)) config.mode = 'local';
  config.publicBaseUrl = normalizeBaseUrl(config.publicBaseUrl);
}

function normalizeUiConfig(config) {
  if (!['auto', 'ru', 'en'].includes(config.language)) config.language = 'auto';
  if (!['', 'ru', 'en'].includes(config.predictionTemplateLanguage)) config.predictionTemplateLanguage = '';
}

function normalizeUpdateConfig(config) {
  config.autoCheck = true;
  if (config.autoInstallDefaultVersion !== 2) {
    config.autoInstall = true;
    config.autoInstallDefaultVersion = 2;
  }
  config.autoInstall = config.autoInstall !== false;
  if (process.platform !== 'win32') config.autoInstall = false;
}

function normalizeMatchIntelConfig(config, options = {}) {
  config.enabled = config.enabled !== false;
  config.showPlayerRanks = config.showPlayerRanks !== false;
  config.showPlayerFlags = config.showPlayerFlags === true;
  if (options.spectatorLabel) {
    config.showSpectatorGameLabel = config.showSpectatorGameLabel !== false;
    config.spectatorGameLabelTemplate = predictionTextOrDefault(config.spectatorGameLabelTemplate, 'Spectating game: {game_id}', 120);
  } else {
    delete config.showSpectatorGameLabel;
    delete config.spectatorGameLabelTemplate;
  }
  const legacyAegisRoshan = config.showAegisRoshan;
  config.showAegisTimer = config.showAegisTimer !== false && legacyAegisRoshan !== false;
  config.showRoshanTimer = config.showRoshanTimer !== false && legacyAegisRoshan !== false;
  delete config.showAegisRoshan;
  if (!['minutes', 'full_game', 'pre_game_only'].includes(config.rankDisplayMode)) config.rankDisplayMode = 'minutes';
  config.rankDisplayMinutes = clampInt(config.rankDisplayMinutes, 1, 30);
  const migrateMmrGoalSplitPositions = config.streamerMmrGoalSplitPositionsMigrated !== true;
  config.overlayPositions = normalizeOverlayPositions(config.overlayPositions, { migrateMmrGoalSplitPositions });
  config.streamerMmrGoalSplitPositionsMigrated = true;
  config.customPlayers = normalizeCustomNotablePlayers(config.customPlayers);
  normalizeStreamerStatsConfig(config);
}

function normalizeOverlayPositions(value, options = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const legacyMmrGoal = normalizeOverlayOffset(source.streamerMmrGoal);
  const menuMmrGoal = normalizeOverlayOffset(source.streamerMmrGoalMenu);
  const gameMmrGoal = normalizeOverlayOffset(source.streamerMmrGoalGame);
  const shouldMigrateMmrGoal = options.migrateMmrGoalSplitPositions === true
    && (legacyMmrGoal.x !== 0 || legacyMmrGoal.y !== 0);
  return {
    streamerStatsMenu: normalizeOverlayOffset(source.streamerStatsMenu),
    streamerStatsGame: normalizeOverlayOffset(source.streamerStatsGame),
    streamerMmrGoalMenu: shouldMigrateMmrGoal && menuMmrGoal.x === 0 && menuMmrGoal.y === 0 ? legacyMmrGoal : menuMmrGoal,
    streamerMmrGoalGame: shouldMigrateMmrGoal && gameMmrGoal.x === 0 && gameMmrGoal.y === 0 ? legacyMmrGoal : gameMmrGoal,
    streamerMmrGoal: legacyMmrGoal,
    roshanTimer: normalizeOverlayOffset(source.roshanTimer),
    predictionOverlay: normalizeOverlayOffset(source.predictionOverlay)
  };
}

function normalizeOverlayOffset(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    x: clampInt(source.x, -1920, 1920),
    y: clampInt(source.y, -1080, 1080)
  };
}

function normalizeCustomNotablePlayers(value) {
  const rows = Array.isArray(value) ? value : [];
  const byAccountId = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const accountId = normalizeAccountId(row.accountId ?? row.dotaId ?? row.id);
    if (!accountId) continue;
    byAccountId.set(String(accountId), {
      accountId,
      name: String(row.name || row.nickname || '').trim().slice(0, 40),
      countryCode: normalizeCountryCode(row.countryCode)
    });
  }
  return [...byAccountId.values()].slice(0, 50);
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
  if (serverNetworkingEnabled() && runtime.config.deployment.publicBaseUrl) {
    return runtime.config.deployment.publicBaseUrl;
  }
  return `http://localhost:${port}`;
}

function effectiveRedirectUri() {
  if (serverNetworkingEnabled() && runtime.config.deployment.publicBaseUrl) {
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

function normalizePredictionSettings(settings, defaults = defaultConfig.predictions) {
  if (!['selected', 'random'].includes(settings.selectionMode)) settings.selectionMode = 'selected';
  settings.autoCreate = settings.autoCreate === true;
  settings.forceStreamOnline = settings.forceStreamOnline === true;
  settings.autoResolve = settings.autoResolve === true;
  settings.cancelUncontestedPrediction = settings.cancelUncontestedPrediction === true;
  settings.autoCancelInvalidGame = settings.autoCancelInvalidGame !== false;
  settings.windowSeconds = normalizePredictionInt(settings.windowSeconds, 30, 1800, defaults.windowSeconds);
  settings.autoLockAtGameSeconds = normalizePredictionInt(settings.autoLockAtGameSeconds, 0, 3600, defaults.autoLockAtGameSeconds);
  settings.autoCancelDisconnectSeconds = normalizePredictionInt(settings.autoCancelDisconnectSeconds, 300, 1800, defaults.autoCancelDisconnectSeconds);
  settings.titleTemplate = predictionTextOrDefault(settings.titleTemplate, defaults.titleTemplate, 120);
  settings.winTitle = predictionTextOrDefault(settings.winTitle, defaults.winTitle, 25);
  settings.loseTitle = predictionTextOrDefault(settings.loseTitle, defaults.loseTitle, 25);
  settings.types = merge(structuredClone(defaults.types), settings.types || {});
  delete settings.types.custom_condition;
  for (const type of Object.keys(settings.types)) {
    if (!defaults.types[type]) delete settings.types[type];
  }
  settings.customTemplates = normalizeCustomPredictionTemplates(settings.customTemplates);
  const availableTypes = allPredictionTypes(settings);
  if (!availableTypes[settings.selectedType]) settings.selectedType = Object.keys(availableTypes)[0] || 'win_loss';
  for (const [type, config] of Object.entries(settings.types)) {
    config.enabled = config.enabled !== false;
    config.weight = clampInt(config.weight, 1, 100);
    if (['streamer_kills', 'streamer_deaths', 'streamer_assists', 'last_hits_by_minute', 'total_kills_by_minute', 'radiant_kills_by_minute', 'dire_kills_by_minute'].includes(type)) {
      config.min = clampInt(config.min, 0, 999);
      config.max = clampInt(config.max, config.min, 999);
    }
    if (['no_death_until', 'last_hits_by_minute', 'game_duration_at_least', 'total_kills_by_minute', 'radiant_kills_by_minute', 'dire_kills_by_minute'].includes(type)) {
      config.minMinute = clampInt(config.minMinute, 1, 180);
      config.maxMinute = clampInt(config.maxMinute, config.minMinute, 180);
    }
    const typeDefaults = defaults.types[type] || {};
    config.titleTemplate = predictionTextOrDefault(config.titleTemplate, typeDefaults.titleTemplate || '', 120);
    config.yesTitle = predictionTextOrDefault(config.yesTitle, typeDefaults.yesTitle || 'Да', 25);
    config.noTitle = predictionTextOrDefault(config.noTitle, typeDefaults.noTitle || 'Нет', 25);
  }
}

function normalizePredictionInt(value, min, max, fallback) {
  return Number.isFinite(Number(value)) ? clampInt(value, min, max) : clampInt(fallback, min, max);
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
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function resolveHeroName(hero, heroId, previous, lifecycle = {}) {
  const localized = String(hero?.localized_name || hero?.localizedName || '').trim();
  if (localized) return localized;

  const byId = dotaHeroNamesById[Number(hero?.id ?? hero?.hero_id ?? heroId)];
  if (byId) return byId;

  const rawName = String(hero?.name || '').trim();
  if (rawName) return formatHeroName(rawName);

  if (lifecycle.fallbackHeroName) return formatHeroName(lifecycle.fallbackHeroName);
  if (lifecycle.inheritPlayerState && previous?.heroName) return formatHeroName(previous.heroName);

  const previousById = lifecycle.inheritPlayerState ? dotaHeroNamesById[Number(previous?.heroId)] : null;
  return previousById || null;
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
  if (runtime.state.twitch.authenticated
    && !runtime.state.twitch.needsReconnect
    && runtime.state.twitch.targetMatchesToken !== false
    && url.searchParams.get('force') !== '1') {
    return redirect(res, '/?twitch=connected');
  }

  const state = randomBytes(16).toString('hex');
  pruneOauthStates();
  runtime.oauthStates.set(state, Date.now());
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
  pruneOauthStates();
  if (!state || !runtime.oauthStates.has(state)) return sendText(res, 'Invalid or expired OAuth state', 400);
  runtime.oauthStates.delete(state);
  if (!code) return sendText(res, 'Missing OAuth code', 400);
  if (runtime.predictionCreation) return sendText(res, 'Wait for the pending prediction creation, then connect Twitch again.', 409);
  if (runtime.twitchAuthMutation) return sendText(res, 'Another Twitch authentication change is already in progress.', 409);

  const authMutation = { id: randomBytes(12).toString('hex'), startedAt: Date.now() };
  const expectedGeneration = runtime.twitchAuthGeneration;
  runtime.twitchAuthMutation = authMutation;

  try {
    const params = new URLSearchParams({
      client_id: runtime.config.twitch.clientId,
      client_secret: runtime.config.twitch.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: effectiveRedirectUri()
    });
    const token = await fetchWithTimeout(
      `${twitchId}/token`,
      { method: 'POST', body: params },
      twitchRequestTimeoutMs,
      parseTwitchResponse
    );
    await saveToken(token, { expectedGeneration, advanceGeneration: true });
    redirect(res, '/?twitch=connected');
  } finally {
    if (runtime.twitchAuthMutation === authMutation) runtime.twitchAuthMutation = null;
  }
}

async function saveToken(token, options = {}) {
  const validation = await validateToken(token.access_token);
  if (runtime.predictionCreation && options.allowDuringPredictionCreation !== true) {
    const error = new Error('Wait for the pending prediction creation before reconnecting Twitch');
    error.statusCode = 409;
    throw error;
  }
  if (options.expectedGeneration !== undefined && options.expectedGeneration !== runtime.twitchAuthGeneration) {
    throw new Error('Twitch authentication changed while the token was refreshing');
  }
  const ownedBroadcasterId = runtime.state.activePredictionMeta?.broadcasterId
    || runtime.state.activePredictionRecovery?.meta?.broadcasterId
    || runtime.config.twitch.targetBroadcasterId
    || null;
  if (['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction?.status)
    && ownedBroadcasterId
    && String(validation.user_id || '') !== String(ownedBroadcasterId)) {
    const error = new Error('Resolve or cancel the active prediction before authenticating as a different Twitch broadcaster');
    error.statusCode = 409;
    throw error;
  }
  if (options.advanceGeneration === true) runtime.twitchAuthGeneration += 1;
  runtime.twitchLastValidatedAt = Date.now();
  const previous = runtime.state.twitchToken || {};
  runtime.state.twitchToken = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token || previous.refreshToken || null,
    clientId: runtime.config.twitch.clientId,
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
  } else if (String(runtime.config.twitch.targetChannelLogin || '').toLowerCase() === String(validation.login || '').toLowerCase()) {
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

function pruneOauthStates(now = Date.now()) {
  for (const [state, createdAt] of runtime.oauthStates) {
    if (now - Number(createdAt || 0) > oauthStateTtlMs) runtime.oauthStates.delete(state);
  }
}

function normalizeScopes(scopes) {
  if (Array.isArray(scopes)) return scopes.map(String).filter(Boolean);
  return String(scopes || '').split(/\s+/).filter(Boolean);
}

async function validateToken(accessToken) {
  const validation = await fetchWithTimeout(
    `${twitchId}/validate`,
    { headers: { Authorization: `OAuth ${accessToken}` } },
    twitchRequestTimeoutMs,
    parseTwitchResponse
  );
  if (validation.client_id && validation.client_id !== runtime.config.twitch.clientId) {
    throw new Error('Twitch token belongs to a different Client ID');
  }
  return validation;
}

async function refreshTokenIfNeeded(force = false) {
  const token = runtime.state.twitchToken;
  if (!token?.accessToken) throw new Error('Twitch is not authenticated');
  const now = Date.now();
  const expiresAt = Date.parse(token.expiresAt);
  const expiresSoon = !Number.isFinite(expiresAt) || expiresAt - now <= 60000;
  const validationDue = now - Number(runtime.twitchLastValidatedAt || 0) >= twitchValidationIntervalMs;
  if (!force && !expiresSoon && !validationDue) return token.accessToken;
  if (runtime.twitchTokenRefreshPromise) return await runtime.twitchTokenRefreshPromise;
  const authGeneration = runtime.twitchAuthGeneration;

  const request = (async () => {
    if (!force && !expiresSoon) {
      try {
        const validation = await validateToken(token.accessToken);
        if (authGeneration !== runtime.twitchAuthGeneration) {
          throw new Error('Twitch authentication changed while the token was validating');
        }
        runtime.twitchLastValidatedAt = Date.now();
        runtime.state.twitchToken = {
          ...token,
          clientId: runtime.config.twitch.clientId,
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
        return runtime.state.twitchToken.accessToken;
      } catch (error) {
        if (!isInvalidTwitchCredentialError(error)) throw error;
      }
    }

    if (!token.refreshToken) {
      const error = new Error('Twitch token expired and has no refresh token');
      error.statusCode = 401;
      error.twitchStatus = 401;
      await invalidateTwitchAuth(error, authGeneration);
      throw error;
    }
    const params = new URLSearchParams({
      client_id: runtime.config.twitch.clientId,
      client_secret: runtime.config.twitch.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken
    });
    let refreshed;
    try {
      refreshed = await fetchWithTimeout(
        `${twitchId}/token`,
        { method: 'POST', body: params },
        twitchRequestTimeoutMs,
        parseTwitchResponse
      );
    } catch (error) {
      if (isInvalidTwitchCredentialError(error)) await invalidateTwitchAuth(error, authGeneration);
      throw error;
    }
    await saveToken(refreshed, {
      expectedGeneration: authGeneration,
      allowDuringPredictionCreation: true
    });
    return runtime.state.twitchToken.accessToken;
  })();
  runtime.twitchTokenRefreshPromise = request;
  try {
    return await request;
  } finally {
    if (runtime.twitchTokenRefreshPromise === request) runtime.twitchTokenRefreshPromise = null;
  }
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

function requireTwitchTargetBroadcaster(options = {}) {
  if (!runtime.state.twitchToken?.accessToken) {
    throw new Error('Twitch is not authenticated. Connect Twitch from the dashboard.');
  }
  const target = twitchTargetChannel();
  if (!target.broadcasterId) {
    throw new Error('Target Twitch channel is not resolved. Save or resolve the streamer login first.');
  }
  if (options.allowDifferentTokenUser !== true
    && String(target.broadcasterId) !== String(runtime.state.twitchToken.broadcasterId || '')) {
    throw new Error('Predictions require OAuth from the target broadcaster. Reconnect Twitch while signed in as that channel.');
  }
  return target.broadcasterId;
}

async function twitchRequest(path, options = {}) {
  const { timeoutMs = twitchRequestTimeoutMs, ...requestOptions } = options;
  const authGeneration = runtime.twitchAuthGeneration;
  const clientId = runtime.config.twitch.clientId;
  const send = async (accessToken) => await fetchWithTimeout(`${twitchApi}${path}`, {
      ...requestOptions,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': clientId,
        'Content-Type': 'application/json',
        ...(requestOptions.headers || {})
      }
    }, timeoutMs, parseTwitchResponse);
  try {
    const result = await send(await refreshTokenIfNeeded());
    if (authGeneration !== runtime.twitchAuthGeneration) throw new Error('Twitch authentication changed during the request');
    return result;
  } catch (error) {
    if (Number(error?.twitchStatus) !== 401) throw error;
    if (authGeneration !== runtime.twitchAuthGeneration) throw error;
    let refreshedToken;
    try {
      refreshedToken = await refreshTokenIfNeeded(true);
    } catch (refreshError) {
      if (isInvalidTwitchCredentialError(refreshError)) await invalidateTwitchAuth(refreshError, authGeneration);
      throw refreshError;
    }
    try {
      const result = await send(refreshedToken);
      if (authGeneration !== runtime.twitchAuthGeneration) throw new Error('Twitch authentication changed during the retry');
      return result;
    } catch (retryError) {
      if (Number(retryError?.twitchStatus) === 401) await invalidateTwitchAuth(retryError, authGeneration);
      throw retryError;
    }
  }
}

async function parseTwitchResponse(response) {
  const text = await readResponseText(response, 2 * 1024 * 1024);
  let json = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      if (response.ok) throw new Error('Twitch returned an invalid response');
    }
  }
  if (!response.ok) {
    const message = json.message || json.error || response.statusText;
    const error = new Error(`Twitch ${response.status}: ${message}`);
    error.statusCode = response.status;
    error.twitchStatus = response.status;
    throw error;
  }
  return json;
}

function isInvalidTwitchCredentialError(error) {
  return [400, 401].includes(Number(error?.twitchStatus || error?.statusCode));
}

async function invalidateTwitchAuth(error, expectedGeneration = runtime.twitchAuthGeneration) {
  if (expectedGeneration !== runtime.twitchAuthGeneration) return;
  runtime.twitchAuthGeneration += 1;
  delete runtime.state.twitchToken;
  runtime.twitchLastValidatedAt = 0;
  resetTwitchStreamStatus();
  hydrateTwitchStatus();
  runtime.state.twitch.needsReconnect = true;
  runtime.state.twitch.authError = error?.message || 'Twitch authentication is no longer valid';
  await deleteTwitchTokenBackup();
  await persistState();
  broadcast();
}

async function twitchLogout(req, res) {
  const body = await readBody(req);
  if (runtime.twitchAuthMutation) {
    const error = new Error('Wait for the pending Twitch authentication change before logging out');
    error.statusCode = 409;
    throw error;
  }
  if (runtime.predictionCreation) {
    const error = new Error('Wait for the pending prediction creation before logging out of Twitch');
    error.statusCode = 409;
    throw error;
  }
  if (['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction?.status) && body.force !== true) {
    const error = new Error('Resolve or cancel the active prediction before logging out of Twitch');
    error.statusCode = 409;
    throw error;
  }
  rememberOwnedPrediction(runtime.state.activePrediction, runtime.state.activePredictionMeta);
  runtime.twitchAuthGeneration += 1;
  delete runtime.state.twitchToken;
  resetTwitchStreamStatus();
  hydrateTwitchStatus();
  await deleteTwitchTokenBackup();
  await persistState({ backup: false });
  await rm(`${statePath}.bak`, { force: true });
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
  const broadcaster = requireTwitchTargetBroadcaster({ allowDifferentTokenUser: true });
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
  if (runtime.twitchAuthMutation || runtime.predictionCreation || ['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction?.status)) {
    const error = new Error('Resolve or cancel the active prediction before changing the Twitch channel');
    error.statusCode = 409;
    throw error;
  }
  const body = await readBody(req);
  const login = String(body.login || runtime.config.twitch.targetChannelLogin || '').trim().replace(/^@/, '').toLowerCase();
  if (!login) return sendJson(res, { error: 'Streamer login is required' }, 400);
  const authGeneration = runtime.twitchAuthGeneration;
  const user = await resolveTwitchUserByLogin(login);
  if (runtime.twitchAuthMutation
    || runtime.predictionCreation
    || authGeneration !== runtime.twitchAuthGeneration
    || ['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction?.status)) {
    const error = new Error('A prediction started while the Twitch channel was being resolved; channel was not changed');
    error.statusCode = 409;
    throw error;
  }
  runtime.twitchAuthGeneration += 1;
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

  const pending = runtime.twitchStreamStatusPromise;
  if (pending?.broadcasterId === broadcaster) return await pending.promise;

  const request = (async () => {
    const result = await twitchRequest(`/streams?user_id=${encodeURIComponent(broadcaster)}&first=1`);
    if (String(twitchTargetChannel().broadcasterId || '') !== String(broadcaster)) return null;
    const stream = (result.data || []).find((item) => String(item.user_id) === String(broadcaster) && item.type === 'live') || null;
    runtime.twitchStreamStatus = {
      broadcasterId: broadcaster,
      checkedAt: Date.now(),
      isLive: Boolean(stream),
      streamId: stream?.id || null,
      gameName: stream?.game_name || null,
      title: stream?.title || null
    };
    hydrateTwitchStatus();
    syncStreamerSessionPresence();
    await persistState();
    broadcast();
    return runtime.twitchStreamStatus.isLive;
  })();
  runtime.twitchStreamStatusPromise = { broadcasterId: broadcaster, promise: request };
  try {
    return await request;
  } finally {
    if (runtime.twitchStreamStatusPromise?.promise === request) runtime.twitchStreamStatusPromise = null;
  }
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
  if (runtime.twitchAuthMutation) {
    const error = new Error('Wait for the pending Twitch authentication change before creating a prediction');
    error.statusCode = 409;
    throw error;
  }
  if (runtime.predictionCreation) {
    const error = new Error('A Twitch prediction creation request is already in progress');
    error.statusCode = 409;
    throw error;
  }
  const creation = { id: randomBytes(12).toString('hex'), startedAt: Date.now() };
  runtime.predictionCreation = creation;
  try {
    return await createPredictionFromSettingsUnlocked(overrides, options);
  } finally {
    if (runtime.predictionCreation === creation) runtime.predictionCreation = null;
  }
}

async function createPredictionFromSettingsUnlocked(overrides = {}, options = {}) {
  const profile = options.profile || (overrides.profile === 'spectator' ? 'spectator' : predictionProfileForGsi(runtime.state.gsi));
  const settings = predictionSettingsForProfile(profile);
  const sourceGsi = structuredClone(options.sourceGsi || runtime.state.gsi);
  const sourceMatchId = sourceGsi.activeMatchId || sourceGsi.matchId || null;
  const sourceContextKey = predictionOwnershipContextKey(sourceGsi, profile);
  const bindContext = options.automatic || /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(String(sourceGsi.gameState || ''));
  const authGeneration = runtime.twitchAuthGeneration;
  if (runtime.state.gsi?.heroDemoMode) {
    throw new Error('Predictions are disabled in Demo Hero mode');
  }
  await syncOwnedActivePredictionFromTwitch({ force: true });
  if (options.expectedContextKey
    && !predictionContextMatches(options.expectedContextKey, runtime.state.gsi, profile)) {
    throw new Error('Game changed before the automatic prediction could be created');
  }
  if (options.automatic && !shouldAutoCreatePrediction(runtime.state.gsi, runtime.state.gsi, profile)) {
    throw new Error('The game is no longer eligible for an automatic prediction');
  }
  if (runtime.state.activePrediction && ['ACTIVE', 'LOCKED'].includes(runtime.state.activePrediction.status)) {
    throw new Error('A prediction is already active or locked');
  }
  const broadcaster = requireTwitchTargetBroadcaster();
  if (!broadcaster) throw new Error('Twitch is not authenticated. Connect Twitch from the dashboard.');
  if (options.automatic && (
    authGeneration !== runtime.twitchAuthGeneration
    || predictionSettingsForProfile(profile).autoCreate !== true
  )) {
    throw new Error('Automatic prediction settings or Twitch authentication changed before creation');
  }
  const draft = buildPredictionDraft(overrides, settings, profile);
  const compatibleCurrentContextKey = options.expectedContextKey
    && predictionContextMatches(options.expectedContextKey, runtime.state.gsi, profile)
    ? predictionOwnershipContextKey(runtime.state.gsi, profile)
    : sourceContextKey;
  const compatibleCurrentMatchId = runtime.state.gsi.activeMatchId || runtime.state.gsi.matchId || sourceMatchId;
  const predictionWindow = clampInt(overrides.windowSeconds ?? settings.windowSeconds, 30, 1800);
  draft.meta.predictionWindowSeconds = predictionWindow;
  draft.meta.profile = profile;
  draft.meta.broadcasterId = broadcaster;
  draft.meta.contextKey = bindContext ? compatibleCurrentContextKey : null;
  const body = {
    broadcaster_id: broadcaster,
    title: draft.title,
    outcomes: [{ title: draft.yesTitle }, { title: draft.noTitle }],
    prediction_window: predictionWindow
  };
  const result = await twitchRequest('/predictions', { method: 'POST', body: JSON.stringify(body) });
  const item = result.data?.[0];
  if (!item) throw new Error('Twitch did not return a prediction');
  const staleAutomaticContext = options.automatic && (
    !predictionContextMatches(options.expectedContextKey, runtime.state.gsi, profile)
    || !shouldAutoCreatePrediction(runtime.state.gsi, runtime.state.gsi, profile)
    || authGeneration !== runtime.twitchAuthGeneration
    || predictionSettingsForProfile(profile).autoCreate !== true
    || String(twitchTargetChannel().broadcasterId || '') !== String(broadcaster)
  );
  runtime.state.activePredictionMeta = draft.meta;
  const responseContextMatches = predictionContextMatches(options.expectedContextKey || sourceContextKey, runtime.state.gsi, profile);
  if (bindContext && responseContextMatches) {
    runtime.state.activePredictionMeta.contextKey = predictionOwnershipContextKey(runtime.state.gsi, profile);
  }
  runtime.state.activePrediction = normalizePrediction(item, draft.yesTitle, draft.noTitle, draft.meta);
  runtime.state.activePredictionMatchId = responseContextMatches
    ? (runtime.state.gsi.activeMatchId || runtime.state.gsi.matchId || compatibleCurrentMatchId)
    : compatibleCurrentMatchId;
  rememberOwnedPrediction(runtime.state.activePrediction, draft.meta);
  runtime.state.predictionCancelCandidate = null;
  runtime.state.activePredictionSyncedAt = new Date().toISOString();
  await persistState();
  logEvent('twitch', `Prediction created: ${draft.title}`);
  broadcast();
  if (staleAutomaticContext) {
    logEvent('twitch', 'Automatic prediction became stale while Twitch was creating it; canceling it');
    try {
      await twitchEndPrediction(item.id, 'CANCELED');
    } catch (error) {
      logEvent('twitch', `Stale automatic prediction could not be canceled: ${error.message}`);
    }
    throw new Error('Game or Twitch settings changed while the automatic prediction was being created');
  }
  if (options.automatic) {
    markAutoPredictionCreated(responseContextMatches ? runtime.state.gsi : sourceGsi, profile);
    await persistState();
  }
  return runtime.state.activePrediction;
}

function buildPredictionDraft(overrides = {}, settings = runtime.config.predictions, profile = 'own') {
  if (overrides.title) {
    const yesTitle = String(overrides.winTitle || settings.winTitle || 'Да').slice(0, 25);
    const noTitle = String(overrides.loseTitle || settings.loseTitle || 'Нет').slice(0, 25);
    return {
      title: String(overrides.title).slice(0, 45),
      yesTitle,
      noTitle,
      meta: {
        type: 'manual',
        profile,
        variables: predictionVariables(),
        outcomes: { yesTitle, noTitle }
      }
    };
  }

  const type = choosePredictionType(settings);
  const allTypes = allPredictionTypes(settings);
  const typeConfig = allTypes[type] || allTypes[Object.keys(allTypes)[0]] || defaultConfig.predictions.types.win_loss;
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
      profile,
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
  if (!enabled.length) return Object.keys(types)[0] || 'win_loss';
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
  const players = runtime.state.matchIntel?.players || [];
  const radiantPlayers = players.filter((player) => player.team === 'radiant').sort((left, right) => Number(left.slot) - Number(right.slot));
  const direPlayers = players.filter((player) => player.team === 'dire').sort((left, right) => Number(left.slot) - Number(right.slot));
  const radiantHeroes = teamHeroList(radiantPlayers);
  const direHeroes = teamHeroList(direPlayers);
  const hero = formatHeroName(gsi.heroName || gsi.heroId || 'hero');
  const variables = {
    hero,
    hero_raw: gsi.heroName || '',
    hero_id: gsi.heroId || '',
    match_id: gsi.activeMatchId || gsi.matchId || '',
    radiant_team: gsi.radiantTeamName || 'Radiant',
    dire_team: gsi.direTeamName || 'Dire',
    winning_team: gsi.winTeam === 'radiant'
      ? (gsi.radiantTeamName || 'Radiant')
      : gsi.winTeam === 'dire'
        ? (gsi.direTeamName || 'Dire')
        : '',
    radiant_heroes: radiantHeroes || 'Radiant heroes',
    dire_heroes: direHeroes || 'Dire heroes',
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
    radiant_kills: gsi.radiantKills ?? 0,
    radiant_deaths: gsi.radiantDeaths ?? 0,
    radiant_assists: gsi.radiantAssists ?? 0,
    dire_kills: gsi.direKills ?? 0,
    dire_deaths: gsi.direDeaths ?? 0,
    dire_assists: gsi.direAssists ?? 0,
    total_kills: gsi.totalKills ?? 0,
    total_deaths: gsi.totalDeaths ?? 0,
    total_assists: gsi.totalAssists ?? 0,
    team: gsi.playerTeam || '',
    type: extra.type || ''
  };
  addTeamSlotVariables(variables, 'radiant', radiantPlayers);
  addTeamSlotVariables(variables, 'dire', direPlayers);
  return variables;
}

function teamHeroList(players) {
  return players
    .map((player) => player?.hero ? formatHeroName(player.hero) : '')
    .filter(Boolean)
    .join(', ');
}

function addTeamSlotVariables(variables, team, players) {
  for (let index = 0; index < 5; index += 1) {
    const player = players[index] || null;
    const number = index + 1;
    variables[`${team}_hero_${number}`] = player?.hero ? formatHeroName(player.hero) : '';
    variables[`${team}_player_${number}`] = player?.name || '';
    variables[`${team}_account_${number}`] = player?.accountId || '';
  }
}

function renderTemplate(template, variables) {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => variables[key] ?? '');
}

function formatHeroName(value) {
  const text = String(value || '').trim();
  if (dotaHeroNamesById[Number(text)]) return dotaHeroNamesById[Number(text)];
  if (dotaHeroNamesByNpc[text]) return dotaHeroNamesByNpc[text];
  const raw = text.replace(/^npc_dota_hero_/, '').replace(/_/g, ' ').trim();
  if (!raw) return 'hero';
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

async function refreshActivePredictionApi(res) {
  const active = runtime.state.activePrediction;
  if (active?.id && ['ACTIVE', 'LOCKED'].includes(active.status)) {
    await syncOwnedActivePredictionFromTwitch({ force: true });
  }
  sendJson(res, publicState());
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
  let result;
  try {
    result = await twitchRequest(`/predictions?${params}`, { method: 'PATCH' });
  } catch (error) {
    if (isCurrentOwnedPredictionId(id) && isMissingTwitchPredictionError(error)) {
      const title = runtime.state.activePrediction?.title || id;
      clearActivePredictionState({ keepRecovery: false });
      await persistState();
      broadcast();
      logEvent('twitch', `Our prediction no longer exists on Twitch: ${title}`);
    }
    throw error;
  }
  const item = result.data?.[0];
  if (item) {
    if (!isCurrentOwnedPredictionId(id)) return result;
    const meta = runtime.state.activePredictionMeta;
    runtime.state.activePrediction = normalizePrediction(item, meta?.outcomes?.yesTitle, meta?.outcomes?.noTitle, meta);
    if (['RESOLVED', 'CANCELED'].includes(item.status)) {
      clearActivePredictionState({ keepRecovery: false });
    } else {
      runtime.state.activePredictionSyncedAt = new Date().toISOString();
      rememberOwnedPrediction(runtime.state.activePrediction, meta);
    }
    await persistState();
    broadcast();
  }
  return result;
}

function isCurrentOwnedPredictionId(id) {
  return samePredictionId(runtime.state.activePrediction, id);
}

function samePredictionId(prediction, id) {
  return Boolean(prediction?.id) && String(prediction.id) === String(id);
}

function isMissingTwitchPredictionError(error) {
  return /Twitch 404|not found|does not exist/i.test(String(error?.message || ''));
}

function normalizePrediction(item, yesTitle = runtime.config.predictions.winTitle, noTitle = runtime.config.predictions.loseTitle, meta = null) {
  const settings = predictionSettingsForProfile(predictionProfileFromMeta(meta));
  const predictionWindowSeconds = clampInt(
    item.prediction_window ?? item.predictionWindow ?? meta?.predictionWindowSeconds ?? meta?.windowSeconds ?? settings.windowSeconds,
    30,
    1800
  );
  return {
    id: item.id,
    title: item.title,
    status: item.status,
    createdAt: item.created_at,
    lockedAt: item.locked_at,
    predictionWindowSeconds,
    profile: predictionProfileFromMeta(meta),
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

  const commonDotaPaths = process.platform === 'win32'
    ? [
        'C:\\SteamLibrary\\steamapps\\common\\dota 2 beta',
        'D:\\SteamLibrary\\steamapps\\common\\dota 2 beta',
        'C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta',
        'C:\\Program Files\\Steam\\steamapps\\common\\dota 2 beta'
      ]
    : platformSteamPaths().map((steamPath) => join(steamPath, 'steamapps', 'common', 'dota 2 beta'));

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

  const fallbacks = process.platform === 'win32'
    ? ['C:\\SteamLibrary', 'D:\\SteamLibrary', 'C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam']
    : platformSteamPaths();
  for (const fallback of fallbacks) {
    roots.add(normalize(fallback));
  }

  return Array.from(roots);
}

async function findSteamInstallPaths() {
  const paths = new Set();
  if (process.platform !== 'win32') {
    for (const path of platformSteamPaths()) paths.add(normalize(path));
    return Array.from(paths);
  }
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

async function refreshInstalledGsiConfig() {
  const cfgDir = String(runtime.config.dota?.cfgDir || '').trim();
  if (!cfgDir || !runtime.config.dota?.gsiToken) return;
  const cfgPath = join(cfgDir, 'gamestate_integration_dotastreamkit.cfg');
  if (!await pathExists(cfgPath)) return;
  try {
    await writeFile(cfgPath, makeGsiConfig(), 'utf8');
  } catch (error) {
    console.warn(`Could not refresh Dota GSI config: ${error.message}`);
  }
}

function platformSteamPaths() {
  const home = homedir();
  if (process.platform === 'darwin') {
    return [join(home, 'Library', 'Application Support', 'Steam')];
  }
  return [
    join(home, '.steam', 'steam'),
    join(home, '.steam', 'debian-installation'),
    join(home, '.local', 'share', 'Steam'),
    join(home, '.var', 'app', 'com.valvesoftware.Steam', '.local', 'share', 'Steam')
  ];
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
  "auth"
  {
    "token" "${runtime.config.dota.gsiToken}"
  }
  "data"
  {
    "provider" "1"
    "map" "1"
    "player" "1"
    "hero" "1"
    "items" "1"
    "allplayers" "1"
    "draft" "1"
    "events" "1"
  }
}
`;
}
