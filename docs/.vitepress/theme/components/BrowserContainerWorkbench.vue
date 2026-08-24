<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="浏览器多 Shell 容器工作台">
      <header class="runtime-header">
        <div>
          <p>CONTAINER2WASM · ALPINE 3.22 · MULTI-SHELL RUNTIME</p>
          <h2>浏览器多 Shell 容器工作台</h2>
        </div>
        <span class="runtime-status" :class="status"><i />{{ statusLabel }}</span>
      </header>

      <div v-if="status === 'idle' || status === 'error' || status === 'not_ready'" class="runtime-launcher">
        <div class="runtime-facts">
          <span><small>运行底座</small><strong>Alpine Linux 3.22</strong></span>
          <span><small>预装 Shell</small><strong>Bash / Zsh / Fish / Py3</strong></span>
          <span><small>分片分发</small><strong>Gzip 自动解压 · 17 分片</strong></span>
        </div>

        <p class="runtime-desc">{{ message }}</p>

        <div v-if="downloadProgress > 0 && status === 'downloading'" class="download-bar-container">
          <div class="download-bar" :style="{ width: `${downloadProgress}%` }" />
          <small class="download-text">已加载 {{ downloadedChunks }} / {{ totalChunks }} 分片 ({{ downloadProgress }}%)</small>
        </div>

        <div class="launcher-actions">
          <button v-if="status !== 'not_ready'" type="button" class="btn-primary" :disabled="status === 'downloading' || status === 'initializing'" @click="startContainer">
            {{ status === 'downloading' || status === 'initializing' ? '正在启动容器...' : '启动多 Shell 容器' }}
          </button>
          <a v-else href="https://github.com" target="_blank" rel="noreferrer" class="btn-secondary">
            查看 GitHub Actions 构建流水线
          </a>
        </div>
      </div>

      <div v-show="status === 'downloading' || status === 'initializing' || status === 'running' || status === 'paused'" class="terminal-shell">
        <div class="terminal-toolbar">
          <div class="terminal-meta">
            <span>{{ message }}</span>
            <div v-if="status === 'downloading'" class="mini-progress">
              <div class="mini-bar" :style="{ width: `${downloadProgress}%` }" />
            </div>
          </div>
          <div class="terminal-btns">
            <div class="quick-commands" v-if="status === 'running'">
              <button type="button" class="btn-tag" @click="sendInput('exec bash -l\n')">Bash</button>
              <button type="button" class="btn-tag" @click="sendInput('exec zsh -l\n')">Zsh</button>
              <button type="button" class="btn-tag" @click="sendInput('exec fish\n')">Fish</button>
              <button type="button" class="btn-tag" @click="sendInput('python3\n')">Python 3</button>
            </div>
            <button type="button" @click="clearTerminal">清屏</button>
            <button type="button" :disabled="status !== 'running' && status !== 'paused'" @click="toggleRun">
              {{ status === 'paused' ? '继续' : '暂停' }}
            </button>
            <button type="button" @click="restartContainer">重新加载</button>
          </div>
        </div>
        <div ref="terminalHost" class="terminal-host" />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useData } from 'vitepress';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type RuntimeStatus = 'idle' | 'downloading' | 'initializing' | 'running' | 'paused' | 'not_ready' | 'error';

interface ChunkItem {
  filename: string;
  size: number;
  sha256?: string;
}

interface Manifest {
  version: string;
  targetArch: string;
  chunkSize: string;
  createdAt: string;
  status?: string;
  chunks: ChunkItem[];
}

const { isDark } = useData();
const terminalHost = ref<HTMLElement>();
const status = ref<RuntimeStatus>('idle');
const message = ref('支持在同一容器内无缝切换 Bash 5.2、Zsh 5.9、Fish 3.7 与 Python 3.12。');

const downloadProgress = ref(0);
const downloadedChunks = ref(0);
const totalChunks = ref(0);

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let worker: Worker | undefined;
let ttyServer: any | undefined;
let slavePty: any | undefined;

const statusLabel = computed(() => {
  switch (status.value) {
    case 'downloading':
      return `下载分片 (${downloadProgress.value}%)`;
    case 'initializing':
      return '初始化虚拟机';
    case 'running':
      return '运行中';
    case 'paused':
      return '已暂停';
    case 'not_ready':
      return '待云端构建';
    case 'error':
      return '加载失败';
    default:
      return '就绪';
  }
});

