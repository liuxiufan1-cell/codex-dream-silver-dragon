// Verify against an explicit checkout of the pinned upstream; only mutate a temporary copy.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {sha256} from '../integration/patch-engine.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!process.env.NGO_ENGINE_DIR)throw Error('Set NGO_ENGINE_DIR to the pinned v1.9.0 windows checkout.');
const tmp=await fs.mkdtemp(path.join(root,'tests/.tmp/engine-').replace(/engine-$/,'engine-')).catch(async e=>{if(e.code!=='ENOENT')throw e;await fs.mkdir(path.join(root,'tests/.tmp'),{recursive:true});return fs.mkdtemp(path.join(root,'tests/.tmp/engine-'));});
const run=(file,args)=>execFileSync(process.execPath,[file,...args],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const install=(mode,target=tmp)=>run('integration/install-dynamic.mjs',[mode,target]);
try{
 for(const name of ['assets','scripts'])await fs.cp(path.join(process.env.NGO_ENGINE_DIR,name),path.join(tmp,name),{recursive:true});
 await fs.copyFile(path.join(process.env.NGO_ENGINE_DIR,'VERSION'),path.join(tmp,'VERSION'));
 const injector=path.join(tmp,'scripts/injector.mjs'),original=await fs.readFile(injector);
 assert.equal(JSON.parse(install('--check')).compatible,true);
 assert.equal(sha256(original),sha256(await fs.readFile(injector)));
 install('--install');const patched=await fs.readFile(injector);
 assert.notEqual(sha256(patched),sha256(original));
 install('--install');assert.equal(sha256(patched),sha256(await fs.readFile(injector)));
 const checked=JSON.parse(run(injector,['--check-payload','--theme-dir',path.join(root,'static-theme')]));
 assert.equal(checked.pass,true);assert.equal(checked.appearance,'light');assert.equal(checked.safeCssStatus,'validated');
 assert.ok(checked.payloadBytes>20_000_000,'Dynamic bundle must be in the real upstream payload');
 install('--restore');assert.deepEqual(await fs.readFile(injector),original);
 await fs.appendFile(injector,'\n// unknown local modification\n');
 assert.throws(()=>install('--install'),/Unsupported engine/);
 const report={pass:8,fail:0,engine:'1.9.0',scope:'Official upstream engine copied to temporary directory. Check, install, idempotence, real payload compilation, light safe CSS, embedded dynamic bundle, restore and unknown-version rejection. No running Codex.'};
 await fs.writeFile(path.join(root,'reports/engine-integration.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await fs.rm(tmp,{recursive:true,force:true});}
