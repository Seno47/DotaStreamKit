export function inferPredictionResult(meta, gsi, inferMatchResult = () => null) {
  const state = String(gsi?.gameState || '');
  const postGame = /POST_GAME/i.test(state);
  const clockTime = predictionNumber(gsi?.clockTime);
  const deadlineSeconds = predictionNumber(meta?.deadlineSeconds);
  const target = predictionNumber(meta?.target);

  if (meta?.type === 'radiant_win') {
    if (!postGame || !gsi?.winTeam) return null;
    return gsi.winTeam === 'radiant' ? 'yes' : 'no';
  }
  if (meta?.type === 'dire_win') {
    if (!postGame || !gsi?.winTeam) return null;
    return gsi.winTeam === 'dire' ? 'yes' : 'no';
  }
  if (meta?.type === 'game_duration_at_least') {
    if (!Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds)) return null;
    if (clockTime >= deadlineSeconds) return 'yes';
    return postGame ? 'no' : null;
  }
  if (['total_kills_by_minute', 'radiant_kills_by_minute', 'dire_kills_by_minute'].includes(meta?.type)) {
    if (!Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds) || !Number.isFinite(target)) return null;
    const stat = predictionStatValue(meta.type, gsi);
    if (!Number.isFinite(stat)) return null;
    if (postGame && clockTime < deadlineSeconds) return stat >= target ? 'yes' : 'no';
    if (clockTime < deadlineSeconds) return stat >= target ? 'yes' : null;
    if (clockTime === deadlineSeconds) return stat >= target ? 'yes' : 'no';
    return stat < target ? 'no' : null;
  }
  if (!meta?.type || meta.type === 'win_loss' || meta.type === 'manual') {
    const result = inferMatchResult(gsi);
    return result === 'win' ? 'yes' : result === 'lose' ? 'no' : null;
  }
  if (meta.type === 'custom_condition') return inferCustomConditionResult(meta, gsi);

  const stat = predictionStatValue(meta.type, gsi);
  if (['streamer_kills', 'streamer_deaths', 'streamer_assists'].includes(meta.type)) {
    if (!Number.isFinite(stat) || !Number.isFinite(target)) return null;
    if (stat >= target) return 'yes';
    return postGame ? 'no' : null;
  }
  if (meta.type === 'no_death_until') {
    const deaths = predictionNumber(gsi?.deaths);
    if (!Number.isFinite(deaths) || !Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds)) return null;
    if (clockTime > deadlineSeconds) return deaths === 0 ? 'yes' : null;
    if (deaths > 0) return 'no';
    if (clockTime >= deadlineSeconds) return 'yes';
    return postGame ? 'no' : null;
  }
  if (meta.type === 'last_hits_by_minute') {
    const lastHits = predictionNumber(gsi?.lastHits);
    if (!Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds) || !Number.isFinite(lastHits) || !Number.isFinite(target)) return null;
    if (postGame && clockTime < deadlineSeconds) return lastHits >= target ? 'yes' : 'no';
    if (clockTime < deadlineSeconds) return lastHits >= target ? 'yes' : null;
    if (clockTime === deadlineSeconds) return lastHits >= target ? 'yes' : 'no';
    return lastHits < target ? 'no' : null;
  }
  return null;
}

export function latchPredictionResult(meta, gsi, inferMatchResult = () => null, now = new Date()) {
  if (meta?.latchedResult === 'yes' || meta?.latchedResult === 'no') {
    return { result: meta.latchedResult, meta, changed: false };
  }
  const result = inferPredictionResult(meta, gsi, inferMatchResult);
  if (!result) return { result: null, meta, changed: false };
  return {
    result,
    meta: {
      ...(meta || {}),
      latchedResult: result,
      latchedAt: now.toISOString()
    },
    changed: true
  };
}

function predictionStatValue(type, gsi) {
  if (type === 'streamer_kills') return predictionNumber(gsi?.kills);
  if (type === 'streamer_deaths') return predictionNumber(gsi?.deaths);
  if (type === 'streamer_assists') return predictionNumber(gsi?.assists);
  if (type === 'total_kills_by_minute') return predictionNumber(gsi?.totalKills);
  if (type === 'radiant_kills_by_minute') return predictionNumber(gsi?.radiantKills);
  if (type === 'dire_kills_by_minute') return predictionNumber(gsi?.direKills);
  return NaN;
}

function inferCustomConditionResult(meta, gsi) {
  const state = String(gsi?.gameState || '');
  const target = predictionNumber(meta?.target);
  const deadlineSeconds = predictionNumber(meta?.deadlineSeconds);
  const clockTime = predictionNumber(gsi?.clockTime);
  const metricValue = predictionMetricValue(meta?.metric, gsi);

  if (meta?.condition === 'game_duration_at_least') {
    if (!Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds)) return null;
    if (clockTime >= deadlineSeconds) return 'yes';
    return /POST_GAME/i.test(state) ? 'no' : null;
  }
  if (meta?.condition === 'metric_reaches_target') {
    if (!Number.isFinite(metricValue) || !Number.isFinite(target)) return null;
    if (metricValue >= target) return 'yes';
    return /POST_GAME/i.test(state) ? 'no' : null;
  }
  if (meta?.condition === 'metric_by_minute') {
    if (!Number.isFinite(clockTime) || !Number.isFinite(deadlineSeconds) || !Number.isFinite(metricValue) || !Number.isFinite(target)) return null;
    if (/POST_GAME/i.test(state) && clockTime < deadlineSeconds) return metricValue >= target ? 'yes' : 'no';
    if (clockTime < deadlineSeconds) return metricValue >= target ? 'yes' : null;
    if (meta.metric === 'clock_minutes') return deadlineSeconds / 60 >= target ? 'yes' : 'no';
    if (clockTime === deadlineSeconds) return metricValue >= target ? 'yes' : 'no';
    return metricValue < target ? 'no' : null;
  }
  return null;
}

function predictionMetricValue(metric, gsi) {
  if (metric === 'clock_minutes') {
    const clockTime = predictionNumber(gsi?.clockTime);
    return Number.isFinite(clockTime) ? clockTime / 60 : NaN;
  }
  const fieldByMetric = {
    kills: 'kills', deaths: 'deaths', assists: 'assists', last_hits: 'lastHits', denies: 'denies', level: 'level',
    team_kills: 'teamKills', team_deaths: 'teamDeaths', team_assists: 'teamAssists',
    enemy_kills: 'enemyKills', enemy_deaths: 'enemyDeaths', enemy_assists: 'enemyAssists',
    radiant_kills: 'radiantKills', radiant_deaths: 'radiantDeaths', radiant_assists: 'radiantAssists',
    dire_kills: 'direKills', dire_deaths: 'direDeaths', dire_assists: 'direAssists',
    total_kills: 'totalKills', total_deaths: 'totalDeaths', total_assists: 'totalAssists'
  };
  const field = fieldByMetric[metric];
  return field ? predictionNumber(gsi?.[field]) : NaN;
}

function predictionNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