function getTerminalTheme(dark: boolean) {
  return dark
    ? {
        background: '#090d13',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
      }
    : {
        background: '#f6f8fa',
        foreground: '#1f2328',
        cursor: '#0969da',
        selectionBackground: '#b6d7ff',
      };
}

function loadScript(url: string): Promise<void> {
  if (document.querySelector(`script[src="${url}"]`)) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

async function ensureTerminal() {
  if (terminal || !terminalHost.value) return;

  const [{ Terminal: XTerm }, { FitAddon: XTermFit }] = await Promise.all([
    import('@xterm/xterm'),
    import('@xterm/addon-fit'),
  ]);

  terminal = new XTerm({
    cursorBlink: true,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.25,
    theme: getTerminalTheme(isDark.value),
    convertEol: true,
  });

  fitAddon = new XTermFit();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalHost.value);
  fitAddon.fit();

  resizeObserver = new ResizeObserver(() => fitAddon?.fit());
  resizeObserver.observe(terminalHost.value);
}

async function loadChunks(manifest: Manifest, baseUrl: string): Promise<Uint8Array> {
  const chunks = manifest.chunks;
  totalChunks.value = chunks.length;
  downloadedChunks.value = 0;
  downloadProgress.value = 0;

  const buffers: ArrayBuffer[] = new Array(chunks.length);
  let completed = 0;

  await Promise.all(
    chunks.map(async (chunk, index) => {
      const url = `${baseUrl}runtime/c2w/${chunk.filename}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch chunk ${chunk.filename}: ${res.statusText}`);
      }
      const buf = await res.arrayBuffer();
      buffers[index] = buf;
      completed++;
      downloadedChunks.value = completed;
      downloadProgress.value = Math.round((completed / chunks.length) * 100);
    })
  );

  const totalLength = buffers.reduce((acc, b) => acc + b.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    combined.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }

  return combined;
}

async function startContainer() {
  try {
    status.value = 'downloading';
    message.value = '正在读取运行时资产清单...';
    await nextTick();
    await ensureTerminal();

    const baseUrl = import.meta.env.BASE_URL || '/';

    // 加载 xterm-pty 终端主从协议库
    await loadScript(`${baseUrl}runtime/c2w/engine/xterm-pty.js`);

    const manifestRes = await fetch(`${baseUrl}runtime/c2w/manifest.json`);

    if (!manifestRes.ok) {
      status.value = 'not_ready';
      message.value = '云端运行时清单尚未生成。请先在 GitHub Actions 中触发 build-c2w-runtime 工作流。';
      terminal?.writeln('\x1b[33m[提示]\x1b[0m 容器运行时尚未在云端生成。');
      return;
    }

    const manifest: Manifest = await manifestRes.json();

    if (!manifest.chunks || manifest.chunks.length === 0) {
      status.value = 'not_ready';
      message.value = '已配置云端构建流水线，首次使用前需在 GitHub Actions 运行 build-c2w-runtime 生成分片。';
      return;
    }

    message.value = `正在并发拉取 ${manifest.chunks.length} 个 Gzip 分片...`;
    const wasmBytes = await loadChunks(manifest, baseUrl);

    status.value = 'initializing';
    message.value = '分片下载与解压完成，正在启动 WebAssembly 虚拟机与 PTY 终端...';
    terminal?.writeln(`\x1b[32m✔\x1b[0m 已加载全部分片 (共 ${(wasmBytes.byteLength / 1024 / 1024).toFixed(1)} MB)`);
    terminal?.writeln('\x1b[34m[Boot]\x1b[0m 启动 Alpine Linux 3.22 内核与多 Shell 终端...');

    if (typeof SharedArrayBuffer === 'undefined') {
      terminal?.writeln('\x1b[33m[环境提示]\x1b[0m 当前浏览器窗口未开启 SharedArrayBuffer。');
      terminal?.writeln('已在后台完成 ServiceWorker 跨域隔离注册，请刷新页面后再次点击启动。');
      throw new Error('未检测到 SharedArrayBuffer 支持（请刷新页面后重试）');
    }

    const { openpty, TtyServer, Termios } = (window as any);
    const { master, slave } = openpty();
    slavePty = slave;

    const termios = slave.ioctl('TCGETS');
    termios.iflag &= ~(32 | 64 | 128 | 256 | 1024);
    termios.oflag &= ~1;
    termios.lflag &= ~(2 | 64 | 8 | 16 | 32768);
    slave.ioctl('TCSETS', new Termios(termios.iflag, termios.oflag, termios.cflag, termios.lflag, termios.cc));

    terminal?.loadAddon(master);

    // 启动 Worker
    worker = new Worker(`${baseUrl}runtime/c2w/engine/worker.js`);

    worker.postMessage({
      type: 'init',
      wasmBuffer: wasmBytes.buffer
    }, [wasmBytes.buffer]);

    ttyServer = new TtyServer(slave);
    ttyServer.start(worker);

    status.value = 'running';
    message.value = '多 Shell 容器已就绪。可通过上方按钮快速切换 Shell，或直接在终端中交互。';
  } catch (err: any) {
    status.value = 'error';
    message.value = err.message || '容器加载失败，请刷新重试。';
    terminal?.writeln(`\x1b[31m[错误] 加载失败: ${err.message}\x1b[0m`);
  }
}

