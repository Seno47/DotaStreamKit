export const aegisDurationSeconds = 5 * 60;
export const roshanRespawnMinSeconds = 8 * 60;
export const roshanRespawnMaxSeconds = 11 * 60;

const aegisItemPattern = /(^|_)aegis($|_)/i;
const roshanKillPattern = /roshan.*(kill|death|dead|slain)|(?:kill|death|dead|slain).*roshan|roshan_killed/i;

export function collectMatchPlayers(payload) {
  const source = payload?.allplayers || payload?.players || {};
  return Object.entries(source)
    .map(([key, player]) => normalizeMatchPlayer(key, player))
    .filter(Boolean)
    .sort((left, right) => left.slot - right.slot);
}

export function updateMatchIntel(previousIntel, payload, gsi, players) {
  const previous = previousIntel && typeof previousIntel === 'object' ? previousIntel : {};
  const clockTime = normalizedClock(gsi?.clockTime);
  const activeMatchId = gsi?.activeMatchId || gsi?.matchId || null;
  const matchChanged = previous.matchId && activeMatchId && String(previous.matchId) !== String(activeMatchId);
  const base = matchChanged ? {} : previous;
  const aegisHolder = players.find((player) => player.hasAegis) || null;
  const roshanKilled = hasRoshanKillEvent(payload);
  let roshan = base.roshan ? { ...base.roshan } : null;
  let aegis = base.aegis ? { ...base.aegis } : null;

  if ((roshanKilled || (aegisHolder && !aegis)) && Number.isFinite(clockTime)) {
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
    if (clockTime >= Number(aegis.expiresAt || 0)) {
      aegis = null;
    } else {
      aegis.consumedAt = clockTime;
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
    aegis: aegis && !aegis.consumedAt ? aegis : null
  };
}

export function notablePlayersFromRankCache(players, getCachedRank) {
  return players
    .map((player) => {
      const rank = player.accountId ? getCachedRank(String(player.accountId)) : null;
      if (!rank?.leaderboardRank) return null;
      return {
        slot: player.slot,
        accountId: player.accountId,
        name: rank.name || player.name,
        leaderboardRank: rank.leaderboardRank,
        rankTier: rank.rankTier || null
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.slot - right.slot);
}

export function normalizeAccountId(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (number > 76561197960265728) return Math.trunc(number - 76561197960265728);
  return Math.trunc(number);
}

function normalizeMatchPlayer(key, player) {
  if (!player || typeof player !== 'object') return null;
  const slot = normalizePlayerSlot(player.player_slot ?? player.playerSlot ?? player.team_slot ?? player.teamSlot ?? key, player);
  if (slot === null) return null;
  const accountId = normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id);
  return {
    slot,
    team: slot < 5 ? 'radiant' : 'dire',
    accountId,
    name: String(player.name || player.player_name || player.personaname || '').slice(0, 40),
    hero: String(player.hero_name || player.heroName || player.hero || '').slice(0, 60),
    hasAegis: hasAegisItem(player)
  };
}

function normalizePlayerSlot(rawSlot, player) {
  const numeric = Number(rawSlot);
  if (Number.isFinite(numeric)) {
    if (numeric >= 0 && numeric <= 4) return Math.trunc(numeric);
    if (numeric >= 128 && numeric <= 132) return Math.trunc(numeric - 128 + 5);
    if (numeric >= 5 && numeric <= 9) return Math.trunc(numeric);
  }

  const keyMatch = String(rawSlot || '').match(/(?:player)?(\d+)$/i);
  if (keyMatch) {
    const index = Number(keyMatch[1]);
    if (Number.isFinite(index) && index >= 0 && index <= 9) return index;
  }

  const team = String(player?.team_name || player?.team || '').toLowerCase();
  const teamSlot = Number(player?.team_slot ?? player?.teamSlot);
  if (Number.isFinite(teamSlot) && teamSlot >= 0 && teamSlot <= 4) {
    if (team.includes('dire') || team.includes('bad')) return Math.trunc(teamSlot + 5);
    return Math.trunc(teamSlot);
  }

  return null;
}

function hasAegisItem(value) {
  return itemNames(value).some((name) => aegisItemPattern.test(name.replace(/^item_/, '')));
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
  return {
    phase: 'possible',
    earliestRemaining: 0,
    latestRemaining: 0
  };
}
