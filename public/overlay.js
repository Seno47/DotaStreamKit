const queueMask = document.querySelector('#queueMask');
const draftScreenMask = document.querySelector('#draftScreenMask');
const minimapMask = document.querySelector('#minimapMask');
const spectatorGameLabelEl = document.querySelector('#spectatorGameLabel');
const topBarSlotsRoot = document.querySelector('#topBarSlots');
const matchIntelRoot = document.querySelector('#matchIntel');
const streamerStatsEl = document.querySelector('#streamerStats');
const streamerMmrGoalEl = document.querySelector('#streamerMmrGoal');
const predictionOverlayEl = document.querySelector('#predictionOverlay');
let queuePartEls = [];
let topBarSlotEls = [];
let matchIntelSlotEls = [];
let draftPartEls = [];
let minimapLayerEl = null;
let minimapVisionImageEl = null;
let roshanIntelEl = null;
let streamerStatsNodes = null;
let streamerMmrGoalNodes = null;
let predictionOverlayNodes = null;
let predictionOverlayAnimation = null;
let predictionOverlayFinalSync = null;
let lastOverlaySnapshot = null;
const predictionOverlayFinalHoldMs = 4000;
const streamerMmrGoalTemplates = ['classic', 'bubbles', 'neon', 'minimal', 'lightning', 'eye', 'scanner', 'sparks', 'glitch'];
const streamerMmrGoalTemplateClasses = streamerMmrGoalTemplates.map((template) => `streamer-goal-template-${template}`);
const streamerMmrGoalStyleDefaults = {
  template: 'classic',
  fillStart: '#63c9ff',
  fillEnd: '#8df0a1',
  track: '#101720',
  accent: '#ffdf91',
  text: '#f8f1df',
  barHeight: 13,
  barRadius: 7,
  glow: 12,
  animated: true,
  currentPrefix: '',
  currentSuffix: '',
  targetPrefix: '/ ',
  targetSuffix: '',
  deltaPrefix: '+',
  deltaSuffix: '',
  customCss: ''
};

const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  lastOverlaySnapshot = JSON.parse(event.data);
  renderOverlay(lastOverlaySnapshot);
};

setInterval(() => {
  if (lastOverlaySnapshot) renderOverlay(lastOverlaySnapshot);
}, 1000);

function renderOverlay({ config, state }) {
  const reference = normalizeReference(config.protection.referenceSize);
  const draftParts = config.protection.draftMaskParts || [];
  const queueParts = queueMaskParts(config.protection, reference);
  const slots = config.protection.topBarSlots || [];
  const matchIntelSlots = config.protection.matchIntelSlots || slots;
  ensureQueueParts(queueParts.length);
  ensureDraftParts(draftParts.length);
  ensureTopBarSlots(slots.length);
  ensureMatchIntelSlots(matchIntelSlots.length);
  applyQueueParts(queueParts, reference, state);
  applyDraftParts(draftParts, reference, state);
  applyTopBarSlots(slots, reference, state);
  const spectatorView = isSpectatingGameView(state);
  const matchIntelSettings = spectatorView
    ? (config.protection.spectatorMatchIntel || config.protection.matchIntel || {})
    : (config.protection.matchIntel || {});
  const predictionSettings = state.activePrediction?.profile === 'spectator'
    ? (config.spectatorPredictions || config.predictions || {})
    : (config.predictions || {});
  applyMatchIntel(matchIntelSlots, reference, matchIntelSettings, state);
  applyStreamerStats(reference, config.protection || {}, state);
  applyStreamerMmrGoal(reference, config.protection || {}, state);
  applyPredictionOverlay(reference, predictionSettings, matchIntelSettings, state);
  applyMinimap(config.protection, reference, state);
  applySpectatorGameLabel(config.protection, reference, state);
  setVisible(minimapMask, state.protection.minimap);
}

function queueMaskParts(protection, reference) {
  if ((protection.queueMode || 'partial') === 'full') {
    return [{ left: 0, top: 0, width: reference.width, height: reference.height }];
  }

  const profileRight = clampNumber(protection.queueProfileRight, 0, reference.width, 398);
  const chat = normalizeBox(protection.queueChatBox, { left: 616, top: 742, width: 688, height: 317 }, reference);
  const chatRight = chat.left + chat.width;
  const chatBottom = chat.top + chat.height;
  return [
    { left: profileRight, top: 0, width: reference.width - profileRight, height: chat.top },
    { left: profileRight, top: chat.top, width: Math.max(0, chat.left - profileRight), height: chat.height },
    { left: chatRight, top: chat.top, width: reference.width - chatRight, height: chat.height },
    { left: profileRight, top: chatBottom, width: reference.width - profileRight, height: reference.height - chatBottom }
  ].filter((part) => part.width > 0 && part.height > 0);
}

function normalizePartBox(part, reference) {
  const left = Number(part.left || 0);
  const width = Number(part.width || 0);
  const height = Number(part.height || 0);
  const top = part.bottom !== undefined
    ? reference.height - Number(part.bottom || 0) - height
    : Number(part.top || 0);
  return { left, top, width, height };
}

function normalizeReference(reference) {
  const width = Number(reference?.width);
  const height = Number(reference?.height);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return { width: 1920, height: 1080 };
  }
  return { width, height };
}

