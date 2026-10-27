// Curated deterministic ZIPs. Does not read installed apps, original references or profiles.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { sourceFiles, root } from './source-files.mjs';
import { makeZip } from '../integration/zip.mjs';
await import('./build-runtime.mjs');
await import('./verify-source.mjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const entries = await Promise.all((await sourceFiles()).map(async name => ({name, bytes:await fs.readFile(path.join(root,name))})));
const version = '1.0.0-beta.2', prefix = 'codex-dream-silver-dragon';
const out = path.join(root, 'release', `v${version}`);
await fs.mkdir(out, {recursive:true});
const info=[];
async function write(name, members, metadata=true) {
  const selected = [...members].sort((a,b)=>a.name.localeCompare(b.name,'en'));
  if (metadata) {
    const manifest = {schema:'silver-dragon-source-release/1', version, stage:'beta', members:selected.map(({name,bytes})=>({name,bytes:bytes.length,sha256:hash(bytes)}))};
    selected.push({name:'SOURCE-MANIFEST.json',bytes:Buffer.from(JSON.stringify(manifest,null,2)+'\n')});
  }
  const zip=makeZip(selected);
  const dest=path.join(out,name);
  const existing=await fs.lstat(dest).catch(()=>null);
  if (existing && (!existing.isFile() || existing.isSymbolicLink() || existing.nlink!==1)) throw Error('Redirected output');
  await fs.writeFile(dest,zip);
  info.push({file:name,bytes:zip.length,sha256:hash(zip),members:selected.length});
}
await write(`${prefix}-source-v${version}.zip`, entries);
const runtimeEntries=[];
for (const name of ['runtime/dist/moon-palace.bundle.js','runtime/dist/manifest.json']) runtimeEntries.push({name,bytes:await fs.readFile(path.join(root,name))});
runtimeEntries.push({name:'启动测试预览.cmd',bytes:Buffer.from('@echo off\r\ncall "%~dp0launch-preview.cmd"\r\n')});
await write(`${prefix}-windows-theme-v${version}.zip`, [...entries,...runtimeEntries]);
await write(`${prefix}-static-v${version}.zip`, await Promise.all(['theme.json','theme.css','background.png'].map(async name=>({name,bytes:await fs.readFile(path.join(root,'static-theme',name))}))),false);
await fs.writeFile(path.join(out,'SHA256SUMS.txt'),info.map(item=>`${item.sha256}  ${item.file}`).join('\n')+'\n');
await fs.writeFile(path.join(out,'release-manifest.json'),JSON.stringify({schema:'silver-dragon-publication/1',version,stage:'beta',files:info},null,2)+'\n');
console.log(JSON.stringify({status:'packaged',files:info},null,2));
