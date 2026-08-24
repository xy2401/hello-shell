<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="JUST-BASH 工作台">
      <header class="runtime-header">
        <div class="runtime-identity">
          <a href="https://github.com/vercel-labs/just-bash" target="_blank" rel="noopener noreferrer"><strong>just-bash 3.4.2</strong></a>
          <span aria-hidden="true">·</span>
          <a href="https://xtermjs.org/" target="_blank" rel="noopener noreferrer">xterm.js</a>
        </div>
        <button
          type="button"
          class="runtime-status"
          :class="status"
          :disabled="status === 'loading'"
          @click="handleRuntimeAction"
        >
          <i></i>{{ runtimeActionLabel }}
        </button>
      </header>

      <dl class="runtime-specs">
        <div><dt>实现</dt><dd>TypeScript 解释器</dd></div>
        <div><dt>命令状态</dt><dd>每次回车独立</dd></div>
        <div><dt>文件状态</dt><dd>命令间保留</dd></div>
        <div><dt>加载</dt><dd>按需 · 约 460 KB</dd></div>
      </dl>

      <div class="terminal-shell">
        <div class="terminal-toolbar">
          <span><strong>交互终端</strong>{{ message }}</span>
          <div>
            <div
              class="example-menu"
              :class="{ open: exampleMenuOpen, available: status === 'running' && !commandBusy }"
              :title="exampleControlHint"
              @mouseleave="closeExampleMenu"
              @keydown.esc="closeExampleMenu"
            >
              <button
                type="button"
                aria-haspopup="menu"
                :aria-expanded="exampleMenuOpen"
                :class="{ busy: commandBusy }"
                :disabled="status !== 'running' || commandBusy"
                @click="toggleExampleMenu"
              >运行示例 <span aria-hidden="true">▾</span></button>
              <div class="example-options" role="menu">
                <button
                  v-for="example in examples"
                  :key="example.id"
                  type="button"
                  role="menuitem"
                  @click="runExample(example.source)"
                >
                  <strong>{{ example.title }}</strong>
                  <small>{{ example.summary }}</small>
                </button>
              </div>
            </div>
            <span class="control-hint" :title="clearControlHint">
              <button type="button" :disabled="status !== 'running'" @click="clearTerminal">清屏</button>
            </span>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'error'" class="terminal-idle">
          <div class="terminal-preview" aria-hidden="true">
            <span>browser-bash:/home/user$</span>
            <code>printf '%s\n' "hello from the browser"</code>
          </div>
          <p v-if="status === 'idle'">终端尚未加载。点击右上角“未启动 · 启动 Bash”后即可输入命令。</p>
          <p v-else>{{ message }}</p>
        </div>
        <div v-show="status === 'loading' || status === 'running'" ref="terminalHost" class="terminal-host" />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useData } from 'vitepress';