function normalizeBox(box, fallback, reference) {
  const left = clampNumber(box?.left, 0, reference.width, fallback.left);
  const top = clampNumber(box?.top, 0, reference.height, fallback.top);
  const width = clampNumber(box?.width, 0, reference.width - left, fallback.width);
  const height = clampNumber(box?.height, 0, reference.height - top, fallback.height);
  return { left, top, width, height };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function ensureQueueParts(count) {
  while (queuePartEls.length < count) {
    const el = document.createElement('div');
    el.className = 'queueMaskPart';
    queueMask.append(el);
    queuePartEls.push(el);
  }
  while (queuePartEls.length > count) {
    queuePartEls.pop().remove();
  }
}

function ensureDraftParts(count) {
  while (draftPartEls.length < count) {
    const el = document.createElement('div');
    el.className = 'draftMaskPart';
    draftScreenMask.append(el);
    draftPartEls.push(el);
  }
  while (draftPartEls.length > count) {
    draftPartEls.pop().remove();
  }
}

function ensureTopBarSlots(count) {
  while (topBarSlotEls.length < count) {
    const el = document.createElement('div');
    el.className = 'topBarSlot';
    topBarSlotsRoot.append(el);
    topBarSlotEls.push(el);
  }
  while (topBarSlotEls.length > count) {
    topBarSlotEls.pop().remove();
  }
}

function ensureMatchIntelSlots(count) {
  while (matchIntelSlotEls.length < count) {
    const el = document.createElement('div');
    el.className = 'matchIntelSlot';
    matchIntelRoot.append(el);
    matchIntelSlotEls.push(el);
  }
  while (matchIntelSlotEls.length > count) {
    matchIntelSlotEls.pop().remove();
  }
  if (!roshanIntelEl) {
    roshanIntelEl = document.createElement('div');
    roshanIntelEl.className = 'roshanIntel';
    matchIntelRoot.append(roshanIntelEl);
  }
}

function applyQueueParts(parts, reference, state) {
  const version = assetVersion(state);
  parts.forEach((part, index) => {
    const el = queuePartEls[index];
    applyScaledBox(el, part, reference);
    el.style.backgroundImage = `url('/assets/queue-screenshot.png?v=${version}')`;
    el.style.backgroundSize = '100vw 100vh';
    el.style.backgroundPosition = `${-toPercent(part.left, reference.width)}vw ${-toPercent(part.top, reference.height)}vh`;
    setVisible(el, state.protection.queue);
  });
}

function applyDraftParts(parts, reference, state) {
  const version = assetVersion(state);
  parts.forEach((part, index) => {
    const el = draftPartEls[index];
    applyScaledBox(el, part, reference);
    el.style.backgroundImage = `url('/assets/draft-screenshot.png?v=${version}')`;
    el.style.backgroundSize = '100vw 100vh';
    el.style.backgroundPosition = `${-toPercent(part.left, reference.width)}vw ${-toPercent(part.top, reference.height)}vh`;
    setVisible(el, state.protection.draft);
  });
}

function applyTopBarSlots(slots, reference, state) {
  const version = assetVersion(state);
  const visible = state.protection.draft || state.protection.topBar;
  slots.forEach((slot, index) => {
    const el = topBarSlotEls[index];
    applyScaledBox(el, slot, reference);
    el.style.backgroundImage = `url('/assets/${encodeURIComponent(slot.asset)}?v=${version}')`;
    setVisible(el, visible && shouldHideDraftSlot(index, state));
  });
}

function shouldHideDraftSlot(index, state) {
  const protection = lastOverlaySnapshot?.config?.protection || {};
  if ((protection.draftHideMode || 'all') !== 'streamer_team') return true;
  const team = String(state.gsi?.playerTeam || '').toLowerCase();
  if (team === 'radiant') return index < 5;
  if (team === 'dire') return index >= 5;
  return true;
}

function applyMatchIntel(slots, reference, settings, state) {
  const intel = state.matchIntel || {};
  const version = assetVersion(state);
  const enabled = isMatchIntelActive(settings, state);
  const gameState = String(state.gsi?.gameState || '');
  const preGameState = /PRE_GAME/i.test(gameState);
  const clockTime = Number(state.gsi?.clockTime);
  const rankCutoff = Number(settings.rankDisplayMinutes || 12) * 60;
  const fullGameRanks = settings.rankDisplayMode === 'full_game';
  const preGameOnlyRanks = settings.rankDisplayMode === 'pre_game_only';
  const gameClockStarted = Number.isFinite(clockTime) && clockTime >= 0;
  const spectatingMatch = isSpectatingMatch(state);
  const withinNotableWindow = preGameState || (
    !preGameOnlyRanks
    && (
      gameClockStarted
        ? (fullGameRanks || clockTime <= rankCutoff)
        : spectatingMatch
    )
  );
  const showNames = enabled && settings.showPlayerRanks !== false && withinNotableWindow;
  const showFlags = enabled && settings.showPlayerFlags === true && withinNotableWindow;
  const playersByAccountId = new Map((intel.players || []).filter((player) => player?.accountId).map((player) => [String(player.accountId), player]));
  const ranksBySlot = new Map((intel.notablePlayers || []).map((player) => [Number(player.slot), player]));
  const aegis = intel.aegis || null;
  const showAegis = enabled
    && /GAME_IN_PROGRESS/i.test(gameState)
    && Number.isFinite(clockTime)
    && settings.showAegisTimer !== false
    && settings.showAegisRoshan !== false
    && aegis
    && Number(aegis.expiresAt) > clockTime;
  const aegisSlot = showAegis ? resolveAegisSlot(aegis, playersByAccountId) : null;

  slots.forEach((slot, index) => {
    const el = matchIntelSlotEls[index];
    const rank = ranksBySlot.get(index);
    const hasAegis = showAegis && aegisSlot === index;
    applyScaledBox(el, {
      left: slot.left + slot.width / 2 - 44,
      top: slot.top + slot.height + 5,
      width: 88,
      height: 58
    }, reference);
    hideBadge(el, 'rankBadge');
    setNameBadge(el, showNames && rank?.name, rank?.name || '');
    setFlagBadge(el, showFlags && rank?.countryCode, rank?.countryCode || '');
    if (hasAegis) {
      const remaining = Math.max(0, Math.min(300, Math.ceil(Number(aegis.expiresAt) - clockTime)));
      setImageBadge(el, 'aegisBadge', true, `/assets/aegis.png?v=${version}`, formatClock(remaining));
    } else {
      setImageBadge(el, 'aegisBadge', false, `/assets/aegis.png?v=${version}`, '');
    }
    setVisible(el, enabled && hasVisibleBadge(el));
  });

  applyRoshanIntel(reference, settings, state, version, slots);
}

function resolveAegisSlot(aegis, playersByAccountId) {
  if (!aegis) return null;
  const accountId = aegis.accountId !== undefined && aegis.accountId !== null ? String(aegis.accountId) : '';
  if (accountId && playersByAccountId.has(accountId)) {
    const player = playersByAccountId.get(accountId);
    const slot = Number(player?.slot);
    if (Number.isFinite(slot)) return slot;
  }
  const slot = Number(aegis.slot);
  return Number.isFinite(slot) ? slot : null;
}

function isMatchIntelActive(settings, state) {
  if (settings.enabled === false || !state.gsi?.connected) return false;
  if (state.gsi?.leftGameView) return false;
  const gameState = String(state.gsi?.gameState || '');
  if (/POST_GAME|GAME_END|DISCONNECT/i.test(gameState)) return false;
  if (/PRE_GAME/i.test(gameState)) return true;
  if (gameState) return /GAME_IN_PROGRESS/i.test(gameState);
  if (isSpectatingMatch(state)) return true;
  return Number.isFinite(Number(state.gsi?.clockTime)) && Number(state.gsi?.clockTime) >= 0;
}

function isSpectatingMatch(state) {
  const activity = String(state.gsi?.playerActivity || '').toLowerCase();
  const gameState = String(state.gsi?.gameState || '');
  const players = state.matchIntel?.players || [];
  return activity === 'spectating'
    && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState)
    && Array.isArray(players)
    && players.some((player) => player?.accountId);
}

function isSpectatingGameView(state) {
  const activity = String(state.gsi?.playerActivity || '').toLowerCase();
  const gameState = String(state.gsi?.gameState || '');
  return activity === 'spectating'
    && !state.gsi?.leftGameView
    && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState)
    && Boolean(state.gsi?.activeMatchId || state.gsi?.matchId);
}

