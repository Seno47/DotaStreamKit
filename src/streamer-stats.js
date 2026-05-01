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

export function normalizeStreamerStatsConfig(config) {
  config.showStreamerStats = config.showStreamerStats === true;
  config.showStreamerRankMedal = config.showStreamerRankMedal !== false;
  config.showStreamerMmr = config.showStreamerMmr !== false;
  config.showStreamerWinLoss = config.showStreamerWinLoss !== false;
  config.autoUpdateStreamerMmr = config.autoUpdateStreamerMmr !== false;
  if (!['auto', 'account', 'mmr'].includes(config.streamerMedalSource)) config.streamerMedalSource = 'auto';
  config.streamerMmr = clampInt(config.streamerMmr, 0, 99999, 0);
  config.streamerMmrWinDelta = clampInt(config.streamerMmrWinDelta, 0, 200, 25);
  config.streamerMmrLossDelta = clampInt(config.streamerMmrLossDelta, 0, 200, 25);
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
    accountRankTier: normalizePositiveInt(state.accountRankTier),
    accountLeaderboardRank: normalizePositiveInt(state.accountLeaderboardRank),
    accountRankCheckedAt: stringOrNull(state.accountRankCheckedAt),
    previousSession: normalizePreviousSession(state.previousSession)
  };
}

export function rankMedalFromMmr(mmr) {
  if (mmr === null || mmr === undefined || mmr === '') return null;
  const value = Number(mmr);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value <= 0) return { ...rankMedalThresholds[0] };
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
  if (String(state.lastMatchId || '') === String(matchId)) {
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

  let configChanged = false;
  if (nextConfig.autoUpdateStreamerMmr !== false && Number(nextConfig.streamerMmr) > 0) {
    const delta = result === 'win'
      ? Math.max(0, Math.trunc(Number(nextConfig.streamerMmrWinDelta) || 25))
      : -Math.max(0, Math.trunc(Number(nextConfig.streamerMmrLossDelta) || 25));
    nextConfig.streamerMmr = Math.max(0, Math.trunc(Number(nextConfig.streamerMmr) + delta));
    nextState.lastMmrChange = delta;
    configChanged = true;
  }

  return { state: nextState, config: nextConfig, changed: true, configChanged };
}

export function updateStreamerSessionPresence(state, effectiveOnline, now = new Date(), graceMs = streamOfflineGraceMs) {
  const next = normalizeStreamerStatsState(state);
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
      sessionStartedAt: next.sessionStartedAt,
      sessionEndedAt: next.offlineSince,
      archivedAt: iso,
      lastMatchId: next.lastMatchId,
      lastResult: next.lastResult
    };
  }
  next.wins = 0;
  next.losses = 0;
  next.sessionStartedAt = null;
  next.offlineSince = iso;
  next.lastMatchId = null;
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
  next.sessionStartedAt = previous.sessionStartedAt || now.toISOString();
  next.lastMatchId = previous.lastMatchId || null;
  next.lastResult = previous.lastResult || null;
  next.offlineSince = null;
  next.previousSession = null;
  return { state: next, changed: true };
}

export function resetStreamerSession(state, now = new Date()) {
  const next = normalizeStreamerStatsState(state);
  if (next.wins > 0 || next.losses > 0 || next.sessionStartedAt) {
    next.previousSession = {
      wins: next.wins,
      losses: next.losses,
      sessionStartedAt: next.sessionStartedAt,
      sessionEndedAt: now.toISOString(),
      archivedAt: now.toISOString(),
      lastMatchId: next.lastMatchId,
      lastResult: next.lastResult
    };
  }
  next.wins = 0;
  next.losses = 0;
  next.sessionStartedAt = now.toISOString();
  next.offlineSince = null;
  next.lastMatchId = null;
  next.lastResult = null;
  next.lastMmrChange = 0;
  next.lastResultAt = null;
  return { state: next, changed: true };
}

function normalizePreviousSession(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    wins: clampInt(value.wins, 0, 10000, 0),
    losses: clampInt(value.losses, 0, 10000, 0),
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

function stringOrNull(value) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.trunc(number), min), max);
}
