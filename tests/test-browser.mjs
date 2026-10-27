// Real Chromium rendering against the preview and a declared host DOM fixture.
// The fixture verifies the companion, not a running Codex application.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const render=process.argv.includes('--render');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
const server=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,MOON_PREVIEW_PORT:'9483'},stdio:['ignore','pipe','pipe']});
const checks=[];
const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
let serverError='';server.stderr.on('data',b=>serverError+=b);
try{
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Preview startup timed out: '+serverError)),10000);server.once('exit',()=>{clearTimeout(t);reject(Error(serverError));});server.stdout.once('data',()=>{clearTimeout(t);resolve();});});
 await fs.mkdir(path.join(root,'reports'),{recursive:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[1280,720],[1920,1080],[2560,1440],[853,480],[390,844]]){
  await page.setViewportSize({width,height});
  for(const view of ['home','chat']){
   await page.goto(`http://127.0.0.1:9483/?view=${view}&capture=1`);
   await page.waitForSelector('body[data-assets-ready="true"]');
   const state=await page.evaluate(()=>({
    assets:[...document.querySelectorAll('.character-layer,.eye-overlay')].every(n=>n.complete&&n.naturalWidth>0),
    overflow:document.documentElement.scrollWidth>innerWidth,
    canvas:getComputedStyle(document.body).backgroundColor,
    coreAnimation:getComputedStyle(document.querySelector('[data-layer="core"]')).animationName,
    decoPointer:getComputedStyle(document.querySelector('.character')).pointerEvents,
    characterHidden:getComputedStyle(document.querySelector('.character')).display==='none',
    home:document.querySelector('.home-view').getBoundingClientRect().toJSON(),
    character:document.querySelector('.character').getBoundingClientRect().toJSON(),
   }));
   check(`${width} ${view}: assets, light palette, stable core, inert decoration and no horizontal overflow`,state.assets&&!state.overflow&&state.canvas==='rgb(250, 249, 253)'&&state.coreAnimation==='none'&&state.decoPointer==='none');
   if(width<=1100||view==='chat'&&width<=1700)check(`${width} ${view}: narrow reading hides character`,state.characterHidden);
   if(view==='home'&&!state.characterHidden)check(`${width}: character does not overlap operation column`,state.home.right<=state.character.left+1);
   await page.screenshot({path:path.join(root,`reports/browser-${view}-${width}.png`)});
   if(render&&width===2560)await page.screenshot({path:path.join(root,`concepts/${view}-2560x1440.png`)});
  }
 }
 await page.setViewportSize({width:1920,height:1080});
 await page.goto('http://127.0.0.1:9483/?motion=full');await page.waitForSelector('body[data-assets-ready="true"]');
 await page.waitForFunction(()=>!document.body.classList.contains('decor-quiet'));
 const motion=await page.evaluate(()=>{const n=document.querySelector('[data-layer="tail"]');const s=getComputedStyle(n);return{name:s.animationName,running:s.animationPlayState};});
 check('Full mode runs a real tail animation',motion.name==='tail-drift'&&motion.running==='running');
 await page.click('#appearance-button');
 await page.selectOption('#motion-select','off');
 await page.keyboard.press('Escape');
 check('Off stops every character animation',await page.evaluate(()=>[...document.querySelectorAll('.character-layer')].every(n=>getComputedStyle(n).animationName==='none')));
 await page.evaluate(()=>moonPreview.setMotion('full'));await page.click('#appearance-button');
 check('Open menu pauses animation',await page.evaluate(()=>getComputedStyle(document.querySelector('[data-layer="tail"]')).animationPlayState==='paused'));
 await page.keyboard.press('Escape');
 await page.locator('#home-input').dispatchEvent('compositionstart');
 check('IME pauses animation and opens eyes',await page.evaluate(()=>getComputedStyle(document.querySelector('[data-layer="tail"]')).animationPlayState==='paused'&&moonPreview.state.blinkPaths.every(n=>n.style.opacity==='0')));
 await page.locator('#home-input').dispatchEvent('compositionend');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.body.dataset.motion==='off');
 check('System reduced motion overrides full',await page.evaluate(()=>document.body.dataset.motion==='off'&&getComputedStyle(document.querySelector('[data-layer="tail"]')).animationName==='none'));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>document.body.dataset.motion==='full');
 for(const state of ['normal','half','closed']){await page.evaluate(s=>moonPreview.forceBlink(s),state);await page.locator('.character').screenshot({animations:'disabled',path:path.join(root,`reports/blink-${state}.png`)});}
 // Fixture retains native input, sidebar and thread elements, with no simulator.
 const fixture=`<!doctype html><html class="codex-dream-skin" data-dream-skin="active" data-dream-motion-character="on" data-dream-motion-status="on"><head><style>@layer properties,community;body{margin:0;font:16px system-ui}aside{position:fixed;width:240px;height:100vh;padding:24px;box-sizing:border-box}main{margin-left:240px;padding:80px 30px;min-height:100vh;box-sizing:border-box}.dream-home{display:flex;flex-direction:column}.composer-surface-chrome{padding:20px;border:1px solid;border-radius:12px}textarea{width:100%;height:100px;border:0;background:transparent;color:inherit}button{padding:12px;background:transparent;color:inherit;border:1px solid #ddd}pre{padding:20px}</style></head><body><aside data-ds-part="sidebar">项目 / 会话<br><button>新建会话</button></aside><main data-ds-part="main"><section class="dream-home" data-ds-part="home"><div class="group/home-composer-layout"><h1 data-ds-part="home-hero">开始新的创作</h1><div data-ds-part="composer" class="composer-surface-chrome"><textarea aria-label="真实输入框结构"></textarea><button>发送</button></div></div></section><section data-ds-part="thread" hidden><p>示例正文与代码，仅供宿主布局验证。</p><div data-code-block="true"><pre>const palette = 'white-purple';</pre></div></section></main></body></html>`;
 await page.goto('about:blank');
 await page.setContent(fixture);
 await page.evaluate(()=>{window.__CODEX_DREAM_SKIN_STATE__={themeId:'silver-dragon-moon-palace'};window.__CODEX_DREAM_SKIN_MOTION_STATE__={inspect:()=>({mode:'full',route:'home',routeEpoch:1,paused:false,state:'unknown',taskBound:false})};});
 const bundle=await fs.readFile(path.join(root,'runtime/dist/moon-palace.bundle.js'),'utf8');
 await page.addScriptTag({content:bundle});
 await page.waitForFunction(()=>window.__SILVER_DRAGON_MOON_PALACE__?.inspect().loadedLayers===8);
 const host=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,sidebar:getComputedStyle(document.querySelector('aside')).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--dream-accent').trim(),mode:window.__SILVER_DRAGON_MOON_PALACE__.inspect().mode}));
 check('Embedded host fixture uses the same white palette and full dynamic mode',host.background==='rgb(250, 249, 253)'&&host.sidebar==='rgb(255, 255, 255)'&&host.accent==='#8B65C2'&&host.mode==='full');
 const composer=page.locator('[data-ds-part="composer"]');const before=await composer.boundingBox();
 await page.screenshot({path:path.join(root,'reports/host-fixture-home.png')});
 await page.waitForTimeout(800);check('Character animation leaves native composer geometry stable',JSON.stringify(before)===JSON.stringify(await composer.boundingBox()));
 await page.locator('textarea').fill('输入检查');check('Decoration permits native input',await page.locator('textarea').inputValue()==='输入检查');
 await page.evaluate(()=>window.__SILVER_DRAGON_MOON_PALACE__.cleanup());
 check('Cleanup removes scene, owned style and root marker',await page.evaluate(()=>!document.querySelector('.smp-scene')&&!document.querySelector('.smp-style')&&!document.documentElement.hasAttribute('data-silver-moon-palace')));
 check('No browser JavaScript exceptions',errors.length===0);
 if(render){
  await page.goto('http://127.0.0.1:9483/?view=art&capture=1');await page.setViewportSize({width:2560,height:1440});await page.waitForSelector('body[data-assets-ready="true"]');
  await page.screenshot({path:path.join(root,'static-theme/background.png')});
 }
 await fs.writeFile(path.join(root,'reports/browser-validation.json'),JSON.stringify({scope:'Chromium standalone preview and declared host DOM fixture; not native Windows Codex acceptance',checks,pass:checks.length,fail:0},null,2)+'\n');
 console.log(JSON.stringify({pass:checks.length,fail:0,render}));
}finally{await browser.close();server.kill();}
