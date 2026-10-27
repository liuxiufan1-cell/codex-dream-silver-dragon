/* Standalone concept only: no Codex connection, network backend, or live task detection. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const validMotions = ['off', 'subtle', 'full'];
  const labels = { idle: '静候灵感', busy: '模拟执行中', done: '模拟已完成', attention: '模拟待确认', error: '模拟执行失败' };
  const motionLabels = { off: '关闭', subtle: '轻量', full: '完整' };
  const safeStorage = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k,v) { try { localStorage.setItem(k,v); } catch {} } };
  const state = { view: 'home', motion: 'subtle', task: 'idle', menu: false, composing: false, quietUntil: 0, blinkTimer: null, blinkVersion: 0, blinkPaths: [], assets: null, generation: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const artOnly = params.get('view') === 'art' || params.get('artOnly') === '1';
  if (artOnly) document.body.classList.add('art-only');
  if (params.get('capture') === '1') document.body.classList.add('capture-mode');
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').hidden = true, 3000); }
  function settle(ms = 850) { state.quietUntil = performance.now() + ms; openEyes(); scheduleBlink(); refreshQuiet(); clearTimeout(settle.timer); settle.timer = setTimeout(refreshQuiet, ms + 20); }
  function refreshQuiet() { document.body.classList.toggle('decor-quiet', state.menu || state.composing || performance.now() < state.quietUntil); }
  function setView(view, updateURL = true) {
    state.view = view === 'chat' ? 'chat' : 'home';
    document.body.dataset.view = state.view;
    document.querySelector('.home-view').hidden = state.view !== 'home';
    document.querySelector('.chat-view').hidden = state.view !== 'chat';
    $('nav-home').classList.toggle('selected', state.view === 'home');
    $('nav-chat').classList.toggle('selected', state.view === 'chat');
    $('breadcrumb-view').textContent = state.view === 'home' ? '月光书房' : '月夜设计手记';
    document.querySelectorAll('.view-switch button').forEach(button => { button.classList.toggle('active', button.dataset.view === state.view); button.setAttribute('aria-pressed', String(button.dataset.view === state.view)); });
    $('main-content').scrollTop = 0;
    if (updateURL) { const url = new URL(location.href); url.searchParams.set('view', state.view); history.replaceState(null, '', url); }
    settle(700);
  }
  function setMotion(motion, save = true) {
    state.motion = validMotions.includes(motion) ? motion : 'subtle';
    document.body.dataset.motion = reduced.matches ? 'off' : state.motion;
    $('motion-select').value = state.motion;
    $('motion-cycle').textContent = `动态：${motionLabels[state.motion]}${reduced.matches ? '（系统已减少）' : ''}`;
    if (save) safeStorage.set('moon-palace.motion', state.motion);
    openEyes(); scheduleBlink();
  }
  function setTask(task) {
    state.task = Object.hasOwn(labels, task) ? task : 'idle';
    document.body.dataset.task = state.task;
    $('task-select').value = state.task;
    $('task-status').dataset.state = state.task;
    $('task-status').textContent = labels[state.task];
    if (state.task === 'done') { const halo = document.querySelector('.crystal-halo'); halo.style.animation = 'none'; void halo.offsetWidth; halo.style.animation = ''; }
  }
  function menu(open) { state.menu = open; $('appearance-panel').hidden = !open; $('appearance-button').setAttribute('aria-expanded', String(open)); $('profile-menu').setAttribute('aria-expanded', String(open)); openEyes(); scheduleBlink(); refreshQuiet(); }
  function openEyes() { state.blinkPaths.forEach(node => node.style.opacity = '0'); }
  function eyeState(fraction) { state.blinkPaths.forEach(node => { const isClosed = node.dataset.eyeState === 'closed'; node.style.opacity = isClosed ? (fraction === 1 ? '1' : '0') : (fraction === .5 ? '1' : '0'); }); }
  function scheduleBlink() {
    clearTimeout(state.blinkTimer);
    ++state.blinkVersion;
    if (!state.blinkPaths.length || state.motion === 'off' || reduced.matches || document.hidden || params.get('capture') === '1') return;
    const delay = 5000 + Math.random() * 3000;
    state.blinkTimer = setTimeout(() => {
      if (state.menu || state.composing || performance.now() < state.quietUntil) { scheduleBlink(); return; }
      const generation = state.blinkVersion;
      eyeState(.5);
      setTimeout(() => { if (generation === state.blinkVersion) eyeState(1); }, 65);
      setTimeout(() => { if (generation === state.blinkVersion) eyeState(.5); }, 145);
      setTimeout(() => { if (generation === state.blinkVersion) { openEyes(); scheduleBlink(); } }, 210);
    }, delay);
  }
  async function buildBlink(manifest) {
    const assets = manifest.blink?.assets;
    if (!assets?.half || !assets?.closed) return false;
    const loaded = await Promise.all(['half','closed'].map(name => new Promise(resolve => {
      const overlay = new Image(); overlay.alt=''; overlay.className='eye-overlay';
      overlay.dataset.eyeState=name; overlay.style.zIndex='80'; overlay.style.opacity='0';
      overlay.setAttribute('aria-hidden','true');
      $('character-canvas').append(overlay); state.blinkPaths.push(overlay);
      overlay.onload=()=>resolve(true); overlay.onerror=()=>resolve(false);
      overlay.src=srcFromManifest(assets[name]);
    })));
    if (loaded.every(Boolean)) { scheduleBlink(); return true; }
    openEyes(); return false;
  }
  function srcFromManifest(src) {
    if (!src) return '';
    if (/^(?:data:|https?:|file:|\/)/.test(src)) return src;
    if (src.startsWith('assets/')) return src;
    return `assets/layers/${src.replace(/^\.\//,'')}`;
  }
  async function loadAssets() {
    try {
      const response = await fetch('assets/layers/manifest.json', { cache:'no-store' });
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const manifest = await response.json(); state.assets = manifest;
      const width = manifest.canvas?.width || manifest.width || 1024, height = manifest.canvas?.height || manifest.height || 1536;
      const canvas = $('character-canvas'); canvas.style.aspectRatio = `${width} / ${height}`;
      const bg = manifest.background?.src || manifest.background || 'assets/art/moon-palace-background.png';
      if (typeof bg === 'string') document.querySelector('.scenery-image').style.backgroundImage = `url("${bg.startsWith('assets/') ? bg : srcFromManifest(bg)}")`;
      let loaded = 0;
      const layers = manifest.layers || [];
      await Promise.all(layers.map(async (layer, index) => {
        const img = new Image(); img.alt=''; img.className='character-layer';
        img.dataset.layer = layer.id || `layer-${index}`;
        const id = layer.id || '';
        img.dataset.motion = layer.motion || (/(hair)/.test(id) ? 'hair' : /sleeve/.test(id) ? 'sleeve' : /wing/.test(id) ? 'wing' : /tail/.test(id) ? 'tail' : 'none');
        const x = layer.x ?? layer.position?.x ?? 0, y = layer.y ?? layer.position?.y ?? 0;
        const w = layer.width ?? layer.size?.width ?? width, h = layer.height ?? layer.size?.height ?? height;
        Object.assign(img.style,{ left:`${x/width*100}%`, top:`${y/height*100}%`, width:`${w/width*100}%`, height:`${h/height*100}%`, zIndex:String(layer.z ?? layer.zIndex ?? index), animationDelay:`${layer.delay ?? -index*.63}s` });
        if (Number.isFinite(layer.duration) && layer.duration > 0) img.style.animationDuration = `${layer.duration}s`;
        const pivot = layer.pivot || layer.origin || [w/2,h/2];
        if (Array.isArray(pivot)) img.style.transformOrigin = `${pivot[0]/w*100}% ${pivot[1]/h*100}%`;
        else if (typeof pivot === 'string') img.style.transformOrigin = pivot;
        canvas.append(img);
        await new Promise(resolve => { img.onload = () => { loaded++; resolve(); }; img.onerror = resolve; img.src = srcFromManifest(layer.src || layer.path || layer.file); });
      }));
      // The original core remains fixed. Only a feathered dress/torso region
      // receives a sub-pixel breath stretch; head, face and horns never move.
      const core = canvas.querySelector('[data-layer="core"]');
      if (core && width === 1024 && height === 1536) {
        const breath = core.cloneNode(); breath.dataset.layer='breathing-body'; breath.dataset.motion='breath';
        breath.classList.add('breathing-body'); breath.style.zIndex=String(Number(core.style.zIndex)+1); breath.style.transformOrigin='51% 40%'; breath.style.animationDelay='0s';
        canvas.append(breath);
      }
      const blinkReady = await buildBlink(manifest);
      $('asset-status').textContent = `人物图层：${loaded}/${layers.length} · 眨眼素材：${blinkReady ? '已载入' : '未载入'} · 独立二维预览`;
      document.body.dataset.assetsReady = String(loaded === layers.length && loaded > 0 && blinkReady);
      window.dispatchEvent(new CustomEvent('moon-assets-ready',{detail:{loaded,total:layers.length}}));
    } catch (error) {
      $('asset-status').textContent = location.protocol === 'file:' ? '请运行 launch-preview.cmd，通过本地服务器载入分层素材。' : '图层尚未载入，请检查素材清单。';
      document.body.dataset.assetsReady='false';
      console.warn('Preview assets:', error.message);
    }
  }
  function appendMessage(text) {
    const article=document.createElement('article'); article.className='message user-message';
    const avatar=document.createElement('span'); avatar.className='message-avatar'; avatar.textContent='你';
    const content=document.createElement('div'), meta=document.createElement('div'), p=document.createElement('p');
    meta.className='message-meta'; meta.textContent='你 · 模拟输入'; p.textContent=text;
    content.append(meta,p); article.append(avatar,content); $('messages').append(article);
    const reply=document.createElement('article'); reply.className='message assistant-message';
    const replyContent=document.createElement('div'); replyContent.className='message-content';
    const replyMeta=document.createElement('div'); replyMeta.className='message-meta'; replyMeta.textContent='白银龙娘 · 本地预览';
    const replyP=document.createElement('p'); replyP.textContent='已记录这条演示消息。此页面用于检查构图、阅读与动态效果；不会发送消息或执行真实任务。';
    replyContent.append(replyMeta,replyP); reply.append(replyContent); $('messages').append(reply);
    setTask('busy'); const generation=++state.generation; setTimeout(()=>{if(generation===state.generation) setTask('done');},2600);
    requestAnimationFrame(()=>$('main-content').scrollTo({top:$('main-content').scrollHeight,behavior:reduced.matches?'instant':'smooth'}));
  }
  function submit(event, input) { event.preventDefault(); if(state.composing)return; const text=input.value.trim(); if(!text){toast('输入一个想法，试试模拟对话。');input.focus();return;} setView('chat'); appendMessage(text); input.value=''; }
  $('home-form').addEventListener('submit',event=>submit(event,$('home-input')));
  $('chat-form').addEventListener('submit',event=>submit(event,$('chat-input')));
  document.querySelectorAll('textarea').forEach(input=>{
    input.addEventListener('compositionstart',()=>{state.composing=true;openEyes();scheduleBlink();refreshQuiet();});
    input.addEventListener('compositionend',()=>{state.composing=false;settle(800);scheduleBlink();});
    input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&!state.composing){event.preventDefault();input.form.requestSubmit();}});
  });
  document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>{setView('home');$('home-input').value=button.dataset.prompt;$('home-input').focus();}));
  document.querySelectorAll('.view-switch button').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
  $('brand-home').addEventListener('click',()=>setView('home'));
  $('new-chat').addEventListener('click',()=>{++state.generation;setView('home');setTask('idle');$('home-input').focus();});
  $('nav-home').addEventListener('click',()=>setView('home')); $('nav-chat').addEventListener('click',()=>setView('chat'));
  $('task-select').addEventListener('change',event=>{++state.generation;setTask(event.target.value);});
  $('motion-select').addEventListener('change',event=>setMotion(event.target.value));
  $('motion-cycle').addEventListener('click',()=>setMotion(validMotions[(validMotions.indexOf(state.motion)+1)%3]));
  $('appearance-button').addEventListener('click',()=>menu(!state.menu)); $('profile-menu').addEventListener('click',()=>menu(!state.menu));
  document.addEventListener('pointerdown',event=>{if(state.menu&&!event.target.closest('#appearance-panel,#appearance-button,#profile-menu'))menu(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')menu(false);});
  $('main-content').addEventListener('scroll',()=>settle(700),{passive:true});
  document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);openEyes();scheduleBlink();});
  reduced.addEventListener('change',()=>setMotion(state.motion,false));
  $('copy-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(':root {\n  --canvas: #FAF9FD;\n  --ink: #302B3B;\n  --accent: #8B65C2;\n  --focus: #7651AF;\n}');toast('示例主题变量已复制。');}catch{toast('当前环境不支持复制，请在代码框选择文字。');}});
  document.body.classList.toggle('page-hidden',document.hidden);
  setView(params.get('view'),false); setMotion(params.get('motion')||safeStorage.get('moon-palace.motion')||'subtle',false); setTask(params.get('state')||'idle');
  loadAssets();
  window.moonPreview={state,setView,setMotion,setTask,settle,eyeState,openEyes,loadAssets,forceBlink(value){clearTimeout(state.blinkTimer);++state.blinkVersion;if(value==='normal'||value===0)openEyes();else eyeState(value==='closed'||value===1?1:.5);}};
  window.__moonPreview=window.moonPreview;
})();
