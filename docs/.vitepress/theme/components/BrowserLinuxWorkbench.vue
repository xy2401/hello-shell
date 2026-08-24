<template>
  <ClientOnly>
    <section class="shell-workbench shell-workbench--linux" aria-label="V86 工作台">
      <header class="workbench-header">
        <div class="workbench-identity">
          <a href="https://copy.sh/v86/" target="_blank" rel="noopener noreferrer"><strong>v86 0.5.441</strong></a>
          <span aria-hidden="true">·</span>
          <a href="https://buildroot.org/" target="_blank" rel="noopener noreferrer">Buildroot Linux</a>
        </div>
        <button type="button" class="workbench-status" :class="status" :disabled="status === 'loading'" @click="handleRuntimeAction">
          <i></i>{{ runtimeActionLabel }}
        </button>
      </header>

      <dl class="workbench-specs">
        <div><dt>系统</dt><dd>真实 Linux 内核</dd></div>
        <div><dt>机器</dt><dd>x86 PC 模拟</dd></div>
        <div><dt>内存</dt><dd>64 MB</dd></div>
        <div><dt>加载</dt><dd>本地 · 约 13 MB</dd></div>
      </dl>

      <div class="workbench-terminal">
        <div class="workbench-toolbar">
          <span class="workbench-toolbar-message"><strong>串口终端</strong>{{ message }}</span>
          <div class="workbench-controls">
            <WorkbenchExampleMenu :examples="examples" :disabled="status !== 'running'" :hint="controlHint" @select="runExample" />
            <span class="workbench-control-hint" :title="status === 'running' || status === 'paused' ? '清空终端显示' : controlHint">
              <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="clearTerminal">清屏</button>
            </span>
            <button type="button" class="workbench-button" :disabled="status !== 'running' && status !== 'paused'" @click="toggleRun">{{ status === 'paused' ? '继续' : '暂停' }}</button>
          </div>
        </div>
        <div v-if="status === 'idle' || status === 'error'" class="workbench-idle">
          <div class="workbench-preview" aria-hidden="true"><span>~%</span><code>uname -a</code></div>
          <p>{{ status === 'idle' ? '虚拟机尚未加载。点击右上角“未启动 · 启动 Linux”后开始引导。' : message }}</p>
        </div>
        <div v-show="status === 'loading' || status === 'running' || status === 'paused'" ref="terminalHost" class="workbench-terminal-host" />
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useData } from 'vitepress';
import type { IDisposable, Terminal } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import type { V86 } from 'v86';
import WorkbenchExampleMenu from './WorkbenchExampleMenu.vue';
import '@xterm/xterm/css/xterm.css';

type RuntimeStatus = 'idle' | 'loading' | 'running' | 'paused' | 'error';

const { isDark } = useData();
const terminalHost = ref<HTMLElement>();
const status = ref<RuntimeStatus>('idle');
const message = ref('启动一台完全位于浏览器内的精简 x86 Linux 虚拟机。');

let terminal: Terminal | undefined;
let fitAddon: FitAddon | undefined;
let emulator: V86 | undefined;
let dataDisposable: IDisposable | undefined;
let resizeObserver: ResizeObserver | undefined;
let outputTail = '';
const decoder = new TextDecoder();

const runtimeActionLabel = computed(() => ({
  idle: '未启动 · 启动 Linux',
  loading: '正在启动…',
  running: '运行中 · 重新启动',
  paused: '已暂停 · 继续',
  error: '启动失败 · 重试',
})[status.value]);

const controlHint = computed(() => status.value === 'running'
  ? '选择并运行 Linux 示例'
  : status.value === 'loading' ? 'Linux 正在引导，请稍候' : status.value === 'paused' ? '虚拟机已暂停，请先继续' : '未启动，请先启动 Linux');

const examples = [
  { id: 'system', title: '系统信息', summary: '查看内核、架构和主机身份', source: 'uname -a' },
  { id: 'processes', title: '进程与内存', summary: '查看真实 Linux 进程和内存', source: 'ps; free' },
  { id: 'filesystem', title: '文件系统', summary: '查看当前目录和根目录内容', source: 'pwd; ls -la; df -h' },
  { id: 'commands', title: '可用命令', summary: '按六列列出 BusyBox applet', source: 'busybox --list | sort | xargs -n 6' },
] as const;

