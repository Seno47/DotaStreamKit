export const aegisDurationSeconds = 5 * 60;
export const roshanRespawnMinSeconds = 8 * 60;
export const roshanRespawnMaxSeconds = 11 * 60;

const aegisItemPattern = /(^|_)aegis($|_)/i;
const aegisItemIds = new Set([117]);
const aegisPickupPattern = /aegis.*pick|pick.*aegis|aegis_picked_up/i;
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
  const aegisEvent = extractLatestAegisEvent(payload, players, clockTime);
  const rosterAegisHolder = players.find((player) => player.source === 'roster' && player.hasAegis) || null;
  const eventAegisHolder = aegisEvent?.holder || null;
  const aegisHolder = eventAegisHolder || rosterAegisHolder || players.find((player) => player.hasAegis) || null;
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
    const eventPickedAt = optionalNumber(aegisHolder.pickedAt);
    const pickedAt = sameHolder && Number.isFinite(Number(aegis.pickedAt))
      ? Number(aegis.pickedAt)
      : (Number.isFinite(eventPickedAt) ? eventPickedAt : clockTime);
    const expiresAt = Math.min(pickedAt + aegisDurationSeconds, clockTime + aegisDurationSeconds);
    aegis = {
      slot: aegisHolder.slot,
      accountId: aegisHolder.accountId,
      name: aegisHolder.name,
      holderDeaths: Number.isFinite(Number(aegisHolder.deaths)) ? Number(aegisHolder.deaths) : null,
      holderAlive: typeof aegisHolder.alive === 'boolean' ? aegisHolder.alive : null,
      holderRespawnSeconds: Number.isFinite(Number(aegisHolder.respawnSeconds)) ? Number(aegisHolder.respawnSeconds) : null,
      pickedAt,
      expiresAt
    };
  } else if (aegis && Number.isFinite(clockTime)) {
    if (clockTime >= Number(aegis.expiresAt || 0) || didAegisHolderDieOrRespawn(aegis, players)) {
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

function didAegisHolderDieOrRespawn(aegis, players) {
  const holder = findPlayerForAegis(aegis, players);
  if (!holder) return false;

  const holderDeaths = Number(holder.deaths);
  const knownDeaths = Number(aegis.holderDeaths);
  if (Number.isFinite(holderDeaths) && Number.isFinite(knownDeaths) && holderDeaths > knownDeaths) return true;

  if (holder.alive === false) return true;

  const respawnSeconds = Number(holder.respawnSeconds);
  if (Number.isFinite(respawnSeconds) && respawnSeconds > 0) return true;

  return false;
}

function findPlayerForAegis(aegis, players) {
  const accountId = normalizeAccountId(aegis?.accountId);
  if (accountId) {
    const byAccount = players.find((player) => player.accountId === accountId);
    if (byAccount) return byAccount;
  }
  const slot = Number(aegis?.slot);
  return Number.isFinite(slot) ? players.find((player) => player.slot === slot) || null : null;
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
  const slot = normalizePlayerSlot(player.team_slot ?? player.teamSlot ?? player.player_slot ?? player.playerSlot, player);
  if (slot === null) return null;
  const accountId = normalizeAccountId(player.accountid ?? player.account_id ?? player.accountId ?? player.steamid ?? player.steam_id);
  return {
    slot,
    team: slot < 5 ? 'radiant' : 'dire',
    source: 'roster',
    accountId,
    name: String(player.name || player.player_name || player.personaname || '').slice(0, 40),
    hero: String(player.hero_name || player.heroName || player.hero || '').slice(0, 60),
    deaths: normalizeOptionalNumber(player.deaths),
    alive: normalizeOptionalBoolean(player.alive),
    respawnSeconds: normalizeOptionalNumber(player.respawn_seconds ?? player.respawnSeconds),
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
    deaths: normalizeOptionalNumber(player.deaths),
    alive: normalizeOptionalBoolean(hero.alive),
    respawnSeconds: normalizeOptionalNumber(hero.respawn_seconds ?? hero.respawnSeconds),
    hasItemData: hasInspectableItemData(player) || hasInspectableItemData(payload.items),
    hasAegis: hasAegisItem(player) || hasAegisItem(payload.items)
  };
}

function currentPlayerTopbarSlot(payload, player, forceVisualFirst) {
  const team = String(player.team_name || player.team || '').toLowerCase();
  if (player.team_slot !== undefined || player.teamSlot !== undefined) {
    const slot = normalizePlayerSlot(player.team_slot ?? player.teamSlot, player);
    if (slot !== null) return slot;
  }
  if (player.player_slot !== undefined || player.playerSlot !== undefined) {
    const slot = normalizePlayerSlot(player.player_slot ?? player.playerSlot, player);
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
    const slot = normalizePlayerSlot(rosterPlayer.team_slot ?? rosterPlayer.teamSlot ?? rosterPlayer.player_slot ?? rosterPlayer.playerSlot, rosterPlayer);
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

function normalizeOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeOptionalBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
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
    deaths: currentPlayer.deaths ?? merged[existingIndex].deaths ?? null,
    alive: currentPlayer.alive ?? merged[existingIndex].alive ?? null,
    respawnSeconds: currentPlayer.respawnSeconds ?? merged[existingIndex].respawnSeconds ?? null,
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
    if (numeric >= 0 && numeric <= 4) {
      if (team.includes('dire') || team.includes('bad')) return Math.trunc(numeric + 5);
      if (team.includes('radiant') || team.includes('good')) return Math.trunc(numeric);
      return Math.trunc(numeric);
    }
    if (numeric >= 128 && numeric <= 132) return Math.trunc(numeric - 128 + 5);
    if (numeric >= 5 && numeric <= 9) return Math.trunc(numeric);
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
  const itemId = Number(value.id ?? value.item_id ?? value.itemId);
  if (aegisItemIds.has(itemId)) return ['item_aegis'];
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

function extractLatestAegisEvent(payload, players, clockTime = null) {
  const events = collectEventEntries(payload);
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = expandEventData(events[index]);
    const eventText = [
      event.event_type,
      event.eventType,
      event.type,
      event.name,
      event.key
    ].filter(Boolean).join(' ');

    if (!aegisPickupPattern.test(eventText)) continue;
    const holder = findAegisEventHolder(event, players);
    if (holder) {
      const pickedAt = normalizeAegisEventTime(event, clockTime);
      if (pickedAt === false) continue;
      return {
        holder: {
          ...holder,
          pickedAt
        }
      };
    }
  }
  return null;
}

function normalizeAegisEventTime(event, clockTime) {
  const eventTime = normalizeEventTime(event);
  const current = normalizedClock(clockTime);
  if (!Number.isFinite(eventTime)) return null;
  if (!Number.isFinite(current)) return eventTime;
  if (eventTime > current + 5) return null;
  if (current - eventTime >= aegisDurationSeconds) return false;
  return eventTime;
}

function optionalNumber(value) {
  if (value === null || value === undefined || value === '') return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function collectEventEntries(payload) {
  const entries = [];
  appendEventEntries(entries, payload?.events);
  appendEventEntries(entries, payload?.added?.events);
  return entries;
}

function appendEventEntries(entries, value) {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((event) => appendEventEntries(entries, event));
    return;
  }
  if (typeof value !== 'object') return;
  if (value.event_type || value.eventType || value.type || value.name) {
    entries.push(value);
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (item && typeof item === 'object') {
      entries.push({ key, ...item });
    }
  }
}

function expandEventData(event) {
  const expanded = { ...(event || {}) };
  const rawData = expanded.data;
  if (typeof rawData === 'string') {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === 'object') Object.assign(expanded, parsed);
    } catch {
      // Some Dota events carry plain text data; the event_type is still enough.
    }
  } else if (rawData && typeof rawData === 'object') {
    Object.assign(expanded, rawData);
  }
  return expanded;
}

function findAegisEventHolder(event, players) {
  const slot = normalizeEventPlayerSlot(
    event.player_id
      ?? event.playerId
      ?? event.playerid
      ?? event.playerid1
      ?? event.player_slot
      ?? event.playerSlot,
    event
  );
  const accountId = normalizeAccountId(event.accountid ?? event.account_id ?? event.accountId ?? event.steamid ?? event.steam_id);
  const heroToken = normalizeHeroToken(event.hero_name || event.heroName || event.hero || event.hero_id || event.heroId || '');
  const player = (slot !== null ? players.find((item) => item.slot === slot) : null)
    || (accountId ? players.find((item) => item.accountId === accountId) : null)
    || (heroToken ? players.find((item) => normalizeHeroToken(item.hero) === heroToken) : null)
    || null;

  if (player) {
    return {
      slot: player.slot,
      accountId: player.accountId || accountId,
      name: player.name,
      source: 'event'
    };
  }
  if (slot === null) return null;
  return {
    slot,
    accountId,
    name: '',
    source: 'event'
  };
}

function normalizeEventPlayerSlot(value, event) {
  if (value === undefined || value === null || value === '') return null;
  return normalizePlayerSlot(value, {
    team_name: event.team_name || event.team || event.player_team || event.playerTeam || ''
  });
}

function normalizeEventTime(event) {
  const time = Number(event.game_time ?? event.gameTime ?? event.clock_time ?? event.clockTime ?? event.time);
  return Number.isFinite(time) ? Math.max(0, time) : null;
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
