import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directories = ['preview', 'runtime', 'assets', 'static-theme', 'integration', 'concepts', 'scripts', 'tests', 'docs'];
const rootFiles = ['README.md', 'LICENSE-NOTICE.md', '.gitignore', '.gitattributes', 'package.json', 'package-lock.json', 'palette.json', 'server.mjs', 'launch-preview.cmd', 'launch-preview.ps1'];
const skipped = new Set(['dist', '.tmp', 'node_modules', '.git']);

export async function sourceFiles() {
  const files = [];
  async function visit(relative) {
    const target = path.join(root, relative);
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink() || path.resolve(await fs.realpath(target)).toLowerCase() !== target.toLowerCase()) throw new Error(`Redirected source: ${relative}`);
    if (stat.isDirectory()) {
      if (skipped.has(path.basename(relative))) return;
      for (const name of (await fs.readdir(target)).sort()) await visit(path.join(relative, name));
    } else {
      if (!stat.isFile() || stat.nlink !== 1) throw new Error(`Source is not a regular unlinked file: ${relative}`);
      files.push(relative.split(path.sep).join('/'));
    }
  }
  for (const file of rootFiles) {
    if (file === 'package-lock.json' && !await fs.stat(path.join(root, file)).catch(() => null)) continue;
    await visit(file);
  }
  for (const directory of directories) await visit(directory);
  return files.sort();
}
