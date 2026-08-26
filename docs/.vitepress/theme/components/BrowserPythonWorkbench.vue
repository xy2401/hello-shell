<template>
  <ClientOnly>
    <section class="shell-workbench shell-workbench--python" aria-label="Pyodide 工作台">
      <header class="workbench-header">
        <div class="workbench-identity">
          <a href="https://pyodide.org/" target="_blank" rel="noopener noreferrer"><strong>Pyodide 0.26.4</strong></a>
          <span aria-hidden="true">·</span>
          <a href="https://www.python.org/" target="_blank" rel="noopener noreferrer">CPython 3.12</a>
        </div>
        <button type="button" class="workbench-status" :class="status" :disabled="status === 'loading'" @click="handleRuntimeAction">
          <i></i>{{ runtimeActionLabel }}
        </button>
      </header>

      <dl class="workbench-specs">
        <div><dt>解释器</dt><dd>CPython 3.12</dd></div>
        <div><dt>交互</dt><dd>Python REPL</dd></div>
        <div><dt>文件系统</dt><dd>Emscripten 内存</dd></div>
        <div><dt>加载</dt><dd>CDN · 按需</dd></div>
      </dl>

      <div v-if="runtimeError" class="workbench-error" role="alert" aria-live="assertive">
        <strong>启动异常</strong>
        <pre>{{ runtimeError }}</pre>
      </div>

      <div class="workbench-terminal">
        <div class="workbench-toolbar">
          <span class="workbench-toolbar-message"><strong>交互终端</strong>{{ message }}</span>
          <div class="workbench-controls">
            <WorkbenchExampleMenu :examples="examples" :disabled="status !== 'running'" :hint="controlHint" @select="runSnippet" />
            <button type="button" class="workbench-button" :disabled="status !== 'running'" @click="loadAllExperiments" title="将所有实验脚本和数据注入到虚拟文件系统中">加载实验</button>
            <span class="workbench-control-hint" :title="status === 'running' ? '清空终端显示' : controlHint">
              <button type="button" class="workbench-button" :disabled="status !== 'running'" @click="clearTerminal">清屏</button>
            </span>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'error'" class="workbench-idle">
          <div class="workbench-preview" aria-hidden="true"><span>&gt;&gt;&gt;</span><code>import sys; print(sys.version)</code></div>
          <p>{{ status === 'idle' ? '终端尚未加载。点击右上角“未启动 · 启动 Python”后即可输入代码。' : message }}</p>
        </div>
        <div v-show="status === 'loading' || status === 'running'" ref="terminalHost" class="workbench-terminal-host" />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useData } from 'vitepress';
import type { IDisposable, Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import { sourceModules, fixtureModules } from "../data/matrixExperiments";
import WorkbenchExampleMenu from './WorkbenchExampleMenu.vue';
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
let dataDisposable: IDisposable | undefined;

const runtimeActionLabel = computed(() => ({
  idle: '未启动 · 启动 Python',
  loading: '正在启动…',
  running: '运行中 · 重新启动',
  error: '启动失败 · 重试',
})[status.value]);

const controlHint = computed(() => status.value === 'running'
  ? '选择并运行 Python 示例'
  : status.value === 'loading' ? '正在启动 Pyodide，请稍候' : '未启动，请先启动 Python');

const examples = [
  { id: 'version', title: '系统与版本', summary: '查看 Python 与 WASM 平台信息', source: 'import sys, os; print(f"Python {sys.version.split()[0]} on {sys.platform}")' },
  { id: 'format', title: '变量格式化', summary: '使用 f-string 处理字符串和数字', source: 'name = "world"; score = 98.5; print(f"Hello, {name.upper()}! Score={score:.2f}")' },
  { id: 'data', title: '数据处理', summary: '汇总结构化列表中的数值', source: 'data = [{"id": 1, "val": 10}, {"id": 2, "val": 25}]; print("Total:", sum(x["val"] for x in data))' },
  { id: 'stdlib', title: '标准库', summary: '组合 JSON、正则和数学模块', source: 'import json, re, math; print(json.dumps({"match": bool(re.search(r"sh\\w+", "shell")), "root": math.sqrt(81)}))' },
  { id: 'demo', title: '执行文件脚本', summary: '运行我们刚刚注入的测试脚本', source: 'exec(open("/python/06_pipes_files.py").read())' },
] as const;

watch(isDark, () => applyTerminalTheme());

function applyTerminalTheme() {
  if (!terminal) return;
  terminal.options.theme = isDark.value
    ? {
        background: '#08111f', foreground: '#dce7f5', cursor: '#93c5fd', selectionBackground: '#1e3a8a',
        red: '#f87171', green: '#4ade80', yellow: '#facc15', blue: '#60a5fa', magenta: '#c084fc', cyan: '#22d3ee', white: '#cbd5e1', brightBlack: '#64748b', brightBlue: '#93c5fd', brightWhite: '#f8fafc',
      }
    : {
        background: '#f8fafc', foreground: '#243247', cursor: '#2563eb', selectionBackground: '#bfdbfe',
        red: '#dc2626', green: '#15803d', yellow: '#a16207', blue: '#2563eb', magenta: '#9333ea', cyan: '#0e7490', white: '#e2e8f0', brightBlack: '#64748b', brightBlue: '#3b82f6', brightWhite: '#f8fafc',
      };
}

async function handleRuntimeAction() {
  if (status.value === 'running') await restart();
  else await startPyodide();
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

    dataDisposable?.dispose();
    dataDisposable = terminal?.onData(async (data) => {
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

async function loadAllExperiments() {
  if (status.value !== 'running' || !pyodide || !terminal) return;

  try {
    const allModules = { ...sourceModules, ...fixtureModules };
    const files = Object.entries(allModules)
      .map(([key, content]) => {
        const match = key.match(/demos\/(.+)$/);
        return match ? { relPath: match[1], content } : undefined;
      })
      .filter((file): file is { relPath: string; content: string } => !!file);

    terminal.writeln(`\r\n\x1b[34m[加载实验]\x1b[0m 正在极速注入 ${files.length} 个实验素材至 Pyodide 虚拟文件系统...`);

    for (const { relPath, content } of files) {
      // Map shared/fixtures to /fixtures as expected by python scripts
      const targetPath = relPath.startsWith('shared/fixtures') 
        ? `/${relPath.replace('shared/fixtures', 'fixtures')}`
        : `/${relPath}`;
        
      const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
      if (dir) {
        const parts = dir.split('/');
        let currentPath = '';
        for (const part of parts) {
          if (!part) continue;
          currentPath += '/' + part;
          try {
            pyodide.FS.mkdir(currentPath);
          } catch (e: any) {
            // Ignore if directory exists
            if (e.code !== 'EEXIST') console.warn(e);
          }
        }
      }
      
      pyodide.FS.writeFile(targetPath, content);
    }

    terminal.writeln(`\x1b[32m✔\x1b[0m 成功载入所有素材。试试执行: \x1b[36mexec(open('/python/06_pipes_files.py').read())\x1b[0m`);
    printPrompt();
  } catch (err: any) {
    terminal.writeln(`\r\n\x1b[31m[错误]\x1b[0m 素材加载失败: ${err.message || String(err)}`);
    printPrompt();
  }
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
  dataDisposable?.dispose();
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
