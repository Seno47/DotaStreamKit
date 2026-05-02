const allPickPhaseTargets = [2, 4, 5];

export function inferOwnPickPhase({
  previous = {},
  payload = {},
  gameState = null,
  playerHeroPicked = false,
  playerTeam = null,
  lifecycle = {}
}) {
  const state = String(gameState || '');
  const heroSelection = /HERO_SELECTION/i.test(state);
  const team = normalizeTeam(playerTeam);
  const counts = collectDraftHeroCounts(payload, team, playerHeroPicked);
  const ownCount = team ? counts[team] : null;
  const enemyTeam = team === 'radiant' ? 'dire' : team === 'dire' ? 'radiant' : null;
  const enemyCount = enemyTeam ? counts[enemyTeam] : null;

  if (!heroSelection) {
    const ended = /STRATEGY_TIME|TEAM_SHOWCASE|PRE_GAME|GAME_IN_PROGRESS/i.test(state)
      && playerHeroPicked
      && !lifecycle.newDraft;
    return {
      ownPickPhaseEnded: ended,
      ownTeamPickedHeroCount: ownCount,
      enemyTeamPickedHeroCount: enemyCount,
      ownPickPhaseTargetCount: ended ? normalizeTarget(previous.ownPickPhaseTargetCount) : null,
      ownPickPhaseSource: counts.source
    };
  }

  if (!playerHeroPicked || !team) {
    return {
      ownPickPhaseEnded: false,
      ownTeamPickedHeroCount: ownCount,
      enemyTeamPickedHeroCount: enemyCount,
      ownPickPhaseTargetCount: null,
      ownPickPhaseSource: counts.source
    };
  }

  const previousTarget = lifecycle.newDraft ? null : normalizeTarget(previous.ownPickPhaseTargetCount);
  const target = previousTarget || phaseTargetForOwnCount(ownCount);
  const hasBothTeamCounts = counts.reliable && Number.isFinite(ownCount) && Number.isFinite(enemyCount);
  const endedByCounts = Boolean(target && hasBothTeamCounts && ownCount >= target && enemyCount >= target);
  const alreadyEnded = !lifecycle.newDraft && previous.ownPickPhaseEnded === true;

  return {
    ownPickPhaseEnded: alreadyEnded || endedByCounts,
    ownTeamPickedHeroCount: ownCount,
    enemyTeamPickedHeroCount: enemyCount,
    ownPickPhaseTargetCount: target,
    ownPickPhaseSource: counts.source
  };
}

export function collectDraftHeroCounts(payload = {}, playerTeam = null, playerHeroPicked = false) {
  const roster = collectRosterHeroCounts(payload);
  const draft = collectDraftObjectHeroCounts(payload?.draft);
  const radiant = Math.max(roster?.radiant ?? 0, draft?.radiant ?? 0);
  const dire = Math.max(roster?.dire ?? 0, draft?.dire ?? 0);
  const sources = [roster?.source, draft?.source].filter(Boolean);
  const team = normalizeTeam(playerTeam);

  const counts = {
    radiant,
    dire,
    source: sources.length ? sources.join('+') : 'none',
    reliable: sources.length > 0
  };

  if (team && playerHeroPicked) {
    counts[team] = Math.max(counts[team], 1);
  }

  return counts;
}

function phaseTargetForOwnCount(count) {
  const value = Number(count);
  if (!Number.isFinite(value) || value <= 0) return 2;
  return allPickPhaseTargets.find((target) => value <= target) || 5;
}

function normalizeTarget(value) {
  const number = Number(value);
  return allPickPhaseTargets.includes(number) ? number : null;
}

function collectRosterHeroCounts(payload) {
  const source = payload?.allplayers || payload?.players;
  if (!source || typeof source !== 'object') return null;
  const picked = { radiant: new Set(), dire: new Set() };

  for (const [key, player] of Object.entries(source)) {
    if (key === 'player0') continue;
    if (!player || typeof player !== 'object') continue;
    if (!hasPickedHero(player.hero_id ?? player.heroId ?? player.hero_name ?? player.heroName ?? player.hero)) continue;
    const team = playerTeam(player);
    if (!team) continue;
    picked[team].add(playerIdentity(key, player));
  }

  return {
    radiant: Math.min(5, picked.radiant.size),
    dire: Math.min(5, picked.dire.size),
    source: 'roster'
  };
}

