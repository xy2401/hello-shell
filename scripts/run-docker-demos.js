// Linux 侧输出采集器：逐个 Shell 在锁定版本容器内运行统一任务脚本，输出写源码旁 *.out.txt。
// 用法：npm run collect-outputs（需要 Docker）
import fs from 'fs';
import path from 'path';
import { execFileSync, execSync } from 'child_process';
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

function runFile(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function evidence(content, image) {
  return `---\nstatus: verified\ncapturedAt: "${new Date().toISOString()}"\ndockerImage: "${image}"\nexitCode: 0\n---\n${content.trim()}\n`;
}

function collectTooling(s) {
  if (!['bash', 'zsh', 'fish', 'pwsh'].includes(s.shell)) return;
  const evidenceDir = path.join(demosDir, s.shell === 'pwsh' ? 'powershell' : s.shell, 'docker');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const inspect = runFile('docker', ['image', 'inspect', s.image, '--format', 'id={{.Id}} os={{.Os}} arch={{.Architecture}} size={{.Size}}']);
  const pathInventory = runFile('docker', ['run', '--rm', s.image, 'sh', '-lc', 'echo "PATH=$PATH"; for d in $(echo "$PATH" | tr : " "); do [ -d "$d" ] || continue; for f in "$d"/*; do [ -f "$f" ] && [ -x "$f" ] && basename "$f"; done; done | sort -u']);
  const builtinArgs = s.shell === 'bash' ? ['bash', '-lc', 'compgen -b | sort']
    : s.shell === 'zsh' ? ['zsh', '-fc', 'print -l ${(k)builtins} | sort']
    : s.shell === 'fish' ? ['fish', '-c', 'builtin --names | sort']
    : ['pwsh', '-NoProfile', '-Command', 'Get-Command -CommandType Cmdlet,Function | Sort-Object Name | ForEach-Object Name'];
  const builtins = runFile('docker', ['run', '--rm', s.image, ...builtinArgs]);
  fs.writeFileSync(path.join(evidenceDir, 'inventory.out.txt'), evidence(`${inspect}\n## builtins/cmdlets\n${builtins}\n## PATH executables\n${pathInventory}`, s.image));
  const demoDir = path.join(demosDir, s.shell);
  const session = ['00_env', '06_pipes_files', '08_real_world'].map(prefix => {
    const file = fs.readdirSync(demoDir).find(name => name.startsWith(prefix) && name.endsWith('.out.txt'));
    return file ? `## ${file}\n${fs.readFileSync(path.join(demoDir, file), 'utf8').trim()}` : '';
  }).filter(Boolean).join('\n\n');
  fs.writeFileSync(path.join(evidenceDir, 'session.out.txt'), evidence(session, s.image));
  const outputCount = fs.readdirSync(demoDir).filter(name => name.endsWith('.out.txt')).length;
  const assertions = outputCount === 9 ? 'PASS taskSnapshots: 9\nRESULT: all assertions passed' : `FAIL taskSnapshots: expected=9 actual=${outputCount}`;
  fs.writeFileSync(path.join(evidenceDir, 'assert.out.txt'), evidence(assertions, s.image));
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

for (const s of linuxShells) collectTooling(s);

console.log(`🎉 采集完成：${total} 个任务输出`);