function setImageBadge(parent, className, visible, src, text) {
  const badge = ensureBadge(parent, className);
  let img = badge.querySelector('img');
  let span = badge.querySelector('span');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    badge.append(img);
  }
  if (!span) {
    span = document.createElement('span');
    badge.append(span);
  }
  if (img.getAttribute('src') !== src) img.src = src;
  span.textContent = text || '';
  badge.hidden = !visible;
}

function setTextBadge(parent, className, visible, text) {
  const badge = ensureBadge(parent, className);
  let span = badge.querySelector('span');
  if (!span) {
    span = document.createElement('span');
    badge.append(span);
  }
  span.textContent = text || '';
  badge.hidden = !visible;
}

function setNameBadge(parent, visible, text) {
  const badge = ensureBadge(parent, 'nameBadge');
  let span = badge.querySelector('span');
  if (!span) {
    span = document.createElement('span');
    badge.append(span);
  }
  const name = String(text || '').trim();
  span.textContent = name;
  span.style.fontSize = `${nameFontSize(name)}px`;
  badge.title = name;
  badge.hidden = !visible || !name;
}

function hideBadge(parent, className) {
  const badge = parent.querySelector(`:scope > .${className}`);
  if (badge) badge.hidden = true;
}

function setFlagBadge(parent, visible, countryCode) {
  const badge = ensureBadge(parent, 'flagBadge');
  for (const child of [...badge.children]) {
    if (child.tagName !== 'IMG') child.remove();
  }
  let img = badge.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    badge.append(img);
  }
  const code = normalizeCountryCode(countryCode);
  const src = code ? countryFlagUrl(code) : '';
  if (src && img.getAttribute('src') !== src) img.src = src;
  img.alt = code ? `${code} flag` : '';
  badge.title = code || '';
  badge.hidden = !visible || !code;
}

function ensureBadge(parent, className) {
  let badge = parent.querySelector(`:scope > .${className}`);
  if (!badge) {
    badge = document.createElement('div');
    badge.className = className;
    parent.append(badge);
  }
  return badge;
}

function hasVisibleBadge(parent) {
  return [...parent.children].some((child) => !child.hidden);
}

function normalizeCountryCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : '';
}

function countryFlagUrl(code) {
  const normalized = normalizeCountryCode(code).toLowerCase();
  if (!normalized) return '';
  return localFlagSvgDataUrl(normalized) || `https://flagcdn.com/w40/${normalized}.png`;
}

function localFlagSvgDataUrl(code) {
  const svg = {
    by: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#c8313e" d="M0 0h30v13.2H0z"/><path fill="#4aa657" d="M0 13.2h30V20H0z"/><path fill="#fff" d="M0 0h6v20H0z"/><path fill="#c8313e" d="M1 1h1v2H1zm2 2h1v2H3zM1 5h1v2H1zm2 2h1v2H3zM1 9h1v2H1zm2 2h1v2H3zm-2 4h1v2H1zm2 2h1v2H3z"/></svg>',
    ru: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#fff" d="M0 0h30v20H0z"/><path fill="#1f4ba8" d="M0 6.67h30v6.66H0z"/><path fill="#d52b1e" d="M0 13.33h30V20H0z"/></svg>',
    ua: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#005bbb" d="M0 0h30v10H0z"/><path fill="#ffd500" d="M0 10h30v10H0z"/></svg>',
    se: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#006aa7" d="M0 0h30v20H0z"/><path fill="#fecc00" d="M0 8h30v4H0z"/><path fill="#fecc00" d="M9 0h4v20H9z"/></svg>',
    us: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#b22234" d="M0 0h30v20H0z"/><path stroke="#fff" stroke-width="1.54" d="M0 2.31h30M0 5.38h30M0 8.46h30M0 11.54h30M0 14.62h30M0 17.69h30"/><path fill="#3c3b6e" d="M0 0h12.4v10.8H0z"/></svg>',
    kz: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><path fill="#00afca" d="M0 0h30v20H0z"/><circle cx="15" cy="9" r="3.2" fill="#f6c400"/><path fill="#f6c400" d="M14 12h2l-1 3zM4 0h1.6v20H4z"/></svg>'
  }[code];
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : '';
}

function nameFontSize(name) {
  const length = String(name || '').trim().length;
  if (length > 18) return 7;
  if (length > 14) return 8;
  if (length > 10) return 9;
  if (length > 7) return 10;
  return 11;
}

function applyRoshanIntel(reference, settings, state, version, slots) {
  if (!roshanIntelEl) return;
  const intel = state.matchIntel || {};
  const status = intel.roshanStatus;
  const enabled = isMatchIntelActive(settings, state) && settings.showRoshanTimer !== false && settings.showAegisRoshan !== false && status && status.phase !== 'possible';
  if (!enabled) {
    setVisible(roshanIntelEl, false);
    return;
  }

  const text = roshanText(status);
  let img = roshanIntelEl.querySelector('img');
  let span = roshanIntelEl.querySelector('span');
  if (!img) {
    img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    roshanIntelEl.append(img);
  }
  if (!span) {
    span = document.createElement('span');
    roshanIntelEl.append(span);
  }
  const src = `/assets/roshan.png?v=${version}`;
  if (img.getAttribute('src') !== src) img.src = src;
  span.textContent = text;
  const firstSlot = slots.reduce((leftmost, slot) => !leftmost || Number(slot.left) < Number(leftmost.left) ? slot : leftmost, null);
  const box = firstSlot
    ? { left: Math.max(0, Number(firstSlot.left) - 230), top: Number(firstSlot.top || 0) + 6, width: 145, height: 34 }
    : { left: 318, top: 6, width: 145, height: 34 };
  applyScaledBox(roshanIntelEl, withOverlayOffset(box, settings.overlayPositions?.roshanTimer), reference);
  setVisible(roshanIntelEl, true);
}

function applyMinimap(protection, reference, state) {
  const size = protection.minimapSize || 'normal';
  const side = protection.minimapSide || 'left';
  const style = ['realistic', 'simple', 'empty'].includes(protection.minimapStyle) ? protection.minimapStyle : 'realistic';
  const boxes = protection.minimapBoxes || {};
  const box = boxes[size] || boxes.normal || protection.minimapBox;
  const contentAreas = protection.minimapContentAreas || {};
  const rawContentArea = contentAreas[size] || contentAreas.normal || { left: 0, top: 0, width: 100, height: 100 };
  const contentArea = side === 'right' ? mirrorPercentBox(rawContentArea) : rawContentArea;
  const version = assetVersion(state);
  applyScaledBox(minimapMask, box, reference, side);
  minimapMask.style.opacity = String(protection.minimapOpacity ?? 0.92);
  ensureMinimapLayer();
  applyPercentBox(minimapLayerEl, contentArea);
  minimapLayerEl.classList.toggle('rightSide', side === 'right');
  const src = `/assets/fake-minimap-vision-${style}.png?v=${version}`;
  if (minimapVisionImageEl.getAttribute('src') !== src) {
    minimapVisionImageEl.src = src;
  }
  minimapVisionImageEl.alt = '';
}

