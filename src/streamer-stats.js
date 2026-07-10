export const streamOfflineGraceMs = 2 * 60 * 60 * 1000;

export const rankMedalThresholds = [
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

export const calibrationMedal = { medal: 'calibration', name: 'Calibration', minMmr: 0, starStep: 0, stars: 0 };

export function repairMojibakeText(value) {
  const original = String(value || '').trim();
  if (!original) return '';
  const candidates = [
    original,
    decodeLatin1Utf8(original),
    decodeWindows1251Utf8(original)
  ].filter(Boolean);
  return candidates.reduce((best, candidate) => (
    mojibakeScore(candidate) < mojibakeScore(best) ? candidate : best
  ), original);
}

export function normalizeStreamerStatsConfig(config) {
  config.showStreamerStats = config.showStreamerStats === true;
  config.showStreamerRankMedal = config.showStreamerRankMedal !== false;
  config.showStreamerMmr = config.showStreamerMmr !== false;
  config.showStreamerWinLoss = config.showStreamerWinLoss !== false;
  if (!['left', 'right', 'bottom', 'top'].includes(config.streamerWinLossPosition)) config.streamerWinLossPosition = 'left';
  if (!['left', 'right', 'bottom', 'top'].includes(config.streamerWinLossMenuPosition)) config.streamerWinLossMenuPosition = config.streamerWinLossPosition;
  if (!['left', 'right', 'bottom', 'top'].includes(config.streamerWinLossGamePosition)) config.streamerWinLossGamePosition = config.streamerWinLossPosition;
  config.hideStreamerStatsDuringDraft = config.hideStreamerStatsDuringDraft !== false;
  config.showStreamerMmrGoal = config.showStreamerMmrGoal !== false;
  config.showStreamerMmrGoalInMenu = config.showStreamerMmrGoalInMenu !== false;
  config.showStreamerMmrGoalDuringDraft = config.showStreamerMmrGoalDuringDraft !== false;
  config.showStreamerMmrGoalInGame = config.showStreamerMmrGoalInGame !== false;
  config.showStreamerMmrGoalProgress = config.showStreamerMmrGoalProgress !== false;
  config.showStreamerMmrGoalCurrent = config.showStreamerMmrGoalCurrent !== false;
  config.showStreamerMmrGoalStart = config.showStreamerMmrGoalStart === true;
  config.showStreamerMmrGoalTarget = config.showStreamerMmrGoalTarget !== false;
  config.showStreamerMmrGoalRecord = config.showStreamerMmrGoalRecord !== false;
  config.showStreamerMmrGoalWinRate = config.showStreamerMmrGoalWinRate !== false;
  config.showStreamerMmrGoalEta = config.showStreamerMmrGoalEta !== false;
  config.showStreamerMmrGoalDelta = config.showStreamerMmrGoalDelta !== false;
  config.showStreamerMmrGoalBackground = config.showStreamerMmrGoalBackground !== false;
  config.streamerMmrGoalTemplate = normalizeGoalTemplate(config.streamerMmrGoalTemplate);
  config.streamerMmrGoalFillStart = normalizeGoalColor(config.streamerMmrGoalFillStart, '#63c9ff');
  config.streamerMmrGoalFillEnd = normalizeGoalColor(config.streamerMmrGoalFillEnd, '#8df0a1');
  config.streamerMmrGoalTrack = normalizeGoalColor(config.streamerMmrGoalTrack, '#101720');
  config.streamerMmrGoalAccent = normalizeGoalColor(config.streamerMmrGoalAccent, '#ffdf91');
  config.streamerMmrGoalText = normalizeGoalColor(config.streamerMmrGoalText, '#f8f1df');
  config.streamerMmrGoalBarHeight = clampInt(config.streamerMmrGoalBarHeight, 8, 64, 13);
  config.streamerMmrGoalBarRadius = clampInt(config.streamerMmrGoalBarRadius, 0, 40, 7);
  config.streamerMmrGoalGlow = clampInt(config.streamerMmrGoalGlow, 0, 30, 12);
  config.streamerMmrGoalAnimationSpeed = clampNumber(config.streamerMmrGoalAnimationSpeed, 0.25, 3, 1);
  config.streamerMmrGoalPaddingTop = clampInt(config.streamerMmrGoalPaddingTop, 0, 48, 10);
  config.streamerMmrGoalPaddingRight = clampInt(config.streamerMmrGoalPaddingRight, 0, 48, 10);
  config.streamerMmrGoalPaddingBottom = clampInt(config.streamerMmrGoalPaddingBottom, 0, 48, 10);
  config.streamerMmrGoalPaddingLeft = clampInt(config.streamerMmrGoalPaddingLeft, 0, 48, 10);
  config.streamerMmrGoalAnimated = config.streamerMmrGoalAnimated !== false;
  config.streamerMmrGoalStartPrefix = normalizeGoalTextPart(config.streamerMmrGoalStartPrefix, '');
  config.streamerMmrGoalStartSuffix = normalizeGoalTextPart(config.streamerMmrGoalStartSuffix, ' → ');
  config.streamerMmrGoalCurrentPrefix = normalizeGoalTextPart(config.streamerMmrGoalCurrentPrefix, '');
  config.streamerMmrGoalCurrentSuffix = normalizeGoalTextPart(config.streamerMmrGoalCurrentSuffix, '');
  config.streamerMmrGoalTargetPrefix = normalizeGoalTextPart(config.streamerMmrGoalTargetPrefix, '/ ');
  config.streamerMmrGoalTargetSuffix = normalizeGoalTextPart(config.streamerMmrGoalTargetSuffix, '');
  config.streamerMmrGoalDeltaPrefix = normalizeGoalTextPart(config.streamerMmrGoalDeltaPrefix, '+');
  config.streamerMmrGoalDeltaSuffix = normalizeGoalTextPart(config.streamerMmrGoalDeltaSuffix, '');
  config.streamerMmrGoalCustomCss = normalizeGoalCustomCss(config.streamerMmrGoalCustomCss);
  config.autoUpdateStreamerMmr = config.autoUpdateStreamerMmr !== false;
  config.menuMmrOcrEnabled = config.menuMmrOcrEnabled === true;
  config.menuMmrOcrRegion = normalizeMenuMmrOcrRegion(config.menuMmrOcrRegion);
  config.autoBindStreamerAccounts = true;
  if (!['auto', 'account', 'mmr'].includes(config.streamerMedalSource)) config.streamerMedalSource = 'auto';
  config.streamerMmr = clampInt(config.streamerMmr, 0, 99999, 0);
  config.streamerGoalMmr = clampInt(config.streamerGoalMmr, 0, 99999, 0);
  config.streamerGoalStartMmr = clampInt(config.streamerGoalStartMmr, 0, 99999, 0);
  config.streamerMmrWinDelta = clampInt(config.streamerMmrWinDelta, 0, 200, 25);
  config.streamerMmrLossDelta = clampInt(config.streamerMmrLossDelta, 0, 200, 25);
  config.streamerAccounts = normalizeStreamerAccounts(config.streamerAccounts, config.streamerMmr);
}

export function normalizeStreamerStatsState(value) {
  const state = value && typeof value === 'object' ? value : {};
  return {
    wins: clampInt(state.wins, 0, 10000, 0),
    losses: clampInt(state.losses, 0, 10000, 0),
    sessionStartedAt: stringOrNull(state.sessionStartedAt),
    offlineSince: stringOrNull(state.offlineSince),
    lastMatchId: stringOrNull(state.lastMatchId),
    lastResult: ['win', 'lose'].includes(state.lastResult) ? state.lastResult : null,
    lastMmrChange: Number.isFinite(Number(state.lastMmrChange)) ? Math.trunc(Number(state.lastMmrChange)) : 0,
    lastResultAt: stringOrNull(state.lastResultAt),
    streamerAccountId: normalizePositiveInt(state.streamerAccountId),
    lastStreamerAccountId: normalizePositiveInt(state.lastStreamerAccountId ?? state.streamerAccountId),
    accountRankTier: normalizePositiveInt(state.accountRankTier),
    accountLeaderboardRank: normalizePositiveInt(state.accountLeaderboardRank),
    accountRankCheckedAt: stringOrNull(state.accountRankCheckedAt),
    accountSessions: normalizeAccountSessions(state.accountSessions),
    accountGoalRecords: normalizeAccountGoalRecords(state.accountGoalRecords ?? state.accountSessions),
    previousSession: normalizePreviousSession(state.previousSession)
  };
}

export function rankMedalFromMmr(mmr) {
  if (mmr === null || mmr === undefined || mmr === '') return null;
  const value = Number(mmr);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value <= 0) return { ...calibrationMedal };
  let current = rankMedalThresholds[1];
  for (const threshold of rankMedalThresholds.slice(1)) {
    if (value >= threshold.minMmr) current = threshold;
  }
  return { ...current, stars: starsFromMmr(value, current) };
}

