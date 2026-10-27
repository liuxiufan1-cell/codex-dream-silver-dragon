// Inert DOM / virtual-clock regression for the observed MemoryRouter contract.
// No browser, native window, CDP, IPC, network, transcript or credentials.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await fs.readFile(path.join(root,'runtime/moon-palace.js'),'utf8');
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/layers/manifest.json'),'utf8'));
const css=await fs.readFile(path.join(root,'runtime/moon-palace.css'),'utf8');
const checks=[];
function assert(name,condition){checks.push({name,pass:Boolean(condition)});if(!condition)throw Error(name);}
// Synthetic identifiers only: no actual session or task identifiers are shipped.
const THREAD='11111111-1111-7111-8111-111111111111';
const OTHER='22222222-2222-7222-8222-222222222222';
const ALIAS='client-new-thread:33333333-3333-7333-8333-333333333333';
const run=n=>`44444444-4444-7444-8444-${String(n).padStart(12,'0')}`;
function fixture(){
 let now=0,nextId=0,ipcCalls=0;
 const timers=new Map(),observers=[];
 class Node{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attributes={};this.style={};this.children=[];this.parentElement=null;this.listeners=new Map();this.complete=true;this.naturalWidth=100;this.className='';this.hidden=false;this.kind=null;}
  setAttribute(k,v){this.attributes[k]=String(v);}getAttribute(k){return this.attributes[k]??null;}removeAttribute(k){delete this.attributes[k];}
  appendChild(n){n.parentElement=this;this.children.push(n);return n;}append(...ns){ns.forEach(n=>this.appendChild(n));}prepend(n){n.parentElement=this;this.children.unshift(n);}
  remove(){if(this.parentElement){this.parentElement.children=this.parentElement.children.filter(n=>n!==this);this.parentElement=null;}}
  get isConnected(){return this===doc.documentElement||Boolean(this.parentElement?.isConnected);}
  closest(selector){
   for(let n=this;n;n=n.parentElement){
    if(selector.includes('data-smp-owned')&&n.getAttribute('data-smp-owned')!==null)return n;
    if(selector.includes('[hidden]')&&n.hidden)return n;
    if(selector.includes('[aria-hidden="true"]')&&n.getAttribute('aria-hidden')==='true')return n;
    if(selector.includes('data-app-shell-active-page="false"')&&n.getAttribute('data-app-shell-active-page')==='false')return n;
    if(selector.includes('contenteditable')&&n.getAttribute('contenteditable')==='true')return n;
   }return null;
  }
  getClientRects(){return this.hidden?[]:[{width:100,height:100}];}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}
 }
 const doc=new Node('document');doc.documentElement=new Node('html');doc.head=new Node('head');doc.body=new Node('body');doc.documentElement.append(doc.head,doc.body);doc.hidden=false;
 const homeWrap=new Node(),home=new Node();home.kind='home';homeWrap.setAttribute('data-app-shell-active-page','true');homeWrap.append(home);doc.body.append(homeWrap);
 const threadWrap=new Node(),thread=new Node();thread.kind='thread';threadWrap.setAttribute('data-app-shell-active-page','false');threadWrap.append(thread);doc.body.append(threadWrap);
 const row=new Node('button');row.kind='row';row.setAttribute('data-app-action-sidebar-thread-kind','local');row.setAttribute('data-app-action-sidebar-thread-host-id','local');row.setAttribute('data-app-action-sidebar-thread-id','local:'+THREAD);row.setAttribute('data-app-action-sidebar-thread-active','false');doc.body.append(row);
 let menus=[],extraRows=[];
 const all=(n=doc.documentElement)=>[n,...n.children.flatMap(c=>all(c))];
 doc.createElement=tag=>new Node(tag);
 doc.querySelectorAll=selector=>{
  if(selector.includes('[data-ds-part="home"]'))return all().filter(n=>n.kind==='home');
  if(selector.includes('[data-ds-part="thread"]'))return all().filter(n=>n.kind==='thread');
  if(selector.includes('data-app-action-sidebar-thread-row'))return [row,...extraRows].filter(n=>n.getAttribute('data-app-action-sidebar-thread-active')==='true');
  if(selector.includes('[role="menu"]'))return menus;
  return [];
 };
 doc.querySelector=selector=>doc.querySelectorAll(selector)[0]||null;
 const media=new Node();media.matches=false;
 const win=new Node('window');win.performance={now:()=>now};win.matchMedia=()=>media;win.getComputedStyle=()=>({display:'block',visibility:'visible',opacity:'1'});
 win.location={protocol:'app:',origin:'app://-',pathname:'/index.html',search:'',hash:''};
 win.electronBridge={sendMessageFromView(){ipcCalls++;throw Error('Companion must remain passive');}};
 win.setTimeout=(fn,delay=0)=>{const id=++nextId;timers.set(id,{fn,at:now+delay});return id;};win.clearTimeout=id=>timers.delete(id);
 win.requestAnimationFrame=fn=>win.setTimeout(fn,16);win.cancelAnimationFrame=win.clearTimeout;
 win.MutationObserver=class{constructor(fn){this.fn=fn;this.disconnected=false;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}};
 doc.documentElement.setAttribute('data-dream-skin','active');doc.documentElement.setAttribute('data-dream-motion-character','on');doc.documentElement.setAttribute('data-dream-motion-status','on');
 win.__CODEX_DREAM_SKIN_STATE__={themeId:'silver-dragon-moon-palace'};
 let hostState={mode:'full',paused:true,state:'completed',route:'home',routeEpoch:1,taskBound:true};
 win.__CODEX_DREAM_SKIN_MOTION_STATE__={inspect:()=>({...hostState})};
 const context=vm.createContext({Math:Object.assign(Object.create(Math),{random:()=>.5}),Set,Map,Date,encodeURIComponent,decodeURIComponent});
 vm.runInContext(source.replace('export function mountMoonPalace(','function mountMoonPalace(')+'\nthis.mount=mountMoonPalace;',context);
 const payload={schema:'silver-dragon-runtime/1',themeId:'silver-dragon-moon-palace',version:'1.0.0-beta.2',manifest,css,assets:Object.fromEntries([manifest.background,'assets/ui/dragon-crest.svg',...manifest.layers.map(n=>n.src),...Object.values(manifest.blink.assets)].map(p=>[p,'data:image/png;base64,AA==']))};
 function advance(ms){const end=now+ms;for(let count=0;;count++){if(count>10000)throw Error('Unbounded timer loop');const next=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;}
 function notify(){for(const observer of observers.filter(o=>!o.disconnected))observer.fn([{target:doc.body}]);advance(16);}
 const mount=()=>context.mount(win,doc,payload);
 const page=(kind,id=THREAD)=>{
  homeWrap.setAttribute('data-app-shell-active-page',kind==='home'?'true':'false');
  threadWrap.setAttribute('data-app-shell-active-page',kind==='thread'?'true':'false');
  row.setAttribute('data-app-action-sidebar-thread-active',kind==='thread'?'true':'false');
  row.setAttribute('data-app-action-sidebar-thread-id','local:'+id);notify();
 };
 const event=(data,source=null,origin='')=>{win.emit('message',{source,origin,data});advance(16);};
 const mcp=(method,params={},hostId='local')=>event({type:'mcp-notification',hostId,method,params});
 const start=(n,id=THREAD,hostId='local')=>mcp('turn/started',{threadId:id,turn:{id:run(n),status:'inProgress'}},hostId);
 const finish=(n,status='completed',id=THREAD,hostId='local')=>mcp('turn/completed',{threadId:id,turn:{id:run(n),status}},hostId);
 const delta=(n,id=THREAD)=>mcp('item/agentMessage/delta',{threadId:id,turnId:run(n)});
 return{win,doc,homeWrap,threadWrap,row,Node,media,mount,advance,notify,page,event,mcp,start,finish,delta,all,timers,observers,
  setHost:s=>{hostState={...hostState,...s};notify();},setMenus:v=>{menus=v;notify();},addRow:n=>{extraRows.push(n);doc.body.append(n);notify();},ipcCalls:()=>ipcCalls};
}