function applySpectatorGameLabel(protection, reference, state) {
  if (!spectatorGameLabelEl) return;
  const settings = protection.spectatorMatchIntel || {};
  const gameId = state.gsi?.activeMatchId || state.gsi?.matchId || '';
  if (settings.showSpectatorGameLabel === false || !isSpectatingGameView(state)) {
    setVisible(spectatorGameLabelEl, false);
    return;
  }

  const text = renderSpectatorGameLabelText(settings.spectatorGameLabelTemplate, gameId);
  if (!text) {
    setVisible(spectatorGameLabelEl, false);
    return;
  }

  spectatorGameLabelEl.textContent = text;
  applyScaledBox(spectatorGameLabelEl, spectatorGameLabelBox(protection, reference), reference, protection.minimapSide || 'left');
  setVisible(spectatorGameLabelEl, true);
}

function spectatorGameLabelBox(protection, reference) {
  const box = minimapBoxForProtection(protection, reference);
  const height = 34;
  const gap = 8;
  const lowerOffset = height * 1.5;
  return {
    left: box.left,
    bottom: Math.min(reference.height - height, Math.max(0, box.bottom + box.height + gap - lowerOffset)),
    width: Math.max(box.width, 330),
    height
  };
}

function minimapBoxForProtection(protection, reference) {
  const size = protection.minimapSize || 'normal';
  const boxes = protection.minimapBoxes || {};
  const fallback = size === 'large'
    ? { left: 0, bottom: 0, width: 326, height: 326 }
    : { left: 0, bottom: 0, width: 272, height: 280 };
  const source = boxes[size] || boxes.normal || protection.minimapBox || fallback;
  const left = clampNumber(source.left, 0, reference.width, fallback.left);
  const width = clampNumber(source.width, 1, reference.width - left, fallback.width);
  const height = clampNumber(source.height, 1, reference.height, fallback.height);
  const fallbackTop = reference.height - fallback.bottom - fallback.height;
  const top = clampNumber(source.top, 0, reference.height - height, fallbackTop);
  const rawBottom = source.bottom !== undefined ? source.bottom : reference.height - top - height;
  const bottom = clampNumber(rawBottom, 0, reference.height - height, fallback.bottom);
  return { left, bottom, width, height };
}

function renderSpectatorGameLabelText(template, gameId) {
  const value = String(gameId || '').trim();
  return String(template || 'Spectating game: {game_id}')
    .replace(/\{game_id\}/g, value)
    .replace(/\{match_id\}/g, value)
    .replace(/\{gameId\}/g, value)
    .replace(/<gameId>/g, value)
    .replace(/<matchId>/g, value)
    .trim()
    .slice(0, 120);
}

function assetVersion(state) {
  return encodeURIComponent(state.startedAt || '1');
}

function ensureMinimapLayer() {
  if (minimapLayerEl) return;
  minimapLayerEl = document.createElement('div');
  minimapVisionImageEl = document.createElement('img');
  minimapLayerEl.className = 'minimapMapLayer';
  minimapVisionImageEl.className = 'minimapVisionImage';
  minimapVisionImageEl.decoding = 'async';
  minimapVisionImageEl.draggable = false;
  minimapLayerEl.append(minimapVisionImageEl);
  minimapMask.append(minimapLayerEl);
}

function applyPercentBox(el, box) {
  el.style.left = `${Number(box.left || 0)}%`;
  el.style.top = `${Number(box.top || 0)}%`;
  el.style.width = `${Number(box.width || 100)}%`;
  el.style.height = `${Number(box.height || 100)}%`;
}

function mirrorPercentBox(box) {
  const width = Number(box.width || 100);
  return {
    left: 100 - Number(box.left || 0) - width,
    top: Number(box.top || 0),
    width,
    height: Number(box.height || 100)
  };
}

function setVisible(el, visible) {
  el.classList.toggle('visible', Boolean(visible));
}

function applyBox(el, box) {
  if (!box) return;
  for (const [key, value] of Object.entries(box)) {
    if (value === null || value === undefined) continue;
    el.style[key] = typeof value === 'number' ? `${value}px` : value;
  }
}

function applyScaledBox(el, box, reference, side = 'left') {
  if (side === 'right') {
    el.style.right = `${toPercent(box.left, reference.width)}vw`;
    el.style.left = 'auto';
  } else {
    el.style.left = `${toPercent(box.left, reference.width)}vw`;
    el.style.right = 'auto';
  }
  if (box.bottom !== undefined) {
    el.style.bottom = `${toPercent(box.bottom, reference.height)}vh`;
    el.style.top = 'auto';
  } else {
    el.style.top = `${toPercent(box.top, reference.height)}vh`;
    el.style.bottom = 'auto';
  }
  el.style.width = `${toPercent(box.width, reference.width)}vw`;
  el.style.height = `${toPercent(box.height, reference.height)}vh`;
}

function toPercent(value, total) {
  return (Number(value) / Number(total)) * 100;
}

function roshanText(status) {
  if (status.phase === 'possible') return 'UP?';
  if (status.phase === 'window') return `0:00-${formatClock(status.latestRemaining)}`;
  return `${formatClock(status.earliestRemaining)}-${formatClock(status.latestRemaining)}`;
}

function applyPredictionOverlay(reference, predictionsConfig, overlaySettings, state) {
  if (!predictionOverlayEl) return;
  const prediction = state.activePrediction;
  if (!prediction?.id) {
    maybeRefreshPredictionOverlayAtClose(prediction, 0);
    resetPredictionOverlayAnimation();
    setVisible(predictionOverlayEl, false);
    return;
  }

  const remainingSeconds = predictionRemainingSeconds(prediction, predictionsConfig);
  maybeRefreshPredictionOverlayAtClose(prediction, remainingSeconds);
  if (!shouldShowPredictionOverlay(prediction, remainingSeconds)) {
    resetPredictionOverlayAnimation();
    setVisible(predictionOverlayEl, false);
    return;
  }

  const outcomes = predictionOverlayOutcomes(prediction);
  if (outcomes.length < 2) {
    resetPredictionOverlayAnimation();
    setVisible(predictionOverlayEl, false);
    return;
  }

  const nodes = ensurePredictionOverlayNodes();
  const totalPoints = outcomes.reduce((sum, outcome) => sum + outcome.points, 0);
  const layoutPercentages = outcomeLayoutPercentages(outcomes, totalPoints);
  const displayPercentages = outcomeDisplayPercentages(outcomes, totalPoints);
  setTextContent(nodes.title, prediction.title || '');
  setTextContent(nodes.timer, formatClock(remainingSeconds));

  outcomes.forEach((outcome, index) => {
    const colorClass = outcome.kind === 'no' || /pink|no/i.test(String(outcome.color || '')) ? 'no' : 'yes';
    nodes.fills[index].className = `predictionOverlayFill ${colorClass}`;
    nodes.fills[index].style.flexBasis = `${layoutPercentages[index]}%`;
    nodes.labels[index].className = `predictionOverlayLabel ${colorClass}${layoutPercentages[index] <= 28 ? ' compact' : ''}`;
    nodes.labels[index].style.left = `${index === 0 ? 0 : layoutPercentages[0]}%`;
    nodes.labels[index].style.width = `${layoutPercentages[index]}%`;
  });
  animatePredictionOverlayLabels(prediction.id, nodes, outcomes, displayPercentages, layoutPercentages);

  const box = withOverlayOffset(
    { left: 610, top: 104, width: 700, height: 96 },
    overlaySettings.overlayPositions?.predictionOverlay
  );
  applyScaledBox(predictionOverlayEl, box, reference);
  setVisible(predictionOverlayEl, true);
}

