export const aegisDurationSeconds = 5 * 60;
export const roshanRespawnMinSeconds = 8 * 60;
export const roshanRespawnMaxSeconds = 11 * 60;

const aegisItemPattern = /(^|_)aegis($|_)/i;
const roshanKillPattern = /roshan.*(kill|death|dead|slain)|(?:kill|death|dead|slain).*roshan|roshan_killed/i;
const roshanRespawnPattern = /roshan.*(respawn|spawn|alive|up)|(?:respawn|spawn|alive).*roshan/i;

export function collectMatchPlayers(payload) {
  const source = payload?.allplayers || payload?.players || {};
  const players = Object.entries(source)
    .filter(([key]) => !isIgnoredRosterKey(key))
    .map(([key, player]) => normalizeMatchPlayer(key, player))
    .filter(Boolean)
    .sort((left, right) => left.slot - right.slot);
  return upsertCurrentPlayer(players, normalizeCurrentMatchPlayer(payload, players.length <= 1));
}

export function updateMatchIntel(previousIntel, payload, gsi, players) {
  const previous = previousIntel && typeof previousIntel === 'object' ? previousIntel : {};
  const clockTime = normalizedClock(gsi?.clockTime);
  const activeMatchId = gsi?.activeMatchId || gsi?.matchId || null;
  const matchChanged = previous.matchId && activeMatchId && String(previous.matchId) !== String(activeMatchId);
  const base = matchChanged ? {} : previous;
  const rosterAegisHolder = players.find((player) => player.source === 'roster' && player.hasAegis) || null;
  const aegisHolder = rosterAegisHolder || players.find((player) => player.hasAegis) || null;
  const roshanKilled = hasRoshanKillEvent(payload);
  const roshanRespawned = hasRoshanRespawnEvent(payload);
  let roshan = base.roshan ? { ...base.roshan } : null;
  let aegis = base.aegis ? { ...base.aegis } : null;

  if (roshanRespawned && !roshanKilled) {
    roshan = null;
  }

  if (Number.isFinite(clockTime) && shouldStartRoshanTimer({ roshan, roshanKilled, aegisHolder, aegis, clockTime })) {
    const killedAt = roshanKilled ? clockTime : Math.max(0, clockTime - 5);
    roshan = {
      killedAt,
      earliestRespawnAt: killedAt + roshanRespawnMinSeconds,
      latestRespawnAt: killedAt + roshanRespawnMaxSeconds
    };
  }

  if (aegisHolder && Number.isFinite(clockTime)) {
    const sameHolder = aegis && String(aegis.slot) === String(aegisHolder.slot);
    const pickedAt = sameHolder && Number.isFinite(Number(aegis.pickedAt)) ? Number(aegis.pickedAt) : clockTime;
    aegis = {
      slot: aegisHolder.slot,
      accountId: aegisHolder.accountId,
      name: aegisHolder.name,
      pickedAt,
      expiresAt: pickedAt + aegisDurationSeconds
    };
  } else if (aegis && Number.isFinite(clockTime)) {
    if (clockTime >= Number(aegis.expiresAt || 0) || players.some((player) => player.hasItemData)) {
      aegis = null;
    }
  }

  const roshanStatus = roshan && Number.isFinite(clockTime)
    ? formatRoshanStatus(roshan, clockTime)
    : null;

  return {
    matchId: activeMatchId,
    players,
    notablePlayers: Array.isArray(base.notablePlayers) ? base.notablePlayers : [],
    roshan,
    roshanStatus,
    aegis
  };
}

function shouldStartRoshanTimer({ roshan, roshanKilled, aegisHolder, aegis, clockTime }) {
  if (roshanKilled) {
    const killedAt = Number(roshan?.killedAt);
    const latestRespawnAt = Number(roshan?.latestRespawnAt);
    return !roshan
      || !Number.isFinite(killedAt)
      || clockTime < killedAt - 30
      || (Number.isFinite(latestRespawnAt) && clockTime > latestRespawnAt + 30);
  }
  return Boolean(aegisHolder && !aegis && !roshan);
}

