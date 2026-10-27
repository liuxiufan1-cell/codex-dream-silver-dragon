// Explicit opt-in companion integration for the pinned Windows NGO engine.
// Does not discover apps, touch Codex binaries, or import a theme automatically.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {patchInjector, sha256} from './patch-engine.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const pin=JSON.parse(await fs.readFile(path.join(here,'compatible-host.json'),'utf8'));
const args=process.argv.slice(2), mode=args[0], engineArg=args[1];
if(!['--check','--install','--restore'].includes(mode)||!engineArg||args.length!==2)throw Error('Usage: node integration/install-dynamic.mjs --check|--install|--restore <NGO windows directory>');
const engine=await fs.realpath(path.resolve(engineArg));
async function regular(file){const s=await fs.lstat(file);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1)throw Error(`Expected regular file: ${path.basename(file)}`);return fs.readFile(file);}
async function directory(dir){const s=await fs.lstat(dir);if(!s.isDirectory()||s.isSymbolicLink()||await fs.realpath(dir)!==dir)throw Error('Redirected engine directory');}
await directory(path.join(engine,'scripts'));await directory(path.join(engine,'assets'));
const injector=path.join(engine,'scripts/injector.mjs');
const marker=path.join(engine,'assets/silver-dragon-install.json');
const backup=path.join(engine,'scripts/injector.silver-dragon-original.mjs');
const companion=path.join(engine,'assets/silver-dragon-host.mjs');
const bundleFile=path.join(engine,'assets/silver-dragon-runtime.bundle.js');
const current=await regular(injector);
const installed=await fs.lstat(marker).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;});
const old=installed?JSON.parse((await regular(marker)).toString('utf8')):null;
if(old){
 if(old.schema!=='silver-dragon-install/1'||old.baseline!==pin.injectorSha256||sha256(current)!==old.injector)throw Error('Installed injector was changed; refusing to overwrite it');
 if(sha256(await regular(backup))!==pin.injectorSha256)throw Error('Original backup integrity mismatch');
 if(sha256(await regular(companion))!==old.companion||sha256(await regular(bundleFile))!==old.bundle)throw Error('Installed companion was changed; refusing to overwrite it');
}else if(sha256(current)!==pin.injectorSha256)throw Error(`Unsupported engine. Expected NGO ${pin.version} Windows injector ${pin.injectorSha256}`);
if(mode==='--restore'){
 if(!old){console.log('No Silver Dragon companion installed.');process.exit(0);}
 await fs.writeFile(injector,await regular(backup));
 for(const p of [marker,backup,companion,bundleFile])await fs.unlink(p);
 console.log('Original NGO injector restored. Use the engine theme menu to select your previous theme.');process.exit(0);
}
const dist=path.resolve(here,'../runtime/dist');
const manifest=JSON.parse(await regular(path.join(dist,'manifest.json')));
const bundle=await regular(path.join(dist,'moon-palace.bundle.js'));
if(manifest.themeId!=='silver-dragon-moon-palace'||sha256(bundle)!==manifest.bundle.sha256||bundle.length!==manifest.bundle.bytes)throw Error('Build manifest/bundle mismatch; rebuild before installation');
new Function(bundle.toString('utf8'));
const hostSource=(await regular(path.join(here,'host-payload.mjs'))).toString('utf8');
if(hostSource.split('__SILVER_DRAGON_RUNTIME_SHA256__').length!==2)throw Error('Missing unique host pin');
const host=Buffer.from(hostSource.replace('__SILVER_DRAGON_RUNTIME_SHA256__',manifest.bundle.sha256));
const original=old?await regular(backup):current;
const patched=patchInjector(original,pin.injectorSha256);
const syntax=spawnSync(process.execPath,['--check','--input-type=module'],{input:patched,encoding:'utf8'});
if(syntax.status!==0)throw Error(`Patched injector syntax check failed: ${syntax.stderr}`);
if(mode==='--check'){
 console.log(JSON.stringify({compatible:true,engine:pin.version,commit:pin.commit,installed:Boolean(old),themeId:manifest.themeId,runtimeVersion:manifest.version,bundleSha256:manifest.bundle.sha256}));process.exit(0);
}
if(old){if(old.bundle!==manifest.bundle.sha256)throw Error('Restore the existing companion before installing a different build');console.log('This exact dynamic build is already installed.');process.exit(0);}
// Exclusive creation prevents clobbering unrelated files. Injector is the final commit point.
const created=[];
try{
 for(const [file,bytes] of [[backup,original],[companion,host],[bundleFile,bundle]]){await fs.writeFile(file,bytes,{flag:'wx'});created.push(file);}
 const record={schema:'silver-dragon-install/1',engine:pin.version,baseline:pin.injectorSha256,injector:sha256(patched),companion:sha256(host),bundle:sha256(bundle),runtimeVersion:manifest.version};
 await fs.writeFile(marker,JSON.stringify(record,null,2)+'\n',{flag:'wx'});created.push(marker);
 await fs.writeFile(injector,patched);
 console.log('Dynamic companion installed. Import the matching static ZIP, select Silver Dragon, enable character motion, then restart the engine and Codex.');
}catch(error){await fs.writeFile(injector,original).catch(()=>{});for(const f of created.reverse())await fs.unlink(f).catch(()=>{});throw error;}
