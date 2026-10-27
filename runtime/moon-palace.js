/** Trusted companion for the pinned NGO renderer. No HTML preview or task simulator.
 * Preferences come from the pinned NGO host. Native task/route identity comes
 * from current public business markers and the structured preload protocol.
 * This module never sends a message, reads transcript text, or changes native controls.
 */
export function mountMoonPalace(win, doc, payload) {
  'use strict';
  const KEY = '__SILVER_DRAGON_MOON_PALACE__';
  const THEME = 'silver-dragon-moon-palace';
  const OWN = 'data-smp-owned';
  const root = doc.documentElement;
  const safely = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
  safely(() => win[KEY]?.cleanup?.());
  const host = () => win.__CODEX_DREAM_SKIN_STATE__;
  const motion = () => win.__CODEX_DREAM_SKIN_MOTION_STATE__;
  if (!root || !doc.body || root.getAttribute('data-dream-skin') !== 'active'
    || host()?.themeId !== THEME || payload?.themeId !== THEME || payload?.schema !== 'silver-dragon-runtime/1'
    || !Array.isArray(payload.manifest?.layers) || payload.manifest.layers.length !== 8
    || typeof payload.css !== 'string' || !payload.assets) return null;

  let alive = true;
  let api;
  let frame = null;
  let blinkTimer = null;
  let blinkVersion = 0;
  let settleTimer = null;
  let completeTimer = null;
  let composing = 0;
  let quietUntil = 0;
  let last = null;
  let activeEpoch = null;
  let terminal = false;
  let completionCount = 0;
  let blinkCount = 0;
  let refreshes = 0;
  let nativeEpoch = 1;
  let nativeContext = null;
  let nativeTask = null;
  const aliases = new Map();
  const aliasKeys = new Map();
  const conflictedAliases = new Set();
  let aliasSaturated = false;
  const pendingStarts = new Map();
  const seenRuns = new Set();
  let current = { mode: 'off', paused: true, state: 'unknown', route: 'other', routeEpoch: null, taskBound: false };
  const timers = new Set();
  const listeners = [];
  const observers = [];
  const media = safely(() => win.matchMedia('(prefers-reduced-motion: reduce)'));
  const ACTIVE = new Set(['busy', 'streaming', 'needs-attention']);
  const STATES = new Set(['unknown', 'idle', 'busy', 'streaming', 'needs-attention', 'completed', 'failed', 'cancelled']);
  const MENU = '[role="menu"], [role="listbox"], [role="dialog"][aria-modal="true"], [role="alertdialog"], dialog[open]';
  const attr = (node, name, value) => { if (node.getAttribute(name) !== String(value)) node.setAttribute(name, String(value)); };
  const live = () => alive && win[KEY] === api;
  const now = () => win.performance?.now?.() ?? Date.now();
  const cancel = timer => { if (timer !== null) { win.clearTimeout(timer); timers.delete(timer); } };
  const later = (fn, delay) => {
    const id = win.setTimeout(() => { timers.delete(id); if (live()) fn(); }, delay);
    timers.add(id); return id;
  };
  const listen = (target, type, fn, options) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, fn, options); listeners.push([target, type, fn, options]);
  };
  const make = (tag, className) => {
    const n = doc.createElement(tag); n.className = className;
    n.setAttribute(OWN, ''); n.setAttribute('aria-hidden', 'true'); return n;
  };
  const image = (className, source) => {
    const n = make('img', className); n.alt = ''; n.draggable = false;
    n.setAttribute('decoding', 'async'); n.src = payload.assets[source]; return n;
  };
  const css = make('style', 'smp-style'); css.id = 'silver-dragon-moon-palace-style';
  css.textContent = payload.css;
  (doc.head || root).appendChild(css);
  const scene = make('div', 'smp-scene'); scene.id = 'silver-dragon-moon-palace-scene';
  scene.setAttribute('inert', '');
  const background = make('div', 'smp-background');
  background.style.backgroundImage = `url("${payload.assets[payload.manifest.background]}")`;
  const shade = make('div', 'smp-base-shade');
  const crest = image('smp-crest', 'assets/ui/dragon-crest.svg');
  const character = make('div', 'smp-character');
  const canvas = make('div', 'smp-canvas');
  let core = null;
  const layerNodes = [];
  const width = payload.manifest.canvas.width, height = payload.manifest.canvas.height;
  for (const [index, layer] of payload.manifest.layers.entries()) {
    const n = image('smp-layer', layer.src); n.setAttribute('data-smp-layer', layer.id);
    n.setAttribute('data-smp-motion', layer.motion);
    Object.assign(n.style, { left: `${layer.x / width * 100}%`, top: `${layer.y / height * 100}%`,
      width: `${layer.width / width * 100}%`, height: `${layer.height / height * 100}%`, zIndex: String(layer.z),
      transformOrigin: `${layer.pivot[0] / layer.width * 100}% ${layer.pivot[1] / layer.height * 100}%`,
      animationDuration: `${layer.duration || 6}s`, animationDelay: `${-index * .63}s` });
    canvas.appendChild(n); layerNodes.push(n); if (layer.id === 'core') core = n;
  }
  if (core) {
    const n = image('smp-layer smp-breath', 'assets/layers/core.png');
    n.setAttribute('data-smp-layer', 'breathing-body'); n.setAttribute('data-smp-motion', 'breath');
    Object.assign(n.style, { left: '0', top: '0', width: '100%', height: '100%', zIndex: '31',
      animationDuration: '6s', animationDelay: '0s', transformOrigin: '51% 40%' });
    canvas.appendChild(n);
  }
  const eyes = ['half', 'closed'].map(name => {
    const n = image('smp-eyes', payload.manifest.blink.assets[name]);
    n.setAttribute('data-smp-eye', name); n.style.opacity = '0'; canvas.appendChild(n); return n;
  });
  const halo = make('div', 'smp-halo'); canvas.appendChild(halo);
  character.appendChild(canvas);
  scene.append(background, shade, crest, character);
  doc.body.prepend(scene);
  attr(root, 'data-silver-moon-palace', payload.version);

  const openEyes = () => eyes.forEach(n => { n.style.opacity = '0'; });
  const eyesReady = () => eyes.every(n => n.complete && n.naturalWidth > 0);
  const eyeState = name => eyes.forEach(n => { n.style.opacity = n.getAttribute('data-smp-eye') === name ? '1' : '0'; });
  const cancelBlink = () => { ++blinkVersion; cancel(blinkTimer); blinkTimer = null; openEyes(); };
  const visible = node => node && !node.hidden
    && !node.closest?.('[hidden], [aria-hidden="true"], [data-app-shell-active-page="false"]')
    && safely(() => node.getClientRects().length > 0, false)
    && safely(() => { const s = win.getComputedStyle(node); return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'; }, false);
  const menuOpen = () => safely(() => [...doc.querySelectorAll(MENU)].slice(0, 24).some(visible), false);
  const id = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value);
  const canonical = value => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
  const clientAlias = value => typeof value === 'string' && /^client-new-thread:[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
  const hasNativeDOM = typeof doc.querySelector === 'function';
  const nativeAvailable = () => typeof win.electronBridge?.sendMessageFromView === 'function'
    && win.location?.protocol === 'app:';
  const liveNodes = selector => safely(() => [...doc.querySelectorAll(selector)].slice(0, 64).filter(visible), []);
  // The app's own aCr action resolver excludes retained inactive pages. See
  // pinned app-initial-83973da15da9.js; URL alone is not a MemoryRouter route.
  const readContext = () => {
    const home = liveNodes('[data-ds-part="home"], .dream-home, [role="main"]:has([data-testid="home-icon"])');
    const thread = liveNodes('[data-ds-part="thread"], .thread-scroll-container, [data-app-action-timeline-scroll]');
    const route = home.length && !thread.length ? 'home' : thread.length && !home.length ? 'thread' : 'other';
    const rows = route === 'thread' ? liveNodes('[data-app-action-sidebar-thread-row][data-app-action-sidebar-thread-active="true"]') : [];
    let identity = 'none', hostId = null, uiId = null, threadId = null;
    if (rows.length === 1) {
      const row = rows[0], raw = row.getAttribute('data-app-action-sidebar-thread-id');
      const host = row.getAttribute('data-app-action-sidebar-thread-host-id');
      if (row.getAttribute('data-app-action-sidebar-thread-kind') === 'local' && id(host) && raw?.startsWith('local:')) {
        uiId = raw.slice(6); hostId = host;
        if (canonical(uiId)) { threadId = uiId; identity = 'canonical'; }
        else if (clientAlias(uiId)) {
          threadId = aliasSaturated || conflictedAliases.has(uiId) ? null : aliases.get(uiId) || null;
          identity = threadId ? 'alias-mapped' : 'alias-unresolved';
        } else identity = 'unsupported';
      }
    } else if (rows.length > 1) identity = 'ambiguous';
    return { route, hostId, uiId, threadId, identity, visible: route !== 'other' };
  };
  const sameContext = (a, b) => a && a.route === b.route && a.hostId === b.hostId
    && (a.uiId === b.uiId || (a.threadId && a.threadId === b.threadId));
  const context = () => {
    const next = composing && nativeContext ? nativeContext : readContext();
    if (nativeContext && !sameContext(nativeContext, next)) {
      nativeEpoch += 1; nativeTask = null; seenRuns.clear();
    }
    nativeContext = next;
    if (nativeTask && (nativeTask.epoch !== nativeEpoch || nativeTask.hostId !== next.hostId || nativeTask.threadId !== next.threadId)) nativeTask = null;
    // A just-started real task can precede React committing the current page.
    // Adopt only a still-active, exact business-identity match, never a terminal
    // result replayed while opening an old task. Time only expires candidates.
    for (const [key, task] of pendingStarts) {
      if (now() - task.receivedAt > 4000 || nativeEpoch > task.observedEpoch + 1) pendingStarts.delete(key);
      else if (!nativeTask && next.route === 'thread' && next.hostId === task.hostId && next.threadId === task.threadId) {
        nativeTask = { ...task, epoch: nativeEpoch, state: 'busy', phase: 'busy', terminal: false, approvals: new Set(), approvalOverflow: false };
        seenRuns.add(task.runId); pendingStarts.delete(key);
      }
    }
    return next;
  };
  const rememberAlias = (key, value, deleted = false) => {
    if (aliasSaturated) return;
    if (typeof key !== 'string' || !key.startsWith('thread-client-id-v1:') || key.length > 240) return;
    const encoded = key.slice('thread-client-id-v1:'.length);
    const decoded = safely(() => decodeURIComponent(encoded));
    if (!decoded?.startsWith('local:') || encodeURIComponent(decoded) !== encoded) return;
    const threadId = decoded.slice(6);
    if (!canonical(threadId)) return;
    const prior = aliasKeys.get(key);
    if (prior && aliases.get(prior) === threadId) aliases.delete(prior);
    aliasKeys.delete(key);
    if (deleted || !clientAlias(value)) return;
    if (aliases.has(value) && aliases.get(value) !== threadId) {
      aliases.delete(value);
      if (conflictedAliases.size >= 64) { aliasSaturated = true; aliases.clear(); aliasKeys.clear(); conflictedAliases.clear(); }
      else conflictedAliases.add(value);
      return;
    }
    if (conflictedAliases.has(value)) return;
    if (aliasKeys.size >= 64) {
      const oldest = aliasKeys.keys().next().value, alias = aliasKeys.get(oldest);
      aliasKeys.delete(oldest); aliases.delete(alias);
    }
    aliases.set(value, threadId); aliasKeys.set(key, value);
  };
  const trustworthy = event => (event.source == null || event.source === win)
    && (event.source === win ? event.origin === win.location?.origin : !event.origin || event.origin === win.location?.origin);
  const nativeMessage = event => {
    if (!live() || !nativeAvailable() || !trustworthy(event)) { schedule(); return; }
    const envelope = event.data;
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return;
    // zXt + ydt in the pinned application publish this exact persisted key.
    // Only alias IDs are inspected; unrelated persisted values are never read.
    if (envelope.type === 'persisted-atom-updated') {
      rememberAlias(envelope.key, envelope.value, envelope.deleted === true); schedule(); return;
    }
    if (envelope.type === 'persisted-atom-sync' && envelope.state && typeof envelope.state === 'object') {
      const keys = Object.keys(envelope.state);
      if (keys.length <= 4096) for (const key of keys) if (key.startsWith('thread-client-id-v1:')) rememberAlias(key, envelope.state[key]);
      schedule(); return;
    }
    const request = ['mcp-request', 'mcp-request-delivery'].includes(envelope.type);
    if ((!request && envelope.type !== 'mcp-notification') || !id(envelope.hostId)) { schedule(); return; }
    const message = request ? envelope.request : envelope;
    const params = message?.params;
    if (!params || typeof params !== 'object' || Array.isArray(params) || typeof message.method !== 'string') return;
    const threadId = params.threadId, runId = params.turnId || params.turn?.id;
    if (!canonical(threadId)) return;
    const page = context(), exact = page.route === 'thread' && page.hostId === envelope.hostId && page.threadId === threadId;
    const pendingKey = `${envelope.hostId}:${threadId}:${runId}`;
    const bind = state => {
      if (seenRuns.has(runId)) return false;
      if (seenRuns.size >= 64) return false;
      seenRuns.add(runId);
      nativeTask = { hostId: envelope.hostId, threadId, runId, epoch: nativeEpoch, state, phase: state,
        terminal: false, approvals: new Set(), approvalOverflow: false };
      return true;
    };
    if (!request && message.method === 'turn/started' && id(runId) && params.turn?.status === 'inProgress') {
      if (exact) { if (bind('busy')) sync(); }
      else if (pendingStarts.size < 8 && !seenRuns.has(runId)) pendingStarts.set(pendingKey,
        { hostId: envelope.hostId, threadId, runId, receivedAt: now(), observedEpoch: nativeEpoch });
      schedule(); return;
    }
    if (!request && message.method === 'turn/completed') pendingStarts.delete(pendingKey);
    if (!exact) { schedule(); return; }
    if (!request && message.method === 'item/agentMessage/delta' && id(runId) && !nativeTask && bind('streaming')) sync();
    if (!nativeTask || nativeTask.terminal || nativeTask.epoch !== nativeEpoch || nativeTask.hostId !== envelope.hostId
      || nativeTask.threadId !== threadId || (message.method !== 'serverRequest/resolved' && nativeTask.runId !== runId)) return;
    if (request && ['item/commandExecution/requestApproval', 'item/fileChange/requestApproval', 'item/tool/requestUserInput', 'item/permissions/requestApproval'].includes(message.method)) {
      const key = typeof message.id === 'string' && message.id.length <= 128 || Number.isSafeInteger(message.id) ? String(message.id) : null;
      if (key === null) return;
      if (nativeTask.approvals.size >= 32 && !nativeTask.approvals.has(key)) nativeTask.approvalOverflow = true;
      else nativeTask.approvals.add(key);
      nativeTask.state = 'needs-attention'; sync();
    } else if (!request && message.method === 'serverRequest/resolved') {
      const key = typeof params.requestId === 'string' || Number.isSafeInteger(params.requestId) ? String(params.requestId) : null;
      if (key !== null && nativeTask.approvals.delete(key)) { nativeTask.state = nativeTask.approvals.size || nativeTask.approvalOverflow ? 'needs-attention' : nativeTask.phase; sync(); }
    } else if (!request && message.method === 'item/agentMessage/delta') {
      nativeTask.phase = 'streaming';
      const state = nativeTask.approvals.size || nativeTask.approvalOverflow ? 'needs-attention' : 'streaming';
      if (nativeTask.state !== state) { nativeTask.state = state; sync(); }
    } else if (!request && message.method === 'turn/completed') {
      const state = ({ completed: 'completed', failed: 'failed', interrupted: 'cancelled' })[params.turn?.status];
      if (state) { nativeTask.state = state; nativeTask.terminal = true; nativeTask.approvals.clear(); sync(); }
    }
  };
  const mayAnimate = () => current.mode !== 'off' && !current.paused && !current.quiet
    && current.characterEnabled && current.route !== 'other';
  const scheduleBlink = () => {
    if (!mayAnimate() || !eyesReady() || blinkTimer !== null) return;
    const version = ++blinkVersion;
    blinkTimer = later(() => {
      blinkTimer = null;
      if (version !== blinkVersion || !mayAnimate() || !eyesReady()) { openEyes(); return; }
      blinkCount += 1; eyeState('half');
      later(() => { if (version === blinkVersion && mayAnimate()) eyeState('closed'); }, 65);
      later(() => { if (version === blinkVersion && mayAnimate()) eyeState('half'); }, 145);
      later(() => { if (version === blinkVersion) { openEyes(); scheduleBlink(); } }, 210);
    }, 5000 + Math.random() * 3000);
  };
  const clearCompletion = () => { cancel(completeTimer); completeTimer = null; attr(scene, 'data-smp-complete', 'false'); };
  const quiet = (duration = 700) => {
    quietUntil = Math.max(quietUntil, now() + duration);
    cancel(settleTimer);
    settleTimer = later(() => { settleTimer = null; sync(); }, Math.max(0, quietUntil - now()) + 5);
    sync();
  };
  const sync = () => {
    if (!live()) return;
    if (root.getAttribute('data-dream-skin') !== 'active' || host()?.themeId !== THEME) { cleanup(); return; }
    refreshes += 1;
    const raw = safely(() => motion()?.inspect?.(), {}) || {};
    const page = hasNativeDOM ? context() : null;
    const task = page && nativeTask?.epoch === nativeEpoch ? nativeTask : null;
    const next = {
      mode: media?.matches || !['subtle', 'full'].includes(raw.mode) ? 'off' : raw.mode,
      paused: Boolean(doc.hidden || composing || (page ? !page.visible : raw.paused)),
      state: page ? task?.state || 'unknown' : STATES.has(raw.state) ? raw.state : 'unknown',
      route: page ? page.route : ['home', 'thread'].includes(raw.route) ? raw.route : 'other',
      routeEpoch: page ? nativeEpoch : Number.isSafeInteger(raw.routeEpoch) ? raw.routeEpoch : null,
      taskBound: page ? Boolean(task) : raw.taskBound === true,
      characterEnabled: root.getAttribute('data-dream-motion-character') !== 'off',
      statusEnabled: root.getAttribute('data-dream-motion-status') !== 'off',
      quiet: Boolean(composing || now() < quietUntil || menuOpen()),
    };
    const routeChanged = last && (last.route !== next.route || last.routeEpoch !== next.routeEpoch);
    if (routeChanged) {
      activeEpoch = null; terminal = false; clearCompletion();
      quietUntil = Math.max(quietUntil, now() + 850); next.quiet = true;
      cancel(settleTimer); settleTimer = later(() => { settleTimer = null; sync(); }, 855);
    }
    // The host accepts validated task/run/epoch/revision messages. A visual busy
    // indication alone is not a task binding and can never trigger completion.
    if (next.taskBound && ACTIVE.has(next.state) && next.routeEpoch !== null) {
      if (!last || last.state !== next.state || last.taskBound !== next.taskBound || routeChanged) {
        activeEpoch = next.routeEpoch; terminal = false;
      }
    }
    const completed = next.state === 'completed' && next.taskBound && !terminal
      && activeEpoch !== null && activeEpoch === next.routeEpoch
      && last && ACTIVE.has(last.state) && last.taskBound && !routeChanged;
    if (['completed', 'failed', 'cancelled'].includes(next.state)) {
      terminal = true; activeEpoch = null;
    }
    current = next;
    attr(scene, 'data-smp-route', next.route);
    attr(scene, 'data-smp-mode', next.mode);
    attr(scene, 'data-smp-state', next.statusEnabled ? next.state : 'unknown');
    attr(scene, 'data-smp-running', mayAnimate());
    attr(scene, 'data-smp-quiet', next.quiet || next.paused);
    attr(root, 'data-smp-route', next.route);
    attr(root, 'data-smp-mode', next.mode);
    if (!mayAnimate()) cancelBlink(); else scheduleBlink();
    if (completed && next.mode !== 'off' && next.statusEnabled && !next.paused && !next.quiet) {
      clearCompletion(); completionCount += 1; attr(scene, 'data-smp-complete', 'true');
      completeTimer = later(() => { completeTimer = null; attr(scene, 'data-smp-complete', 'false'); }, 1400);
    }
    if (next.mode === 'off' || !next.statusEnabled || next.paused || next.quiet) clearCompletion();
    last = { ...next };
  };
  const schedule = () => {
    if (!live() || frame !== null) return;
    frame = win.requestAnimationFrame(() => { frame = null; sync(); });
  };
  function cleanup() {
    if (!alive) return;
    alive = false; ++blinkVersion;
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
    for (const id of timers) win.clearTimeout(id);
    timers.clear();
    for (const observer of observers) observer.disconnect();
    aliases.clear(); aliasKeys.clear(); conflictedAliases.clear(); pendingStarts.clear(); seenRuns.clear(); nativeTask = null;
    for (const [target, type, fn, options] of listeners) target.removeEventListener(type, fn, options);
    scene.remove(); css.remove();
    for (const name of ['data-silver-moon-palace', 'data-smp-route', 'data-smp-mode']) root.removeAttribute(name);
    if (win[KEY] === api) delete win[KEY];
  }
  api = {
    version: payload.version,
    inspect: () => ({ alive, themeId: THEME, version: payload.version, ...current,
      layerCount: layerNodes.length, loadedLayers: layerNodes.filter(n => n.complete && n.naturalWidth > 0).length,
      eyesReady: eyesReady(),
      timers: timers.size, observers: observers.length, listeners: listeners.length,
      blinkCount, completionCount, refreshes, sceneConnected: scene.isConnected,
      adapter: hasNativeDOM ? 'Current visible business page and trusted preload MCP; no transcript inference' : 'NGO fixture contract',
      nativeAdapter: { enabled: nativeAvailable(), identity: nativeContext?.identity || 'none', aliases: aliases.size, aliasSaturated,
        routeSource: hasNativeDOM ? 'active-business-dom' : 'host-fixture', stateSource: hasNativeDOM ? 'trusted-preload' : 'host-fixture' } }),
    cleanup,
  };
  win[KEY] = api;
  if (win.MutationObserver) {
    const stateObserver = new win.MutationObserver(schedule);
    stateObserver.observe(root, { attributes: true, attributeFilter: ['data-dream-skin', 'data-dream-theme', 'data-dream-motion',
      'data-dream-motion-state', 'data-dream-motion-route', 'data-dream-motion-paused', 'data-dream-motion-character', 'data-dream-motion-status'] });
    observers.push(stateObserver);
    const menuObserver = new win.MutationObserver(records => {
      if (records.some(r => !r.target?.closest?.(`[${OWN}]`))) schedule();
    });
    menuObserver.observe(doc.body, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['hidden', 'aria-hidden', 'aria-expanded', 'aria-modal', 'data-state', 'data-ds-part',
        'data-app-shell-active-page', 'data-app-action-sidebar-thread-active', 'data-app-action-sidebar-thread-selected',
        'data-app-action-sidebar-thread-id', 'data-app-action-sidebar-thread-host-id', 'data-app-action-sidebar-thread-kind'] });
    observers.push(menuObserver);
  }
  listen(doc, 'scroll', () => quiet(650), { passive: true, capture: true });
  listen(win, 'compositionstart', () => { composing += 1; sync(); });
  listen(win, 'compositionend', () => { composing = Math.max(0, composing - 1); quiet(800); });
  listen(doc, 'input', event => { if (event.target?.closest?.('input,textarea,[contenteditable="true"]')) quiet(650); }, true);
  listen(doc, 'visibilitychange', sync);
  listen(media, 'change', sync);
  listen(win, 'resize', () => quiet(400));
  listen(win, 'popstate', () => quiet(850));
  listen(win, 'hashchange', () => quiet(850));
  listen(win, 'message', nativeMessage);
  for (const n of [...layerNodes, ...eyes]) { listen(n, 'load', schedule); listen(n, 'error', schedule); }
  sync();
  return api;
}