function shouldShowPredictionOverlay(prediction, remainingSeconds) {
  if (!prediction?.id) return false;
  const status = String(prediction.status || '').toUpperCase();
  if (status === 'ACTIVE') return remainingSeconds > 0 || isPredictionOverlayFinalHoldActive(prediction.id);
  if (status === 'LOCKED') return isPredictionOverlayFinalHoldActive(prediction.id);
  return false;
}

function maybeRefreshPredictionOverlayAtClose(prediction, remainingSeconds) {
  if (!prediction?.id) {
    predictionOverlayFinalSync = null;
    return;
  }

  const predictionId = String(prediction.id);
  if (predictionOverlayFinalSync?.predictionId !== predictionId) {
    predictionOverlayFinalSync = {
      predictionId,
      requested: false,
      holdUntil: 0
    };
  }

  if (remainingSeconds > 0 || predictionOverlayFinalSync.requested) return;

  predictionOverlayFinalSync.requested = true;
  predictionOverlayFinalSync.holdUntil = Math.max(
    predictionOverlayFinalSync.holdUntil,
    Date.now() + predictionOverlayFinalHoldMs
  );

  fetch('/api/twitch/predictions/active/refresh', { method: 'POST' })
    .then((response) => response.ok ? response.json() : null)
    .then((snapshot) => {
      if (predictionOverlayFinalSync?.predictionId !== predictionId) return;
      predictionOverlayFinalSync.holdUntil = Date.now() + predictionOverlayFinalHoldMs;
      if (snapshot?.config && snapshot?.state) {
        lastOverlaySnapshot = snapshot;
        renderOverlay(snapshot);
      }
    })
    .catch(() => {
      if (predictionOverlayFinalSync?.predictionId === predictionId) {
        predictionOverlayFinalSync.holdUntil = Date.now() + predictionOverlayFinalHoldMs;
      }
    });
}

function isPredictionOverlayFinalHoldActive(predictionId) {
  return predictionOverlayFinalSync?.predictionId === String(predictionId || '')
    && Date.now() < Number(predictionOverlayFinalSync.holdUntil || 0);
}

function predictionOverlayOutcomes(prediction) {
  const outcomes = (prediction.outcomes || []).map((outcome, index) => ({
    title: String(outcome.title || (index === 0 ? 'Yes' : 'No')).slice(0, 25),
    points: Math.max(0, Math.trunc(Number(outcome.channelPoints) || 0)),
    kind: outcome.kind || null,
    color: outcome.color || null,
    index
  }));
  const yes = outcomes.find((outcome) => outcome.kind === 'yes') || outcomes[0];
  const no = outcomes.find((outcome) => outcome.kind === 'no' && outcome !== yes)
    || outcomes.find((outcome) => outcome !== yes);
  return [yes, no].filter(Boolean);
}

function outcomeLayoutPercentages(outcomes, totalPoints) {
  if (totalPoints <= 0) return [50, 50];
  const first = clampNumber((outcomes[0].points / totalPoints) * 100, 24, 76, 50);
  return [first, 100 - first];
}

function outcomeDisplayPercentages(outcomes, totalPoints) {
  if (totalPoints <= 0) return [0, 0];
  const first = Math.round((outcomes[0].points / totalPoints) * 100);
  return [first, 100 - first];
}

function predictionRemainingSeconds(prediction, predictionsConfig) {
  const createdAt = Date.parse(prediction.createdAt || '');
  const windowSeconds = clampNumber(
    prediction.predictionWindowSeconds ?? predictionsConfig.windowSeconds,
    0,
    1800,
    predictionsConfig.windowSeconds || 180
  );
  if (!Number.isFinite(createdAt) || windowSeconds <= 0) return 0;
  return Math.max(0, Math.ceil((createdAt + windowSeconds * 1000 - Date.now()) / 1000));
}

function formatPredictionPoints(value) {
  return Math.max(0, Math.trunc(Number(value) || 0)).toLocaleString('en-US');
}

function animatePredictionOverlayLabels(predictionId, nodes, outcomes, targetPercentages, layoutPercentages) {
  const targetId = String(predictionId || '');
  const normalizedTargets = targetPercentages.map((value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0))));
  const compact = layoutPercentages.map((value) => Number(value) <= 28);
  const stateChanged = !predictionOverlayAnimation || predictionOverlayAnimation.predictionId !== targetId;
  if (stateChanged) {
    resetPredictionOverlayAnimation();
    predictionOverlayAnimation = {
      predictionId: targetId,
      values: [...normalizedTargets],
      targets: [...normalizedTargets],
      starts: [...normalizedTargets],
      startedAt: 0,
      duration: 700,
      frame: null,
      labels: nodes.labels,
      outcomes: predictionOverlayLabelData(outcomes, compact)
    };
    updatePredictionOverlayLabelText(predictionOverlayAnimation);
    return;
  }

  predictionOverlayAnimation.labels = nodes.labels;
  predictionOverlayAnimation.outcomes = predictionOverlayLabelData(outcomes, compact);
  if (sameNumberArray(predictionOverlayAnimation.targets, normalizedTargets)) {
    updatePredictionOverlayLabelText(predictionOverlayAnimation);
    return;
  }

  if (predictionOverlayAnimation.frame) cancelAnimationFrame(predictionOverlayAnimation.frame);
  predictionOverlayAnimation.starts = [...predictionOverlayAnimation.values];
  predictionOverlayAnimation.targets = [...normalizedTargets];
  predictionOverlayAnimation.startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - predictionOverlayAnimation.startedAt) / predictionOverlayAnimation.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    predictionOverlayAnimation.values = predictionOverlayAnimation.targets.map((target, index) => {
      const start = predictionOverlayAnimation.starts[index] ?? target;
      return Math.round(start + (target - start) * eased);
    });
    updatePredictionOverlayLabelText(predictionOverlayAnimation);
    if (progress < 1) {
      predictionOverlayAnimation.frame = requestAnimationFrame(tick);
    } else {
      predictionOverlayAnimation.frame = null;
      predictionOverlayAnimation.values = [...predictionOverlayAnimation.targets];
      updatePredictionOverlayLabelText(predictionOverlayAnimation);
    }
  };
  predictionOverlayAnimation.frame = requestAnimationFrame(tick);
}

