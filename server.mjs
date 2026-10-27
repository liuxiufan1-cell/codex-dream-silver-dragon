import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.MOON_PREVIEW_PORT||9478);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('MOON_PREVIEW_PORT 必须为 1 到 65535 的整数。');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.md':'text/markdown; charset=utf-8','.zip':'application/zip'};
const server=http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'}).end();return;}
  let decoded;try{decoded=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
  if(decoded.includes('\0')||decoded.split(/[\\/]/).includes('..')){res.writeHead(403).end();return;}
  const entry = {'/':'preview/index.html','/index.html':'preview/index.html','/app.js':'preview/app.js','/styles.css':'preview/styles.css'};
  const relative=entry[decoded] || (/^\/(?:assets|concepts|static-theme)\//.test(decoded) ? decoded.slice(1) : null);
  if (!relative) { res.writeHead(404).end('Not found'); return; }
  const target=path.resolve(root,relative);
  if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(target,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(target).toLowerCase()]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'"});
    if(req.method==='HEAD'){res.end();return;}fs.createReadStream(target).pipe(res);
  });
});
server.on('error',error=>{if(error.code==='EADDRINUSE')console.error(`端口 ${port} 已被占用。请关闭旧预览或设置 MOON_PREVIEW_PORT。`);else console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${port}`;
  console.log(`月夜晶宫独立设计预览：${url}\n此服务器只监听本机。按 Ctrl+C 关闭。`);
  // The user-invoked launcher opts in. Never open a browser before listen succeeds,
  // and never open an unrelated service when the requested port is already occupied.
  if (process.argv.includes('--open') && process.platform === 'win32') {
    execFile('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true},error=>{
      if (error) console.error(`未能自动打开浏览器，请手动打开上方地址：${error.message}`);
    });
  }
});
