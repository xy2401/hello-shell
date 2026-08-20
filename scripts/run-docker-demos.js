// Linux 侧输出采集器：逐个 Shell 在锁定版本容器内运行统一任务脚本，输出写源码旁 *.out.txt。
// 用法：npm run collect-outputs（需要 Docker）
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const demosDir = path.join(rootDir, 'demos');
const fixturesDir = path.join(demosDir, 'shared', 'fixtures');

function loadEnvVersions() {
  const text = fs.readFileSync(path.join(rootDir, '.env.versions'), 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const V = loadEnvVersions();

// image：直接 docker run；dockerfile：先 docker build（以 ALPINE_IMAGE 为基底安装 shell）
const linuxShells = [
  { shell: 'bash', ext: '.sh', image: V.BASH_IMAGE, exec: (f) => ['bash', `/demos/${f}`] },
  { shell: 'zsh', ext: '.zsh', dockerfile: true, image: 'hello-shell-zsh:local', exec: (f) => ['zsh', `/demos/${f}`] },
  { shell: 'fish', ext: '.fish', dockerfile: true, image: 'hello-shell-fish:local', exec: (f) => ['fish', `/demos/${f}`] },
  { shell: 'pwsh', ext: '.ps1', image: V.POWERSHELL_IMAGE, exec: (f) => ['pwsh', '-NoProfile', '-File', `/demos/${f}`] },
  { shell: 'python', ext: '.py', image: V.PYTHON_IMAGE, exec: (f) => ['python', `/demos/${f}`] },
];

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

let total = 0;
console.log('🚀 hello-shell Linux 输出采集（容器化，镜像 tag+digest 双锁定）');

for (const s of linuxShells) {
  const dir = path.join(demosDir, s.shell);
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ 跳过缺失目录：${s.shell}`);
    continue;
  }

  if (s.dockerfile) {
    const buildArg = `ALPINE_IMAGE=${V.ALPINE_IMAGE}`;
    console.log(`🔨 构建 ${s.shell} 运行镜像（${buildArg}）`);
    run(`docker build --quiet --build-arg "${buildArg}" -t ${s.image} "${dir}"`);
  }

  const scripts = fs.readdirSync(dir).filter((f) => f.endsWith(s.ext)).sort();
  for (const script of scripts) {
    const outFile = path.join(dir, `${script}.out.txt`);
    const dockerArgs = [
      'docker run --rm',
      `-v "${dir}:/demos:ro"`,
      `-v "${fixturesDir}:/fixtures:ro"`,
      s.image,
      ...s.exec(script),
    ];
    const output = run(dockerArgs.join(' '));
    fs.writeFileSync(outFile, output);
    total += 1;
    console.log(`✅ [${s.shell}] ${script} → ${path.relative(rootDir, outFile)}`);
  }
}

console.log(`🎉 采集完成：${total} 个任务输出`);