export function notablePlayersFromRankCache(players, getCachedRank, customPlayers = []) {
  const customByAccountId = normalizeCustomNotablePlayers(customPlayers);
  return players
    .map((player) => {
      const rank = player.accountId ? getCachedRank(String(player.accountId)) : null;
      const custom = player.accountId ? customByAccountId.get(String(player.accountId)) : null;
      if (!rank?.leaderboardRank && !custom) return null;
      return {
        slot: player.slot,
        accountId: player.accountId,
        name: custom?.name || rank?.name || player.name,
        leaderboardRank: rank?.leaderboardRank || null,
        rankTier: rank?.rankTier || null,
        countryCode: normalizeCountryCode(custom?.countryCode || rank?.countryCode)
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.slot - right.slot);
}

function normalizeCustomNotablePlayers(customPlayers) {
  const byAccountId = new Map();
  for (const row of Array.isArray(customPlayers) ? customPlayers : []) {
    if (!row || typeof row !== 'object') continue;
    const accountId = normalizeAccountId(row.accountId ?? row.dotaId ?? row.id);
    if (!accountId) continue;
    byAccountId.set(String(accountId), {
      accountId,
      name: String(row.name || row.nickname || '').trim().slice(0, 40),
      countryCode: normalizeCountryCode(row.countryCode)
    });
  }
  return byAccountId;
}

function normalizeCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function normalizeAccountId(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (number > 76561197960265728) return Math.trunc(number - 76561197960265728);
  return Math.trunc(number);
}

function normalizeMatchPlayer(key, player) {
  if (isIgnoredRosterKey(key)) return null;
  if (!player || typeof player !== 'object') return null;
  const slot = normalizePlayerSlot(player.player_slot ?? player.playerSlot ?? player.team_slot ?? player.teamSlot ?? key, player);
  if (slot === null) return null;
  const accountId = normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id);
  return {
    slot,
    team: slot < 5 ? 'radiant' : 'dire',
    source: 'roster',
    accountId,
    name: String(player.name || player.player_name || player.personaname || '').slice(0, 40),
    hero: String(player.hero_name || player.heroName || player.hero || '').slice(0, 60),
    hasItemData: hasInspectableItemData(player),
    hasAegis: hasAegisItem(player)
  };
}

function normalizeCurrentMatchPlayer(payload, forceVisualFirst = false) {
  const player = payload?.player;
  if (!player || typeof player !== 'object') return null;
  const slot = currentPlayerTopbarSlot(payload, player, forceVisualFirst);
  if (slot === null) return null;
  const hero = payload?.hero || {};
  return {
    slot,
    team: slot < 5 ? 'radiant' : 'dire',
    source: 'current',
    accountId: normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id),
    name: String(player.name || player.player_name || player.personaname || '').slice(0, 40),
    hero: String(hero.name || hero.hero_name || hero.heroName || hero.localized_name || '').slice(0, 60),
    hasItemData: hasInspectableItemData(player) || hasInspectableItemData(payload.items),
    hasAegis: hasAegisItem(player) || hasAegisItem(payload.items)
  };
}

function currentPlayerTopbarSlot(payload, player, forceVisualFirst) {
  const team = String(player.team_name || player.team || '').toLowerCase();
  if (player.player_slot !== undefined || player.playerSlot !== undefined) {
    const slot = normalizePlayerSlot(player.player_slot ?? player.playerSlot, player);
    if (slot !== null) return slot;
  }
  if (player.team_slot !== undefined || player.teamSlot !== undefined) {
    const slot = normalizePlayerSlot(player.team_slot ?? player.teamSlot, player);
    if (slot !== null) return slot;
  }
  const rosterSlot = inferRosterSlot(payload, player);
  if (rosterSlot !== null) return rosterSlot;
  if (forceVisualFirst) {
    if (team.includes('dire') || team.includes('bad')) return 5;
    if (team.includes('radiant') || team.includes('good')) return 0;
  }
  return null;
}