export function rankMedalFromRankTier(rankTier) {
  const tier = Number(rankTier);
  if (!Number.isFinite(tier) || tier <= 0) return null;
  const medal = Math.min(8, Math.max(1, Math.trunc(tier / 10)));
  const stars = medal >= 8 ? 0 : clampInt(tier % 10 || 1, 1, 5, 1);
  const threshold = rankMedalThresholds.find((item) => item.medal === medal);
  return threshold ? { ...threshold, stars } : null;
}

export function selectStreamerMedal({ source, accountRankTier, mmr }) {
  const fromAccount = rankMedalFromRankTier(accountRankTier);
  const fromMmr = rankMedalFromMmr(mmr);
  if (source === 'account') return fromAccount;
  if (source === 'mmr') return fromMmr;
  return fromAccount || fromMmr;
}

export function applyStreamerMatchResult(state, config, result, matchId, now = new Date()) {
  if (!config?.showStreamerStats || !['win', 'lose'].includes(result) || !matchId) {
    return { state, config, changed: false, configChanged: false };
  }
  if (String(state?.lastMatchId || '') === String(matchId)) {
    return { state, config, changed: false, configChanged: false };
  }

  const nextState = normalizeStreamerStatsState(state);
  const nextConfig = { ...config };
  const iso = now.toISOString();
  nextState.sessionStartedAt ||= iso;
  nextState.lastMatchId = String(matchId);
  nextState.lastResult = result;
  nextState.lastResultAt = iso;
  nextState.lastMmrChange = 0;
  if (result === 'win') nextState.wins += 1;
  if (result === 'lose') nextState.losses += 1;
  const streamerAccountId = normalizePositiveInt(nextState.streamerAccountId);
  if (streamerAccountId) {
    const accountKey = String(streamerAccountId);
    const accountSession = normalizeAccountSession(nextState.accountSessions[accountKey]);
    accountSession.accountId = streamerAccountId;
    accountSession.sessionStartedAt ||= nextState.sessionStartedAt || iso;
    accountSession.lastMatchId = String(matchId);
    accountSession.lastResult = result;
    accountSession.lastResultAt = iso;
    if (result === 'win') accountSession.wins += 1;
    if (result === 'lose') accountSession.losses += 1;
    nextState.accountSessions[accountKey] = accountSession;

    const goalRecord = normalizeAccountGoalRecord(nextState.accountGoalRecords[accountKey]);
    goalRecord.accountId = streamerAccountId;
    if (result === 'win') goalRecord.wins += 1;
    if (result === 'lose') goalRecord.losses += 1;
    goalRecord.lastMatchId = String(matchId);
    goalRecord.lastResult = result;
    goalRecord.lastResultAt = iso;
    nextState.accountGoalRecords[accountKey] = goalRecord;
  }

  let configChanged = false;
  const activeMmrTarget = activeAccountMmrTarget(nextConfig, streamerAccountId);
  if (nextConfig.autoUpdateStreamerMmr !== false && activeMmrTarget.mmr > 0) {
    const previousMmr = activeMmrTarget.mmr;
    const delta = result === 'win'
      ? Math.max(0, Math.trunc(Number(nextConfig.streamerMmrWinDelta) || 25))
      : -Math.max(0, Math.trunc(Number(nextConfig.streamerMmrLossDelta) || 25));
    const nextMmr = clampInt(previousMmr + delta, 1, 99999, 1);
    if (activeMmrTarget.accountIndex >= 0) {
      nextConfig.streamerAccounts = [...(nextConfig.streamerAccounts || [])];
      nextConfig.streamerAccounts[activeMmrTarget.accountIndex] = {
        ...nextConfig.streamerAccounts[activeMmrTarget.accountIndex],
        mmr: nextMmr
      };
    } else {
      nextConfig.streamerMmr = nextMmr;
    }
    nextState.lastMmrChange = nextMmr - previousMmr;
    configChanged = nextMmr !== previousMmr;
  }

  return { state: nextState, config: nextConfig, changed: true, configChanged };
}

