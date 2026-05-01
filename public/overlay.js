const queueMask = document.querySelector('#queueMask');
const draftScreenMask = document.querySelector('#draftScreenMask');
const minimapMask = document.querySelector('#minimapMask');
const topBarSlotsRoot = document.querySelector('#topBarSlots');
const matchIntelRoot = document.querySelector('#matchIntel');
let queuePartEls = [];
let topBarSlotEls = [];
let matchIntelSlotEls = [];
let draftPartEls = [];
let minimapLayerEl = null;
let minimapVisionImageEl = null;
let roshanIntelEl = null;
let lastOverlaySnapshot = null;

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
  const draftParts = effectiveDraftParts(config.protection.draftMaskParts || [], reference, config.protection, state);
  const queueParts = queueMaskParts(config.protection, reference);
  const slots = config.protection.topBarSlots || [];
  ensureQueueParts(queueParts.length);
  ensureDraftParts(draftParts.length);
  ensureTopBarSlots(slots.length);
  ensureMatchIntelSlots(slots.length);
  applyQueueParts(queueParts, reference, state);
  applyDraftParts(draftParts, reference, state);
  applyTopBarSlots(slots, reference, state);
  applyMatchIntel(slots, reference, config.protection.matchIntel || {}, state);
  applyMinimap(config.protection, reference, state);
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

function effectiveDraftParts(parts, reference, protection, state) {
  if ((protection.draftHideMode || 'all') !== 'streamer_team') return parts;
  const team = String(state.gsi?.playerTeam || '').toLowerCase();
  if (!['radiant', 'dire'].includes(team)) return parts;
  const side = team === 'radiant'
    ? { left: 0, top: 0, width: reference.width / 2, height: reference.height }
    : { left: reference.width / 2, top: 0, width: reference.width / 2, height: reference.height };
  return parts.map((part) => intersectBoxes(part, side, reference)).filter(Boolean);
}

function intersectBoxes(part, clip, reference) {
  const box = normalizePartBox(part, reference);
  const left = Math.max(box.left, clip.left);
  const top = Math.max(box.top, clip.top);
  const right = Math.min(box.left + box.width, clip.left + clip.width);
  const bottom = Math.min(box.top + box.height, clip.top + clip.height);
  const width = right - left;
  const height = bottom - top;
  if (width <= 0 || height <= 0) return null;
  return { left, top, width, height };
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
  const enabled = settings.enabled !== false && state.gsi?.connected && /PRE_GAME|GAME_IN_PROGRESS|POST_GAME/i.test(String(state.gsi?.gameState || ''));
  const clockTime = Number(state.gsi?.clockTime);
  const rankCutoff = Number(settings.rankDisplayMinutes || 12) * 60;
  const fullGameRanks = settings.rankDisplayMode === 'full_game';
  const showRanks = enabled && settings.showPlayerRanks !== false && (fullGameRanks || (Number.isFinite(clockTime) && clockTime >= 0 && clockTime <= rankCutoff));
  const ranksBySlot = new Map((intel.notablePlayers || []).map((player) => [Number(player.slot), player]));
  const aegis = intel.aegis || null;
  const showAegis = enabled && settings.showAegisRoshan !== false && aegis && Number(aegis.expiresAt) > clockTime;

  slots.forEach((slot, index) => {
    const el = matchIntelSlotEls[index];
    const rank = ranksBySlot.get(index);
    const hasAegis = showAegis && Number(aegis.slot) === index;
    applyScaledBox(el, {
      left: slot.left + slot.width / 2 - 48,
      top: slot.top + slot.height + 4,
      width: 96,
      height: 72
    }, reference);
    el.innerHTML = '';
    if (showRanks && rank) {
      const rankBadge = document.createElement('div');
      rankBadge.className = 'rankBadge';
      rankBadge.innerHTML = `<img src="/assets/rank-immortal.png?v=${version}" alt=""><span>#${escapeHtml(rank.leaderboardRank)}</span>`;
      el.append(rankBadge);
    }
    if (hasAegis) {
      const remaining = Math.max(0, Math.ceil(Number(aegis.expiresAt) - clockTime));
      const aegisBadge = document.createElement('div');
      aegisBadge.className = 'aegisBadge';
      aegisBadge.innerHTML = `<img src="/assets/aegis.png?v=${version}" alt=""><span>${formatClock(remaining)}</span>`;
      el.append(aegisBadge);
    }
    setVisible(el, enabled && (el.children.length > 0));
  });

  applyRoshanIntel(reference, settings, state, version);
}

function applyRoshanIntel(reference, settings, state, version) {
  if (!roshanIntelEl) return;
  const intel = state.matchIntel || {};
  const status = intel.roshanStatus;
  const enabled = settings.enabled !== false && settings.showAegisRoshan !== false && state.gsi?.connected && status;
  if (!enabled) {
    setVisible(roshanIntelEl, false);
    return;
  }

  const text = roshanText(status);
  roshanIntelEl.innerHTML = `<img src="/assets/roshan.png?v=${version}" alt=""><span>${text}</span>`;
  roshanIntelEl.style.left = '50vw';
  roshanIntelEl.style.top = `${toPercent(82, reference.height)}vh`;
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
  if (status.phase === 'possible') return 'ROSHAN UP?';
  if (status.phase === 'window') return `ROSHAN 0:00-${formatClock(status.latestRemaining)}`;
  return `ROSHAN ${formatClock(status.earliestRemaining)}-${formatClock(status.latestRemaining)}`;
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
