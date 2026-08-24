<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="BusyBox 工作台">
      <header class="runtime-header">
        <div>
          <p>BUSYBOX · WASI-SH · 600KB PURE LOCAL WASM</p>
          <h2>BusyBox 工作台</h2>
        </div>
        <span class="runtime-status" :class="status"><i></i>{{ statusLabel }}</span>
      </header>

      <div v-if="runtimeError" class="runtime-error" role="alert" aria-live="assertive">
        <strong>启动异常</strong>
        <pre>{{ runtimeError }}</pre>
      </div>

      <div v-if="status === 'idle' || status === 'error'" class="runtime-launcher">
        <div class="runtime-facts">
          <span><small>运行模式</small><strong>100% 纯本地 WASI</strong></span>
          <span><small>包体积</small><strong>约 600 KB（零外部依赖）</strong></span>
          <span><small>默认 Shell</small><strong>ash (Almquist Shell)</strong></span>
        </div>
        <p>{{ message }}</p>
        <button type="button" @click="startBusybox">启动 BusyBox</button>
      </div>

      <div v-show="status === 'loading' || status === 'running'" class="terminal-shell">
        <div class="terminal-toolbar">
          <span>{{ message }}</span>
          <div class="toolbar-actions">
            <button type="button" :disabled="status !== 'running' || commandRunning" @click="runToolsHelp">支持工具集</button>
            <button type="button" :disabled="status !== 'running' || commandRunning" @click="runSystemInfo">系统信息</button>
            <button type="button" :disabled="status !== 'running' || commandRunning" @click="runPipeTest">管道测试</button>
            <button type="button" @click="clearTerminal">清屏</button>
            <button type="button" :disabled="status === 'loading'" @click="restart">重置终端</button>
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

type RuntimeStatus = 'idle' | 'loading' | 'running' | 'error';

const { isDark } = useData();
const terminalHost = ref<HTMLElement>();
const status = ref<RuntimeStatus>('idle');
const commandRunning = ref(false);
const message = ref('纯本地 WASI 驱动的 BusyBox ash 终端，600KB 免网络开箱即用。');
const runtimeError = ref('');

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let session: any | undefined;
let inputLine = '';
let outputBuffer = '';
let outputDecoder = new TextDecoder();

const recordSeparator = '\x1e';
const promptText = '\x1b[36m$\x1b[0m ';

const statusLabel = computed(() => ({
  idle: '未启动',
  loading: '启动中',
  running: '运行中',
  error: '启动失败',
})[status.value]);

watch(isDark, () => applyTerminalTheme());

function applyTerminalTheme() {
  if (!terminal) return;
  terminal.options.theme = isDark.value
    ? {
        background: '#090d13',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        selectionBackground: '#264f78',
      }
    : {
        background: '#ffffff',
        foreground: '#24292f',
        cursor: '#0969da',
        selectionBackground: '#b6d7a8',
      };
}