import type { IDisposable, Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type RuntimeStatus = 'idle' | 'loading' | 'running' | 'error';
type BashResult = { stdout: string; stderr: string; exitCode: number };
type BashEngine = { exec(source: string): Promise<BashResult> };

const { isDark } = useData();
const terminalHost = ref<HTMLElement>();
const status = ref<RuntimeStatus>('idle');
const message = ref('Bash 语法和 Unix 工具在浏览器内存沙箱中执行，不连接命令服务器。');
const commandBusy = ref(false);
const exampleMenuOpen = ref(false);

const examples = [
  {
    id: 'commands',
    title: '可用命令',
    summary: '多列列出当前运行时的全部命令',
    source: 'compgen -A command | sort -u | column',
  },
  {
    id: 'quoting',
    title: '变量与引号',
    summary: '观察带空格变量的安全展开',
    source: "name='Hello Shell'; printf 'name=<%s>\\n' \"$name\"",
  },
  {
    id: 'pipeline',
    title: '管道与过滤',
    summary: '组合 printf、grep 与 sort',
    source: "printf 'apple\\nbanana\\napricot\\n' | grep '^a' | sort",
  },
  {
    id: 'files',
    title: '文件与重定向',
    summary: '写入沙箱文件并读取统计',
    source: "printf 'alpha\\nbeta\\n' > sample.txt; wc -l sample.txt; cat sample.txt",
  },
  {
    id: 'control-flow',
    title: '条件与循环',
    summary: '在循环中判断并输出命中项',
    source: "for n in 1 2 3; do if [ \"$n\" -eq 2 ]; then printf 'hit=%s\\n' \"$n\"; fi; done",
  },
] as const;

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let bash: BashEngine | undefined;
let dataDisposable: IDisposable | undefined;
let resizeObserver: ResizeObserver | undefined;
let commandLine = '';

const runtimeActionLabel = computed(() => ({
  idle: '未启动 · 启动 Bash',
  loading: '正在启动…',
  running: '运行中 · 重新启动',
  error: '启动失败 · 重试',
})[status.value]);

const inactiveControlHint = computed(() => ({
  idle: '未启动，请先启动 Bash',
  loading: '正在启动 Bash，请稍候',
  running: '',
  error: '启动失败，请先点击右上角重试',
})[status.value]);

const exampleControlHint = computed(() => {
  if (status.value !== 'running') return inactiveControlHint.value;
  return commandBusy.value ? '命令执行中，请稍候' : '选择并运行示例';
});

const clearControlHint = computed(() => status.value === 'running' ? '清空终端显示' : inactiveControlHint.value);

watch(isDark, () => applyTerminalTheme());

async function handleRuntimeAction() {
  if (status.value === 'running') await restart();
  else await startBash();
}

async function startBash() {
  if (!terminalHost.value || status.value === 'loading' || status.value === 'running') return;
  status.value = 'loading';
  message.value = '正在加载 Bash 解释器和 Unix 工具集…';
  disposeRuntime();

  try {
    const [{ Terminal }, { FitAddon }, { Bash }] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('just-bash'),
    ]);
    bash = new Bash() as BashEngine;
    terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.25,
      scrollback: 3000,
      theme: terminalTheme(),
    });
    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalHost.value);
    await nextTick();
    fitAddon.fit();
    resizeObserver = new ResizeObserver(() => fitAddon?.fit());
    resizeObserver.observe(terminalHost.value);
    dataDisposable = terminal.onData(handleTerminalData);
    terminal.writeln('\x1b[1;36mHello Shell · Browser Bash\x1b[0m');
    terminal.writeln('TypeScript Bash interpreter · in-memory filesystem\r\n');
    status.value = 'running';
    message.value = 'Bash 命令在当前浏览器中执行';
    writePrompt();
    terminal.focus();
  } catch (error) {
    status.value = 'error';
    message.value = `Bash 启动失败：${messageOf(error)}`;
    terminal?.writeln(`\r\n\x1b[31m${message.value}\x1b[0m`);
  }
}

function handleTerminalData(data: string) {
  if (commandBusy.value) return;
  if (data === '\r') {
    terminal?.write('\r\n');
    const source = commandLine;
    commandLine = '';
    void executeCommand(source);
  } else if (data === '\u0003') {
    commandLine = '';
    terminal?.write('^C\r\n');
    writePrompt();
  } else if (data === '\u007f') {
    if (commandLine.length) {
      commandLine = commandLine.slice(0, -1);
      terminal?.write('\b \b');
    }
  } else if ([...data].every((char) => char >= ' ')) {
    commandLine += data;
    terminal?.write(data);
  }
}

async function executeCommand(source: string) {
  const command = source.trim();
  if (!command) return writePrompt();
  if (command === 'clear') {
    terminal?.clear();
    return writePrompt();
  }
  if (!bash) return;

  commandBusy.value = true;
  message.value = `正在执行：${command}`;
  try {
    const result = await bash.exec(command);
    writeOutput(result.stdout);
    writeOutput(result.stderr, true);
    if (result.exitCode !== 0) terminal?.writeln(`\x1b[33m[exit ${result.exitCode}]\x1b[0m`);
  } catch (error) {
    terminal?.writeln(`\x1b[31m${messageOf(error)}\x1b[0m`);
  } finally {
    commandBusy.value = false;
    message.value = 'Bash 命令在当前浏览器中执行';
    writePrompt();
    terminal?.focus();
  }
}

function writeOutput(output: string, error = false) {
  if (!output) return;
  const normalized = output.replace(/\r?\n/g, '\r\n').replace(/\r\n$/, '');
  terminal?.writeln(error ? `\x1b[31m${normalized}\x1b[0m` : normalized);
}

function writePrompt() { terminal?.write('\x1b[36mbrowser-bash:/home/user$\x1b[0m '); }

async function restart() {
  disposeRuntime();
  status.value = 'idle';
  await startBash();
}

function clearTerminal() { terminal?.clear(); terminal?.focus(); }

function closeExampleMenu() { exampleMenuOpen.value = false; }

