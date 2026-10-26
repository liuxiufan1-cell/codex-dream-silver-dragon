// Exact, version-pinned source patch. Exported for compile-only fixture tests.
import { createHash } from 'node:crypto';
export const THEME_ID = 'silver-dragon-moon-palace';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function once(source, needle, replacement) {
  if (source.split(needle).length !== 2) throw new Error(`Engine hook missing or ambiguous: ${needle.slice(0, 70)}`);
  return source.replace(needle, () => replacement);
}
export function patchInjector(bytes, expectedHash) {
  if (sha256(bytes) !== expectedHash) throw new Error('Injector baseline hash mismatch; refusing an unknown engine');
  let source = bytes.toString('utf8');
  const nl = source.includes('\r\n') ? '\r\n' : '\n';
  source = once(source, 'import fs from "node:fs/promises";',
    `import fs from "node:fs/promises";${nl}import { loadSilverDragonRuntime, composeSilverDragonPayload } from "../assets/silver-dragon-host.mjs";`);
  source = once(source, '  const motionPreferences = await readMotionPreferences(motionSettingsPath);',
    `  const motionPreferences = await readMotionPreferences(motionSettingsPath);${nl}  const silverDragonRuntime = await loadSilverDragonRuntime(loadedTheme.theme);`);
  source = once(source, '    .update(motionPreferences.signature)',
    `    .update(motionPreferences.signature)${nl}    .update(silverDragonRuntime?.sha256 || "")`);
  source = once(source, '  const payload = buildMotionPayload({', '  let payload = buildMotionPayload({');
  source = once(source, '  // Defence in depth for every caller, not just --check-payload:',
    `  payload = composeSilverDragonPayload(payload, silverDragonRuntime, revision);${nl}  // Defence in depth for every caller, not just --check-payload:`);
  return Buffer.from(source);
}
