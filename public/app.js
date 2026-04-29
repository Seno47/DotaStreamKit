const els = {
  gsiStatus: document.querySelector('#gsiStatus'),
  twitchStatus: document.querySelector('#twitchStatus'),
  autoDraft: document.querySelector('#autoDraft'),
  autoMinimap: document.querySelector('#autoMinimap'),
  autoQueue: document.querySelector('#autoQueue'),
  minimapSize: document.querySelector('#minimapSize'),
  minimapSide: document.querySelector('#minimapSide'),
  minimapStyle: document.querySelector('#minimapStyle'),
  queueMode: document.querySelector('#queueMode'),
  manualDraft: document.querySelector('#manualDraft'),
  manualMinimap: document.querySelector('#manualMinimap'),
  manualTopBar: document.querySelector('#manualTopBar'),
  manualQueue: document.querySelector('#manualQueue'),
  gameState: document.querySelector('#gameState'),
  gameScreen: document.querySelector('#gameScreen'),
  heroState: document.querySelector('#heroState'),
  clockTime: document.querySelector('#clockTime'),
  matchId: document.querySelector('#matchId'),
  deploymentMode: document.querySelector('#deploymentMode'),
  publicBaseUrl: document.querySelector('#publicBaseUrl'),
  clientId: document.querySelector('#clientId'),
  clientSecret: document.querySelector('#clientSecret'),
  twitchChannelMode: document.querySelector('#twitchChannelMode'),
  targetChannelLogin: document.querySelector('#targetChannelLogin'),
  resolveTwitchChannel: document.querySelector('#resolveTwitchChannel'),
  effectiveRedirectUri: document.querySelector('#effectiveRedirectUri'),
  targetChannelStatus: document.querySelector('#targetChannelStatus'),
  logoutTwitch: document.querySelector('#logoutTwitch'),
  predictionForm: document.querySelector('#predictionForm'),
  predictionTypeForm: document.querySelector('#predictionTypeForm'),
  predictionTitle: document.querySelector('#predictionTitle'),
  predictionWindow: document.querySelector('#predictionWindow'),
  winTitle: document.querySelector('#winTitle'),
  loseTitle: document.querySelector('#loseTitle'),
  autoCreate: document.querySelector('#autoCreate'),
  autoResolve: document.querySelector('#autoResolve'),
  autoCancelInvalidGame: document.querySelector('#autoCancelInvalidGame'),
  predictionSelectionMode: document.querySelector('#predictionSelectionMode'),
  selectedPredictionType: document.querySelector('#selectedPredictionType'),
  selectedPredictionTypeWrap: document.querySelector('#selectedPredictionTypeWrap'),
  predictionTypes: document.querySelector('#predictionTypes'),
  variableChips: document.querySelectorAll('.variable-chip'),
  createPrediction: document.querySelector('#createPrediction'),
  lockPrediction: document.querySelector('#lockPrediction'),
  cancelPrediction: document.querySelector('#cancelPrediction'),
  resolveWin: document.querySelector('#resolveWin'),
  resolveLose: document.querySelector('#resolveLose'),
  activePrediction: document.querySelector('#activePrediction'),
  dotaPath: document.querySelector('#dotaPath'),
  detectDota: document.querySelector('#detectDota'),
  installGsi: document.querySelector('#installGsi'),
  draftScreenshotAsset: document.querySelector('#draftScreenshotAsset'),
  queueScreenshotAsset: document.querySelector('#queueScreenshotAsset'),
  assetStatus: document.querySelector('#assetStatus'),
  events: document.querySelector('#events')
};

let snapshot = null;
let lastTemplateInput = null;

const predictionTypeDefs = [
  { type: 'win_loss', label: 'Победа/поражение', description: 'Базовый прогноз на исход игры.', ranges: [] },
  { type: 'streamer_kills', label: 'Киллы стримера', description: 'Случайная цель по убийствам из диапазона.', ranges: ['min', 'max'] },
  { type: 'streamer_deaths', label: 'Смерти стримера', description: 'Случайная цель по смертям из диапазона.', ranges: ['min', 'max'] },
  { type: 'streamer_assists', label: 'Ассисты стримера', description: 'Случайная цель по ассистам из диапазона.', ranges: ['min', 'max'] },
  { type: 'no_death_until', label: 'Не умереть до минуты', description: 'Случайная минута, до которой герой должен выжить.', ranges: ['minMinute', 'maxMinute'] },
  { type: 'last_hits_by_minute', label: 'Ластхиты к минуте', description: 'Случайная цель по ластхитам и минута проверки.', ranges: ['min', 'max', 'minMinute', 'maxMinute'] }
];

