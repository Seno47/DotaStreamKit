const els = {
  gsiStatus: document.querySelector('#gsiStatus'),
  twitchStatus: document.querySelector('#twitchStatus'),
  autoDraft: document.querySelector('#autoDraft'),
  autoMinimap: document.querySelector('#autoMinimap'),
  minimapSize: document.querySelector('#minimapSize'),
  minimapSide: document.querySelector('#minimapSide'),
  minimapStyle: document.querySelector('#minimapStyle'),
  manualDraft: document.querySelector('#manualDraft'),
  manualMinimap: document.querySelector('#manualMinimap'),
  manualTopBar: document.querySelector('#manualTopBar'),
  gameState: document.querySelector('#gameState'),
  gameScreen: document.querySelector('#gameScreen'),
  heroState: document.querySelector('#heroState'),
  clockTime: document.querySelector('#clockTime'),
  matchId: document.querySelector('#matchId'),
  clientId: document.querySelector('#clientId'),
  clientSecret: document.querySelector('#clientSecret'),
  logoutTwitch: document.querySelector('#logoutTwitch'),
  predictionForm: document.querySelector('#predictionForm'),
  predictionTitle: document.querySelector('#predictionTitle'),
  predictionWindow: document.querySelector('#predictionWindow'),
  winTitle: document.querySelector('#winTitle'),
  loseTitle: document.querySelector('#loseTitle'),
  autoCreate: document.querySelector('#autoCreate'),
  autoResolve: document.querySelector('#autoResolve'),
  autoCancelInvalidGame: document.querySelector('#autoCancelInvalidGame'),
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
  assetStatus: document.querySelector('#assetStatus'),
  events: document.querySelector('#events')
};

let snapshot = null;

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
  els.twitchStatus.textContent = state.twitch.authenticated
    ? state.twitch.needsReconnect
      ? `Twitch: ${state.twitch.broadcasterLogin} / reconnect`
      : `Twitch: ${state.twitch.broadcasterLogin}`
    : state.twitch.needsReconnect
      ? 'Twitch reconnect'
      : 'Twitch disconnected';
  els.twitchStatus.className = `pill ${state.twitch.authenticated && !state.twitch.needsReconnect ? 'ok' : 'bad'}`;

  els.autoDraft.checked = config.protection.autoDraft;
  els.autoMinimap.checked = config.protection.autoMinimap;
  els.minimapSize.value = config.protection.minimapSize || 'normal';
  els.minimapSide.value = config.protection.minimapSide || 'left';
  els.minimapStyle.value = config.protection.minimapStyle || 'realistic';
  toggleButton(els.manualDraft, config.protection.manualDraft || state.protection.draft);
  toggleButton(els.manualMinimap, config.protection.manualMinimap || state.protection.minimap);
  toggleButton(els.manualTopBar, config.protection.manualTopBar || state.protection.topBar);

  els.gameState.textContent = state.gsi.gameState || '-';
  els.gameScreen.textContent = state.gsi.leftGameView ? 'меню Dota / reconnect' : state.gsi.inGameScreen ? 'игровой экран' : '-';
  els.heroState.textContent = state.gsi.playerHeroPicked ? `${state.gsi.heroName || state.gsi.heroId || 'выбран'}${state.gsi.ownPickPhaseEnded ? ' / topbar only' : ''}` : '-';
  els.clockTime.textContent = state.gsi.clockTime ?? '-';
  els.matchId.textContent = state.gsi.matchId || '-';

  els.clientId.value = config.twitch.clientId || '';
  if (document.activeElement !== els.dotaPath) {
    els.dotaPath.value = config.dota?.installPath || '';
  }
  els.predictionTitle.value = config.predictions.titleTemplate;
  els.predictionWindow.value = config.predictions.windowSeconds;
  els.winTitle.value = config.predictions.winTitle;
  els.loseTitle.value = config.predictions.loseTitle;
  els.autoCreate.checked = config.predictions.autoCreate;
  els.autoResolve.checked = config.predictions.autoResolve;
  els.autoCancelInvalidGame.checked = config.predictions.autoCancelInvalidGame ?? true;

  renderPrediction(state.activePrediction);
  renderEvents(state.events || []);
}

function toggleButton(button, enabled) {
  button.classList.toggle('active', Boolean(enabled));
}

function renderPrediction(prediction) {
  if (!prediction) {
    els.activePrediction.textContent = 'Нет активной ставки.';
    return;
  }
  const outcomes = prediction.outcomes.map((item) => `${item.title}: ${item.channelPoints || 0}`).join(' | ');
  els.activePrediction.textContent = `${prediction.title} (${prediction.status}) ${outcomes}`;
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
els.minimapSize.addEventListener('change', () => saveProtection({ minimapSize: els.minimapSize.value }).catch(alert));
els.minimapSide.addEventListener('change', () => saveProtection({ minimapSide: els.minimapSide.value }).catch(alert));
els.minimapStyle.addEventListener('change', () => saveProtection({ minimapStyle: els.minimapStyle.value }).catch(alert));
els.manualDraft.addEventListener('click', () => saveProtection({ manualDraft: !snapshot.config.protection.manualDraft }).catch(alert));
els.manualMinimap.addEventListener('click', () => saveProtection({ manualMinimap: !snapshot.config.protection.manualMinimap }).catch(alert));
els.manualTopBar.addEventListener('click', () => saveProtection({ manualTopBar: !snapshot.config.protection.manualTopBar }).catch(alert));

els.clientId.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('change', () => saveTwitchAppConfig().catch(alert));
els.clientSecret.addEventListener('blur', () => {
  els.clientSecret.value = '';
});
els.dotaPath.addEventListener('change', () => saveDotaConfig().catch(alert));

async function saveTwitchAppConfig() {
  await api('/api/config', {
    twitch: {
      clientId: els.clientId.value.trim(),
      clientSecret: els.clientSecret.value.trim() || '********'
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

els.predictionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await api('/api/config', {
    predictions: {
      titleTemplate: els.predictionTitle.value.trim(),
      windowSeconds: Number(els.predictionWindow.value),
      winTitle: els.winTitle.value.trim(),
      loseTitle: els.loseTitle.value.trim(),
      autoCreate: els.autoCreate.checked,
      autoResolve: els.autoResolve.checked,
      autoCancelInvalidGame: els.autoCancelInvalidGame.checked
    }
  }).catch(alert);
});

els.createPrediction.addEventListener('click', () => api('/api/twitch/predictions', {
  title: els.predictionTitle.value.trim(),
  windowSeconds: Number(els.predictionWindow.value),
  winTitle: els.winTitle.value.trim(),
  loseTitle: els.loseTitle.value.trim()
}).catch(alert));

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
    const outcome = prediction.outcomes.find((item) => item.kind === kind);
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
  const slotBytes = slots.reduce((sum, item) => sum + item.bytes, 0);
  els.assetStatus.textContent = `Слоты: ${slots.length}/10, ${Math.round(slotBytes / 1024)} KB | Скрин: ${full} | Миникарта: ${minimap}`;
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