function predictionOverlayLabelData(outcomes, compact) {
  return outcomes.map((outcome, index) => ({
    title: outcome.title,
    points: outcome.points,
    compact: Boolean(compact[index])
  }));
}

function updatePredictionOverlayLabelText(animation) {
  animation.labels.forEach((label, index) => {
    const outcome = animation.outcomes[index];
    if (!outcome) return;
    const percent = Math.max(0, Math.min(100, Math.round(animation.values[index] || 0)));
    const text = outcome.compact
      ? `${outcome.title} ${percent}%`
      : `${outcome.title} ${percent}% (${formatPredictionPoints(outcome.points)})`;
    setTextContent(label, text);
  });
}

function resetPredictionOverlayAnimation() {
  if (predictionOverlayAnimation?.frame) cancelAnimationFrame(predictionOverlayAnimation.frame);
  predictionOverlayAnimation = null;
}

function sameNumberArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function ensurePredictionOverlayNodes() {
  if (predictionOverlayNodes) return predictionOverlayNodes;
  const title = document.createElement('div');
  const bar = document.createElement('div');
  const fills = [document.createElement('span'), document.createElement('span')];
  const labels = [document.createElement('span'), document.createElement('span')];
  const timer = document.createElement('div');
  title.className = 'predictionOverlayTitle';
  bar.className = 'predictionOverlayBar';
  timer.className = 'predictionOverlayTimer';
  fills.forEach((fill) => bar.append(fill));
  labels.forEach((label) => bar.append(label));
  predictionOverlayEl.replaceChildren(title, bar, timer);
  predictionOverlayNodes = { title, bar, fills, labels, timer };
  return predictionOverlayNodes;
}

function applyStreamerStats(reference, protection, state) {
  if (!streamerStatsEl) return;
  const spectatorView = isSpectatingGameView(state);
  const settings = spectatorView
    ? (protection.spectatorMatchIntel || protection.matchIntel || {})
    : (protection.matchIntel || {});
  const stats = state.streamerStats || {};
  const gameState = String(state.gsi?.gameState || '');
  const visibleState = shouldShowStreamerStatsInOverlay(state);
  if (!settings.showStreamerStats || !visibleState) {
    setVisible(streamerStatsEl, false);
    return;
  }

  const nodes = ensureStreamerStatsNodes();
  const medal = stats.medal;
  const calibrationMedal = String(medal?.id || '') === 'calibration';
  streamerStatsEl.classList.toggle('calibrationMedal', calibrationMedal);
  const hideDraftSummary = shouldHideStreamerSummaryDuringDraft(state, gameState);
  if (!hideDraftSummary && settings.showStreamerRankMedal !== false && medal?.id) {
    const src = `/assets/rank-medal-${encodeURIComponent(medal.id)}.png?v=${assetVersion(state)}`;
    if (nodes.medal.getAttribute('src') !== src) nodes.medal.src = src;
    nodes.medalWrap.hidden = false;
    streamerStatsEl.style.setProperty('--streamer-medal-gap-offset', `${streamerMedalGapOffset(medal.id)}px`);
    const stars = Math.max(0, Math.min(5, Number(medal.stars || 0)));
    if (stars > 0) {
      const pipsSrc = `/assets/rank-pip-${stars}.png?v=${assetVersion(state)}`;
      if (nodes.pips.getAttribute('src') !== pipsSrc) nodes.pips.src = pipsSrc;
      nodes.pips.hidden = false;
    } else {
      nodes.pips.hidden = true;
    }
  } else {
    nodes.medalWrap.hidden = true;
    nodes.pips.hidden = true;
    streamerStatsEl.style.setProperty('--streamer-medal-gap-offset', '0px');
  }

  if (!hideDraftSummary && settings.showStreamerWinLoss !== false) {
    setTextContent(nodes.winNumber, Math.max(0, Number(stats.wins || 0)));
    setTextContent(nodes.lossNumber, Math.max(0, Number(stats.losses || 0)));
    nodes.winLoss.hidden = false;
  } else {
    nodes.winLoss.hidden = true;
  }
  const leaderboardRank = Number(stats.accountLeaderboardRank || 0);
  if (
    settings.showStreamerRankMedal !== false
    && leaderboardRank >= 1
    && leaderboardRank <= 25000
    && !nodes.medalWrap.hidden
  ) {
    setTextContent(nodes.leaderboard, `#${Math.trunc(leaderboardRank)}`);
    nodes.leaderboard.hidden = false;
  } else {
    nodes.leaderboard.hidden = true;
  }
  streamerStatsEl.classList.toggle('hasLeaderboard', !nodes.leaderboard.hidden);
  const mmr = Number(stats.currentMmr || settings.streamerMmr || 0);
  if (settings.showStreamerMmr !== false && mmr > 0) {
    setTextContent(nodes.mmr, formatStreamerMmr(mmr));
    nodes.mmr.hidden = false;
  } else {
    nodes.mmr.hidden = true;
  }
  nodes.mmrLine.hidden = nodes.mmr.hidden;
  if (nodes.medalWrap.hidden && nodes.leaderboard.hidden && nodes.winLoss.hidden && nodes.mmrLine.hidden) {
    setVisible(streamerStatsEl, false);
    return;
  }

  const minimapSide = protection.minimapSide === 'right' ? 'right' : 'left';
  const inLiveGame = !spectatorView && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState);
  streamerStatsEl.classList.toggle('mainMenuScale', !inLiveGame);
  streamerStatsEl.classList.toggle('liveGameScale', inLiveGame);
  const left = inLiveGame
    ? minimapSide === 'right' ? 302 : 1390
    : minimapSide === 'right' ? 1500 : 1276;
  const box = inLiveGame
    ? { left, bottom: 8, width: 260, height: 150 }
    : { left, top: 18, width: 170, height: 116 };
  const offset = inLiveGame
    ? settings.overlayPositions?.streamerStatsGame
    : settings.overlayPositions?.streamerStatsMenu;
  applyScaledBox(streamerStatsEl, withOverlayOffset(box, offset), reference);
  setVisible(streamerStatsEl, true);
}

