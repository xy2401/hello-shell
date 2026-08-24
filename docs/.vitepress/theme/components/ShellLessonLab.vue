<template>
  <ClientOnly>
    <section id="shell-lesson-lab" class="lesson-lab" aria-label="本页可运行实验">
      <header class="lesson-header">
        <div>
          <p>LESSON LAB · 浏览器沙箱</p>
          <h2>脚本实验与输出对照</h2>
        </div>
        <span class="lesson-status" :class="effectiveStatus">{{ statusLabel }}</span>
      </header>

      <div class="lesson-controls">
        <label>
          <span>案例</span>
          <select v-model="currentCaseId" @change="selectCase(currentCaseId)">
            <option v-for="item in availableCases" :key="item.id" :value="item.id">{{ item.title }}</option>
          </select>
        </label>
        <label>
          <span>运行体</span>
          <select v-model="currentVariantId" @change="selectVariant(currentVariantId)">
            <option v-for="item in selectedCase?.variants" :key="item.id" :value="item.id">{{ item.label }}</option>
          </select>
        </label>
      </div>

      <p class="lesson-description">{{ selectedCase?.description }}</p>
      <p v-if="selectedVariant?.limitation" class="lesson-notice">{{ selectedVariant.limitation }}</p>

      <div class="editor-heading">
        <div>
          <strong>{{ selectedVariant?.sourceFileName }}</strong>
          <small>{{ routeLabel }}</small>
        </div>
        <div class="lesson-actions">
          <button type="button" :disabled="source === selectedVariant?.source || isBusy" @click="resetSource">恢复原始脚本</button>
          <button v-if="selectedVariant?.route === 'inline' && !isBusy" type="button" class="primary" @click="run">运行</button>
          <button v-if="isBusy" type="button" class="danger" @click="stop">停止</button>
          <a v-if="selectedVariant?.route === 'workbench' && workbenchUrl" class="primary link-button" :href="workbenchUrl">在完整工作台打开</a>
        </div>
      </div>

      <textarea
        v-model="source"
        class="lesson-editor"
        :readonly="selectedVariant?.route === 'snapshot'"
        :aria-label="`${selectedVariant?.label || ''} 实验脚本`"
        spellcheck="false"
      />

      <p class="lesson-message" role="status" aria-live="polite">{{ message }}</p>

      <div class="comparison-grid">
        <section class="output-column">
          <h3>实际结果</h3>
          <OutputPanel label="stdout" :value="actualStdout" empty-label="运行后显示标准输出" />
          <OutputPanel label="stderr" :value="actualStderr" empty-label="无标准错误" />
          <p class="exit-code"><span>退出码</span><strong>{{ result?.exitCode ?? '—' }}</strong><small v-if="result">{{ result.durationMs }} ms</small></p>
        </section>
        <section class="output-column expected">
          <h3>仓库预期快照</h3>
          <OutputPanel label="stdout" :value="selectedVariant?.expectedStdout || ''" empty-label="空" />
          <OutputPanel label="stderr" :value="selectedVariant?.expectedStderr || ''" empty-label="无标准错误" />
          <p class="exit-code"><span>退出码</span><strong>{{ selectedVariant?.expectedExitCode ?? '—' }}</strong><small>已归一化 CRLF</small></p>
        </section>
      </div>
    </section>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import {
  comparableLabText,
  getLabCase,
  type ComparisonStatus,
  type ExecutionResult,
  type LabCase,
  type LabVariant,
} from '../data/labCatalog'

const props = withDefaults(defineProps<{
  caseIds: string[]
  defaultVariant?: string
}>(), {
  defaultVariant: 'bash',
})

const OutputPanel = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    emptyLabel: { type: String, required: true },
  },
  setup(panelProps) {
    return () => h('div', { class: 'output-panel' }, [
      h('span', panelProps.label),
      h('pre', panelProps.value || panelProps.emptyLabel),
    ])
  },
})

type UiStatus = 'idle' | 'loading' | 'running' | ComparisonStatus
type WorkerResultMessage = {
  type: 'result'
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
  truncated?: boolean
}

const availableCases = computed<LabCase[]>(() => props.caseIds.map(getLabCase).filter((item): item is LabCase => Boolean(item)))
const currentCaseId = ref('')
const currentVariantId = ref('')
const source = ref('')
const status = ref<UiStatus>('idle')
const message = ref('选择案例后点击“运行”；解释器只在此时加载。')
const result = ref<ExecutionResult>()

let worker: Worker | undefined
let executionTimer: ReturnType<typeof setTimeout> | undefined