const f=fixture(),api=f.mount();
assert('Actual current Home overrides stale host terminal state',api.inspect().route==='home'&&api.inspect().state==='unknown'&&!api.inspect().taskBound&&api.inspect().completionCount===0);
f.page('thread');f.advance(900);
assert('Retained inactive Home cannot override the visible thread',api.inspect().route==='thread'&&api.inspect().routeEpoch===2&&api.inspect().nativeAdapter.identity==='canonical');
assert('Stale hidden Home host pause does not freeze the visible thread',!api.inspect().paused&&!api.inspect().quiet);
assert('Constant MemoryRouter URL does not prevent independent route epoch changes',f.win.location.pathname==='/index.html'&&f.doc.documentElement.getAttribute('data-smp-route')==='thread');
f.start(1);assert('Exact canonical current thread binds structured native start',api.inspect().state==='busy'&&api.inspect().taskBound);
f.delta(1);assert('Structured delta updates streaming without reading its content',api.inspect().state==='streaming');
f.finish(1);assert('Same bound native turn completion glints once',api.inspect().state==='completed'&&api.inspect().completionCount===1);
f.finish(1);f.start(1);f.delta(1);assert('Duplicate terminal and stale restart do not replay completion',api.inspect().completionCount===1&&api.inspect().state==='completed');
f.start(2,THREAD,'other-host');f.finish(2,'completed',THREAD,'other-host');assert('A different host cannot supply task state',api.inspect().state==='completed'&&api.inspect().completionCount===1);
f.event({type:'mcp-notification',hostId:'local',method:'turn/started',params:{threadId:THREAD,turn:{id:run(2),status:'inProgress'}}},{});
assert('Foreign-window event sources are ignored',api.inspect().state==='completed');
f.event({type:'mcp-notification',hostId:'local',method:'turn/started',params:{threadId:THREAD,turn:{id:run(2),status:'inProgress'}}},f.win,'https://unrelated.invalid');
assert('Wrong-origin same-window events are ignored',api.inspect().state==='completed');
f.start(2);f.finish(99);assert('A stale different run cannot complete the active turn',api.inspect().state==='busy'&&api.inspect().completionCount===1);
f.page('thread',OTHER);f.advance(900);f.finish(2);
assert('Changing current thread clears binding despite unchanged URL and host epoch',!api.inspect().taskBound&&api.inspect().state==='unknown'&&api.inspect().routeEpoch===3&&api.inspect().completionCount===1);
f.page('thread');f.advance(900);f.finish(2);
assert('Returning to a completed task does not celebrate an unobserved turn',!api.inspect().taskBound&&api.inspect().completionCount===1);
f.delta(3);assert('A live matching native stream may safely resume a missed start',api.inspect().state==='streaming'&&api.inspect().taskBound);
f.finish(3,'failed');assert('Native failed result stays static and cannot count as success',api.inspect().state==='failed'&&api.inspect().completionCount===1);
f.start(4);
f.event({type:'mcp-request-delivery',hostId:'local',request:{id:'approval-1',method:'item/fileChange/requestApproval',params:{threadId:THREAD,turnId:run(4)}}});
assert('Native request-delivery approval becomes static attention',api.inspect().state==='needs-attention');
f.mcp('serverRequest/resolved',{threadId:THREAD,requestId:'approval-1'});
assert('Resolving the same approval resumes the actual native phase',api.inspect().state==='busy');
f.finish(4,'interrupted');assert('Native interruption is cancellation, never success',api.inspect().state==='cancelled'&&api.inspect().completionCount===1);
f.page('thread',ALIAS);f.advance(900);f.start(5);f.finish(5);
assert('Unresolved client alias is never guessed from unrelated native IDs',api.inspect().nativeAdapter.identity==='alias-unresolved'&&!api.inspect().taskBound&&api.inspect().state==='unknown');
f.start(6);
f.event({type:'persisted-atom-updated',key:'thread-client-id-v1:'+encodeURIComponent('local:'+THREAD),value:ALIAS});
assert('Exact observed persisted alias mapping adopts only a still-active matching native start',api.inspect().nativeAdapter.identity==='alias-mapped'&&api.inspect().state==='busy'&&api.inspect().taskBound);
f.finish(6);assert('Alias-bound actual current turn completes once',api.inspect().completionCount===2&&api.inspect().state==='completed');
f.event({type:'persisted-atom-updated',key:'thread-client-id-v1:'+encodeURIComponent('local:'+OTHER),value:ALIAS});
assert('Conflicting alias mappings fail closed and clear binding',api.inspect().nativeAdapter.identity==='alias-unresolved'&&!api.inspect().taskBound&&api.inspect().state==='unknown');
f.page('thread');f.advance(900);f.start(7);f.page('home');f.advance(900);f.finish(7);
assert('Completion received after leaving the thread cannot flash on Home',api.inspect().route==='home'&&api.inspect().completionCount===2&&!api.inspect().taskBound);
f.doc.hidden=true;f.doc.emit('visibilitychange');assert('Document background visibility still pauses the current-page adapter',api.inspect().paused);
f.doc.hidden=false;f.doc.emit('visibilitychange');f.win.emit('compositionstart');assert('IME still pauses the new adapter',api.inspect().paused&&api.inspect().quiet);
f.win.emit('compositionend');f.advance(900);f.doc.emit('scroll');assert('Real scroll quiets the new adapter',api.inspect().quiet);f.advance(700);
f.setHost({mode:'off'});assert('Off preference remains respected independently of stale host route',api.inspect().mode==='off');
f.setHost({mode:'full'});f.media.matches=true;f.media.emit('change');assert('Reduced-motion preference still wins over Full',api.inspect().mode==='off');
assert('Adapter never sends an IPC message or mutates a native control',f.ipcCalls()===0);
api.cleanup();
assert('Native adapter is cleaned with all timers, observers and message listeners',f.timers.size===0&&f.observers.every(o=>o.disconnected)&&!f.win.__SILVER_DRAGON_MOON_PALACE__&&f.win.listeners.get('message')?.size===0);