export function updateStreamerSessionPresence(state, effectiveOnline, now = new Date(), graceMs = streamOfflineGraceMs) {
  const next = normalizeStreamerStatsState(state);
  const completedMatchId = next.lastMatchId;
  const timestamp = now.getTime();
  const iso = now.toISOString();

  if (effectiveOnline === true) {
    next.sessionStartedAt ||= iso;
    next.offlineSince = null;
    return { state: next, changed: JSON.stringify(next) !== JSON.stringify(state || {}) };
  }

  if (effectiveOnline !== false) {
    return { state: next, changed: JSON.stringify(next) !== JSON.stringify(state || {}) };
  }

  if (!next.offlineSince) {
    next.offlineSince = iso;
    return { state: next, changed: true };
  }

  const offlineAt = Date.parse(next.offlineSince);
  if (!Number.isFinite(offlineAt) || timestamp - offlineAt < graceMs) {
    return { state: next, changed: JSON.stringify(next) !== JSON.stringify(state || {}) };
  }

  if (next.wins > 0 || next.losses > 0 || next.sessionStartedAt) {
    next.previousSession = {
      wins: next.wins,
      losses: next.losses,
      accountSessions: next.accountSessions,
      sessionStartedAt: next.sessionStartedAt,
      sessionEndedAt: next.offlineSince,
      archivedAt: iso,
      lastMatchId: next.lastMatchId,
      lastResult: next.lastResult
    };
  }
  next.wins = 0;
  next.losses = 0;
  next.accountSessions = {};
  next.sessionStartedAt = null;
  next.offlineSince = iso;
  // The same POST_GAME payload may keep arriving while the stream is offline.
  // Preserve it as a dedupe barrier across the automatic session reset.
  next.lastMatchId = completedMatchId;
  next.lastResult = null;
  next.lastMmrChange = 0;
  next.lastResultAt = null;
  return { state: next, changed: true };
}

