// hello-shell 静态检查：.env.versions 锁定、统一任务矩阵完整性、docs 存在性。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let failures = 0;
const fail = (msg) => { console.error(`❌ ${msg}`); failures += 1; };
const ok = (msg) => console.log(`✅ ${msg}`);

export const TASKS = [
  '00_env',
  '01_hello_io',
  '02_variables_quoting',
  '03_args_parsing',
  '04_control_flow',
  '05_functions_scope',
  '06_pipes_files',
  '07_errors',
  '08_real_world',
];

const SHELLS = [
  { dir: 'bash', ext: '.sh' },
  { dir: 'zsh', ext: '.zsh' },
  { dir: 'fish', ext: '.fish' },
  { dir: 'pwsh', ext: '.ps1' },
  { dir: 'python', ext: '.py' },
  { dir: 'cmd', ext: '.bat' },
  { dir: 'powershell5', ext: '.ps1' },
  { dir: 'powershell7', ext: '.ps1' },
];

function checkEnvVersions() {
  const file = path.join(ROOT, '.env.versions');
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const [key, value] = [trimmed.slice(0, idx), trimmed.slice(idx + 1)];
    if (!key.endsWith('_IMAGE')) continue;
    if (/(^|:|-)latest($|[,@])/.test(value) || /:edge|:nightly/.test(value)) {
      fail(`.env.versions floating tag: ${key}`);
    }
    if (!value.includes('@sha256:')) {
      fail(`.env.versions missing digest: ${key}`);
    }
  }
  ok('.env.versions pinned with tag+digest');
}

function checkTaskMatrix() {
  for (const shell of SHELLS) {
    const dir = path.join(ROOT, 'demos', shell.dir);
    if (!fs.existsSync(dir)) {
      fail(`demos/${shell.dir}/ missing`);
      continue;
    }
    for (const task of TASKS) {
      const script = path.join(dir, `${task}${shell.ext}`);
      if (!fs.existsSync(script)) fail(`demos/${shell.dir}/${task}${shell.ext} missing`);
    }
  }
  ok('task matrix complete (9 tasks x 8 runners)');
}

function checkZshFishDockerfiles() {
  for (const shell of ['zsh', 'fish']) {
    const dockerfile = path.join(ROOT, 'demos', shell, 'Dockerfile');
    if (!fs.existsSync(dockerfile)) fail(`demos/${shell}/Dockerfile missing`);
  }
  ok('zsh/fish Dockerfiles exist');
}

function checkDocs() {
  const config = path.join(ROOT, 'docs', '.vitepress', 'config.ts');
  const index = path.join(ROOT, 'docs', 'index.md');
  if (!fs.existsSync(config)) fail('docs/.vitepress/config.ts missing');
  if (!fs.existsSync(index)) fail('docs/index.md missing');
  ok('docs entry exists');
}

checkEnvVersions();
checkTaskMatrix();
checkZshFishDockerfiles();
checkDocs();

if (failures > 0) {
  console.error(`\n[check] ${failures} failure(s)`);
  process.exit(1);
}
console.log('\n[check] all checks passed');
