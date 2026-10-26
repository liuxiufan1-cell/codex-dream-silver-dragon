// Meaningful renderer companion unit tests with inert DOM and virtual time.
// This is not visual/browser/native acceptance and performs no HTTP/CDP calls.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await fs.readFile(path.join(root,'runtime/moon-palace.js'),'utf8');
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/layers/manifest.json'),'utf8'));
const css=await fs.readFile(path.join(root,'runtime/moon-palace.css'),'utf8');
const checks=[];
function assert(name,condition){checks.push({name,status:condition?'pass':'fail'});if(!condition)throw new Error(name);}
function fixture(){
 let now=0,nextId=0;const timers=new Map(),observers=[];
 class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attributes={};this.style={};this.children=[];this.parentElement=null;this.listeners=new Map();this.complete=true;this.naturalWidth=100;this.hidden=false;this.className='';}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
  appendChild(n){n.parentElement=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}prepend(n){n.parentElement=this;this.children.unshift(n);}
  remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.parentElement=null;}}
  get isConnected(){return this===doc.documentElement||Boolean(this.parentElement?.isConnected);}
  closest(selector){if(selector.includes('data-smp-owned'))return this.getAttribute('data-smp-owned')!==null?this:this.parentElement?.closest(selector);if(selector.includes('contenteditable'))return ['INPUT','TEXTAREA'].includes(this.tagName)?this:null;return null;}
  getClientRects(){return this.hidden?[]:[{width:100,height:100}];}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}
 }
 const doc=new Node('document');doc.documentElement=new Node('html');doc.head=new Node('head');doc.body=new Node('body');doc.documentElement.append(doc.head,doc.body);doc.hidden=false;let menus=[];
 doc.createElement=tag=>new Node(tag);doc.querySelectorAll=()=>menus;
 const media=new Node();media.matches=false;
 const win=new Node('window');win.performance={now:()=>now};win.matchMedia=()=>media;win.getComputedStyle=()=>({display:'block',visibility:'visible',opacity:'1'});
 win.setTimeout=(fn,delay=0)=>{const id=++nextId;timers.set(id,{fn,at:now+delay});return id;};win.clearTimeout=id=>timers.delete(id);
 win.requestAnimationFrame=fn=>win.setTimeout(fn,16);win.cancelAnimationFrame=win.clearTimeout;
 win.MutationObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 doc.documentElement.setAttribute('data-dream-skin','active');doc.documentElement.setAttribute('data-dream-motion-character','on');doc.documentElement.setAttribute('data-dream-motion-status','on');
 win.__CODEX_DREAM_SKIN_STATE__={themeId:'silver-dragon-moon-palace'};
 let hostState={mode:'full',paused:false,state:'unknown',route:'home',routeEpoch:1,taskBound:false};
 win.__CODEX_DREAM_SKIN_MOTION_STATE__={inspect:()=>({...hostState})};
 const context=vm.createContext({Math:Object.assign(Object.create(Math),{random:()=>.5}),Set,Date});
 vm.runInContext(source.replace('export function mountMoonPalace(', 'function mountMoonPalace(')+'\nthis.mount=mountMoonPalace;',context);
 const payload={schema:'silver-dragon-runtime/1',themeId:'silver-dragon-moon-palace',version:'1.0.0-beta.1',manifest,css,
  assets:Object.fromEntries([manifest.background,'assets/art/left-dragon-atmosphere-v4.png','assets/ui/dragon-crest.svg',...manifest.layers.map(n=>n.src),...Object.values(manifest.blink.assets)].map(p=>[p,'data:image/png;base64,AA==']))};
 const mount=()=>context.mount(win,doc,payload);
 function advance(ms){const end=now+ms;for(let count=0;;count++){if(count>10000)throw new Error('Unbounded timers');const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();}now=end;}
 function notify(){for(const o of observers.filter(o=>!o.disconnected))o.fn([{target:doc.body}]);advance(16);}
 function update(s){hostState={...hostState,...s};notify();}
 const all=(node=doc.documentElement)=>[node,...node.children.flatMap(c=>all(c))];
 return {win,doc,media,mount,advance,update,notify,all,timers,observers,setMenus:v=>{menus=v;notify();},Node};
}
const f=fixture();let api=f.mount();
assert('Native host exact custom theme is required',api?.inspect().themeId==='silver-dragon-moon-palace');
assert('Eight layers plus two eyelids load from embedded assets',api.inspect().layerCount===8&&api.inspect().loadedLayers===8&&api.inspect().eyesReady);
const nodes=f.all();const core=nodes.find(n=>n.getAttribute('data-smp-layer')==='core');
assert('Core head and face have no animation binding',core.getAttribute('data-smp-motion')==='none'&&core.style.transformOrigin==='50% 47.52604166666667%');
assert('Breath is a separate feathered torso-only clone',nodes.filter(n=>n.getAttribute('data-smp-layer')==='breathing-body').length===1&&css.includes('ellipse 16% 11% at 51% 29%'));
assert('Manifest durations are applied without changing native content',manifest.layers.every(l=>nodes.find(n=>n.getAttribute('data-smp-layer')===l.id).style.animationDuration===`${l.duration||6}s`));
f.advance(6500);
assert('Blink timer reaches half-closed eyes after 5-8 seconds',nodes.some(n=>n.getAttribute('data-smp-eye')==='half'&&n.style.opacity==='1')&&api.inspect().blinkCount===1);
f.win.emit('compositionstart');f.advance(150);
assert('Composition immediately cancels blink and pauses decorative motion',nodes.filter(n=>n.className==='smp-eyes').every(n=>n.style.opacity==='0')&&api.inspect().quiet&&api.inspect().paused);
f.win.emit('compositionend');f.advance(810);
assert('Composition end resumes after quiet interval',!api.inspect().quiet&&!api.inspect().paused);
f.update({state:'busy',taskBound:false});f.update({state:'completed',taskBound:false});
assert('Unbound busy-to-completed cannot invent task completion',api.inspect().completionCount===0);
f.update({state:'busy',taskBound:true});f.update({state:'completed'});
assert('Trusted same-epoch active-to-completed glints exactly once',api.inspect().completionCount===1);
f.notify();f.notify();
assert('Repeated host snapshots do not repeat completion',api.inspect().completionCount===1);
f.doc.documentElement.setAttribute('data-dream-motion-status','off');f.notify();
assert('Disabling host status effect immediately clears a completion in progress',nodes.find(n=>n.className==='smp-scene').getAttribute('data-smp-complete')==='false');
f.doc.documentElement.setAttribute('data-dream-motion-status','on');f.notify();
f.advance(1401);
assert('Completion glint ends after 1.4 seconds',nodes.find(n=>n.className==='smp-scene').getAttribute('data-smp-complete')==='false');
f.update({state:'busy',taskBound:true});f.update({state:'completed',routeEpoch:2});f.advance(900);
assert('Route epoch change rejects old completion',api.inspect().completionCount===1&&api.inspect().routeEpoch===2);
f.update({state:'busy',taskBound:true});f.update({state:'failed'});
assert('Failure remains static and never triggers success',api.inspect().state==='failed'&&api.inspect().completionCount===1&&css.includes('[data-smp-state="failed"]'));
const menu=new f.Node();menu.setAttribute('role','menu');f.setMenus([menu]);
assert('Native open menu quiets all decorative movement',api.inspect().quiet);
f.setMenus([]);f.update({route:'thread',state:'unknown',taskBound:false});f.advance(900);
assert('Real host thread route chooses half-body layout',api.inspect().route==='thread'&&f.doc.documentElement.getAttribute('data-smp-route')==='thread'&&css.includes('height:165vh'));
f.doc.emit('scroll');f.advance(100);
assert('Scrolling quiets decoration without moving transcript',api.inspect().quiet);
f.advance(600);f.update({mode:'off'});const count=api.inspect().blinkCount;f.advance(9000);
assert('Off mode cancels all future blinks',api.inspect().mode==='off'&&api.inspect().blinkCount===count);
f.update({mode:'full'});f.media.matches=true;f.media.emit('change');
assert('System reduced motion wins over Full preference',api.inspect().mode==='off');
f.media.matches=false;f.media.emit('change');f.doc.hidden=true;f.doc.emit('visibilitychange');
assert('Hidden document pauses runtime',api.inspect().paused);
f.doc.hidden=false;f.doc.emit('visibilitychange');
const old=api;api=f.mount();
assert('Reinjection cleans previous singleton and retains one scene/style',!old.inspect().alive&&f.all().filter(n=>n.id==='silver-dragon-moon-palace-scene').length===1&&f.all().filter(n=>n.id==='silver-dragon-moon-palace-style').length===1);
api.cleanup();api.cleanup();
assert('Cleanup is idempotent and removes timers observers listeners attributes',f.timers.size===0&&f.observers.every(o=>o.disconnected)&&f.doc.documentElement.getAttribute('data-silver-moon-palace')===null&&!f.win.__SILVER_DRAGON_MOON_PALACE__&&f.all().every(n=>!n.id?.startsWith('silver-dragon')));
const g=fixture();g.win.__CODEX_DREAM_SKIN_STATE__.themeId='other-theme';
assert('Other themes never receive our assets or CSS',g.mount()===null&&g.all().every(n=>!n.id?.startsWith('silver-dragon')));
g.win.__CODEX_DREAM_SKIN_STATE__.themeId='silver-dragon-moon-palace';const a=g.mount();g.doc.documentElement.setAttribute('data-dream-skin','inactive');g.notify();
assert('Theme removal automatically disposes the companion',!a.inspect().alive&&g.timers.size===0);
const h=fixture();const b=h.mount();const eye=h.all().find(n=>n.getAttribute('data-smp-eye')==='half');eye.naturalWidth=0;h.update({mode:'off'});h.update({mode:'full'});h.advance(9000);
assert('Missing eyelid asset disables blinking instead of blinking one state',!b.inspect().eyesReady&&b.inspect().blinkCount===0);b.cleanup();
assert('All scene decoration ignores input and old NGO fake ornaments are hidden precisely',css.includes('pointer-events:none!important')&&css.includes('#codex-dream-skin-chrome')&&!css.includes('*::before'));
const report={createdAt:new Date().toISOString(),scope:'Inert DOM with virtual timers; no rendering, native app, browser, HTTP or CDP calls.',checks,summary:{pass:checks.length,fail:0}};
await fs.mkdir(path.join(root,'reports'),{recursive:true});await fs.writeFile(path.join(root,'reports/runtime-unit-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
