// Offline publication checks. No application, browser, account or network access.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { sourceFiles, root } from './source-files.mjs';

const files = await sourceFiles();
const known = new Set(files);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const read = relative => fs.readFile(path.join(root, relative));
let checks = 0;
function check(condition, message) { checks++; if (!condition) throw new Error(message); }
const forbiddenSegments = new Set(['evidence', 'profiles', 'profile', 'sessions', '.git', '.cache', 'deliverables', 'node_modules', 'revisions']);
const privateHome = new RegExp('[A-Z]:[\\\\/]Users[\\\\/]', 'i');
// Split token prefixes so the scanner does not match its own pattern source.
const credential = new RegExp('(?:gh' + '[pousr]_[A-Za-z0-9]{30,}|github' + '_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)');
for (const file of files) {
  check(!file.split('/').some(part => forbiddenSegments.has(part)), `Private directory included: ${file}`);
  check(!/\.(?:exe|dll|asar|log|db|sqlite|pfx|pem|zip)$/i.test(file), `Unexpected private/binary archive: ${file}`);
  const bytes = await read(file);
  check(bytes.length < 95 * 1024 * 1024, `Exceeds Git source size bound: ${file}`);
  if (/\.(?:md|mjs|js|css|json|ps1|cmd|txt|html)$/.test(file)) {
    const text = bytes.toString('utf8');
    check(!/\b[A-Z]:[\\/]/i.test(text), `Machine-specific absolute path in ${file}`);
    check(!/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/.test(text) || !/https?:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::|\/)/.test(text.replaceAll('127.0.0.1','localhost')), `Non-loopback address in ${file}`);
    check(!privateHome.test(text), `Personal home path in ${file}`);
    check(!credential.test(text), `Credential-like content in ${file}`);
    if (file.endsWith('.md')) {
      for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
        const link = match[1].split('#')[0];
        if (!link || /^[a-z]+:/i.test(link)) continue;
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), link));
        check(known.has(resolved), `Broken document link: ${file} -> ${link}`);
      }
    }
  }
  if (file.endsWith('.svg')) {
    const text = bytes.toString('utf8');
    check(!/<(?:script|foreignObject|iframe|object|embed)\b|\bon\w+\s*=/i.test(text), `Active SVG: ${file}`);
    for (const match of text.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']+)/gi)) check(/^(?:#|data:image\/png;base64,)/.test(match[1]), `External SVG dependency: ${file}`);
  }
}
const manifest = JSON.parse(await read('assets/layers/manifest.json'));
check(manifest.layers.length === 8, 'Expected eight character layers');
for (const file of [manifest.background, ...manifest.layers.map(layer => layer.src), ...Object.values(manifest.blink.assets)]) check(known.has(file), `Missing layer asset: ${file}`);
for (const file of ['concepts/home-2560x1440.png', 'concepts/chat-2560x1440.png', 'static-theme/background.png']) {
  const png = await read(file);
  check(png.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' && png.readUInt32BE(16) === 2560 && png.readUInt32BE(20) === 1440, `Expected 2560x1440 PNG: ${file}`);
}
check((await fs.readdir(path.join(root, 'static-theme'))).sort().join('|') === 'background.png|theme.css|theme.json', 'Static source must contain exactly three files');
const html = (await read('preview/index.html')).toString('utf8');
const css = (await read('preview/styles.css')).toString('utf8');
for (const text of [html, css]) {
  for (const match of text.matchAll(/(?:src=["']|url\(["']?)(assets\/[^"')\s>]+)/g)) check(known.has(match[1]), `Missing preview asset ${match[1]}`);
}
const runtime = JSON.parse(await read('runtime/dist/manifest.json'));
const bundle = await read('runtime/dist/moon-palace.bundle.js');
check(bundle.length === runtime.bundle.bytes && sha(bundle) === runtime.bundle.sha256, 'Runtime bundle integrity failed');
for (const item of [...runtime.assets, ...runtime.sources]) check(sha(await read(item.path)) === item.sha256, `Runtime source changed: ${item.path}`);
check(runtime.version === JSON.parse(await read('package.json')).version && runtime.version.includes('-beta.'), 'Expected the current test version');
console.log(JSON.stringify({status:'pass', sourceFiles:files.length, checks, runtimeSha256:runtime.bundle.sha256}));