export function restorePreviousStreamerSession(state, now = new Date()) {
  const next = normalizeStreamerStatsState(state);
  if (!next.previousSession) return { state: next, changed: false };
  const previous = next.previousSession;
  next.wins = previous.wins;
  next.losses = previous.losses;
  next.accountSessions = normalizeAccountSessions(previous.accountSessions);
  next.sessionStartedAt = previous.sessionStartedAt || now.toISOString();
  next.lastMatchId = previous.lastMatchId || null;
  next.lastResult = previous.lastResult || null;
  next.offlineSince = null;
  next.previousSession = null;
  return { state: next, changed: true };
}

export function resetStreamerSession(state, now = new Date()) {
  const next = normalizeStreamerStatsState(state);
  const completedMatchId = next.lastMatchId;
  if (next.wins > 0 || next.losses > 0 || next.sessionStartedAt) {
    next.previousSession = {
      wins: next.wins,
      losses: next.losses,
      accountSessions: next.accountSessions,
      sessionStartedAt: next.sessionStartedAt,
      sessionEndedAt: now.toISOString(),
      archivedAt: now.toISOString(),
      lastMatchId: next.lastMatchId,
      lastResult: next.lastResult
    };
  }
  next.wins = 0;
  next.losses = 0;
  next.accountSessions = {};
  next.sessionStartedAt = now.toISOString();
  next.offlineSince = null;
  // Keep the last completed match as a dedupe barrier. Dota can continue sending
  // the same POST_GAME snapshot after the user resets W-L.
  next.lastMatchId = completedMatchId;
  next.lastResult = null;
  next.lastMmrChange = 0;
  next.lastResultAt = null;
  return { state: next, changed: true };
}

export function resetStreamerGoalRecord(state, accountId) {
  const next = normalizeStreamerStatsState(state);
  const targetAccountId = normalizePositiveInt(accountId ?? next.streamerAccountId);
  if (!targetAccountId) return { state: next, changed: false };
  const key = String(targetAccountId);
  const hadRecord = Boolean(next.accountGoalRecords[key]);
  delete next.accountGoalRecords[key];
  return { state: next, changed: hadRecord };
}

