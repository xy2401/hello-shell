<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="BusyBox 工作台">
      <header class="runtime-header">
        <div>
          <p>BUSYBOX · WASMER SDK · 1MB STANDALONE POSIX TOOLKIT</p>
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
          <span><small>工具集</small><strong>BusyBox 官方标准构建</strong></span>
          <span><small>体积</small><strong>约 1 MB WASI 单模块</strong></span>
          <span><small>默认 Shell</small><strong>ash (Almquist Shell)</strong></span>
        </div>
        <p>{{ message }}</p>
        <button type="button" @click="startBusybox">启动 BusyBox</button>
      </div>

      <div v-show="status === 'loading' || status === 'running'" class="terminal-shell">
        <div class="terminal-toolbar">
          <span>{{ message }}</span>
          <div class="toolbar-actions">
            <button type="button" :disabled="status !== 'running'" @click="runToolsHelp">支持工具集</button>
            <button type="button" :disabled="status !== 'running'" @click="runSystemInfo">系统指纹</button>
            <button type="button" :disabled="status !== 'running'" @click="runPipeTest">管道测试</button>
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
const message = ref('Wasmer SDK 官方预编译的 1MB 单体 BusyBox WASI 模块，内置 100+ 常用 POSIX 工具。');
const runtimeError = ref('');

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let stdinWriter: any | undefined;
let instance: any | undefined;

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
}

async function startBusybox() {
  try {
    runtimeError.value = '';
    status.value = 'loading';
    message.value = '正在加载 Wasmer 核心运行时...';
    await nextTick();
    await ensureTerminal();

    const baseUrl = import.meta.env.BASE_URL || '/';
    const { init, Wasmer } = await import('@wasmer/sdk');
    
    // 显式指定本地静态托管的 wasmer_js_bg.wasm 路径，彻底杜绝 CDN 404 / HTML 错误页导致的 magic number 校验异常
    await init(`${baseUrl}runtime/wasmer/wasmer_js_bg.wasm`);

    message.value = '正在拉取 busybox 预编译模块 (~1MB)...';
    const pkg = await Wasmer.fromRegistry('busybox/busybox');
    
    instance = await pkg.entrypoint.run({
      args: ['sh'],
    });

    stdinWriter = instance.stdin.getWriter();

    const textDecoder = new TextDecoder();

    instance.stdout.pipeTo(
      new WritableStream({
        write(chunk) {
          const text = typeof chunk === 'string' ? chunk : textDecoder.decode(chunk);
          terminal?.write(text);
        },
      })
    );

    instance.stderr.pipeTo(
      new WritableStream({
        write(chunk) {
          const text = typeof chunk === 'string' ? chunk : textDecoder.decode(chunk);
          terminal?.write(`\x1b[31m${text}\x1b[0m`);
        },
      })
    );

    terminal?.onData((data) => {
      stdinWriter?.write(data);
    });

    if (terminalHost.value) {
      resizeObserver = new ResizeObserver(() => fitAddon?.fit());
      resizeObserver.observe(terminalHost.value);
    }

    status.value = 'running';
    message.value = 'BusyBox 纯 WASI 环境就绪。可直接在终端中执行 ash 及常用 POSIX 命令。';
  } catch (err: any) {
    status.value = 'error';
    const detail = err?.stack || err?.message || String(err);
    runtimeError.value = detail;
    message.value = 'BusyBox 启动失败，详细信息已保留在上方。';
    terminal?.writeln(`\x1b[31m[错误] 启动失败: ${detail}\x1b[0m`);
  }
}

function runCommand(cmd: string) {
  if (stdinWriter) {
    stdinWriter.write(cmd);
  }
}

function runToolsHelp() {
  runCommand('busybox --help\n');
}

function runSystemInfo() {
  runCommand('uname -a && id\n');
}

function runPipeTest() {
  runCommand('echo "hello world" | tr a-z A-Z | sed "s/WORLD/BUSYBOX/g"\n');
}

function clearTerminal() {
  terminal?.clear();
}

async function restart() {
  status.value = 'idle';
  terminal?.clear();
  stdinWriter = undefined;
  instance = undefined;
  startBusybox();
}

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
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
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}
</style>