function inferRosterSlot(payload, player) {
  const source = payload?.allplayers || payload?.players;
  if (!source || typeof source !== 'object') return null;
  const targetAccountId = normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id);
  const targetTeam = normalizeRosterTeam(player.team_name || player.team || '');
  const targetHero = normalizeHeroToken(payload?.hero?.name || payload?.hero?.hero_name || payload?.hero?.heroName || payload?.hero?.localized_name || player.hero_name || player.heroName || player.hero || '');
  let heroMatch = null;

  for (const [key, rosterPlayer] of Object.entries(source)) {
    if (isIgnoredRosterKey(key)) continue;
    if (!rosterPlayer || typeof rosterPlayer !== 'object') continue;
    const slot = normalizePlayerSlot(rosterPlayer.player_slot ?? rosterPlayer.playerSlot ?? rosterPlayer.team_slot ?? rosterPlayer.teamSlot ?? key, rosterPlayer);
    if (slot === null) continue;
    const rosterAccountId = normalizeAccountId(rosterPlayer.accountid ?? rosterPlayer.account_id ?? rosterPlayer.accountId ?? rosterPlayer.steamid ?? rosterPlayer.steam_id);
    const rosterTeam = normalizeRosterTeam(rosterPlayer.team_name || rosterPlayer.team || slot);
    const sameTeam = !targetTeam || !rosterTeam || targetTeam === rosterTeam;
    if (targetAccountId && rosterAccountId && targetAccountId === rosterAccountId && sameTeam) return slot;
    const rosterHero = normalizeHeroToken(rosterPlayer.hero_name || rosterPlayer.heroName || rosterPlayer.hero || rosterPlayer.hero_id || '');
    if (sameTeam && targetHero && rosterHero && targetHero === rosterHero && heroMatch === null) {
      heroMatch = slot;
    }
  }

  return heroMatch;
}

function normalizeRosterTeam(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('dire') || text.includes('bad')) return 'dire';
  if (text.includes('radiant') || text.includes('good')) return 'radiant';
  return null;
}

function normalizeHeroToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^npc_dota_hero_/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function upsertCurrentPlayer(players, currentPlayer) {
  if (!currentPlayer) return players;
  const existingIndex = players.findIndex((player) => (
    (currentPlayer.accountId && player.accountId === currentPlayer.accountId)
    || player.slot === currentPlayer.slot
  ));
  if (existingIndex === -1) return [...players, currentPlayer].sort((left, right) => left.slot - right.slot);
  const merged = [...players];
  merged[existingIndex] = {
    ...merged[existingIndex],
    slot: currentPlayer.slot,
    team: currentPlayer.team || merged[existingIndex].team,
    accountId: merged[existingIndex].accountId || currentPlayer.accountId,
    name: merged[existingIndex].name || currentPlayer.name,
    hero: merged[existingIndex].hero || currentPlayer.hero,
    hasItemData: merged[existingIndex].hasItemData || currentPlayer.hasItemData,
    hasAegis: currentPlayer.hasItemData
      ? currentPlayer.hasAegis
      : merged[existingIndex].hasAegis || currentPlayer.hasAegis
  };
  return merged;
}