function applyStreamerMmrGoal(reference, protection, state) {
  if (!streamerMmrGoalEl) return;
  const spectatorView = isSpectatingGameView(state);
  const settings = spectatorView
    ? (protection.spectatorMatchIntel || protection.matchIntel || {})
    : (protection.matchIntel || {});
  const goal = state.streamerStats?.mmrGoal || null;
  const gameState = String(state.gsi?.gameState || '');
  if (!settings.showStreamerStats || !settings.showStreamerMmrGoal || !goal || !shouldShowStreamerStatsInOverlay(state)) {
    setVisible(streamerMmrGoalEl, false);
    return;
  }

  const nodes = ensureStreamerMmrGoalNodes();
  const goalStyle = applyStreamerMmrGoalStyle(streamerMmrGoalEl, settings);
  applyStreamerMmrGoalCustomCss(goalStyle.customCss);
  const progress = clampNumber(goal.progress, 0, 100, 0);
  const currentMmr = formatStreamerMmr(goal.currentMmr);
  const targetMmr = formatStreamerMmr(goal.targetMmr);
  const remainingMmr = Math.max(0, Math.trunc(Number(goal.remainingMmr || 0)));
  const wins = Math.max(0, Math.trunc(Number(goal.wins || 0)));
  const losses = Math.max(0, Math.trunc(Number(goal.losses || 0)));
  const total = wins + losses;

  setTextContent(nodes.percent, `${formatGoalPercent(progress)}%`);
  nodes.progress.hidden = settings.showStreamerMmrGoalProgress === false;
  nodes.percent.hidden = settings.showStreamerMmrGoalProgress === false;
  nodes.fill.style.width = `${progress}%`;
  setTextContent(nodes.current, formatGoalText(goalStyle.currentPrefix, currentMmr, goalStyle.currentSuffix));
  nodes.current.hidden = settings.showStreamerMmrGoalCurrent === false;
  setTextContent(nodes.target, formatGoalText(goalStyle.targetPrefix, targetMmr, goalStyle.targetSuffix));
  nodes.target.hidden = settings.showStreamerMmrGoalTarget === false;
  streamerMmrGoalEl.dataset.backgroundHidden = settings.showStreamerMmrGoalBackground === false ? 'true' : 'false';
  setTextContent(nodes.delta, remainingMmr > 0 ? formatGoalText(goalStyle.deltaPrefix, formatStreamerMmr(remainingMmr), goalStyle.deltaSuffix) : 'DONE');
  nodes.delta.hidden = settings.showStreamerMmrGoalDelta === false;
  setTextContent(nodes.record, `W ${wins} - L ${losses}`);
  nodes.record.hidden = settings.showStreamerMmrGoalRecord === false;
  setTextContent(nodes.winRate, total > 0 && goal.winRate !== null ? `${formatGoalPercent(goal.winRate)}% WR` : '- WR');
  nodes.winRate.hidden = settings.showStreamerMmrGoalWinRate === false;
  setTextContent(nodes.eta, remainingMmr > 0 ? `${Math.max(0, Number(goal.requiredWins || 0))}W` : 'DONE');
  nodes.eta.hidden = settings.showStreamerMmrGoalEta === false;
  nodes.meta.hidden = settings.showStreamerMmrGoalCurrent === false
    && settings.showStreamerMmrGoalTarget === false
    && settings.showStreamerMmrGoalDelta === false;
  nodes.kpis.hidden = settings.showStreamerMmrGoalRecord === false
    && settings.showStreamerMmrGoalWinRate === false
    && settings.showStreamerMmrGoalEta === false;
  streamerMmrGoalEl.classList.toggle('complete', remainingMmr <= 0);

  const minimapSide = protection.minimapSide === 'right' ? 'right' : 'left';
  const inLiveGame = !spectatorView && /PRE_GAME|GAME_IN_PROGRESS/i.test(gameState);
  const left = inLiveGame
    ? minimapSide === 'right' ? 385 : 1110
    : minimapSide === 'right' ? 1060 : 390;
  const boxHeight = Math.max(104, 104 + Math.max(0, goalStyle.barHeight - streamerMmrGoalStyleDefaults.barHeight));
  const box = inLiveGame
    ? { left, bottom: 176, width: 420, height: boxHeight }
    : { left, top: 132, width: 420, height: boxHeight };
  applyScaledBox(streamerMmrGoalEl, withOverlayOffset(box, settings.overlayPositions?.streamerMmrGoal), reference);
  setVisible(streamerMmrGoalEl, true);
}

function withOverlayOffset(box, offset) {
  const x = Number(offset?.x || 0);
  const y = Number(offset?.y || 0);
  const next = { ...box, left: Number(box.left || 0) + x };
  if (box.bottom !== undefined) {
    next.bottom = Number(box.bottom || 0) - y;
  } else {
    next.top = Number(box.top || 0) + y;
  }
  return next;
}

function shouldShowStreamerStatsInOverlay(state) {
  const gameState = String(state.gsi?.gameState || '');
  if (/POST_GAME|GAME_END|DISCONNECT/i.test(gameState)) return false;
  if (state.gsi?.connected && !state.gsi?.leftGameView) return true;
  if (state.protection?.queue || state.protection?.draft || state.protection?.topBar) return true;
  return state.dota?.processRunning !== false;
}

function shouldHideStreamerSummaryDuringDraft(state, gameState) {
  return state.protection?.draft === true
    || state.protection?.topBar === true
    || /HERO_SELECTION|DRAFT/i.test(gameState);
}

function streamerMedalGapOffset(medalId) {
  const transparentBottomByMedal = {
    0: 23,
    1: 23,
    2: 23,
    3: 23,
    4: 9,
    5: 5,
    6: 1,
    7: 14,
    8: 1,
    calibration: 0
  };
  return Math.max(0, (transparentBottomByMedal[String(medalId)] || 0) - 16);
}

function ensureStreamerStatsNodes() {
  if (streamerStatsNodes) return streamerStatsNodes;
  const medalWrap = document.createElement('span');
  const medal = document.createElement('img');
  const pips = document.createElement('img');
  const leaderboard = document.createElement('span');
  const mmrLine = document.createElement('span');
  const mmr = document.createElement('span');
  const winLoss = document.createElement('span');
  const winNumber = document.createElement('span');
  const win = document.createElement('span');
  const dash = document.createElement('span');
  const lossNumber = document.createElement('span');
  const loss = document.createElement('span');
  medalWrap.className = 'streamerStatsMedalWrap';
  medal.className = 'streamerStatsMedal';
  medal.alt = '';
  medal.decoding = 'async';
  pips.className = 'streamerStatsPips';
  pips.alt = '';
  pips.decoding = 'async';
  leaderboard.className = 'streamerStatsLeaderboard';
  mmrLine.className = 'streamerStatsMmrLine';
  mmr.className = 'streamerStatsMmr';
  winLoss.className = 'streamerStatsWinLoss';
  winNumber.className = 'streamerStatsWinNumber';
  win.className = 'streamerStatsWin';
  dash.className = 'streamerStatsDash';
  lossNumber.className = 'streamerStatsLossNumber';
  loss.className = 'streamerStatsLoss';
  win.textContent = 'W';
  dash.textContent = '-';
  loss.textContent = 'L';
  winLoss.append(winNumber, win, dash, lossNumber, loss);
  medalWrap.append(medal, pips);
  mmrLine.append(mmr);
  streamerStatsEl.replaceChildren(medalWrap, leaderboard, winLoss, mmrLine);
  streamerStatsNodes = { medalWrap, medal, pips, leaderboard, mmrLine, mmr, winLoss, winNumber, lossNumber };
  return streamerStatsNodes;
}