function sendInput(cmd: string) {
  if (slavePty) {
    slavePty.write(cmd);
  } else {
    terminal?.paste(cmd);
  }
}

function clearTerminal() {
  terminal?.clear();
}

function toggleRun() {
  if (status.value === 'running') {
    status.value = 'paused';
    message.value = '虚拟机已暂停。';
  } else if (status.value === 'paused') {
    status.value = 'running';
    message.value = '虚拟机已恢复运行。';
  }
}

function restartContainer() {
  if (worker) {
    worker.terminate();
    worker = undefined;
  }
  if (ttyServer && ttyServer.stop) {
    ttyServer.stop();
    ttyServer = undefined;
  }
  status.value = 'idle';
  downloadProgress.value = 0;
  startContainer();
}

watch(isDark, (dark) => {
  terminal?.options && (terminal.options.theme = getTerminalTheme(dark));
});

onBeforeUnmount(() => {
  if (worker) {
    worker.terminate();
    worker = undefined;
  }
  if (ttyServer && ttyServer.stop) {
    ttyServer.stop();
  }
  resizeObserver?.disconnect();
  terminal?.dispose();
});
</script>

<style scoped>
.runtime-workbench {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.runtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
}

.runtime-header p {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--vp-c-brand-1);
}

.runtime-header h2 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  padding: 0;
}

.runtime-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.runtime-status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
}

.runtime-status.running i {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.runtime-status.downloading i,
.runtime-status.initializing i {
  background: #3b82f6;
  animation: pulse 1.5s infinite;
}

.runtime-status.not_ready i {
  background: #f59e0b;
}

.runtime-status.error i {
  background: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.runtime-launcher {
  padding: 2rem 1.5rem;
  text-align: center;
}

.runtime-facts {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.runtime-facts span {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}

.runtime-facts small {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
}

.runtime-facts strong {
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
}

.runtime-desc {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
}

.download-bar-container {
  max-width: 400px;
  margin: 0 auto 1.5rem;
}

.download-bar {
  height: 6px;
  background: var(--vp-c-brand-1);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.download-text {
  display: block;
  margin-top: 0.5rem;
  color: var(--vp-c-text-2);
}

.launcher-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-block;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
}

.terminal-shell {
  display: flex;
  flex-direction: column;
}

.terminal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--vp-c-bg-elv);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.terminal-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--vp-c-text-2);
}

.mini-progress {
  width: 80px;
  height: 4px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  overflow: hidden;
}

.mini-bar {
  height: 100%;
  background: var(--vp-c-brand-1);
}

.terminal-btns {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-commands {
  display: flex;
  gap: 0.35rem;
  margin-right: 0.5rem;
}

.btn-tag {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-divider);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
  cursor: pointer;
}

.btn-tag:hover {
  background: var(--vp-c-brand-soft);
}

.terminal-btns button {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

.terminal-btns button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
}

.terminal-btns button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.terminal-host {
  padding: 0.75rem;
  min-height: 380px;
  background: #090d13;
}
</style>
