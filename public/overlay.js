const queueMask = document.querySelector('#queueMask');
const draftScreenMask = document.querySelector('#draftScreenMask');
const minimapMask = document.querySelector('#minimapMask');
const topBarSlotsRoot = document.querySelector('#topBarSlots');
let queuePartEls = [];
let topBarSlotEls = [];
let draftPartEls = [];
let minimapLayerEl = null;
let minimapVisionImageEl = null;

const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  const { config, state } = JSON.parse(event.data);
  const reference = config.protection.referenceSize || { width: 1920, height: 1080 };
  const draftParts = config.protection.draftMaskParts || [];
  const queueParts = queueMaskParts(config.protection);
  const slots = config.protection.topBarSlots || [];
  ensureQueueParts(queueParts.length);
  ensureDraftParts(draftParts.length);
  ensureTopBarSlots(slots.length);
  applyQueueParts(queueParts, reference, state);
  applyDraftParts(draftParts, reference, state);
  applyTopBarSlots(slots, reference, state);
  applyMinimap(config.protection, reference, state);
  setVisible(minimapMask, state.protection.minimap);
};

function queueMaskParts(protection) {
  if ((protection.queueMode || 'partial') !== 'full') return protection.queueMaskParts || [];
  const reference = protection.referenceSize || { width: 1920, height: 1080 };
  return [{ left: 0, top: 0, width: reference.width, height: reference.height }];
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
    setVisible(el, visible);
  });
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