function ensureStreamerMmrGoalNodes() {
  if (streamerMmrGoalNodes) return streamerMmrGoalNodes;
  const percent = document.createElement('b');
  const progress = document.createElement('div');
  const fill = document.createElement('span');
  const meta = document.createElement('div');
  const current = document.createElement('b');
  const target = document.createElement('span');
  const delta = document.createElement('em');
  const kpis = document.createElement('div');
  const record = document.createElement('span');
  const winRate = document.createElement('span');
  const eta = document.createElement('span');
  percent.className = 'streamerMmrGoalPercent';
  progress.className = 'streamerMmrGoalProgress';
  fill.className = 'streamerMmrGoalFill';
  meta.className = 'streamerMmrGoalMeta';
  current.className = 'streamerMmrGoalCurrent';
  target.className = 'streamerMmrGoalTarget';
  delta.className = 'streamerMmrGoalDelta';
  kpis.className = 'streamerMmrGoalKpis';
  record.className = 'streamerMmrGoalRecord';
  winRate.className = 'streamerMmrGoalWinRate';
  eta.className = 'streamerMmrGoalEta';
  streamerMmrGoalEl.dataset.goalPart = 'root';
  progress.dataset.goalPart = 'bar';
  fill.dataset.goalPart = 'fill';
  percent.dataset.goalPart = 'percent';
  meta.dataset.goalPart = 'meta';
  current.dataset.goalPart = 'current';
  target.dataset.goalPart = 'target';
  delta.dataset.goalPart = 'delta';
  kpis.dataset.goalPart = 'kpis';
  record.dataset.goalPart = 'record';
  winRate.dataset.goalPart = 'winrate';
  eta.dataset.goalPart = 'eta';
  progress.append(fill, percent);
  meta.append(current, target, delta);
  kpis.append(record, winRate, eta);
  streamerMmrGoalEl.replaceChildren(progress, meta, kpis);
  streamerMmrGoalNodes = { percent, progress, fill, meta, current, target, delta, kpis, record, winRate, eta };
  return streamerMmrGoalNodes;
}

function applyStreamerMmrGoalStyle(root, settings) {
  if (!root) return;
  const style = streamerMmrGoalStyleFromSettings(settings);
  root.classList.remove(...streamerMmrGoalTemplateClasses);
  root.classList.add(`streamer-goal-template-${style.template}`);
  root.dataset.animated = style.animated ? 'true' : 'false';
  root.style.setProperty('--goal-fill-start', style.fillStart);
  root.style.setProperty('--goal-fill-end', style.fillEnd);
  root.style.setProperty('--goal-track', style.track);
  root.style.setProperty('--goal-accent', style.accent);
  root.style.setProperty('--goal-text', style.text);
  root.style.setProperty('--goal-bar-height', `${style.barHeight}px`);
  root.style.setProperty('--goal-bar-radius', `${style.barRadius}px`);
  root.style.setProperty('--goal-glow', `${style.glow}px`);
  root.dataset.goalPart = root.dataset.goalPart || 'root';
  return style;
}

function streamerMmrGoalStyleFromSettings(settings = {}) {
  const template = streamerMmrGoalTemplates.includes(settings.streamerMmrGoalTemplate)
    ? settings.streamerMmrGoalTemplate
    : streamerMmrGoalStyleDefaults.template;
  return {
    template,
    fillStart: normalizeGoalColor(settings.streamerMmrGoalFillStart, streamerMmrGoalStyleDefaults.fillStart),
    fillEnd: normalizeGoalColor(settings.streamerMmrGoalFillEnd, streamerMmrGoalStyleDefaults.fillEnd),
    track: normalizeGoalColor(settings.streamerMmrGoalTrack, streamerMmrGoalStyleDefaults.track),
    accent: normalizeGoalColor(settings.streamerMmrGoalAccent, streamerMmrGoalStyleDefaults.accent),
    text: normalizeGoalColor(settings.streamerMmrGoalText, streamerMmrGoalStyleDefaults.text),
    barHeight: clampNumber(settings.streamerMmrGoalBarHeight, 8, 64, streamerMmrGoalStyleDefaults.barHeight),
    barRadius: clampNumber(settings.streamerMmrGoalBarRadius, 0, 40, streamerMmrGoalStyleDefaults.barRadius),
    glow: clampNumber(settings.streamerMmrGoalGlow, 0, 30, streamerMmrGoalStyleDefaults.glow),
    animated: settings.streamerMmrGoalAnimated !== false,
    currentPrefix: normalizeGoalTextPart(settings.streamerMmrGoalCurrentPrefix, streamerMmrGoalStyleDefaults.currentPrefix),
    currentSuffix: normalizeGoalTextPart(settings.streamerMmrGoalCurrentSuffix, streamerMmrGoalStyleDefaults.currentSuffix),
    targetPrefix: normalizeGoalTextPart(settings.streamerMmrGoalTargetPrefix, streamerMmrGoalStyleDefaults.targetPrefix),
    targetSuffix: normalizeGoalTextPart(settings.streamerMmrGoalTargetSuffix, streamerMmrGoalStyleDefaults.targetSuffix),
    deltaPrefix: normalizeGoalTextPart(settings.streamerMmrGoalDeltaPrefix, streamerMmrGoalStyleDefaults.deltaPrefix),
    deltaSuffix: normalizeGoalTextPart(settings.streamerMmrGoalDeltaSuffix, streamerMmrGoalStyleDefaults.deltaSuffix),
    customCss: normalizeGoalCustomCss(settings.streamerMmrGoalCustomCss)
  };
}

function applyStreamerMmrGoalCustomCss(css) {
  const id = 'streamerMmrGoalCustomCssStyle';
  let style = document.querySelector(`#${id}`);
  if (!css) {
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = id;
    document.head.append(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function formatGoalText(prefix, value, suffix) {
  return `${prefix || ''}${value}${suffix || ''}`;
}

function normalizeGoalTextPart(value, fallback = '') {
  return String(value ?? fallback ?? '').slice(0, 24);
}

function normalizeGoalCustomCss(value) {
  return String(value || '').slice(0, 8000);
}

function normalizeGoalColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function setTextContent(el, value) {
  const text = String(value ?? '');
  if (el.textContent !== text) el.textContent = text;
}

function formatGoalPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number % 1 === 0 ? String(Math.trunc(number)) : number.toFixed(1);
}

function formatStreamerMmr(value) {
  const number = Math.max(0, Math.trunc(Number(value) || 0));
  return number.toLocaleString('en-US');
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}
