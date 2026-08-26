<template>
  <ClientOnly>
    <section class="shell-workbench shell-workbench--container" aria-label="container2wasm 工作台">
      <header class="workbench-header">
        <div class="workbench-identity">
          <a href="https://github.com/container2wasm/container2wasm" target="_blank" rel="noopener noreferrer"><strong>container2wasm 0.8.4</strong></a>
          <span aria-hidden="true">·</span>
          <a href="https://alpinelinux.org/" target="_blank" rel="noopener noreferrer">Alpine Linux 3.22</a>
        </div>
        <button
          type="button"
          class="workbench-status"
          :class="status"
          :disabled="status === 'downloading' || status === 'initializing' || status === 'not_ready'"
          @click="handleRuntimeAction"
        ><i></i>{{ runtimeActionLabel }}</button>
      </header>

      <dl class="workbench-specs">
        <div><dt>系统</dt><dd>Alpine 3.22</dd></div>
        <div><dt>架构</dt><dd>RISC-V 64</dd></div>
        <div><dt>环境</dt><dd>Bash · Zsh · Fish · Py3</dd></div>
        <div><dt>加载</dt><dd>17 个 Gzip 分片</dd></div>
      </dl>

      <div v-if="runtimeError" class="workbench-error" role="alert" aria-live="assertive">
        <strong>容器启动失败</strong>
        <pre>{{ runtimeError }}</pre>
      </div>

      <div class="workbench-terminal">
        <div class="workbench-toolbar">
          <div class="workbench-toolbar-message">
            <strong>容器终端</strong><span>{{ message }}</span>
            <div v-if="status === 'downloading'" class="workbench-progress" :title="`已加载 ${downloadedChunks} / ${totalChunks} 分片`">
              <i :style="{ width: `${downloadProgress}%` }" />
            </div>
          </div>
          <div class="workbench-controls">
            <WorkbenchExampleMenu :examples="examples" :disabled="status !== 'running'" :hint="controlHint" @select="runExample" />
            <button type="button" class="workbench-button" @click="loadAllExperiments">加载实验</button>
            <span class="workbench-control-hint" :title="status === 'running' || status === 'paused' ? '清空终端显示' : controlHint">
              <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="clearTerminal">清屏</button>
            </span>
            <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="toggleRun">
              {{ status === 'paused' ? '继续' : '暂停' }}
            </button>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'error' || status === 'not_ready'" class="workbench-idle">
          <div class="workbench-preview" aria-hidden="true"><span>alpine:~$</span><code>exec zsh -l</code></div>
          <p>{{ status === 'idle' ? '容器尚未加载。点击右上角“未启动 · 启动容器”后下载运行时分片。' : message }}</p>
          <a v-if="status === 'not_ready'" class="workbench-button" href="https://github.com/container2wasm/container2wasm" target="_blank" rel="noopener noreferrer">查看 container2wasm</a>
        </div>
        <div 
          v-show="status === 'downloading' || status === 'initializing' || status === 'running' || status === 'paused'" 
          ref="terminalHost" 
          class="workbench-terminal-host" 
          @dragover.prevent
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          :class="{ 'is-dragging': isDragging }"
        />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useData } from 'vitepress';
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import WorkbenchExampleMenu from './WorkbenchExampleMenu.vue';
import { sourceModules, fixtureModules } from '../data/matrixExperiments';
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
const runtimeError = ref('');

const downloadProgress = ref(0);
const downloadedChunks = ref(0);
const totalChunks = ref(0);

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let worker: Worker | undefined;
let ttyServer: any | undefined;
let slavePty: any | undefined;

const runtimeActionLabel = computed(() => {
  switch (status.value) {
    case 'downloading':
      return `正在下载 · ${downloadProgress.value}%`;
    case 'initializing':
      return '正在初始化…';
    case 'running':
      return '运行中 · 重新启动';
    case 'paused':
      return '已暂停 · 继续';
    case 'not_ready':
      return '运行时不可用';
    case 'error':
      return '启动失败 · 重试';
    default:
      return '未启动 · 启动容器';
  }
});

const controlHint = computed(() => status.value === 'running'
  ? '选择环境或运行示例'
  : status.value === 'paused' ? '容器已暂停，请先继续' : status.value === 'idle' ? '未启动，请先启动容器' : '容器尚未就绪');

const examples: Array<{ id: string; title: string; summary: string; source: string }> = [
  { id: 'bash', title: '切换 Bash', summary: '切换并从 /proc 输出当前进程', source: 'exec bash -l\ncat /proc/$$/comm' },
  { id: 'zsh', title: '切换 Zsh', summary: '切换并从 /proc 输出当前进程', source: 'exec zsh -l\ncat /proc/$$/comm' },
  { id: 'fish', title: '切换 Fish', summary: '切换并从 /proc 输出当前进程', source: 'exec fish\ncat /proc/$fish_pid/comm' },
  { id: 'python', title: '启动 Python', summary: '进入 Python 交互解释器', source: 'python3' },
  { id: 'system', title: '系统信息', summary: '查看 Alpine、内核和架构', source: `cat /etc/os-release; uname -a` },
];

