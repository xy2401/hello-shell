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
          :disabled="status === 'downloading' || (status === 'initializing' && !isPowerShellBooting) || status === 'not_ready'"
          @click="handleRuntimeAction"
        ><i></i>{{ runtimeActionLabel }}</button>
      </header>

      <dl class="workbench-specs">
        <div><dt>系统</dt><dd>Alpine 3.22</dd></div>
        <div><dt>架构</dt><dd>{{ targetArchDisplay }}</dd></div>
        <div><dt>环境</dt><dd>{{ envDisplay }}</dd></div>
        <div><dt>加载</dt><dd>{{ chunkDisplay }}</dd></div>
      </dl>

      <div v-if="runtimeError" class="workbench-error" role="alert" aria-live="assertive">
        <strong>容器启动失败</strong>
        <pre>{{ runtimeError }}</pre>
      </div>

      <div class="workbench-terminal">
        <div class="workbench-toolbar">
          <div class="workbench-toolbar-message">
            <strong>容器终端</strong><span>{{ message }}</span>
            <span v-if="getRuntimeId() === 'c2w-powershell'" class="workbench-runtime-warning" role="note">
              ⚠ 冷启动可能耗时数分钟甚至更久，出现 PS&gt; 后才可输入。
            </span>
            <div v-if="status === 'downloading'" class="workbench-progress" :title="`已加载 ${downloadedChunks} / ${totalChunks} 分片`">
              <i :style="{ width: `${downloadProgress}%` }" />
            </div>
          </div>
          <div class="workbench-controls">
            <WorkbenchExampleMenu :examples="examples" :disabled="status !== 'running'" :hint="controlHint" @select="runExample" />
            <button
              type="button"
              class="workbench-button"
              :disabled="status !== 'running' || isLoadingExperiments"
              @click="loadAllExperiments"
            >{{ isLoadingExperiments ? '加载中…' : '加载实验' }}</button>
            <span class="workbench-control-hint" :title="status === 'running' || status === 'paused' ? '清空终端显示' : controlHint">
              <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="clearTerminal">清屏</button>
            </span>
            <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="toggleRun">
              {{ status === 'paused' ? '继续' : '暂停' }}
            </button>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'error' || status === 'not_ready'" class="workbench-idle">
          <div class="workbench-preview" aria-hidden="true"><span>alpine:~$</span><code>{{ getRuntimeId() === 'c2w-powershell' ? 'pwsh' : (getRuntimeId() === 'c2w-shell' ? 'exec zsh -l' : 'cat /etc/os-release') }}</code></div>
          <p>{{ status === 'idle' ? '容器尚未加载。点击右上角“未启动 · 启动容器”后下载运行时分片。' : message }}</p>
          <a v-if="status === 'not_ready'" class="workbench-button" href="https://github.com/container2wasm/container2wasm" target="_blank" rel="noopener noreferrer">查看 container2wasm</a>
        </div>
        <div 
          v-show="status === 'downloading' || status === 'initializing' || status === 'running' || status === 'paused'" 
          ref="terminalHost" 
          class="workbench-terminal-host" 
          :aria-busy="isPowerShellBooting"
          @dragover.prevent
          @dragenter.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          :class="{ 'is-dragging': isDragging, 'is-booting': isPowerShellBooting }"
        />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, onMounted } from 'vue';
