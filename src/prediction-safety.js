function outcomeChannelPoints(outcome) {
  if (!outcome || outcome.channelPoints === null || outcome.channelPoints === undefined) return null;
  const points = Number(outcome.channelPoints);
  if (!Number.isFinite(points) || points < 0) return null;
  return points;
}

export function predictionOutcomePoints(prediction) {
  const outcomes = Array.isArray(prediction?.outcomes) ? prediction.outcomes : [];
  if (outcomes.length < 2) return null;
  const points = outcomes.map(outcomeChannelPoints);
  if (points.some((value) => value === null)) return null;
  return points;
}

export function hasCompletePredictionOutcomePoints(prediction) {
  return Array.isArray(predictionOutcomePoints(prediction));
}

export function hasPointsOnEveryPredictionOutcome(prediction) {
  const points = predictionOutcomePoints(prediction);
  return Boolean(points && points.every((value) => value > 0));
}

export function isPredictionUncontested(prediction) {
  const points = predictionOutcomePoints(prediction);
  return Boolean(points && points.some((value) => value <= 0));
}

export function isLeftActiveGameViewCancelSignal(previous, gsi) {
  const state = String(gsi.gameState || '');
  if (/POST_GAME|DISCONNECT/i.test(state)) return false;
  const previousState = String(previous?.gameState || '');
  const previousHasClockTime = previous?.clockTime !== null && previous?.clockTime !== undefined;
  const previousClockTime = Number(previous?.clockTime);
  const wasInActiveGameView = Boolean(
    previous?.inGameScreen
    || /HERO_SELECTION|STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(previousState)
    || (previousHasClockTime && Number.isFinite(previousClockTime) && previousClockTime >= 0)
  );
  if (!wasInActiveGameView) return false;
  return Boolean(gsi?.leftGameView || !gsi?.inGameScreen);
}

export function shouldContinueLeftGameViewCancelCandidate(candidate, gsi) {
  const isLeftViewCandidate = candidate?.kind === 'left_game_view'
    || candidate?.reason === 'streamer left the active game view before prediction was resolved';
  if (!isLeftViewCandidate) return false;
  const state = String(gsi?.gameState || '');
  if (/POST_GAME|DISCONNECT/i.test(state)) return false;
  return Boolean(gsi?.leftGameView || !gsi?.inGameScreen);
}

export function isPredictionProfileCompatibleWithActivity(profile, playerActivity) {
  const normalizedProfile = profile === 'spectator' ? 'spectator' : 'own';
  const activity = String(playerActivity || '').trim().toLowerCase();
  if (activity === 'spectating') return normalizedProfile === 'spectator';
  if (activity === 'playing') return normalizedProfile === 'own';
  return true;
}

export function withPredictionCreationLifecycle(meta, { automatic = false, clockTime = null } = {}) {
  const gameSeconds = optionalFiniteNumber(clockTime);
  return {
    ...(meta || {}),
    creationMode: automatic === true ? 'automatic' : 'manual',
    createdAtGameSeconds: Number.isFinite(gameSeconds) ? gameSeconds : null
  };
}

export function shouldAutoLockPredictionAtGameTime(prediction, meta, settings, gsi) {
  if (prediction?.status !== 'ACTIVE') return false;
  const lockAtGameSeconds = optionalFiniteNumber(settings?.autoLockAtGameSeconds);
  const currentGameSeconds = optionalFiniteNumber(gsi?.clockTime);
  if (!Number.isFinite(lockAtGameSeconds) || lockAtGameSeconds <= 0 || !Number.isFinite(currentGameSeconds)) return false;
  if (meta?.creationMode === 'manual') return false;

  const createdAtGameSeconds = Number(meta?.createdAtGameSeconds);
  if (meta?.createdAtGameSeconds !== null
    && meta?.createdAtGameSeconds !== undefined
    && Number.isFinite(createdAtGameSeconds)
    && createdAtGameSeconds >= lockAtGameSeconds) {
    return false;
  }
  return currentGameSeconds >= lockAtGameSeconds;
}

function optionalFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}