function collectDraftObjectHeroCounts(draft) {
  if (!draft || typeof draft !== 'object') return null;
  const picked = { radiant: new Set(), dire: new Set() };

  visitDraftValue(draft, [], picked);

  if (!picked.radiant.size && !picked.dire.size) return null;
  return {
    radiant: Math.min(5, picked.radiant.size),
    dire: Math.min(5, picked.dire.size),
    source: 'draft'
  };
}

function visitDraftValue(value, path, picked) {
  if (Array.isArray(value)) {
    const team = teamFromPath(path);
    value.forEach((item, index) => {
      if (team && hasPickedHero(item)) {
        picked[team].add(heroToken(item, `${path.join('.')}.${index}`));
      } else if (item && typeof item === 'object') {
        visitDraftValue(item, [...path, String(index)], picked);
      }
    });
    return;
  }

  if (!value || typeof value !== 'object') return;

  const directTeam = normalizeTeam(
    value.team
    ?? value.team_name
    ?? value.teamName
    ?? value.pick_team
    ?? value.pickTeam
  ) || teamFromPath(path);
  const directHero = firstHeroValue(value);
  if (directTeam && hasPickedHero(directHero)) {
    picked[directTeam].add(heroToken(directHero, path.join('.')));
  }

  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === 'object') {
      visitDraftValue(child, [...path, key], picked);
      continue;
    }
    const team = teamFromPath([...path, key]);
    if (team && hasPickedHero(child) && /hero|pick|selected/i.test(key)) {
      picked[team].add(heroToken(child, [...path, key].join('.')));
    }
  }
}

function firstHeroValue(value) {
  for (const key of [
    'hero_id',
    'heroId',
    'hero',
    'hero_name',
    'heroName',
    'selected_hero',
    'selectedHero',
    'selected_hero_id',
    'selectedHeroId',
    'picked_hero',
    'pickedHero'
  ]) {
    if (hasPickedHero(value[key])) return value[key];
  }
  return null;
}

function hasPickedHero(value) {
  if (value === null || value === undefined || value === false) return false;
  const number = Number(value);
  if (Number.isFinite(number)) return number > 0;
  const text = String(value).trim().toLowerCase();
  return Boolean(text)
    && !['0', '-1', 'none', 'null', 'undefined', 'npc_dota_hero_'].includes(text);
}

function heroToken(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number) && number > 0) return `id:${Math.trunc(number)}`;
  const text = String(value || '').trim().toLowerCase();
  return text ? `name:${text}` : `slot:${fallback}`;
}

function playerIdentity(key, player) {
  const account = player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id;
  if (account) return `account:${account}`;
  const slot = player.player_slot ?? player.playerSlot ?? player.team_slot ?? player.teamSlot;
  if (slot !== undefined && slot !== null) return `slot:${slot}`;
  return `key:${key}`;
}

function playerTeam(player) {
  const explicit = normalizeTeam(player.team_name ?? player.team);
  if (explicit) return explicit;
  const slot = Number(player.player_slot ?? player.playerSlot);
  if (Number.isFinite(slot)) return slot >= 128 ? 'dire' : 'radiant';
  return null;
}

function teamFromPath(path) {
  const text = path.join('_').toLowerCase();
  return normalizeTeam(text);
}

function normalizeTeam(value) {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('radiant') || raw.includes('good') || raw === '2' || raw.includes('team2')) return 'radiant';
  if (raw.includes('dire') || raw.includes('bad') || raw === '3' || raw.includes('team3')) return 'dire';
  const number = Number(value);
  if (Number.isFinite(number)) {
    if (number >= 0 && number < 128) return 'radiant';
    if (number >= 128) return 'dire';
  }
  return null;
}
