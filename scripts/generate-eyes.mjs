// Authored vector eyelids shared by the interactive preview and inert concept QA.
// The source character PNG remains unchanged. No raster editing or network is used.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/layers/manifest.json'),'utf8'));
const eyes=Object.entries(manifest.eyes).filter(([,eye])=>eye&&typeof eye==='object'&&Number.isFinite(eye.cx));
function eyeShape(name,eye,state){
  const cx=eye.cx,cy=eye.cy,w=eye.width,h=eye.height,rx=w*.65,ry=h*.84;
  const top=cy-ry-1,bottom=cy+ry+1;
  const cover=state==='closed'
    ?`M${cx-rx} ${cy}C${cx-rx} ${top} ${cx+rx} ${top} ${cx+rx} ${cy}C${cx+rx} ${bottom} ${cx-rx} ${bottom} ${cx-rx} ${cy}Z`
    :`M${cx-rx} ${cy+.6}C${cx-rx} ${top} ${cx+rx} ${top} ${cx+rx} ${cy+.6}Q${cx} ${cy+h*.28} ${cx-rx} ${cy+.6}Z`;
  const left=cx-w*.5,right=cx+w*.5,lidY=cy+(state==='closed'?.2:1.7),curveY=cy+(state==='closed'?h*.27:h*.29);
  const lash=name==='left'
    ?`M${left+2} ${lidY+.1}l-3.6 -1.1m5 1.9-3.5 -.2`
    :`M${right-2} ${lidY+.1}l3.6 -1.1m-5 1.9 3.5 -.2`;
  const skin=name==='left'?['#FDEEEB','#FCE3DC','#FDDEDA']:['#ECCBC7','#F9DDD7','#FEE2DC'];
  return `<g transform="rotate(${eye.rotation||0} ${cx} ${cy})"><defs><linearGradient id="skin-${name}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${skin[0]}"/><stop offset=".48" stop-color="${skin[1]}"/><stop offset="1" stop-color="${skin[2]}"/></linearGradient><filter id="soft-${name}" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.15"/></filter></defs><path d="${cover}" fill="url(#skin-${name})" filter="url(#soft-${name})"/><path d="M${left} ${lidY}Q${cx} ${curveY} ${right} ${lidY}" fill="none" stroke="#80616D" stroke-width="1.1" stroke-linecap="round"/><path d="${lash}" fill="none" stroke="#80616D" stroke-width=".7" stroke-linecap="round"/></g>`;
}
for(const state of ['half','closed']){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536"><title>白银龙娘${state==='half'?'半闭':'闭眼'}矢量眼睑</title>${eyes.map(([name,eye])=>eyeShape(name,eye,state)).join('')}</svg>`;
  await fs.writeFile(path.join(root,`assets/layers/eyes-${state}.svg`),svg+'\n');
}
console.log('Shared vector eyelids: half / closed.');