function normalizePreviousSession(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    wins: clampInt(value.wins, 0, 10000, 0),
    losses: clampInt(value.losses, 0, 10000, 0),
    accountSessions: normalizeAccountSessions(value.accountSessions),
    sessionStartedAt: stringOrNull(value.sessionStartedAt),
    sessionEndedAt: stringOrNull(value.sessionEndedAt),
    archivedAt: stringOrNull(value.archivedAt),
    lastMatchId: stringOrNull(value.lastMatchId),
    lastResult: ['win', 'lose'].includes(value.lastResult) ? value.lastResult : null
  };
}

function starsFromMmr(mmr, medal) {
  if (!medal?.starStep || medal.medal <= 0 || medal.medal >= 8) return 0;
  return clampInt(Math.floor((Number(mmr) - medal.minMmr) / medal.starStep) + 1, 1, 5, 1);
}

function normalizePositiveInt(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : null;
}

function normalizeStreamerAccounts(value, fallbackMmr = 0) {
  const rows = Array.isArray(value) ? value : [];
  const byAccountId = new Map();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const accountId = normalizePositiveInt(row.accountId ?? row.dotaId ?? row.id);
    if (!accountId) continue;
    const mmr = row.mmr === undefined || row.mmr === null || row.mmr === ''
      ? clampInt(fallbackMmr, 0, 99999, 0)
      : clampInt(row.mmr, 0, 99999, 0);
    const goalMmr = clampInt(row.goalMmr ?? row.targetMmr, 0, 99999, 0);
    const rawGoalStartMmr = clampInt(row.goalStartMmr ?? row.goalBaseMmr, 0, 99999, 0);
    byAccountId.set(String(accountId), {
      accountId,
      label: repairMojibakeText(row.label || row.name || '').slice(0, 40),
      mmr,
      goalMmr,
      goalStartMmr: rawGoalStartMmr === mmr ? 0 : rawGoalStartMmr,
      boundAt: stringOrNull(row.boundAt)
    });
  }
  return [...byAccountId.values()].slice(0, 20);
}

function normalizeAccountSessions(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sessions = {};
  for (const [key, row] of Object.entries(source)) {
    const accountId = normalizePositiveInt(row?.accountId ?? key);
    if (!accountId) continue;
    const session = normalizeAccountSession({ ...row, accountId });
    sessions[String(accountId)] = session;
  }
  return sessions;
}

function normalizeAccountGoalRecords(value) {
  const source = value && typeof value === 'object' ? value : {};
  const records = {};
  for (const [key, row] of Object.entries(source)) {
    const accountId = normalizePositiveInt(row?.accountId ?? key);
    if (!accountId) continue;
    records[String(accountId)] = normalizeAccountGoalRecord({ ...row, accountId });
  }
  return records;
}

function normalizeAccountGoalRecord(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    accountId: normalizePositiveInt(source.accountId),
    wins: clampInt(source.wins, 0, 10000, 0),
    losses: clampInt(source.losses, 0, 10000, 0),
    lastMatchId: stringOrNull(source.lastMatchId),
    lastResult: ['win', 'lose'].includes(source.lastResult) ? source.lastResult : null,
    lastResultAt: stringOrNull(source.lastResultAt)
  };
}

function normalizeAccountSession(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    accountId: normalizePositiveInt(source.accountId),
    wins: clampInt(source.wins, 0, 10000, 0),
    losses: clampInt(source.losses, 0, 10000, 0),
    sessionStartedAt: stringOrNull(source.sessionStartedAt),
    lastMatchId: stringOrNull(source.lastMatchId),
    lastResult: ['win', 'lose'].includes(source.lastResult) ? source.lastResult : null,
    lastResultAt: stringOrNull(source.lastResultAt)
  };
}

function decodeLatin1Utf8(value) {
  const bytes = [];
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code > 255) return null;
    bytes.push(code);
  }
  return Buffer.from(bytes).toString('utf8').trim();
}

function decodeWindows1251Utf8(value) {
  const bytes = [];
  for (const char of value) {
    const byte = windows1251Byte(char);
    if (byte === null) return null;
    bytes.push(byte);
  }
  return Buffer.from(bytes).toString('utf8').trim();
}