function normalizePlayerSlot(rawSlot, player) {
  const numeric = Number(rawSlot);
  const team = String(player?.team_name || player?.team || '').toLowerCase();
  if (Number.isFinite(numeric)) {
    if (numeric >= 0 && numeric <= 4) return Math.trunc(numeric);
    if (numeric >= 128 && numeric <= 132) return Math.trunc(numeric - 128 + 5);
    if (numeric >= 5 && numeric <= 9) return Math.trunc(numeric);
  }

  const keyMatch = String(rawSlot || '').match(/(?:player)?(\d+)$/i);
  if (keyMatch) {
    const index = Number(keyMatch[1]);
    if (Number.isFinite(index) && index > 0 && index <= 10) return Math.trunc(index - 1);
    return null;
  }

  const teamSlot = Number(player?.team_slot ?? player?.teamSlot);
  if (Number.isFinite(teamSlot) && teamSlot >= 0 && teamSlot <= 4) {
    if (team.includes('dire') || team.includes('bad')) return Math.trunc(teamSlot + 5);
    return Math.trunc(teamSlot);
  }

  return null;
}

function isIgnoredRosterKey(key) {
  const normalized = String(key || '').trim().toLowerCase();
  return normalized === '0' || normalized === 'player0';
}

function hasAegisItem(value) {
  return itemNames(value).some((name) => aegisItemPattern.test(name.replace(/^item_/, '')));
}

function hasInspectableItemData(value, depth = 0) {
  if (!value || depth > 4 || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => hasInspectableItemData(item, depth + 1));
  return Object.entries(value).some(([key, item]) => {
    const normalizedKey = String(key || '').toLowerCase();
    if (/^(items?|item\d+|slot\d+|inventory|backpack|stash|neutral)/.test(normalizedKey)) return true;
    if (/item|inventory|backpack|stash|neutral/.test(normalizedKey) && item && typeof item === 'object') {
      return hasInspectableItemData(item, depth + 1);
    }
    return false;
  });
}

function itemNames(value, depth = 0) {
  if (!value || depth > 4) return [];
  if (typeof value === 'string') return [value.toLowerCase()];
  if (typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item) => itemNames(item, depth + 1));
  const namedItem = value.name || value.item_name || value.itemName;
  if (typeof namedItem === 'string' && /(^item_)|(^|_)aegis($|_)/i.test(namedItem)) return [namedItem.toLowerCase()];
  return Object.entries(value).flatMap(([key, item]) => {
    const normalizedKey = String(key || '').toLowerCase();
    const inItemContainer = /item|inventory|backpack|stash|neutral/.test(normalizedKey);
    if (typeof item === 'string' && inItemContainer) return [item.toLowerCase()];
    if (inItemContainer || typeof item === 'object') return itemNames(item, depth + 1);
    return [];
  });
}

function hasRoshanKillEvent(value, depth = 0) {
  if (!value || depth > 5) return false;
  if (typeof value !== 'object') return roshanKillPattern.test(String(value));
  if (Array.isArray(value)) return value.some((item) => hasRoshanKillEvent(item, depth + 1));
  return Object.entries(value).some(([key, item]) => roshanKillPattern.test(key) || hasRoshanKillEvent(item, depth + 1));
}

function hasRoshanRespawnEvent(value, depth = 0) {
  if (!value || depth > 5) return false;
  if (typeof value !== 'object') return roshanRespawnPattern.test(String(value));
  if (Array.isArray(value)) return value.some((item) => hasRoshanRespawnEvent(item, depth + 1));
  return Object.entries(value).some(([key, item]) => roshanRespawnPattern.test(key) || hasRoshanRespawnEvent(item, depth + 1));
}

function normalizedClock(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : null;
}

function formatRoshanStatus(roshan, clockTime) {
  const earliest = Number(roshan.earliestRespawnAt);
  const latest = Number(roshan.latestRespawnAt);
  if (!Number.isFinite(earliest) || !Number.isFinite(latest)) return null;
  if (clockTime < earliest) {
    return {
      phase: 'waiting',
      earliestRemaining: Math.ceil(earliest - clockTime),
      latestRemaining: Math.ceil(latest - clockTime)
    };
  }
  if (clockTime < latest) {
    return {
      phase: 'window',
      earliestRemaining: 0,
      latestRemaining: Math.ceil(latest - clockTime)
    };
  }
  return null;
}