function handleRuntimeAction() {
  if (status.value === 'paused') toggleRun();
  else if (status.value === 'running') restartContainer();
  else startContainer();
}

function getTerminalTheme(dark: boolean) {
  return dark
    ? {
        background: '#08111f', foreground: '#dce7f5', cursor: '#fdba74', selectionBackground: '#7c2d12',
        red: '#f87171', green: '#4ade80', yellow: '#facc15', blue: '#60a5fa', magenta: '#c084fc', cyan: '#22d3ee', white: '#cbd5e1', brightBlack: '#64748b', brightYellow: '#fde047', brightWhite: '#f8fafc',
      }
    : {
        background: '#f8fafc', foreground: '#243247', cursor: '#ea580c', selectionBackground: '#fed7aa',
        red: '#dc2626', green: '#15803d', yellow: '#a16207', blue: '#2563eb', magenta: '#9333ea', cyan: '#0e7490', white: '#e2e8f0', brightBlack: '#64748b', brightYellow: '#ca8a04', brightWhite: '#f8fafc',
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

async function decompressIfNeeded(buf: ArrayBuffer): Promise<ArrayBuffer> {
  const u8 = new Uint8Array(buf);
  // Gzip magic header 0x1f 0x8b
  if (u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b) {
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const stream = new Response(buf).body!.pipeThrough(ds);
      return await new Response(stream).arrayBuffer();
    }
  }
  return buf;
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
      const rawBuf = await res.arrayBuffer();
      const decompressedBuf = await decompressIfNeeded(rawBuf);
      buffers[index] = decompressedBuf;
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

function formatRuntimeError(error: any): string {
  if (typeof error === 'string') return error;

  const message = error?.message || '容器加载失败，请刷新重试。';
  const stack = error?.stack;
  return stack && !stack.startsWith(message) ? `${message}\n${stack}` : stack || message;
}

function showRuntimeError(error: any) {
  const detail = formatRuntimeError(error);
  status.value = 'error';
  message.value = '容器启动失败，详细信息已保留在下方。';
  runtimeError.value = detail;
  terminal?.writeln(`\x1b[31m[错误] 加载失败: ${detail}\x1b[0m`);
}

async function startContainer() {
  try {
    runtimeError.value = '';
    status.value = 'downloading';
    message.value = '正在读取运行时资产清单...';
    await nextTick();
    await ensureTerminal();

    if (typeof SharedArrayBuffer === 'undefined') {
      terminal?.writeln('\x1b[33m[环境提示]\x1b[0m 当前预览环境未开放 SharedArrayBuffer。');
      terminal?.writeln('container2wasm 的多线程 PTY 终端依赖 Cross-Origin Isolation 安全隔离支持。');
      throw new Error('当前开发服务器未开启 SharedArrayBuffer 跨域隔离支持');
    }

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
    message.value = '分片下载与解压完成，正在校验并启动 WebAssembly 虚拟机...';

    if (!WebAssembly.validate(wasmBytes)) {
      terminal?.writeln('\x1b[31m[错误]\x1b[0m WebAssembly 二进制完整性校验失败，请刷新重试。');
      throw new Error('WebAssembly 二进制完整性校验失败');
    }

    terminal?.writeln(`\x1b[32m✔\x1b[0m 已加载并验证全部分片 (共 ${(wasmBytes.byteLength / 1024 / 1024).toFixed(1)} MB)`);
    terminal?.writeln('\x1b[34m[Boot]\x1b[0m 启动 Alpine Linux 3.22 内核与多 Shell 终端...');

    const { openpty, TtyServer, Termios } = (window as any);
    const { master, slave } = openpty();
    slavePty = slave;

    const termios = slave.ioctl('TCGETS');
    termios.iflag &= ~(32 | 64 | 128 | 256 | 1024);
    termios.oflag &= ~1;
    termios.lflag &= ~(2 | 64 | 8 | 16 | 32768);
    slave.ioctl('TCSETS', new Termios(termios.iflag, termios.oflag, termios.cflag, termios.lflag, termios.cc));

    terminal?.loadAddon(master);

    // 启动 Worker (附带时间戳防 CDN / 浏览器旧版本缓存)
    worker = new Worker(`${baseUrl}runtime/c2w/engine/worker.js?t=${Date.now()}`);

    worker.addEventListener('message', (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'runtime-started') {
        status.value = 'running';
        message.value = 'WebAssembly 虚拟机已启动，正在引导 Alpine Linux。';
      } else if (data.type === 'runtime-error') {
        showRuntimeError(data.stack || data.message || 'Worker 运行失败');
      }
    });

    worker.addEventListener('error', (event: ErrorEvent) => {
      event.preventDefault();
      showRuntimeError(event.error || event.message || 'Worker 脚本加载失败');
    });

    worker.addEventListener('messageerror', () => {
      showRuntimeError('Worker 消息无法解析，容器运行时已停止。');
    });

    worker.postMessage({
      type: 'init',
      wasmBuffer: wasmBytes.buffer
    }, [wasmBytes.buffer]);

    ttyServer = new TtyServer(slave);
    ttyServer.start(worker);
  } catch (err: any) {
    showRuntimeError(err);
  }
}

function sendInput(cmd: string) {
  if (!terminal) return;
  // Use raw terminal input instead of paste: interactive shells can enable
  // bracketed-paste mode, where a pasted newline is intentionally not run.
  terminal.input(cmd.replace(/\r?\n/g, '\r'), true);
  terminal.focus();
}

const isDragging = ref(false);

async function handleDrop(e: DragEvent) {
  isDragging.value = false;
  if (status.value !== 'running') {
    terminal?.writeln('\x1b[33m[提示]\x1b[0m 容器未运行，无法接收文件。请先启动容器。');
    return;
  }
  
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      terminal?.writeln(`\r\n\x1b[34m[上传]\x1b[0m 正在注入文件: ${safeFilename} (${(file.size / 1024).toFixed(1)} KB)...`);
      
      const cmd = `echo "${base64}" | base64 -d > "${safeFilename}"\n`;
      sendInput(cmd);
      
      terminal?.writeln(`\x1b[32m✔\x1b[0m ${safeFilename} 注入完成。您可以通过 cat ${safeFilename} 查看。`);
    } catch (err) {
      terminal?.writeln(`\r\n\x1b[31m[错误]\x1b[0m 注入 ${file.name} 失败: ${err}`);
    }
  }
}