buildPredictionTypeControls();

const stream = new EventSource('/api/events');
stream.onmessage = (event) => {
  snapshot = JSON.parse(event.data);
  render(snapshot);
  refreshAssets();
};

async function api(path, body = null, method = 'POST') {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function render(data) {
  const { config, state } = data;
  els.gsiStatus.textContent = state.gsi.connected ? 'Dota GSI online' : 'Dota GSI offline';
  els.gsiStatus.className = `pill ${state.gsi.connected ? 'ok' : 'bad'}`;
  const liveSuffix = state.twitch.isLive === true ? ' / live' : state.twitch.isLive === false ? ' / offline' : '';
  const predictionChannel = state.twitch.effectiveBroadcasterLogin || state.twitch.broadcasterLogin || 'Twitch';
  els.twitchStatus.textContent = state.twitch.authenticated
    ? state.twitch.needsReconnect
      ? `Twitch: ${state.twitch.broadcasterLogin} / reconnect`
      : `Twitch: ${predictionChannel}${liveSuffix}`
    : state.twitch.needsReconnect
      ? 'Twitch reconnect'
      : 'Twitch disconnected';
  els.twitchStatus.className = `pill ${state.twitch.authenticated && !state.twitch.needsReconnect ? 'ok' : 'bad'}`;

  els.autoDraft.checked = config.protection.autoDraft;
  els.autoMinimap.checked = config.protection.autoMinimap;
  els.autoQueue.checked = config.protection.autoQueue;
  els.minimapSize.value = config.protection.minimapSize || 'normal';
  els.minimapSide.value = config.protection.minimapSide || 'left';
  els.minimapStyle.value = config.protection.minimapStyle || 'realistic';
  els.queueMode.value = config.protection.queueMode || 'partial';
  toggleButton(els.manualDraft, config.protection.manualDraft || state.protection.draft);
  toggleButton(els.manualMinimap, config.protection.manualMinimap || state.protection.minimap);
  toggleButton(els.manualTopBar, config.protection.manualTopBar || state.protection.topBar);
  toggleButton(els.manualQueue, config.protection.manualQueue || state.protection.queue);

  els.gameState.textContent = state.gsi.gameState || '-';
  els.gameScreen.textContent = state.gsi.leftGameView ? 'меню Dota / reconnect' : state.gsi.inGameScreen ? 'игровой экран' : '-';
  els.heroState.textContent = state.gsi.playerHeroPicked ? `${state.gsi.heroName || state.gsi.heroId || 'выбран'}${state.gsi.ownPickPhaseEnded ? ' / topbar only' : ''}` : '-';
  els.clockTime.textContent = state.gsi.clockTime ?? '-';
  els.matchId.textContent = state.gsi.matchId || '-';

  els.deploymentMode.value = config.deployment?.mode || 'local';
  els.publicBaseUrl.value = config.deployment?.publicBaseUrl || '';
  els.clientId.value = config.twitch.clientId || '';
  els.twitchChannelMode.value = config.twitch.channelMode || 'personal';
  if (document.activeElement !== els.targetChannelLogin) {
    els.targetChannelLogin.value = config.twitch.targetChannelLogin || config.twitch.targetBroadcasterLogin || '';
  }
  els.effectiveRedirectUri.textContent = state.twitch.effectiveRedirectUri || config.twitch.redirectUri || '';
  const channelLive = state.twitch.isLive === true ? ' / live' : state.twitch.isLive === false ? ' / offline' : ' / статус не проверен';
  const checkedAt = state.twitch.streamCheckedAt ? ` / проверено ${new Date(state.twitch.streamCheckedAt).toLocaleTimeString()}` : '';
  els.targetChannelStatus.textContent = state.twitch.effectiveBroadcasterId
    ? `Канал прогнозов: ${state.twitch.effectiveBroadcasterLogin || '-'} (${state.twitch.effectiveBroadcasterId})${channelLive}${checkedAt}${state.twitch.targetMatchesToken === false ? ' / отдельный от OAuth аккаунта' : ''}`
    : 'Канал прогнозов не выбран.';
  updateConditionalVisibility(config);
  if (document.activeElement !== els.dotaPath) {
    els.dotaPath.value = config.dota?.installPath || '';
  }
  setInputValue(els.predictionTitle, config.predictions.titleTemplate);
  setInputValue(els.predictionWindow, config.predictions.windowSeconds);
  setInputValue(els.winTitle, config.predictions.winTitle);
  setInputValue(els.loseTitle, config.predictions.loseTitle);
  els.autoCreate.checked = config.predictions.autoCreate;
  els.autoResolve.checked = config.predictions.autoResolve;
  els.autoCancelInvalidGame.checked = config.predictions.autoCancelInvalidGame ?? true;
  els.predictionSelectionMode.value = config.predictions.selectionMode || 'selected';
  els.selectedPredictionType.value = config.predictions.selectedType || 'win_loss';
  renderPredictionTypes(config.predictions.types || {});
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();

  renderPrediction(state.activePrediction);
  renderEvents(state.events || []);
}

function updateConditionalVisibility(config) {
  const serverMode = (config.deployment?.mode || 'local') === 'server';
  const separateChannel = (config.twitch?.channelMode || 'personal') === 'separate';
  document.querySelectorAll('[data-visible-for="server"]').forEach((item) => {
    item.hidden = !serverMode;
  });
  document.querySelectorAll('[data-visible-for="separate-channel"]').forEach((item) => {
    item.hidden = !separateChannel;
  });
}

function toggleButton(button, enabled) {
  button.classList.toggle('active', Boolean(enabled));
}

function setInputValue(input, value) {
  if (document.activeElement !== input) input.value = value ?? '';
}

function renderPrediction(prediction) {
  if (!prediction) {
    els.activePrediction.textContent = 'Нет активной ставки.';
    return;
  }
  const outcomes = prediction.outcomes.map((item) => `${item.title}: ${item.channelPoints || 0}`).join(' | ');
  const type = prediction.type ? ` [${prediction.type}]` : '';
  els.activePrediction.textContent = `${prediction.title}${type} (${prediction.status}) ${outcomes}`;
}

function buildPredictionTypeControls() {
  for (const def of predictionTypeDefs) {
    const option = document.createElement('option');
    option.value = def.type;
    option.textContent = def.label;
    els.selectedPredictionType.append(option);

    const card = document.createElement('section');
    card.className = 'prediction-type';
    card.dataset.type = def.type;
    card.innerHTML = `
      <div class="prediction-type-header">
        <div>
          <h3>${def.label}</h3>
          <p>${def.description}</p>
        </div>
        <label class="check"><input data-field="enabled" type="checkbox"> Включен</label>
      </div>
      <div class="prediction-preview">
        <span>Превью</span>
        <strong data-preview-title>-</strong>
        <small><b data-preview-yes>Да</b> / <b data-preview-no>Нет</b></small>
      </div>
      <div class="prediction-type-grid">
        <label>Шанс выбора<input data-field="weight" type="number" min="1" max="100"></label>
        ${def.ranges.includes('min') ? '<label>Цель от<input data-field="min" type="number" min="0" max="999"></label>' : ''}
        ${def.ranges.includes('max') ? '<label>Цель до<input data-field="max" type="number" min="0" max="999"></label>' : ''}
        ${def.ranges.includes('minMinute') ? '<label>Минута от<input data-field="minMinute" type="number" min="1" max="180"></label>' : ''}
        ${def.ranges.includes('maxMinute') ? '<label>Минута до<input data-field="maxMinute" type="number" min="1" max="180"></label>' : ''}
        <label class="full">Заголовок<input data-field="titleTemplate" maxlength="120"></label>
        <label>Исход Да<input data-field="yesTitle" maxlength="25"></label>
        <label>Исход Нет<input data-field="noTitle" maxlength="25"></label>
      </div>
    `;
    els.predictionTypes.append(card);
  }
}

function renderPredictionTypes(types) {
  for (const def of predictionTypeDefs) {
    const config = types[def.type] || {};
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
    if (!card) continue;
    setTypeField(card, 'enabled', config.enabled !== false);
    setTypeField(card, 'weight', config.weight ?? 1);
    setTypeField(card, 'min', config.min ?? 0);
    setTypeField(card, 'max', config.max ?? config.min ?? 0);
    setTypeField(card, 'minMinute', config.minMinute ?? 10);
    setTypeField(card, 'maxMinute', config.maxMinute ?? config.minMinute ?? 10);
    setTypeField(card, 'titleTemplate', config.titleTemplate || '');
    setTypeField(card, 'yesTitle', config.yesTitle || 'Да');
    setTypeField(card, 'noTitle', config.noTitle || 'Нет');
  }
}

function setTypeField(card, field, value) {
  const input = card.querySelector(`[data-field="${field}"]`);
  if (!input || document.activeElement === input) return;
  if (input.type === 'checkbox') input.checked = Boolean(value);
  else input.value = value;
}

function collectPredictionTypes() {
  const types = {};
  for (const def of predictionTypeDefs) {
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
    types[def.type] = {
      enabled: getTypeField(card, 'enabled'),
      weight: Number(getTypeField(card, 'weight')),
      titleTemplate: String(getTypeField(card, 'titleTemplate')).trim(),
      yesTitle: String(getTypeField(card, 'yesTitle')).trim(),
      noTitle: String(getTypeField(card, 'noTitle')).trim()
    };
    for (const field of ['min', 'max', 'minMinute', 'maxMinute']) {
      const value = getTypeField(card, field);
      if (value !== null) types[def.type][field] = Number(value);
    }
  }
  return types;
}

function getTypeField(card, field) {
  const input = card?.querySelector(`[data-field="${field}"]`);
  if (!input) return null;
  return input.type === 'checkbox' ? input.checked : input.value;
}

function renderPredictionTypePreviews() {
  for (const def of predictionTypeDefs) {
    const card = els.predictionTypes.querySelector(`[data-type="${def.type}"]`);
    if (!card) continue;
    const typeConfig = typeConfigFromCard(card);
    const template = typeConfig.titleTemplate || els.predictionTitle.value || '{hero}: {target}+?';
    const yesTitle = typeConfig.yesTitle || els.winTitle.value || 'Да';
    const noTitle = typeConfig.noTitle || els.loseTitle.value || 'Нет';
    const title = card.querySelector('[data-preview-title]');
    const yes = card.querySelector('[data-preview-yes]');
    const no = card.querySelector('[data-preview-no]');
    if (title) title.textContent = fillTemplate(template, typeConfig);
    if (yes) yes.textContent = yesTitle;
    if (no) no.textContent = noTitle;
  }
}

function renderPredictionTypeVisibility() {
  const selectedMode = els.predictionSelectionMode.value === 'selected';
  const selectedType = els.selectedPredictionType.value || 'win_loss';
  els.selectedPredictionTypeWrap.hidden = !selectedMode;
  for (const card of els.predictionTypes.querySelectorAll('.prediction-type')) {
    card.hidden = selectedMode && card.dataset.type !== selectedType;
  }
}

function typeConfigFromCard(card) {
  return {
    titleTemplate: String(getTypeField(card, 'titleTemplate') || '').trim(),
    yesTitle: String(getTypeField(card, 'yesTitle') || '').trim(),
    noTitle: String(getTypeField(card, 'noTitle') || '').trim(),
    min: Number(getTypeField(card, 'min') || 0),
    max: Number(getTypeField(card, 'max') || 0),
    minMinute: Number(getTypeField(card, 'minMinute') || 10),
    maxMinute: Number(getTypeField(card, 'maxMinute') || 10)
  };
}

function fillTemplate(template, typeConfig) {
  const gsi = snapshot?.state?.gsi || {};
  const target = midpoint(typeConfig.min, typeConfig.max) || 8;
  const minute = midpoint(typeConfig.minMinute, typeConfig.maxMinute) || 10;
  const values = {
    hero: gsi.heroName || 'Pudge',
    target,
    minute,
    kills: 3,
    deaths: 1,
    assists: 7,
    last_hits: 68,
    denies: 6,
    level: 11
  };

  return Object.entries(values).reduce((text, [key, value]) => {
    return text.replaceAll(`{${key}}`, value);
  }, template);
}

function midpoint(min, max) {
  if (!Number.isFinite(min) && !Number.isFinite(max)) return 0;
  if (!Number.isFinite(max) || max <= 0) return min;
  if (!Number.isFinite(min) || min <= 0) return max;
  return Math.round((min + max) / 2);
}

function rememberTemplateInput(input) {
  if (input instanceof HTMLInputElement && (
    input.id === 'predictionTitle'
    || input.matches('#predictionTypes input[data-field="titleTemplate"]')
    || input.matches('#predictionTypes input[data-field="yesTitle"]')
    || input.matches('#predictionTypes input[data-field="noTitle"]')
  )) {
    lastTemplateInput = input;
  }
}

function insertVariable(variable) {
  const target = lastTemplateInput || els.predictionTitle;
  if (!target) return;
  target.focus();
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.setRangeText(variable, start, end, 'end');
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

function renderEvents(events) {
  els.events.innerHTML = '';
  for (const event of events.slice(0, 20)) {
    const row = document.createElement('div');
    row.className = 'event';
    row.textContent = `${new Date(event.at).toLocaleTimeString()} [${event.type}] ${event.message}`;
    els.events.append(row);
  }
}

async function saveProtection(patch) {
  await api('/api/protection', patch);
}

els.autoDraft.addEventListener('change', () => saveProtection({ autoDraft: els.autoDraft.checked }).catch(alert));
els.autoMinimap.addEventListener('change', () => saveProtection({ autoMinimap: els.autoMinimap.checked }).catch(alert));
els.autoQueue.addEventListener('change', () => saveProtection({ autoQueue: els.autoQueue.checked }).catch(alert));
els.minimapSize.addEventListener('change', () => saveProtection({ minimapSize: els.minimapSize.value }).catch(alert));
els.minimapSide.addEventListener('change', () => saveProtection({ minimapSide: els.minimapSide.value }).catch(alert));
els.minimapStyle.addEventListener('change', () => saveProtection({ minimapStyle: els.minimapStyle.value }).catch(alert));
els.queueMode.addEventListener('change', () => saveProtection({ queueMode: els.queueMode.value }).catch(alert));
els.manualDraft.addEventListener('click', () => saveProtection({ manualDraft: !snapshot.config.protection.manualDraft }).catch(alert));
els.manualMinimap.addEventListener('click', () => saveProtection({ manualMinimap: !snapshot.config.protection.manualMinimap }).catch(alert));
els.manualTopBar.addEventListener('click', () => saveProtection({ manualTopBar: !snapshot.config.protection.manualTopBar }).catch(alert));
els.manualQueue.addEventListener('click', () => saveProtection({ manualQueue: !snapshot.config.protection.manualQueue }).catch(alert));

els.clientId.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.deploymentMode.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.publicBaseUrl.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.twitchChannelMode.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.targetChannelLogin.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('blur', () => {
  els.clientSecret.value = '';
});
els.dotaPath.addEventListener('change', () => saveDotaConfig().catch(alert));

async function saveTwitchAppConfig() {
  await api('/api/config', {
    deployment: {
      mode: els.deploymentMode.value,
      publicBaseUrl: els.publicBaseUrl.value.trim()
    },
    twitch: {
      clientId: els.clientId.value.trim(),
      clientSecret: els.clientSecret.value.trim() || '********',
      channelMode: els.twitchChannelMode.value,
      targetChannelLogin: els.targetChannelLogin.value.trim()
    }
  });
}

async function saveDotaConfig() {
  await api('/api/config', {
    dota: {
      installPath: els.dotaPath.value.trim()
    }
  });
}

els.logoutTwitch.addEventListener('click', () => api('/api/twitch/logout').catch(alert));
els.resolveTwitchChannel.addEventListener('click', () => api('/api/twitch/resolve-channel', {
  login: els.targetChannelLogin.value.trim()
}).then((result) => {
  els.targetChannelLogin.value = result.user.login;
  alert(`Канал найден: ${result.user.displayName} (${result.user.id})`);
}).catch(alert));

els.predictionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await savePredictionConfig().catch(alert);
});
els.predictionTypeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await savePredictionConfig().catch(alert);
});
document.addEventListener('focusin', (event) => rememberTemplateInput(event.target));
document.addEventListener('input', (event) => {
  if (event.target.closest?.('#predictionForm, #predictionTypeForm, #predictionTypes')) {
    renderPredictionTypePreviews();
  }
});
els.selectedPredictionType.addEventListener('change', () => {
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();
});
els.predictionSelectionMode.addEventListener('change', () => {
  renderPredictionTypeVisibility();
  renderPredictionTypePreviews();
});
els.variableChips.forEach((button) => {
  button.addEventListener('click', () => insertVariable(button.dataset.var));
});

