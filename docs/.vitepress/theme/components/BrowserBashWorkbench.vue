<template>
  <ClientOnly>
    <section class="runtime-workbench" aria-label="浏览器 Bash 工作台">
      <header class="runtime-header">
        <div>
          <p>JUST-BASH 3.4.2 · XTERM.JS</p>
          <h2>浏览器 Bash 工作台</h2>
        </div>
        <span class="runtime-status" :class="status"><i />{{ statusLabel }}</span>
      </header>

      <div v-if="status === 'idle' || status === 'error'" class="runtime-launcher">
        <div class="runtime-facts">
          <span><small>执行位置</small><strong>当前浏览器</strong></span>
          <span><small>文件系统</small><strong>沙箱内存</strong></span>
          <span><small>首次下载</small><strong>约 460 KB（gzip）</strong></span>
        </div>
        <p>{{ message }}</p>
        <button type="button" @click="prepareAndStart">{{ startButtonLabel }}</button>
      </div>

      <div v-show="status === 'loading' || status === 'running'" class="terminal-shell">
        <div class="terminal-toolbar">
          <span>{{ message }}</span>
          <div>
            <button type="button" :disabled="status !== 'running' || commandBusy" @click="runExample">运行示例</button>
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

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let bash: BashEngine | undefined;
let dataDisposable: IDisposable | undefined;
let resizeObserver: ResizeObserver | undefined;
let commandLine = '';

const statusLabel = computed(() => ({ idle: '未启动', loading: '启动中', running: '运行中', error: '启动失败' })[status.value]);
const startButtonLabel = computed(() => '启动 Bash');

watch(isDark, () => applyTerminalTheme());

async function prepareAndStart() { await startBash(); }

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

async function runExample() {
  const source = "printf 'browser-bash=%s\\n' \"$(printf ready | tr a-z A-Z)\"";
  terminal?.writeln(source);
  await executeCommand(source);
}

function applyTerminalTheme() { if (terminal) terminal.options.theme = terminalTheme(); }
function terminalTheme() {
  return isDark.value
    ? { background: '#08111f', foreground: '#dce7f5', cursor: '#67e8f9', selectionBackground: '#164e63' }
    : { background: '#111827', foreground: '#e5edf7', cursor: '#5eead4', selectionBackground: '#155e75' };
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
  if (terminalHost.value) terminalHost.value.replaceChildren();
}

function messageOf(error: unknown) { return error instanceof Error ? error.message : String(error); }
onBeforeUnmount(disposeRuntime);
</script>

<style scoped>
.runtime-workbench { margin: 1.2rem 0 2rem; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg); box-shadow: 0 18px 45px rgb(15 23 42 / 10%); }
.runtime-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1rem; border-bottom: 1px solid var(--vp-c-divider); background: linear-gradient(125deg, var(--vp-c-bg-soft), var(--vp-c-bg)); }
.runtime-header p { margin: 0; color: var(--vp-c-brand-1); font-size: .65rem; font-weight: 800; letter-spacing: .08em; }
.runtime-header h2 { margin: .16rem 0 0; border: 0; padding: 0; font-size: 1rem; }
.runtime-status { display: inline-flex; align-items: center; gap: .42rem; border: 1px solid var(--vp-c-divider); border-radius: 999px; padding: .34rem .58rem; color: var(--vp-c-text-2); font-size: .68rem; font-weight: 700; }
.runtime-status i { width: .45rem; height: .45rem; border-radius: 50%; background: #94a3b8; }
.runtime-status.loading i { background: #f59e0b; }
.runtime-status.running i { background: #10b981; box-shadow: 0 0 0 4px rgb(16 185 129 / 14%); }
.runtime-status.error i { background: #ef4444; }
.runtime-launcher { display: grid; justify-items: start; gap: 1rem; padding: 1.2rem; }
.runtime-launcher p { margin: 0; color: var(--vp-c-text-2); }
.runtime-facts { display: grid; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }
.runtime-facts span { display: grid; gap: .2rem; border: 1px solid var(--vp-c-divider); border-radius: .65rem; padding: .7rem; background: var(--vp-c-bg-soft); }
.runtime-facts small { color: var(--vp-c-text-3); }
.runtime-launcher button, .terminal-toolbar button { border: 1px solid var(--vp-c-divider); border-radius: .48rem; padding: .45rem .72rem; background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; font-weight: 700; }
.runtime-launcher > button { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-1); color: white; }
.terminal-shell { background: #111827; }
.terminal-toolbar { display: flex; min-height: 2.7rem; align-items: center; justify-content: space-between; gap: .7rem; padding: .45rem .7rem; border-bottom: 1px solid #273449; color: #a8b5c7; font-size: .7rem; }
.terminal-toolbar > div { display: flex; gap: .35rem; }
.terminal-toolbar button { border-color: #344258; background: #182235; color: #dbe5f2; font-size: .67rem; }
.terminal-toolbar button:disabled { cursor: wait; opacity: .55; }
.terminal-host { box-sizing: border-box; height: 430px; padding: .65rem; }
@media (max-width: 640px) {
  .runtime-header { align-items: flex-start; }
  .runtime-facts { grid-template-columns: 1fr; }
  .terminal-toolbar { align-items: flex-start; flex-direction: column; }
  .terminal-host { height: 390px; }
}
</style>