async function ensureTerminal() {
  if (terminal) return;
  const { Terminal } = await import('@xterm/xterm');
  const { FitAddon } = await import('@xterm/addon-fit');

  terminal = new Terminal({
    cursorBlink: true,
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    convertEol: true,
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  if (terminalHost.value) {
    terminal.open(terminalHost.value);
    fitAddon.fit();
  }
  applyTerminalTheme();
  terminal.onData(handleTerminalData);
}

function showPrompt() {
  terminal?.write('', () => {
    const needsNewline = (terminal?.buffer.active.cursorX || 0) > 0;
    terminal?.write(`${needsNewline ? '\r\n' : ''}${promptText}`);
    terminal?.focus();
  });
}

function handleTerminalData(data: string) {
  if (!session) return;

  if (commandRunning.value) {
    session.write(data);
    return;
  }

  for (const char of data) {
    if (char === '\r') {
      terminal?.write('\r\n');
      const command = inputLine;
      inputLine = '';
      executeCommand(command);
    } else if (char === '\x7f' || char === '\b') {
      if (inputLine) {
        inputLine = inputLine.slice(0, -1);
        terminal?.write('\b \b');
      }
    } else if (char === '\x03') {
      inputLine = '';
      terminal?.write('^C');
      showPrompt();
    } else if (char === '\x0c') {
      terminal?.write(`\x1b[2J\x1b[H${promptText}${inputLine}`);
    } else if (char >= ' ') {
      inputLine += char;
      terminal?.write(char);
    }
  }
}

function executeCommand(command: string) {
  const trimmed = command.trim();
  if (!trimmed) {
    showPrompt();
    return;
  }

  commandRunning.value = true;
  session.write(`${command}\n`);
  session.write(`printf "${recordSeparator}%d${recordSeparator}" "$?"\n`);
}

function handleSessionOutput(chunk: Uint8Array | string) {
  outputBuffer += typeof chunk === 'string'
    ? chunk
    : outputDecoder.decode(chunk, { stream: true });

  while (true) {
    const markerStart = outputBuffer.indexOf(recordSeparator);
    if (markerStart < 0) {
      terminal?.write(outputBuffer);
      outputBuffer = '';
      return;
    }

    terminal?.write(outputBuffer.slice(0, markerStart));
    const remainder = outputBuffer.slice(markerStart + 1);
    const markerEnd = remainder.indexOf(recordSeparator);
    if (markerEnd < 0) {
      outputBuffer = recordSeparator + remainder;
      return;
    }

    outputBuffer = remainder.slice(markerEnd + 1);
    commandRunning.value = false;
    showPrompt();
  }
}

async function startBusybox() {
  try {
    runtimeError.value = '';
    status.value = 'loading';
    message.value = '正在加载本地 BusyBox WASI 引擎...';
    await nextTick();
    await ensureTerminal();

    const baseUrl = import.meta.env.BASE_URL || '/';
    const wasmRes = await fetch(`${baseUrl}runtime/busybox/busybox.wasm`);
    if (!wasmRes.ok) {
      throw new Error(`加载 busybox.wasm 失败: HTTP ${wasmRes.status}`);
    }
    const wasmBytes = await wasmRes.arrayBuffer();

    const cols = String(terminal?.cols || 80);
    const rows = String(terminal?.rows || 24);

    const { spawn } = await import('wasi-sh');

    session = await spawn({
      wasm: wasmBytes,
      workerUrl: new URL('./busybox.worker.ts', import.meta.url),
      env: {
        COLUMNS: cols,
        LINES: rows,
        TERM: 'xterm-256color',
        PATH: '/bin:/usr/bin',
        PS1: 'busybox:\\w\\$ ',
      },
    });

    session.onOutput(handleSessionOutput);

    if (terminalHost.value) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(() => {
        fitAddon?.fit();
        if (terminal && session) {
          session.resize(terminal.cols, terminal.rows);
        }
      });
      resizeObserver.observe(terminalHost.value);
    }

    status.value = 'running';
    message.value = 'BusyBox 纯本地 WASI 环境就绪。点击终端后可直接输入命令并按 Enter 执行。';
    terminal?.writeln('\x1b[38;5;244m输入命令并按 Enter 执行；支持 Backspace、Ctrl+C 和 Ctrl+L。\x1b[0m');
    showPrompt();
  } catch (err: any) {
    status.value = 'error';
    const detail = err?.stack || err?.message || String(err);
    runtimeError.value = detail;
    message.value = 'BusyBox 启动失败，详细信息已保留在上方。';
    terminal?.writeln(`\x1b[31m[错误] 启动失败: ${detail}\x1b[0m`);
  }
}

function runCommand(cmd: string, displayCommand = cmd) {
  if (!session || commandRunning.value) return;
  const command = cmd.replace(/[\r\n]+$/, '');
  inputLine = '';
  terminal?.write(`${displayCommand}\r\n`);
  executeCommand(command);
  terminal?.focus();
}

function runToolsHelp() {
  runCommand(
    `printf 'Available commands:\\n'; for cmd in cat ls stat touch mkdir rmdir rm cp mv find du mktemp grep sed awk sort uniq cut tr head tail wc seq paste fold tac expr hexdump xxd md5sum sha1sum sha256sum cksum crc32 date env printenv basename dirname realpath test printf getopt uname nproc stty; do command -v "$cmd" >/dev/null && printf '%s ' "$cmd"; done; printf '\\n'\n`,
    '# 支持工具集',
  );
}

function runSystemInfo() {
  runCommand(
    `printf 'Runtime: WASI sandbox\\nShell: %s\\nSystem: ' "$0"; uname -s; printf 'Architecture: '; uname -m; printf 'Working directory: '; pwd; printf 'Terminal: %s\\nPATH: %s\\n' "$TERM" "$PATH"\n`,
    '# 系统信息',
  );
}

function runPipeTest() {
  runCommand('echo "hello world" | tr a-z A-Z | sed "s/WORLD/BUSYBOX/g"\n');
}

function clearTerminal() {
  terminal?.clear();
}

async function restart() {
  status.value = 'idle';
  commandRunning.value = false;
  inputLine = '';
  outputBuffer = '';
  outputDecoder = new TextDecoder();
  terminal?.clear();
  if (session) {
    try { session.terminate(); } catch {}
    session = undefined;
  }
  startBusybox();
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (session) {
    try { session.terminate(); } catch {}
  }
  terminal?.dispose();
});
</script>

<style scoped>
.runtime-workbench {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.runtime-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.runtime-header p {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.runtime-header h2 {
  margin: 0.25rem 0 0;
  font-size: 1.15rem;
  border: none;
  padding: 0;
}

.runtime-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
}

.runtime-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
}

.runtime-status.running i {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.runtime-status.loading i {
  background: #3b82f6;
  animation: pulse 1s infinite;
}

.runtime-status.error i {
  background: #ef4444;
}

.runtime-launcher {
  padding: 1.5rem 1.25rem;
}

.runtime-facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.runtime-facts span {
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.runtime-facts small {
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
}

.runtime-facts strong {
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
}

.runtime-launcher p {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.runtime-launcher button {
  background: var(--vp-c-brand-1);
  color: #fff;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.runtime-launcher button:hover {
  background: var(--vp-c-brand-2);
}

.runtime-error {
  margin: 1rem 1.25rem 0;
  padding: 0.9rem 1rem;
  border: 1px solid color-mix(in srgb, #ef4444 45%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, #ef4444 10%, var(--vp-c-bg));
  color: var(--vp-c-text-1);
}

.runtime-error strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #dc2626;
}

.runtime-error pre {
  margin: 0;
  max-height: 16rem;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 0.78rem;
  line-height: 1.5;
  background: transparent;
}

.terminal-shell {
  display: flex;
  flex-direction: column;
}

.terminal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 1rem;
  background: var(--vp-c-bg);
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.75rem;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.terminal-toolbar span {
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-actions {
  display: flex;
  gap: 0.4rem;
}

.terminal-toolbar button {
  padding: 0.25rem 0.6rem;
  font-size: 0.72rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  transition: all 0.15s ease;
}

.terminal-toolbar button:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.terminal-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.terminal-host {
  padding: 0.75rem;
  height: 380px;
  background: #090d13;
  cursor: text;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
</style>