async function savePredictionConfig() {
  await api('/api/config', { predictions: predictionConfigFromForm() });
}

function predictionConfigFromForm() {
  return {
    titleTemplate: els.predictionTitle.value.trim(),
    windowSeconds: Number(els.predictionWindow.value),
    winTitle: els.winTitle.value.trim(),
    loseTitle: els.loseTitle.value.trim(),
    autoCreate: els.autoCreate.checked,
    autoResolve: els.autoResolve.checked,
    autoCancelInvalidGame: els.autoCancelInvalidGame.checked,
    selectionMode: els.predictionSelectionMode.value,
    selectedType: els.selectedPredictionType.value,
    types: collectPredictionTypes()
  };
}

els.createPrediction.addEventListener('click', async () => {
  try {
    await savePredictionConfig();
    await api('/api/twitch/predictions', {});
  } catch (error) {
    alert(error);
  }
});

els.lockPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/lock`).catch(alert)));
els.cancelPrediction.addEventListener('click', () => withPrediction((p) => api(`/api/twitch/predictions/${p.id}/cancel`).catch(alert)));
els.resolveWin.addEventListener('click', () => resolveKind('win'));
els.resolveLose.addEventListener('click', () => resolveKind('lose'));
els.detectDota.addEventListener('click', () => detectDota().catch(alert));
els.installGsi.addEventListener('click', () => api('/api/install-gsi', {
  dotaPath: els.dotaPath.value.trim()
}).then((result) => {
  els.dotaPath.value = result.dotaPath || els.dotaPath.value;
  alert(`GSI установлен:\n${result.cfgPath}\n\nПерезапусти Dota 2, если она уже была открыта.`);
}).catch(alert));
els.draftScreenshotAsset.addEventListener('change', () => uploadAsset('draft-screenshot.png', els.draftScreenshotAsset.files[0]).catch(alert));
els.queueScreenshotAsset.addEventListener('change', () => uploadAsset('queue-screenshot.png', els.queueScreenshotAsset.files[0]).catch(alert));

async function detectDota() {
  const result = await api('/api/dota/detect', null, 'GET');
  els.dotaPath.value = result.dotaPath || '';
  alert(`Dota найдена:\n${result.dotaPath}`);
}

function withPrediction(fn) {
  const prediction = snapshot?.state?.activePrediction;
  if (!prediction) return alert('Нет активной ставки');
  return fn(prediction);
}

function resolveKind(kind) {
  return withPrediction((prediction) => {
    const wanted = kind === 'win' ? 'yes' : kind === 'lose' ? 'no' : kind;
    const outcome = prediction.outcomes.find((item) => item.kind === wanted || item.kind === kind);
    if (!outcome) return alert('Не найден исход для закрытия');
    return api(`/api/twitch/predictions/${prediction.id}/resolve`, { winningOutcomeId: outcome.id }).catch(alert);
  });
}

let assetRefresh = 0;

async function refreshAssets() {
  const now = Date.now();
  if (now - assetRefresh < 2000) return;
  assetRefresh = now;
  const status = await fetch('/api/assets').then((res) => res.json()).catch(() => null);
  if (!status) return;
  const slots = Array.from({ length: 10 }, (_, index) => status[`topbar-slot-${index}.png`]).filter((item) => item?.exists);
  const full = formatAssetStatus(status['draft-screenshot.png']);
  const minimap = formatAssetStatus(status['fake-minimap-vision-realistic.png']);
  const queue = formatAssetStatus(status['queue-screenshot.png']);
  const slotBytes = slots.reduce((sum, item) => sum + item.bytes, 0);
  els.assetStatus.textContent = `Слоты: ${slots.length}/10, ${Math.round(slotBytes / 1024)} KB | Draft: ${full} | Поиск: ${queue} | Миникарта: ${minimap}`;
}

function formatAssetStatus(asset) {
  if (!asset?.exists) return 'нет';
  return `${asset.kilobytes || Math.round(asset.bytes / 1024)} KB`;
}

async function uploadAsset(name, file) {
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Нужен PNG, JPEG или WebP');
  const dataUrl = await readFileAsDataUrl(file);
  await api('/api/assets', { name, dataUrl });
  assetRefresh = 0;
  await refreshAssets();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