const selectedCase = computed(() => availableCases.value.find((item) => item.id === currentCaseId.value))
const selectedVariant = computed<LabVariant | undefined>(() => selectedCase.value?.variants.find((item) => item.id === currentVariantId.value))
const isBusy = computed(() => status.value === 'loading' || status.value === 'running')
const workbenchUrl = computed(() => selectedVariant.value?.workbenchHref ? withBase(selectedVariant.value.workbenchHref) : '')
const routeLabel = computed(() => {
  if (selectedVariant.value?.route === 'inline') return `页内执行 · ${selectedVariant.value.runtime}`
  if (selectedVariant.value?.route === 'workbench') return '完整工作台 · 不自动运行'
  return '仓库快照 · 只读'
})
const effectiveStatus = computed<UiStatus>(() => selectedVariant.value?.route === 'inline' ? status.value : 'unsupported')
const statusLabel = computed(() => ({
  idle: '待运行',
  loading: '加载运行时',
  running: '执行中',
  pass: '输出一致',
  difference: '发现差异',
  unsupported: selectedVariant.value?.route === 'workbench' ? '转到工作台' : '仅快照',
  error: '执行失败',
})[effectiveStatus.value])
const actualStdout = computed(() => {
  if (result.value) return result.value.stdout
  if (selectedVariant.value?.route === 'workbench') return '请在完整工作台载入并运行该案例。'
  if (selectedVariant.value?.route === 'snapshot') return '当前浏览器不提供此运行体。'
  return ''
})
const actualStderr = computed(() => result.value?.stderr || '')

function clearExecution() {
  if (executionTimer) clearTimeout(executionTimer)
  executionTimer = undefined
  worker?.terminate()
  worker = undefined
}

function resetResult() {
  clearExecution()
  result.value = undefined
  status.value = 'idle'
  message.value = selectedVariant.value?.route === 'inline'
    ? '点击“运行”后才会加载浏览器解释器。'
    : selectedVariant.value?.limitation || ''
}

function selectCase(caseId: string, requestedVariant?: string) {
  const nextCase = availableCases.value.find((item) => item.id === caseId) || availableCases.value[0]
  if (!nextCase) return
  currentCaseId.value = nextCase.id
  const nextVariant = nextCase.variants.find((item) => item.id === (requestedVariant || currentVariantId.value || props.defaultVariant))
    || nextCase.variants.find((item) => item.id === props.defaultVariant)
    || nextCase.variants[0]
  currentVariantId.value = nextVariant.id
  source.value = nextVariant.source
  resetResult()
}

function selectVariant(variantId: string) {
  const nextVariant = selectedCase.value?.variants.find((item) => item.id === variantId) || selectedCase.value?.variants[0]
  if (!nextVariant) return
  currentVariantId.value = nextVariant.id
  source.value = nextVariant.source
  resetResult()
}

function resetSource() {
  if (selectedVariant.value) source.value = selectedVariant.value.source
  resetResult()
}

function finishWithFailure(failureMessage: string, durationMs = 0) {
  clearExecution()
  status.value = 'error'
  result.value = {
    stdout: '',
    stderr: failureMessage,
    exitCode: 1,
    durationMs,
    status: 'error',
    message: failureMessage,
  }
  message.value = failureMessage
}

function handleWorkerMessage(event: MessageEvent) {
  const data = event.data
  if (data?.type === 'ready') {
    status.value = 'running'
    message.value = '正在执行脚本（最长 5 秒）…'
    worker?.postMessage({
      type: 'execute',
      source: source.value,
      sourceFileName: selectedVariant.value?.sourceFileName,
      fixtures: selectedVariant.value?.fixtures || {},
    })
    executionTimer = setTimeout(() => finishWithFailure('执行超过 5 秒，Worker 已终止。', 5000), 5000)
    return
  }
  if (data?.type === 'startup-failure') {
    finishWithFailure(`运行时加载失败：${data.message}`)
    return
  }
  if (data?.type === 'failure') {
    finishWithFailure(`脚本执行失败：${data.message}`, data.durationMs)
    return
  }
  if (data?.type !== 'result') return
  clearExecution()
  const payload = data as WorkerResultMessage
  const variant = selectedVariant.value
  if (!variant) return
  const matches = comparableLabText(payload.stdout) === comparableLabText(variant.expectedStdout)
    && comparableLabText(payload.stderr) === comparableLabText(variant.expectedStderr)
    && payload.exitCode === variant.expectedExitCode
  const comparisonStatus: ComparisonStatus = matches ? 'pass' : 'difference'
  result.value = {
    stdout: payload.stdout,
    stderr: payload.stderr,
    exitCode: payload.exitCode,
    durationMs: payload.durationMs,
    status: comparisonStatus,
    message: payload.truncated ? '输出超过 64 KiB，已截断。' : undefined,
  }
  status.value = comparisonStatus
  message.value = payload.truncated
    ? '执行完成，但输出超过 64 KiB，已截断。'
    : matches
      ? '实际 stdout、stderr 与退出码均和仓库快照一致。'
      : '执行完成；差异已保留，模拟器结果不会被伪装成通过。'
}

function run() {
  const variant = selectedVariant.value
  if (!variant || variant.route !== 'inline') return
  clearExecution()
  result.value = undefined
  status.value = 'loading'
  message.value = `正在加载 ${variant.runtime === 'just-bash' ? 'JUST-BASH' : 'Pyodide'}…`
  worker = variant.runtime === 'just-bash'
    ? new Worker(new URL('./bash-lab.worker.ts', import.meta.url), { type: 'module' })
    : new Worker(new URL('./python-lab.worker.ts', import.meta.url))
  worker.addEventListener('message', handleWorkerMessage)
  worker.addEventListener('error', (event) => finishWithFailure(`Worker 异常：${event.message || '未知错误'}`))
}