const g=fixture(),ga=g.mount();g.page('thread');g.advance(900);
const second=new g.Node('button');for(const [key,value]of Object.entries(g.row.attributes))second.setAttribute(key,value);g.addRow(second);g.start(1);g.finish(1);
assert('Ambiguous multiple active sidebar identities cannot bind a task',ga.inspect().nativeAdapter.identity==='ambiguous'&&!ga.inspect().taskBound&&ga.inspect().completionCount===0);ga.cleanup();
const h=fixture(),ha=h.mount();h.page('thread',ALIAS);h.advance(900);h.start(1);h.advance(4100);
h.event({type:'persisted-atom-sync',state:{['thread-client-id-v1:'+encodeURIComponent('local:'+THREAD)]:ALIAS}});h.finish(1);
assert('A late mapping cannot resurrect an expired or already finished pending start',!ha.inspect().taskBound&&ha.inspect().completionCount===0);ha.cleanup();
const j=fixture(),ja=j.mount();j.page('thread');j.advance(900);j.start(1);
for(let n=0;n<33;n++)j.event({type:'mcp-request-delivery',hostId:'local',request:{id:'approval-'+n,method:'item/fileChange/requestApproval',params:{threadId:THREAD,turnId:run(1)}}});
for(let n=0;n<32;n++)j.mcp('serverRequest/resolved',{threadId:THREAD,requestId:'approval-'+n});
assert('An overflowing permission set cannot falsely resume after only known approvals resolve',ja.inspect().state==='needs-attention');ja.cleanup();
const k=fixture(),ka=k.mount();
for(let n=0;n<65;n++){
 const alias='client-new-thread:55555555-5555-7555-8555-'+String(n).padStart(12,'0');
 for(const id of [THREAD,OTHER])k.event({type:'persisted-atom-updated',key:'thread-client-id-v1:'+encodeURIComponent('local:'+id),value:alias});
}
k.page('thread');k.advance(900);k.start(1);
assert('Alias conflict saturation stays bounded and leaves canonical task binding usable',ka.inspect().nativeAdapter.aliasSaturated&&ka.inspect().nativeAdapter.aliases===0&&ka.inspect().state==='busy');ka.cleanup();

const report={createdAt:new Date().toISOString(),scope:'Inert native public DOM and structured preload fixtures; no native app, browser, HTTP, CDP or IPC.',checks,summary:{pass:checks.filter(c=>c.pass).length,fail:checks.filter(c=>!c.pass).length}};
await fs.writeFile(path.join(root,'reports/runtime-native-unit-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