watch(isDark, () => applyTerminalTheme());

async function handleRuntimeAction() {
  if (status.value === 'paused') await toggleRun();
  else if (status.value === 'running') reboot();
  else await startLinux();
}

async function startLinux() {
  if (!terminalHost.value || status.value === 'loading' || status.value === 'running') return;
  status.value = 'loading';
  message.value = '正在加载 v86、BIOS 和 9.6 MB Buildroot Linux 镜像…';
  await disposeRuntime();

  try {
    const [{ Terminal }, { FitAddon }, { V86 }] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
      import('v86'),
    ]);

    terminal = new Terminal({
      cursorBlink: true,
      convertEol: false,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      scrollback: 5000,
      theme: terminalTheme(),
    });
    fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalHost.value);
    await nextTick();
    fitAddon.fit();
    terminal.writeln('\x1b[1;32mHello Shell · Browser Linux\x1b[0m');
    terminal.writeln('正在模拟 x86 PC 并启动真实 Linux 内核…\r\n');

    resizeObserver = new ResizeObserver(() => fitAddon?.fit());
    resizeObserver.observe(terminalHost.value);

    const asset = (name: string) => `${import.meta.env.BASE_URL}runtime/v86/${name}`;
    emulator = new V86({
      wasm_path: asset('v86.wasm'),
      memory_size: 64 * 1024 * 1024,
      vga_memory_size: 2 * 1024 * 1024,
      bios: { url: asset('seabios.bin') },
      vga_bios: { url: asset('vgabios.bin') },
      bzimage: { url: asset('buildroot-bzimage68.bin') },
      filesystem: {},
      cmdline: 'tsc=reliable mitigations=off random.trust_cpu=on',
      autostart: true,
      disable_keyboard: true,
      disable_mouse: true,
      disable_speaker: true,
    });

    emulator.add_listener('serial0-output-byte', handleSerialByte);
    emulator.add_listener('emulator-started', () => {
      message.value = 'Linux 内核正在启动，等待 Shell 提示符…';
    });
    dataDisposable = terminal.onData((data) => emulator?.serial0_send(data));
    terminal.focus();
  } catch (error) {
    status.value = 'error';
    message.value = `Linux 启动失败：${messageOf(error)}`;
    terminal?.writeln(`\r\n\x1b[31m${message.value}\x1b[0m`);
  }
}

function handleSerialByte(byte: number) {
  const text = decoder.decode(new Uint8Array([byte]), { stream: true });
  terminal?.write(text);
  outputTail = (outputTail + text).slice(-160);
  if (status.value === 'loading' && outputTail.includes('~% ')) {
    status.value = 'running';
    message.value = 'Buildroot Linux 正在当前浏览器中运行';
    terminal?.focus();
  }
}

async function toggleRun() {
  if (!emulator) return;
  if (status.value === 'paused') {
    await emulator.run();
    status.value = 'running';
    message.value = 'Buildroot Linux 正在当前浏览器中运行';
  } else {
    await emulator.stop();
    status.value = 'paused';
    message.value = '虚拟机已暂停';
  }
}

function reboot() {
  outputTail = '';
  status.value = 'loading';
  message.value = '正在重新启动 Linux…';
  emulator?.restart();
  terminal?.clear();
}

function clearTerminal() {
  terminal?.clear();
  terminal?.focus();
}

function runExample(source: string) {
  if (status.value !== 'running') return;
  emulator?.serial0_send(`${source}\n`);
  terminal?.focus();
}

function applyTerminalTheme() {
  if (terminal) terminal.options.theme = terminalTheme();
}