function stop() {
  clearExecution()
  status.value = 'error'
  result.value = {
    stdout: '',
    stderr: '用户已停止执行。',
    exitCode: 130,
    durationMs: 0,
    status: 'error',
  }
  message.value = '执行已停止，运行时状态已丢弃。'
}

function handleExternalLoad(event: Event) {
  const detail = (event as CustomEvent<{ caseId?: string; variant?: string }>).detail
  if (!detail?.caseId || !availableCases.value.some((item) => item.id === detail.caseId)) return
  selectCase(detail.caseId, detail.variant)
}

onMounted(() => {
  selectCase(props.caseIds[0], props.defaultVariant)
  window.addEventListener('shell-lesson:load', handleExternalLoad)
})

onBeforeUnmount(() => {
  window.removeEventListener('shell-lesson:load', handleExternalLoad)
  clearExecution()
})
</script>

<style scoped>
.lesson-lab {
  margin: 2rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  scroll-margin-top: 5rem;
}

.lesson-header,
.editor-heading,
.lesson-controls,
.lesson-actions,
.exit-code {
  display: flex;
  align-items: center;
}

.lesson-header {
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
}

.lesson-header p,
.lesson-header h2,
.lesson-description,
.lesson-notice,
.lesson-message,
.output-column h3,
.exit-code {
  margin: 0;
}

.lesson-header p {
  color: var(--vp-c-brand-1);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.lesson-header h2 {
  padding: 0;
  border: 0;
  font-size: 1.08rem;
}

.lesson-status {
  flex: none;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  font-weight: 700;
}

.lesson-status.pass { color: #15803d; background: color-mix(in srgb, #22c55e 15%, transparent); }
.lesson-status.difference { color: #b45309; background: color-mix(in srgb, #f59e0b 16%, transparent); }
.lesson-status.error { color: #b91c1c; background: color-mix(in srgb, #ef4444 15%, transparent); }
.lesson-status.loading,
.lesson-status.running { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }

.lesson-controls {
  gap: 1rem;
  padding: 1rem 1.2rem 0;
}

.lesson-controls label {
  flex: 1;
}

.lesson-controls span,
.editor-heading small {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
}

.lesson-controls select {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.lesson-description,
.lesson-notice,
.lesson-message {
  padding: 0.75rem 1.2rem;
  color: var(--vp-c-text-2);
  font-size: 0.86rem;
}

.lesson-notice {
  margin: 0 1.2rem;
  padding: 0.65rem 0.8rem;
  border-left: 3px solid #f59e0b;
  background: color-mix(in srgb, #f59e0b 9%, transparent);
}

.editor-heading {
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 1.2rem;
}

.editor-heading small {
  margin: 0.15rem 0 0;
}

.lesson-actions {
  justify-content: flex-end;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.lesson-actions button,
.link-button {
  padding: 0.42rem 0.7rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  text-decoration: none;
}

.lesson-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
.lesson-actions .primary { border-color: var(--vp-c-brand-1); color: #fff; background: var(--vp-c-brand-1); }
.lesson-actions .danger { border-color: #dc2626; color: #fff; background: #dc2626; }

.lesson-editor {
  display: block;
  width: calc(100% - 2.4rem);
  min-height: 18rem;
  margin: 0 1.2rem;
  padding: 0.85rem;
  resize: vertical;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: #e6edf3;
  background: #0d1117;
  font: 13px/1.55 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  tab-size: 2;
}

.lesson-editor[readonly] { color: #b8c0cc; }

.comparison-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  border-top: 1px solid var(--vp-c-divider);
}

.output-column {
  min-width: 0;
  padding: 1rem 1.2rem 1.2rem;
}

.output-column + .output-column { border-left: 1px solid var(--vp-c-divider); }
.output-column h3 { padding: 0 0 0.65rem; border: 0; font-size: 0.95rem; }

:deep(.output-panel) { margin-bottom: 0.75rem; }
:deep(.output-panel > span) { color: var(--vp-c-text-2); font: 0.72rem ui-monospace, monospace; }
:deep(.output-panel pre) {
  min-height: 4.6rem;
  max-height: 14rem;
  margin: 0.25rem 0 0;
  padding: 0.7rem;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #d1d5db;
  background: #111827;
  font-size: 0.78rem;
  line-height: 1.5;
}

.exit-code {
  gap: 0.6rem;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
}

.exit-code strong { color: var(--vp-c-text-1); font-family: ui-monospace, monospace; }
.exit-code small { margin-left: auto; }

@media (max-width: 720px) {
  .lesson-controls,
  .editor-heading { align-items: stretch; flex-direction: column; }
  .lesson-actions { justify-content: flex-start; }
  .comparison-grid { grid-template-columns: 1fr; }
  .output-column + .output-column { border-top: 1px solid var(--vp-c-divider); border-left: 0; }
  .lesson-editor { min-height: 15rem; }
}
</style>
