// Asset authoring: partition the approved alpha illustration into complementary
// regions on one coordinate canvas. Small motion keeps the fixed face stable.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=await fs.readFile(path.join(root,'assets/layers/seated-source.png'));
const art=`data:image/png;base64,${src.toString('base64')}`;
// Conservative detached tips: never partition a hand, face or a joint.
const regions=[
 ['tail','M790 1000 Q1020 965 1005 1200 Q940 1330 800 1390 Q1030 1400 990 1536 L735 1536 L690 1390 Q820 1310 865 1190 Q925 1100 790 1000Z','tail',[850,1080],11.5],
 ['left-wing','M70 610 Q55 445 260 315 Q350 265 397 278 L375 335 Q300 375 310 455 L250 510Z','wing',[380,330],11],
 ['right-wing','M803 310 Q963 350 1008 625 L1005 705 Q955 558 865 530 L833 430Z','wing',[830,380],11.7],
 ['back-hair','M795 545 Q950 560 1000 735 Q1045 865 966 925 L865 918 L850 842 Q958 825 904 737 Q830 704 795 545Z','hair',[800,550],8.7],
 ['left-sleeve','M365 482 Q415 548 384 600 L290 650 L260 618 Q320 592 340 550Z','sleeve',[360,490],7.6],
 ['right-sleeve','M770 562 Q835 606 833 702 L800 841 L760 837 Q790 696 770 562Z','sleeve',[780,570],8.3],
 ['front-hair','M730 260 Q780 266 802 292 Q767 305 742 294Z','hair',[735,265],7.9],
];
const wrap=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">${body}</svg>`;
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/layers/manifest.json'),'utf8'));
const layers=[];
let prior=[];
for(const [id,d,motion,pivot,duration] of regions){
 const svg=wrap(`<defs><mask id="part"><rect width="1024" height="1536" fill="black"/><path d="${d}" fill="white"/>${prior.map(p=>`<path d="${p}" fill="black"/>`).join('')}</mask></defs><image href="${art}" width="1024" height="1536" mask="url(#part)"/>`);
 const ext=['right-wing','back-hair','right-sleeve'].includes(id)?'svg':'png';
 const relative=`assets/layers/${id}.${ext}`;
 await fs.writeFile(path.join(root,relative),ext==='svg'?svg:await sharp(Buffer.from(svg)).png().toBuffer());
 if(id==='back-hair')await sharp(Buffer.from(svg)).png().toFile(path.join(root,'assets/layers/back-hair.png'));
 layers.push({id,src:relative,x:0,y:0,width:1024,height:1536,pivot,z:{tail:3,'left-wing':5,'right-wing':6,'back-hair':20,'left-sleeve':40,'right-sleeve':41,'front-hair':50}[id],motion,duration});
 prior.push(d);
}
const core=wrap(`<defs><mask id="core"><rect width="1024" height="1536" fill="white"/>${prior.map(d=>`<path d="${d}" fill="black"/>`).join('')}</mask></defs><image href="${art}" width="1024" height="1536" mask="url(#core)"/>`);
await sharp(Buffer.from(core)).png().toFile(path.join(root,'assets/layers/core.png'));
layers.push({id:'core',src:'assets/layers/core.png',x:0,y:0,width:1024,height:1536,pivot:[512,730],z:30,motion:'none',contains:'Stable adult seated figure, face, hands, legs and central gown.'});
manifest.layers=layers.sort((a,b)=>a.z-b.z);
manifest.name='白银龙娘 · 紫晶白昼';manifest.pose='seated';
manifest.eyes={left:{cx:531,cy:258,width:43,height:21,rotation:-13},right:{cx:614,cy:232,width:37,height:20,rotation:-13},note:'Calibrated on seated-source.png, 1024 × 1536. Normal eyes remain in stable core.'};
manifest.alpha='Native alpha source; complementary vector masks partition tips without moving the face. No independent regeneration of facial features.';
manifest.coordinateSystem='Full 1024×1536 shared canvas; local pixel pivots. Complementary cutout regions have subpixel motion.';
await fs.writeFile(path.join(root,'assets/layers/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const portrait=`<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><clipPath id="p"><circle cx="64" cy="64" r="58"/></clipPath></defs><circle cx="64" cy="64" r="61" fill="#f0eaf8" stroke="#8b65c2" stroke-width="1"/><g clip-path="url(#p)"><image href="${art}" x="-105" y="-24" width="300" height="450"/></g></svg>`;
await fs.writeFile(path.join(root,'assets/ui/dragon-portrait-medallion.svg'),portrait);
console.log('Seated character: 8 complementary layers, one stable core.');