import { useData } from 'vitepress';
const props = defineProps<{ runtimeId?: string }>();
const getRuntimeId = () => props.runtimeId || "c2w";
import type { Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import WorkbenchExampleMenu from './WorkbenchExampleMenu.vue';
import { sourceModules, fixtureModules } from '../data/matrixExperiments';
import '@xterm/xterm/css/xterm.css';

type RuntimeStatus = 'idle' | 'downloading' | 'initializing' | 'running' | 'paused' | 'not_ready' | 'error';

interface ChunkItem {
  filename: string;
  size?: number;
  compressedSize?: number;
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
const message = ref(
  getRuntimeId() === 'c2w-powershell' ? '在浏览器中运行跨平台的 .NET PowerShell Core。' :
  getRuntimeId() === 'c2w-shell' ? '支持在同一容器内切换 11 种 Shell 与 Python 3.12。' :
  '极致纯净的 Alpine 容器环境，仅自带基础工具链。'
);

const targetArchDisplay = computed(() => {
  const rid = getRuntimeId();
  if (rid === 'c2w-powershell') return 'AMD64 / x86_64';
  return 'RISC-V 64';
});
const envDisplay = computed(() => {
  const rid = getRuntimeId();
  if (rid === 'c2w-powershell') return 'PowerShell Core';
  if (rid === 'c2w-shell') return '11 Shells · Python 3';
  return 'Alpine 3.22 (仅 ash)';
});

const chunkDisplay = ref('获取中...');

onMounted(async () => {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const res = await fetch(`${baseUrl}runtime/${getRuntimeId()}/manifest.json`);
    if (res.ok) {
      const manifest = await res.json() as Manifest;
      const chunks = manifest.chunks || [];
      const totalCompressed = chunks.reduce((acc, cur) => acc + (cur.compressedSize || cur.size || 0), 0);
      const sizeMB = (totalCompressed / 1024 / 1024).toFixed(1);
      chunkDisplay.value = `${chunks.length} 个分片 (${sizeMB} MB)`;
    } else {
      chunkDisplay.value = '未知';
    }
  } catch (e) {
    chunkDisplay.value = '获取失败';
  }
});

const runtimeError = ref('');
const isLoadingExperiments = ref(false);
const powerShellBootSeconds = ref(0);
const isPowerShellBooting = computed(() => getRuntimeId() === 'c2w-powershell' && status.value === 'initializing');

const downloadProgress = ref(0);
const downloadedChunks = ref(0);
const totalChunks = ref(0);

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let worker: Worker | undefined;
let ttyServer: any | undefined;
let slavePty: any | undefined;
let powerShellPromptDisposable: { dispose(): void } | undefined;
let powerShellBootTimer: number | undefined;

const runtimeActionLabel = computed(() => {
  switch (status.value) {
    case 'downloading':
      return `正在下载 · ${downloadProgress.value}%`;
    case 'initializing':
      return isPowerShellBooting.value && powerShellBootSeconds.value > 0
        ? `引导中 · ${powerShellBootSeconds.value}s · 重启`
        : '正在初始化…';
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

const examples = computed(() => {
  const rid = getRuntimeId();
  if (rid === 'c2w-powershell') {
    return [
      { id: 'ash', title: '切换 Ash', summary: '进入 Alpine 默认 Shell', source: 'exec ash -l\ncat /proc/$$/comm' },
      { id: 'pwsh', title: '启动 PowerShell', summary: '进入 PowerShell Core 环境', source: 'pwsh' },
      { id: 'obj', title: '对象管道', summary: '基于属性过滤进程对象', source: 'Get-Process | Where-Object CPU -gt 0' },
      { id: 'system', title: '系统信息', summary: '查看内核和架构', source: 'cat /etc/os-release; uname -a' },
    ];
  } else if (rid === 'c2w-shell') {
    return [
      { id: 'ash', title: '切换 Ash', summary: '进入 Alpine 默认 Shell', source: 'exec ash -l\ncat /proc/$$/comm' },
      { id: 'bash', title: '切换 Bash', summary: '切换并从 /proc 输出进程', source: 'exec bash -l\ncat /proc/$$/comm' },
      { id: 'zsh', title: '切换 Zsh', summary: '切换并从 /proc 输出进程', source: 'exec zsh -l\ncat /proc/$$/comm' },
      { id: 'fish', title: '切换 Fish', summary: '切换并从 /proc 输出进程', source: 'exec fish\ncat /proc/$fish_pid/comm' },
      { id: 'elvish', title: '切换 Elvish', summary: '进入 Elvish 交互环境', source: 'exec elvish' },
      { id: 'dash', title: '切换 Dash', summary: '切换并从 /proc 输出进程', source: 'exec dash\ncat /proc/$$/comm' },
      { id: 'mksh', title: '切换 mksh', summary: '进入 MirBSD Korn Shell', source: 'exec mksh -l\ncat /proc/$$/comm' },
      { id: 'yash', title: '切换 Yash', summary: '进入 Yet Another Shell', source: 'exec yash\ncat /proc/$$/comm' },
      { id: 'oksh', title: '切换 oksh', summary: '进入 OpenBSD Korn Shell', source: 'exec oksh -l\ncat /proc/$$/comm' },
      { id: 'tcsh', title: '切换 tcsh', summary: '进入兼容 C Shell 的 tcsh', source: 'exec tcsh -l\ncat /proc/$$/comm' },
      { id: 'ion', title: '切换 Ion', summary: '进入 Ion Shell', source: 'exec ion' },
      { id: 'python', title: '启动 Python', summary: '进入 Python 交互解释器', source: 'python3' },
    ];
  } else {
    return [
      { id: 'ash', title: '切换 Ash', summary: '进入 Alpine 默认 Shell', source: 'exec ash -l\ncat /proc/$$/comm' },
      { id: 'system', title: '系统信息', summary: '查看 Alpine、内核和架构', source: 'cat /etc/os-release; uname -a' },
      { id: 'apk', title: '安装包测试', summary: '尝试使用 apk', source: 'apk search htop' }
    ];
  }
});

function handleRuntimeAction() {
  if (status.value === 'paused') toggleRun();
  else if (status.value === 'running' || (status.value === 'initializing' && isPowerShellBooting.value)) restartContainer();
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
      const url = `${baseUrl}runtime/${getRuntimeId()}/${chunk.filename}`;
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
  clearPowerShellReadyWatcher();
  const detail = formatRuntimeError(error);
  status.value = 'error';
  message.value = '容器启动失败，详细信息已保留在下方。';
  runtimeError.value = detail;
  terminal?.writeln(`\x1b[31m[错误] 加载失败: ${detail}\x1b[0m`);
}

function clearPowerShellReadyWatcher() {
  powerShellPromptDisposable?.dispose();
  powerShellPromptDisposable = undefined;
  if (powerShellBootTimer !== undefined) {
    window.clearInterval(powerShellBootTimer);
    powerShellBootTimer = undefined;
  }
}

function watchForPowerShellReady() {
  if (!terminal) return;

  clearPowerShellReadyWatcher();
  powerShellBootSeconds.value = 0;
  const startedAt = Date.now();
  const firstBootLine = terminal.buffer.active.baseY + terminal.buffer.active.cursorY;

  const markReadyIfPromptVisible = () => {
    if (!terminal) return;
    const buffer = terminal.buffer.active;
    const lines: string[] = [];
    for (let index = firstBootLine; index < buffer.length; index++) {
      const line = buffer.getLine(index);
      if (line) lines.push(line.translateToString(true));
    }

    if (!/(?:^|\n)PS [^\n>]*>\s*$/.test(lines.join('\n'))) return;

    clearPowerShellReadyWatcher();
    status.value = 'running';
    message.value = `PowerShell Core 已就绪（引导耗时 ${powerShellBootSeconds.value} 秒），可以输入命令。`;
    terminal.focus();
  };

  powerShellPromptDisposable = terminal.onWriteParsed(markReadyIfPromptVisible);
  powerShellBootTimer = window.setInterval(() => {
    powerShellBootSeconds.value = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    message.value = powerShellBootSeconds.value < 120
      ? `PowerShell Core 正在通过 x86_64 Bochs 引导（已等待 ${powerShellBootSeconds.value} 秒），出现 PS> 后自动开放输入。`
      : `PowerShell Core 仍在引导（已等待 ${powerShellBootSeconds.value} 秒）。可以继续等待，或点击右上角重新启动；出现 PS> 后会自动开放输入。`;
    markReadyIfPromptVisible();
  }, 1_000);

  markReadyIfPromptVisible();
}

async function startContainer() {
  try {
    clearPowerShellReadyWatcher();
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

    const manifestRes = await fetch(`${baseUrl}runtime/${getRuntimeId()}/manifest.json`);

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
    terminal?.writeln(`\x1b[34m[Boot]\x1b[0m ${getRuntimeId() === 'c2w-powershell' ? '启动 x86_64 Bochs 模拟器与 PowerShell Core...' : '启动 Alpine Linux 3.22 内核...'}`);

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
        if (getRuntimeId() === 'c2w-powershell') {
          status.value = 'initializing';
          message.value = 'WebAssembly 虚拟机已启动，正在通过 x86_64 Bochs 引导 PowerShell Core…';
          watchForPowerShellReady();
        } else {
          status.value = 'running';
          message.value = 'WebAssembly 虚拟机已启动，正在引导 Alpine Linux。';
        }
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

function sendInput(cmd: string, wasUserInput = true) {
  if (!terminal) return;
  // Use raw terminal input instead of paste: interactive shells can enable
  // bracketed-paste mode, where a pasted newline is intentionally not run.
  terminal.input(cmd.replace(/\r?\n/g, '\r'), wasUserInput);
  if (wasUserInput) terminal.focus();
}

function waitForTerminalTitle(expected: string, errorPrefix?: string, timeoutMs = 15_000) {
  if (!terminal) return Promise.reject(new Error('终端尚未初始化'));

  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      subscription.dispose();
      reject(new Error(`等待容器确认超时（${expected}）`));
    }, timeoutMs);

    const subscription = terminal!.onTitleChange((title) => {
      if (title !== expected && (!errorPrefix || !title.startsWith(errorPrefix))) return;

      window.clearTimeout(timeout);
      subscription.dispose();
      if (title === expected) resolve();
      else reject(new Error(`容器端写入失败（${title.slice(errorPrefix!.length) || 'unknown'}）`));
    });
  });
}

function shellSingleQuote(value: string) {
  return "'" + value.replace(/'/g, "'\\''") + "'";
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
  if (status.value !== 'running') {
    alert('请先点击右上角的【启动容器】按钮，等待终端提示进入 Alpine Linux 后，再加载实验素材！');
    return;
  }

  if (isLoadingExperiments.value || !terminal) return;

  isLoadingExperiments.value = true;

  const sessionId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const echoOffTitle = `c2w-import-echo-off-${sessionId}`;
  const readyTitle = `c2w-import-ready-${sessionId}`;
  const fileTitlePrefix = `c2w-import-file-${sessionId}-`;
  const errorTitlePrefix = `c2w-import-error-${sessionId}-`;
  const doneTitle = `c2w-import-done-${sessionId}`;

  try {
    const utf8ToBase64 = (str: string) => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const allModules = { ...sourceModules, ...fixtureModules };
    const experimentFiles = Object.entries(allModules)
      .map(([key, content]) => {
        const match = key.match(/demos\/(.+)$/);
        return match ? { relPath: match[1], content } : undefined;
      })
      .filter((file): file is { relPath: string; content: string } => !!file)
      .sort((a, b) => a.relPath.localeCompare(b.relPath));

    message.value = `正在加载 ${experimentFiles.length} 个实验素材…`;
    terminal.writeln(`\r\n\x1b[34m[加载实验]\x1b[0m 正在可靠注入 ${experimentFiles.length} 个实验素材…`);

    // Disable terminal echo first, then wait for an invisible OSC title signal.
    // This keeps importer protocol lines and shell prompts out of the terminal.
    const echoOffPromise = waitForTerminalTitle(echoOffTitle);
    sendInput(`stty -echo; printf '\\033]0;${echoOffTitle}\\007'\n`, false);
    await echoOffPromise;

    const importerScript = `
notify() { printf "\\033]0;%s\\007" "$1"; }
fail() {
  stty echo
  notify "${errorTitlePrefix}$1"
  exit "$2"
}
root="$PWD/demos"
mkdir -p "$root" || fail setup 2
notify "${readyTitle}"
while IFS=" " read -r kind file_id encoded_path encoded_content; do
  if [ "$kind" = "DONE" ]; then
    stty echo
    notify "${doneTitle}"
    exit 0
  fi
  [ "$kind" = "FILE" ] || fail protocol 3
  rel_path=$(printf "%s" "$encoded_path" | base64 -d) || fail "$file_id" 4
  case "$rel_path" in
    ""|/*|..|../*|*/..|*/../*) fail "$file_id" 5 ;;
  esac
  target="$root/$rel_path"
  mkdir -p "$(dirname "$target")" || fail "$file_id" 6
  if [ "$encoded_content" = "-" ]; then
    : > "$target" || fail "$file_id" 7
  else
    printf "%s" "$encoded_content" | base64 -d > "$target" || fail "$file_id" 8
  fi
  notify "${fileTitlePrefix}$file_id"
done
fail eof 9
`.trim();

    const importerPayload = utf8ToBase64(importerScript);
    const importerWrapper = `temp="/tmp/hello-shell-import-${sessionId}.sh"; printf "%s" "$1" | base64 -d > "$temp" || exit 10; sh "$temp"; rc=$?; rm -f "$temp"; exit "$rc"`;
    const readyPromise = waitForTerminalTitle(readyTitle, errorTitlePrefix);
    sendInput(`env sh -c ${shellSingleQuote(importerWrapper)} c2w-import ${importerPayload}\n`, false);
    await readyPromise;

    for (let index = 0; index < experimentFiles.length; index++) {
      const { relPath, content } = experimentFiles[index];
      const fileId = String(index + 1);
      const pathPayload = utf8ToBase64(relPath);
      const contentPayload = utf8ToBase64(content) || '-';
      const ackTitle = `${fileTitlePrefix}${fileId}`;
      const ackPromise = waitForTerminalTitle(ackTitle, errorTitlePrefix);

      sendInput(`FILE ${fileId} ${pathPayload} ${contentPayload}\n`, false);
      try {
        await ackPromise;
      } catch (error) {
        throw new Error(`写入 demos/${relPath} 失败: ${error instanceof Error ? error.message : String(error)}`);
      }

      const completed = index + 1;
      message.value = `正在加载实验素材：${completed} / ${experimentFiles.length}`;
      if (completed % 10 === 0 || completed === experimentFiles.length) {
        terminal.writeln(`\x1b[90m[注入]\x1b[0m 已完成 ${completed} / ${experimentFiles.length}`);
      }
    }

    const donePromise = waitForTerminalTitle(doneTitle, errorTitlePrefix);
    sendInput(`DONE\n`, false);
    await donePromise;

    message.value = `已加载 ${experimentFiles.length} 个实验素材，目录为 demos/。`;
    terminal.writeln(`\r\n\x1b[32m✔\x1b[0m 成功载入 ${experimentFiles.length} 个实验素材；当前目录未改变。`);
  } catch (err) {
    // Interrupt a possibly waiting importer and always restore terminal echo.
    sendInput(`\x03stty echo\n`, false);
    const detail = err instanceof Error ? err.message : String(err);
    message.value = `实验素材加载失败：${detail}`;
    terminal.writeln(`\r\n\x1b[31m[错误]\x1b[0m 素材加载失败: ${detail}`);
  } finally {
    isLoadingExperiments.value = false;
    terminal.focus();
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
  clearPowerShellReadyWatcher();
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
  clearPowerShellReadyWatcher();
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
.workbench-toolbar-message {
  flex-wrap: wrap;
  white-space: normal;
}

.workbench-runtime-warning {
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, #f59e0b 65%, transparent);
  border-radius: .35rem;
  padding: .12rem .4rem;
  background: color-mix(in srgb, #f59e0b 16%, var(--wb-bg-soft));
  color: #f59e0b;
  font-weight: 700;
  line-height: 1.45;
}

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

.workbench-terminal-host.is-booting {
  position: relative;
}

.workbench-terminal-host.is-booting::after {
  content: 'PowerShell Core 正在引导，出现 PS> 后将自动开放输入';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(8, 17, 31, 0.72);
  color: #fdba74;
  font-weight: 700;
  text-align: center;
  cursor: progress;
  z-index: 9;
}
</style>

