// Kept as a compatibility entrypoint; concepts now come from the real preview.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const file of ['scripts/build-runtime.mjs','tests/test-browser.mjs']){const result=spawnSync(process.execPath,[file,...(file.startsWith('tests/')?['--render']:[])],{cwd:root,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