function toggleExampleMenu() {
  if (status.value === 'running' && !commandBusy.value) exampleMenuOpen.value = !exampleMenuOpen.value;
}

async function runExample(source: string) {
  closeExampleMenu();
  terminal?.writeln(source);
  await executeCommand(source);
}

function applyTerminalTheme() { if (terminal) terminal.options.theme = terminalTheme(); }
function terminalTheme() {
  return isDark.value
    ? {
        background: '#08111f', foreground: '#dce7f5', cursor: '#67e8f9', selectionBackground: '#164e63',
        black: '#0f172a', red: '#f87171', green: '#4ade80', yellow: '#facc15', blue: '#60a5fa', magenta: '#c084fc', cyan: '#22d3ee', white: '#cbd5e1',
        brightBlack: '#64748b', brightRed: '#fca5a5', brightGreen: '#86efac', brightYellow: '#fde047', brightBlue: '#93c5fd', brightMagenta: '#d8b4fe', brightCyan: '#67e8f9', brightWhite: '#f8fafc',
      }
    : {
        background: '#f8fafc', foreground: '#243247', cursor: '#0891b2', selectionBackground: '#bae6fd',
        black: '#334155', red: '#dc2626', green: '#15803d', yellow: '#a16207', blue: '#2563eb', magenta: '#9333ea', cyan: '#0e7490', white: '#e2e8f0',
        brightBlack: '#64748b', brightRed: '#ef4444', brightGreen: '#16a34a', brightYellow: '#ca8a04', brightBlue: '#3b82f6', brightMagenta: '#a855f7', brightCyan: '#0891b2', brightWhite: '#f8fafc',
      };
}

function disposeRuntime() {
  dataDisposable?.dispose();
  dataDisposable = undefined;
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  terminal?.dispose();
  terminal = undefined;
  fitAddon = undefined;
  bash = undefined;
  commandLine = '';
  commandBusy.value = false;
  exampleMenuOpen.value = false;
  if (terminalHost.value) terminalHost.value.replaceChildren();
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : String(error); }
onBeforeUnmount(disposeRuntime);
</script>

