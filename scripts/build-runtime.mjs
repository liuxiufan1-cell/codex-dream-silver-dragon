import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const { paletteCSS } = await import('./build-palette.mjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=data=>createHash('sha256').update(data).digest('hex');
const read=async relative=>{
  const target=await fs.realpath(path.join(root,relative));
  if(!target.startsWith(root+path.sep))throw new Error('Source escaped project');
  return fs.readFile(target);
};
const manifest=JSON.parse(await read('assets/layers/manifest.json'));
if(manifest.canvas.width!==1024||manifest.canvas.height!==1536||manifest.layers.length!==8)throw new Error('Unexpected character canvas');
const fixedAssets=['assets/art/moon-palace-background.png','assets/ui/dragon-crest.svg',
  'assets/layers/tail.png','assets/layers/left-wing.png','assets/layers/right-wing.svg','assets/layers/back-hair.svg',
  'assets/layers/core.png','assets/layers/left-sleeve.png','assets/layers/right-sleeve.svg','assets/layers/front-hair.png',
  'assets/layers/eyes-half.svg','assets/layers/eyes-closed.svg'];
const allowed=new Set(fixedAssets);
for(const src of [manifest.background,...manifest.layers.map(n=>n.src),...Object.values(manifest.blink.assets)])if(!allowed.has(src))throw new Error(`Asset not allowlisted: ${src}`);
const assets={},records=[];
for(const relative of fixedAssets){
  const data=await read(relative),svg=relative.endsWith('.svg');
  if(svg){
    const text=data.toString('utf8');
    if(/<(?:script|foreignObject|iframe|object|embed|animate|set)\b|\bon\w+\s*=/i.test(text))throw new Error(`Active SVG rejected: ${relative}`);
    for(const match of text.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']+)/gi))if(!/^(?:#|data:image\/png;base64,)/.test(match[1]))throw new Error(`External SVG dependency: ${relative}`);
  }else if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error(`Not PNG: ${relative}`);
  assets[relative]=`data:image/${svg?'svg+xml':'png'};base64,${data.toString('base64')}`;
  records.push({path:relative,sha256:sha(data),bytes:data.length});
}
const source=(await read('runtime/moon-palace.js')).toString('utf8');
if(!source.includes('export function mountMoonPalace('))throw new Error('Entry function missing');
const css=paletteCSS+(await read('runtime/moon-palace.css')).toString('utf8');
const payload={schema:'silver-dragon-runtime/1',themeId:'silver-dragon-moon-palace',version:'1.0.0-beta.2',manifest,css,assets};
const bundle=`/* White Silver Dragon Moon Palace 1.0.0-beta.2 — trusted companion, not ZIP executable CSS. */\n(() => {\n${source.replace('export function mountMoonPalace(', 'function mountMoonPalace(')}\nmountMoonPalace(window, document, ${JSON.stringify(payload)});\n})();\n`;
new Function(bundle); // Compile only. Do not launch a browser or connect to any endpoint.
const dist=path.join(root,'runtime/dist');await fs.mkdir(dist,{recursive:true});
await fs.writeFile(path.join(dist,'moon-palace.bundle.js'),bundle);
const output={schema:payload.schema,themeId:payload.themeId,version:payload.version,
  bundle:{file:'moon-palace.bundle.js',sha256:sha(bundle),bytes:Buffer.byteLength(bundle)},assets:records,
  sources:[{path:'runtime/moon-palace.js',sha256:sha(source)},{path:'runtime/moon-palace.css',sha256:sha(await read('runtime/moon-palace.css'))},
    {path:'palette.json',sha256:sha(await read('palette.json'))},
    {path:'assets/layers/manifest.json',sha256:sha(await read('assets/layers/manifest.json'))}]};
await fs.writeFile(path.join(dist,'manifest.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({bundle:output.bundle,assets:records.length}));