function windows1251Byte(char) {
  const code = char.charCodeAt(0);
  if (code <= 127) return code;
  const extended = windows1251ExtendedBytes.get(char);
  if (extended !== undefined) return extended;
  if (code >= 0x0410 && code <= 0x044F) return code - 0x0410 + 0xC0;
  if (code === 0x0401) return 0xA8;
  if (code === 0x0451) return 0xB8;
  return code <= 255 ? code : null;
}

function mojibakeScore(value) {
  const text = String(value || '');
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const latin1Utf8Markers = (text.match(/[ÃÂÐÑ][\u0080-\u00BF\u00A0-\u00BF]/g) || []).length;
  const windows1251Utf8Markers = (text.match(/[РС][\u00A0-\u00BF\u0400-\u045F]/g) || []).length;
  const controlCount = (text.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g) || []).length;
  return replacementCount * 100 + controlCount * 30 + latin1Utf8Markers * 12 + windows1251Utf8Markers * 12;
}

const windows1251ExtendedBytes = new Map([
  ['Ђ', 0x80], ['Ѓ', 0x81], ['‚', 0x82], ['ѓ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86], ['‡', 0x87],
  ['€', 0x88], ['‰', 0x89], ['Љ', 0x8A], ['‹', 0x8B], ['Њ', 0x8C], ['Ќ', 0x8D], ['Ћ', 0x8E], ['Џ', 0x8F],
  ['ђ', 0x90], ['‘', 0x91], ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['™', 0x99], ['љ', 0x9A], ['›', 0x9B], ['њ', 0x9C], ['ќ', 0x9D], ['ћ', 0x9E], ['џ', 0x9F],
  ['\u00A0', 0xA0], ['Ў', 0xA1], ['ў', 0xA2], ['Ј', 0xA3], ['¤', 0xA4], ['Ґ', 0xA5], ['¦', 0xA6], ['§', 0xA7],
  ['Ё', 0xA8], ['©', 0xA9], ['Є', 0xAA], ['«', 0xAB], ['¬', 0xAC], ['\u00AD', 0xAD], ['®', 0xAE], ['Ї', 0xAF],
  ['°', 0xB0], ['±', 0xB1], ['І', 0xB2], ['і', 0xB3], ['ґ', 0xB4], ['µ', 0xB5], ['¶', 0xB6], ['·', 0xB7],
  ['ё', 0xB8], ['№', 0xB9], ['є', 0xBA], ['»', 0xBB], ['ј', 0xBC], ['Ѕ', 0xBD], ['ѕ', 0xBE], ['ї', 0xBF]
]);

function activeAccountMmrTarget(config, accountId) {
  const accounts = Array.isArray(config.streamerAccounts) ? config.streamerAccounts : [];
  const accountIndex = accountId
    ? accounts.findIndex((account) => String(account?.accountId || '') === String(accountId))
    : -1;
  if (accountIndex >= 0) {
    return {
      accountIndex,
      mmr: clampInt(accounts[accountIndex].mmr, 0, 99999, 0)
    };
  }
  return {
    accountIndex: -1,
    mmr: clampInt(config.streamerMmr, 0, 99999, 0)
  };
}

function stringOrNull(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function normalizeGoalTemplate(value) {
  return ['classic', 'bubbles', 'neon', 'minimal', 'lightning', 'eye', 'scanner', 'shimmer', 'comet', 'aurora', 'pulse', 'segments', 'liquid', 'equalizer', 'heartbeat', 'sparks', 'glitch'].includes(value) ? value : 'classic';
}

function normalizeGoalColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function normalizeGoalTextPart(value, fallback = '') {
  return String(value ?? fallback ?? '').slice(0, 24);
}

function normalizeGoalCustomCss(value) {
  return String(value || '').slice(0, 8000);
}

function normalizeMenuMmrOcrRegion(value) {
  if (!value || typeof value !== 'object') return null;
  const x = clampInt(value.x, -10000, 10000, null);
  const y = clampInt(value.y, -10000, 10000, null);
  const width = clampInt(value.width, 10, 2000, null);
  const height = clampInt(value.height, 10, 2000, null);
  if (x === null || y === null || width === null || height === null) return null;
  return { x, y, width, height };
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.trunc(number), min), max);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}