function terminalTheme() {
  return isDark.value
    ? {
        background: '#08111f', foreground: '#dce7f5', cursor: '#86efac', selectionBackground: '#14532d',
        red: '#f87171', green: '#4ade80', yellow: '#facc15', blue: '#60a5fa', magenta: '#c084fc', cyan: '#22d3ee', white: '#cbd5e1', brightBlack: '#64748b', brightGreen: '#86efac', brightWhite: '#f8fafc',
      }
    : {
        background: '#f8fafc', foreground: '#243247', cursor: '#16a34a', selectionBackground: '#bbf7d0',
        red: '#dc2626', green: '#15803d', yellow: '#a16207', blue: '#2563eb', magenta: '#9333ea', cyan: '#0e7490', white: '#e2e8f0', brightBlack: '#64748b', brightGreen: '#16a34a', brightWhite: '#f8fafc',
      };
}

async function disposeRuntime() {
  dataDisposable?.dispose();
  dataDisposable = undefined;
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (emulator) {
    emulator.remove_listener('serial0-output-byte', handleSerialByte);
    await emulator.destroy();
  }
  emulator = undefined;
  terminal?.dispose();
  terminal = undefined;
  fitAddon = undefined;
  outputTail = '';
  if (terminalHost.value) terminalHost.value.replaceChildren();
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

onBeforeUnmount(() => { void disposeRuntime(); });
</script>

<style scoped>
.runtime-workbench { margin: 1.2rem 0 2rem; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg); box-shadow: 0 18px 45px rgb(15 23 42 / 10%); }
.runtime-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1rem; border-bottom: 1px solid var(--vp-c-divider); background: linear-gradient(125deg, var(--vp-c-bg-soft), var(--vp-c-bg)); }
.runtime-header p { margin: 0; color: #16a34a; font-size: .65rem; font-weight: 800; letter-spacing: .08em; }
.runtime-header h2 { margin: .16rem 0 0; border: 0; padding: 0; font-size: 1rem; }
.runtime-status { display: inline-flex; align-items: center; gap: .42rem; border: 1px solid var(--vp-c-divider); border-radius: 999px; padding: .34rem .58rem; color: var(--vp-c-text-2); font-size: .68rem; font-weight: 700; }
.runtime-status i { width: .45rem; height: .45rem; border-radius: 50%; background: #94a3b8; }
.runtime-status.loading i { background: #f59e0b; }
.runtime-status.running i { background: #22c55e; box-shadow: 0 0 0 4px rgb(34 197 94 / 14%); }
.runtime-status.paused i { background: #f59e0b; }
.runtime-status.error i { background: #ef4444; }
.runtime-launcher { display: grid; justify-items: start; gap: 1rem; padding: 1.2rem; }
.runtime-launcher p { margin: 0; color: var(--vp-c-text-2); }
.runtime-facts { display: grid; width: 100%; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }
.runtime-facts span { display: grid; gap: .2rem; border: 1px solid var(--vp-c-divider); border-radius: .65rem; padding: .7rem; background: var(--vp-c-bg-soft); }
.runtime-facts small { color: var(--vp-c-text-3); }
.runtime-launcher button, .terminal-toolbar button { border: 1px solid var(--vp-c-divider); border-radius: .48rem; padding: .45rem .72rem; background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; font-weight: 700; }
.runtime-launcher > button { border-color: #16a34a; background: #16a34a; color: white; }
.terminal-shell { background: #0b1510; }
.terminal-toolbar { display: flex; min-height: 2.7rem; align-items: center; justify-content: space-between; gap: .7rem; padding: .45rem .7rem; border-bottom: 1px solid #244130; color: #a7c7b2; font-size: .7rem; }
.terminal-toolbar > div { display: flex; gap: .35rem; }
.terminal-toolbar button { border-color: #315441; background: #13251a; color: #dcfce7; font-size: .67rem; }
.terminal-toolbar button:disabled { cursor: wait; opacity: .55; }
.terminal-host { box-sizing: border-box; height: 460px; padding: .65rem; }
@media (max-width: 640px) {
  .runtime-header { align-items: flex-start; }
  .runtime-facts { grid-template-columns: 1fr; }
  .terminal-toolbar { align-items: flex-start; flex-direction: column; }
  .terminal-host { height: 400px; }
}
</style>