<style scoped>
.runtime-workbench {
  margin: 1rem 0 2rem;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  box-shadow: 0 14px 36px rgb(15 23 42 / 8%);
}
:global(html:not(.dark)) {
  --bash-terminal-bg: #f8fafc;
  --bash-terminal-bg-soft: #eef3f8;
  --bash-terminal-panel: #fff;
  --bash-terminal-border: #cbd5e1;
  --bash-terminal-text: #475569;
  --bash-terminal-text-strong: #1e293b;
  --bash-terminal-muted: #64748b;
  --bash-terminal-accent: #0e7490;
  --bash-terminal-button-hover: #e2e8f0;
  --bash-terminal-menu-shadow: 0 16px 36px rgb(15 23 42 / 18%);
}
:global(html.dark) {
  --bash-terminal-bg: #08111f;
  --bash-terminal-bg-soft: #0d1728;
  --bash-terminal-panel: #182235;
  --bash-terminal-border: #344258;
  --bash-terminal-text: #8fa0b6;
  --bash-terminal-text-strong: #dbe5f2;
  --bash-terminal-muted: #8fa0b6;
  --bash-terminal-accent: #67e8f9;
  --bash-terminal-button-hover: #223149;
  --bash-terminal-menu-shadow: 0 16px 36px rgb(0 0 0 / 35%);
}
.runtime-header { display: flex; align-items: center; justify-content: space-between; gap: 1.2rem; padding: .68rem 1rem; background: linear-gradient(125deg, var(--vp-c-bg-soft), var(--vp-c-bg)); }
.runtime-identity { display: flex; min-width: 0; align-items: center; gap: .45rem; color: var(--vp-c-text-3); font-size: .72rem; white-space: nowrap; }
.runtime-identity a { color: var(--vp-c-text-2); font-weight: 650; text-decoration: none; }
.runtime-identity a:hover { color: var(--vp-c-brand-1); }
.runtime-identity strong { color: var(--vp-c-text-1); font-size: .78rem; }
.runtime-status { display: inline-flex; flex: 0 0 auto; align-items: center; gap: .42rem; border: 1px solid var(--vp-c-divider); border-radius: 999px; padding: .42rem .68rem; background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; font-size: .7rem; font-weight: 750; }
.runtime-status:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.runtime-status:disabled { cursor: wait; opacity: .75; }
.runtime-status i { width: .45rem; height: .45rem; border-radius: 50%; background: #94a3b8; }
.runtime-status.loading i { background: #f59e0b; }
.runtime-status.running i { background: #10b981; box-shadow: 0 0 0 4px rgb(16 185 129 / 14%); }
.runtime-status.error i { background: #ef4444; }
.runtime-specs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0; border-top: 1px solid var(--vp-c-divider); border-bottom: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.runtime-specs div { display: grid; grid-template-columns: auto 1fr; gap: .42rem; min-width: 0; padding: .58rem .72rem; border-right: 1px solid var(--vp-c-divider); }
.runtime-specs div:last-child { border-right: 0; }
.runtime-specs dt { color: var(--vp-c-text-3); font-size: .67rem; }
.runtime-specs dd { overflow: hidden; margin: 0; color: var(--vp-c-text-1); font-size: .69rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.terminal-shell { background: var(--bash-terminal-bg); }
.terminal-toolbar { display: flex; min-height: 2.8rem; align-items: center; justify-content: space-between; gap: .7rem; padding: .42rem .7rem; border-bottom: 1px solid var(--bash-terminal-border); background: var(--bash-terminal-bg-soft); color: var(--bash-terminal-text); font-size: .68rem; }
.terminal-toolbar > span { display: flex; align-items: baseline; gap: .55rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.terminal-toolbar strong { color: var(--bash-terminal-text-strong); font-size: .72rem; }
.terminal-toolbar > div { display: flex; gap: .35rem; }
.terminal-toolbar button { border: 1px solid var(--bash-terminal-border); border-radius: .42rem; padding: .35rem .58rem; background: var(--bash-terminal-panel); color: var(--bash-terminal-text-strong); cursor: pointer; font-size: .66rem; font-weight: 700; }
.terminal-toolbar button:not(:disabled):hover { background: var(--bash-terminal-button-hover); }
.terminal-toolbar button:disabled { cursor: not-allowed; opacity: .55; }
.terminal-toolbar button.busy:disabled { cursor: progress; }
.control-hint { display: inline-flex; }
.example-menu { position: relative; }
.example-menu > button span { margin-left: .18rem; color: var(--bash-terminal-muted); }
.example-options { position: absolute; z-index: 20; top: 100%; right: 0; display: grid; width: 15rem; overflow: hidden; border: 1px solid var(--bash-terminal-border); border-radius: .55rem; background: var(--bash-terminal-panel); box-shadow: var(--bash-terminal-menu-shadow); opacity: 0; pointer-events: none; transform: translateY(-.08rem); transition: opacity .12s ease, transform .12s ease, visibility .12s ease; visibility: hidden; }
.example-menu.available:hover .example-options, .example-menu.available:focus-within .example-options, .example-menu.open .example-options { opacity: 1; pointer-events: auto; transform: translateY(0); visibility: visible; }
.example-options button { position: relative; display: grid; gap: .12rem; border: 0; border-bottom: 1px solid var(--bash-terminal-border); border-radius: 0; padding: .62rem .72rem; text-align: left; }
.example-options button:last-child { border-bottom: 0; }
.example-options button:hover, .example-options button:focus-visible { background: var(--bash-terminal-button-hover); outline: none; }
.example-options strong { color: var(--bash-terminal-text-strong); font-size: .7rem; }
.example-options small { color: var(--bash-terminal-muted); font-size: .62rem; font-weight: 500; }
.terminal-host { box-sizing: border-box; height: 430px; padding: .65rem; }
.terminal-idle { display: grid; align-content: center; justify-items: center; min-height: 280px; padding: 2rem 1rem; background: radial-gradient(circle at 50% 0, var(--bash-terminal-bg-soft) 0, var(--bash-terminal-bg) 58%); color: var(--bash-terminal-text); text-align: center; }
.terminal-idle p { max-width: 33rem; margin: .9rem 0 0; font-size: .75rem; }
.terminal-preview { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: .78rem; }
.terminal-preview span { color: var(--bash-terminal-accent); }
.terminal-preview code { color: var(--bash-terminal-text-strong); }
@media (max-width: 640px) {
  .runtime-header { align-items: flex-start; flex-direction: column; }
  .runtime-status { align-self: stretch; justify-content: center; }
  .runtime-specs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .runtime-specs div:nth-child(2) { border-right: 0; }
  .runtime-specs div:nth-child(-n + 2) { border-bottom: 1px solid var(--vp-c-divider); }
  .terminal-toolbar { align-items: flex-start; flex-direction: column; }
  .terminal-host { height: 390px; }
}
</style>
