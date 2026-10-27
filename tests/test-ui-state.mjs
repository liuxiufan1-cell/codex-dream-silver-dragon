// Executes the real app logic with an inert DOM and virtual clock.
// No browser, rendering, HTTP requests, or external processes are used.
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await fs.mkdir(path.join(root,'reports'),{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/layers/manifest.json'),'utf8'));
const source=await fs.readFile(path.join(root,'preview/app.js'),'utf8');
let now=0, nextTimer=0;
const timers=new Map(), checks=[];
const assert=(name,condition)=>{checks.push({name,status:condition?'pass':'fail'});if(!condition)throw new Error(name);};
function timeout(callback,delay=0){const id=++nextTimer;timers.set(id,{at:now+delay,callback});return id;}
function advance(ms){const end=now+ms;for(;;){const due=[...timers].filter(([,x])=>x.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].callback();}now=end;}
class Node {
  constructor(){this.dataset={};this.style={};this.children=[];this.listeners={};this.attributes={};this.value='';this.hidden=false;this.textContent='';this.className='';this.offsetWidth=1;this.scrollHeight=1000;const values=new Set();this.classList={add:(...xs)=>xs.forEach(x=>values.add(x)),remove:(...xs)=>xs.forEach(x=>values.delete(x)),contains:x=>values.has(x),toggle:(x,on)=>{if(on===undefined)on=!values.has(x);on?values.add(x):values.delete(x);return on;}};}
  addEventListener(name,callback){(this.listeners[name]||=[]).push(callback);}
  emit(name,event={}){for(const callback of this.listeners[name]||[])callback(event);}
  setAttribute(name,value){this.attributes[name]=value;}
  append(...nodes){this.children.push(...nodes);}
  focus(){}
  scrollTo(options){this.scrollTop=options.top;}
  cloneNode(){const node=new Node();node.dataset={...this.dataset};node.style={...this.style};node.className=this.className;return node;}
  querySelector(selector){return selector==='[data-layer="core"]'?this.children.find(x=>x.dataset.layer==='core'):null;}
  closest(){return null;}
}
const ids=new Map(), node=id=>{if(!ids.has(id))ids.set(id,new Node());return ids.get(id);};
const classNodes=new Map(), byClass=selector=>{if(!classNodes.has(selector))classNodes.set(selector,new Node());return classNodes.get(selector);};
const viewButtons=['home','chat'].map(view=>{const b=new Node();b.dataset.view=view;return b;});
const inputs=[node('home-input'),node('chat-input')];
const document=new Node();
Object.assign(document,{body:new Node(),hidden:false,getElementById:node,createElement:()=>new Node(),createElementNS:()=>new Node(),querySelector:byClass,querySelectorAll:selector=>selector==='.view-switch button'?viewButtons:selector==='textarea'?inputs:[]});
class Image extends Node {set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
const storage=new Map(), media={matches:false,addEventListener(){}};
const window={dispatchEvent(){}};
const context={document,window,Image,location:{href:'http://local.test/',search:'',protocol:'http:'},history:{replaceState(){}},localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},matchMedia:()=>media,performance:{now:()=>now},setTimeout:timeout,clearTimeout:id=>timers.delete(id),requestAnimationFrame:callback=>callback(),CustomEvent:class{},URL,URLSearchParams,navigator:{clipboard:{writeText:async()=>{}}},console,Math:Object.assign(Object.create(Math),{random:()=>.5}),fetch:async()=>({ok:true,json:async()=>manifest})};
vm.runInNewContext(source,context,{filename:'app.js'});
for(let i=0;i<20;i++)await Promise.resolve();
const api=window.moonPreview;
const eyesOpen=()=>api.state.blinkPaths.every(x=>x.style.opacity==='0');
assert('Eight manifest layers loaded without network',document.body.dataset.assetsReady==='true'&&node('character-canvas').children.filter(x=>x.dataset.layer&&x.dataset.layer!=='breathing-body').length===8);
assert('Half/closed states load two shared SVG overlays',api.state.blinkPaths.length===2&&api.state.blinkPaths.every(x=>x.src.endsWith('.svg')));
assert('Per-layer manifest durations are applied',manifest.layers.filter(x=>x.duration).every(x=>node('character-canvas').children.find(n=>n.dataset.layer===x.id).style.animationDuration===`${x.duration}s`));
api.setMotion('full');advance(6500);
assert('Scheduled blink reaches half state',api.state.blinkPaths.some(x=>x.dataset.eyeState==='half'&&x.style.opacity==='1'));
api.settle();advance(150);
assert('Scroll/route settling cancels an active blink',eyesOpen());
advance(900);api.setMotion('full');advance(6500);api.setMotion('off');advance(250);
assert('Turning motion off invalidates pending blink callbacks',eyesOpen());
assert('Motion preference is persisted',storage.get('moon-palace.motion')==='off');
api.setMotion('full');advance(6500);node('appearance-button').emit('click');advance(210);
assert('Opening a menu stops an active blink',eyesOpen()&&document.body.classList.contains('decor-quiet'));
document.emit('keydown',{key:'Escape'});
node('home-input').emit('compositionstart');assert('IME composition suppresses decoration',document.body.classList.contains('decor-quiet')&&eyesOpen());
node('home-input').emit('compositionend');advance(900);assert('IME suppression expires after composition ends',!document.body.classList.contains('decor-quiet'));
document.hidden=true;document.emit('visibilitychange');assert('Hidden page pauses by class and cancels blink',document.body.classList.contains('page-hidden')&&eyesOpen());
document.hidden=false;document.emit('visibilitychange');
node('home-input').value='本地模拟消息';node('home-form').emit('submit',{preventDefault(){}});
assert('Submitting a demonstration message enters simulated busy state',api.state.task==='busy');
node('new-chat').emit('click');advance(2700);
assert('New chat cancels previous simulated completion',api.state.task==='idle'&&api.state.view==='home');
const report={createdAt:new Date().toISOString(),scope:'Node VM unit tests with inert DOM and virtual clock. No rendering or browser acceptance is claimed.',checks,summary:{pass:checks.filter(x=>x.status==='pass').length,fail:checks.filter(x=>x.status==='fail').length}};
await fs.writeFile(path.join(root,'reports/ui-state-unit-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