function runExample(source: string) {
  if (status.value !== 'running') return;
  sendInput(`${source}\n`);
  terminal?.focus();
}

async function loadAllExperiments() {
  console.log('loadAllExperiments triggered! Status:', status.value);
  if (status.value !== 'running') {
    alert('请先点击右上角的【启动容器】按钮，等待终端提示进入 Alpine Linux 后，再加载实验素材！');
    return;
  }
  
  try {
    terminal?.writeln(`\r\n\x1b[34m[加载实验]\x1b[0m 正在向系统注入所有实验素材，请稍候...`);
    
    sendInput(`stty -echo\n`);
    
    const utf8ToBase64 = (str: string) => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };
    
    const allModules = { ...sourceModules, ...fixtureModules };
    
    let loaderScript = `mkdir -p demos\ncd demos\n`;
    let fileCount = 0;
    
    for (const [key, content] of Object.entries(allModules)) {
      const match = key.match(/demos\/(.+)$/);
      if (!match) continue;
      
      const relPath = match[1];
      const dir = relPath.includes('/') ? relPath.substring(0, relPath.lastIndexOf('/')) : '';
      
      if (dir) {
        loaderScript += `mkdir -p "${dir}"\n`;
      }
      
      const fileB64 = utf8ToBase64(content);
      loaderScript += `echo "${fileB64}" | base64 -d > "${relPath}"\n`;
      fileCount++;
    }
    
    const loaderB64 = utf8ToBase64(loaderScript);
    
    sendInput(`stty -echo -icanon\n`);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    sendInput(`cat > /tmp/load.b64\n`);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const chunkSize = 1024;
    for (let i = 0; i < loaderB64.length; i += chunkSize) {
      const chunk = loaderB64.slice(i, i + chunkSize);
      sendInput(chunk);
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    sendInput(`\x04`); // Ctrl+D to signal EOF
    await new Promise(resolve => setTimeout(resolve, 100));
    
    sendInput(`stty echo icanon\n`);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    sendInput(`base64 -d /tmp/load.b64 | sh && rm /tmp/load.b64\n`);
    sendInput(`cd demos && clear && ls -la\n`);
    
    terminal?.writeln(`\r\n\x1b[32m✔\x1b[0m 成功载入 ${fileCount} 个实验素材至 ~/demos 目录。`);
    terminal?.focus();
  } catch (err) {
    sendInput(`stty echo\n`);
    terminal?.writeln(`\r\n\x1b[31m[错误]\x1b[0m 素材加载失败: ${err}`);
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
  runtimeError.value = '';
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
.workbench-terminal-host.is-dragging {
  position: relative;
}
.workbench-terminal-host.is-dragging::after {
  content: '松开鼠标以上传文件';
  position: absolute;
  inset: 0;
  background: rgba(37, 99, 235, 0.2);
  border: 2px dashed #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #3b82f6;
  z-index: 10;
  pointer-events: none;
}
</style>

