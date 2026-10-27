// Experimental companion template for an explicitly integrated, compatible host.
// This is outside the strict theme ZIP contract. No script is loaded from a theme.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const PIN = '__SILVER_DRAGON_RUNTIME_SHA256__';
const THEME_ID = 'silver-dragon-moon-palace';
const runtimeFile = fileURLToPath(new URL('./silver-dragon-runtime.bundle.js', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

export async function loadSilverDragonRuntime(theme) {
  if (theme?.id !== THEME_ID) return null;
  const info = await fs.lstat(runtimeFile);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > 128 * 1024 * 1024) {
    throw new Error('Silver Dragon: untrusted runtime file');
  }
  if (path.resolve(await fs.realpath(runtimeFile)).toLowerCase() !== path.resolve(runtimeFile).toLowerCase()) {
    throw new Error('Silver Dragon: redirected runtime file');
  }
  const bytes = await fs.readFile(runtimeFile);
  if (!/^[a-f0-9]{64}$/.test(PIN) || sha(bytes) !== PIN) throw new Error('Silver Dragon: runtime hash mismatch');
  const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  new Function(source); // Compile only. Renderer execution stays in the normal injector path.
  return { source, sha256: PIN };
}

export function composeSilverDragonPayload(payload, companion, revision) {
  if (!companion) return payload;
  return `(async () => {
    const applied = await (${payload});
    if (!applied) return false;
    const host = window.__CODEX_DREAM_SKIN_STATE__;
    if (host?.themeId !== ${JSON.stringify(THEME_ID)} || host?.revision !== ${JSON.stringify(revision)}) return false;
    if (typeof host.cleanup !== 'function') throw new Error('Silver Dragon: missing host cleanup');
    try {
      ${companion.source};
      if (window.__CODEX_DREAM_SKIN_STATE__ !== host) {
        window.__SILVER_DRAGON_MOON_PALACE__?.cleanup?.();
        return false;
      }
      const originalCleanup = host.cleanup;
      host.cleanup = function (...args) {
        try { window.__SILVER_DRAGON_MOON_PALACE__?.cleanup?.(); }
        finally { return originalCleanup.apply(this, args); }
      };
      return true;
    } catch (error) {
      window.__SILVER_DRAGON_MOON_PALACE__?.cleanup?.();
      throw error;
    }
  })()`;
}
