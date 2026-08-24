<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="Pyodide 工作台">
      <header class="runtime-header">
        <div>
          <p>PYODIDE · CPYTHON 3.12 · WEBASSEMBLY INTERACTIVE REPL</p>
          <h2>Pyodide 工作台</h2>
        </div>
        <span class="runtime-status" :class="status"><i></i>{{ statusLabel }}</span>
      </header>

      <div v-if="runtimeError" class="runtime-error" role="alert" aria-live="assertive">
        <strong>启动异常</strong>
        <pre>{{ runtimeError }}</pre>
      </div>

      <div v-if="status === 'idle' || status === 'error'" class="runtime-launcher">
        <div class="runtime-facts">
          <span><small>解释器</small><strong>CPython 3.12 官方 WASM</strong></span>
          <span><small>交互环境</small><strong>原生 &gt;&gt;&gt; 终端 REPL</strong></span>
          <span><small>标准库</small><strong>sys / os / json / re / math</strong></span>
        </div>
        <p>{{ message }}</p>
        <button type="button" @click="startPyodide">启动 Python 终端</button>
      </div>

      <div v-show="status === 'loading' || status === 'running'" class="terminal-shell">
        <div class="terminal-toolbar">
          <span>{{ message }}</span>
          <div class="toolbar-actions">
            <button type="button" :disabled="status !== 'running'" @click="runVersionSnippet">系统与版本</button>
            <button type="button" :disabled="status !== 'running'" @click="runTask02Snippet">任务02: 变量格式化</button>
            <button type="button" :disabled="status !== 'running'" @click="runTask06Snippet">任务06: 管道数据处理</button>
            <button type="button" @click="clearTerminal">清屏</button>
            <button type="button" :disabled="status === 'loading'" @click="restart">重置环境</button>
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
const message = ref('官方 CPython 3.12 解释器在浏览器本地执行，直接对照 Shell 语法。');
const runtimeError = ref('');

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let resizeObserver: ResizeObserver | undefined;
let pyodide: any | undefined;
let currentLine = '';
let history: string[] = [];
let historyIndex = -1;

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

function printPrompt() {
  terminal?.write('\r\n\x1b[32m>>> \x1b[0m');
  currentLine = '';
}

async function loadPyodideLoader(): Promise<any> {
  if (typeof (window as any).loadPyodide === 'function') {
    return (window as any).loadPyodide;
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="pyodide.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).loadPyodide));
      existing.addEventListener('error', (err) => reject(err));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.onload = () => resolve((window as any).loadPyodide);
    script.onerror = () => reject(new Error('无法加载 Pyodide CDN 脚本，请检查网络连接'));
    document.head.appendChild(script);
  });
}

async function startPyodide() {
  try {
    runtimeError.value = '';
    status.value = 'loading';
    message.value = '正在拉取 CPython 3.12 WebAssembly 官方模块...';
    await nextTick();
    await ensureTerminal();

    const loadPyodide = await loadPyodideLoader();
    
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    pyodide.setStdout({
      batched: (str: string) => {
        terminal?.writeln(str);
      },
    });

    pyodide.setStderr({
      batched: (str: string) => {
        terminal?.writeln(`\x1b[31m${str}\x1b[0m`);
      },
    });

    terminal?.writeln('\x1b[34mPython 3.12.7 (main) [Pyodide WASM / Emscripten]\x1b[0m');
    terminal?.writeln('Type "help", "copyright", "credits" or "license" for more information.');
    printPrompt();

    terminal?.onData(async (data) => {
      if (status.value !== 'running' || !pyodide) return;

      const code = data.charCodeAt(0);
      if (data === '\r') {
        terminal?.writeln('');
        const trimmed = currentLine.trim();
        if (trimmed) {
          history.push(trimmed);
          historyIndex = history.length;
          try {
            const res = await pyodide.runPythonAsync(trimmed);
            if (res !== undefined && res !== null) {
              terminal?.writeln(String(res));
            }
          } catch (err: any) {
            terminal?.writeln(`\x1b[31m${err.message || String(err)}\x1b[0m`);
          }
        }
        printPrompt();
      } else if (code === 127 || data === '\b') {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal?.write('\b \b');
        }
      } else if (data === '\x1b[A') {
        // Up arrow
        if (historyIndex > 0) {
          historyIndex--;
          replaceCurrentLine(history[historyIndex]);
        }
      } else if (data === '\x1b[B') {
        // Down arrow
        if (historyIndex < history.length - 1) {
          historyIndex++;
          replaceCurrentLine(history[historyIndex]);
        } else {
          historyIndex = history.length;
          replaceCurrentLine('');
        }
      } else if (code >= 32) {
        currentLine += data;
        terminal?.write(data);
      }
    });

    if (terminalHost.value) {
      resizeObserver = new ResizeObserver(() => fitAddon?.fit());
      resizeObserver.observe(terminalHost.value);
    }

    status.value = 'running';
    message.value = 'Python 3.12 交互式终端就绪。可直接输入 Python 语句，或点击上方预设按钮。';
  } catch (err: any) {
    status.value = 'error';
    const detail = err?.stack || err?.message || String(err);
    runtimeError.value = detail;
    message.value = 'Pyodide 启动失败，详细信息已保留在上方。';
    terminal?.writeln(`\x1b[31m[错误] 加载失败: ${detail}\x1b[0m`);
  }
}

function replaceCurrentLine(newLine: string) {
  if (!terminal) return;
  while (currentLine.length > 0) {
    terminal.write('\b \b');
    currentLine = currentLine.slice(0, -1);
  }
  currentLine = newLine;
  terminal.write(newLine);
}

async function runSnippet(snippet: string) {
  if (!pyodide || status.value !== 'running') return;
  terminal?.writeln(`\r\n\x1b[32m>>> \x1b[0m\x1b[36m${snippet}\x1b[0m`);
  history.push(snippet);
  historyIndex = history.length;
  try {
    const res = await pyodide.runPythonAsync(snippet);
    if (res !== undefined && res !== null) {
      terminal?.writeln(String(res));
    }
  } catch (err: any) {
    terminal?.writeln(`\x1b[31m${err.message || String(err)}\x1b[0m`);
  }
  printPrompt();
}

function runVersionSnippet() {
  runSnippet('import sys, os; print(f"Python {sys.version.split()[0]} on {sys.platform}")');
}

function runTask02Snippet() {
  runSnippet('name = "world"; score = 98.5; print(f"Hello, {name.upper()}! Score={score:.2f}")');
}

function runTask06Snippet() {
  runSnippet('import json; data = [{"id": 1, "val": 10}, {"id": 2, "val": 25}]; print("Total:", sum(x["val"] for x in data))');
}

function clearTerminal() {
  terminal?.clear();
  printPrompt();
}

async function restart() {
  status.value = 'idle';
  terminal?.clear();
  pyodide = undefined;
  startPyodide();
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
