<template>
  <section class="matrix-viewer" aria-label="统一任务证据查看器">
    <div class="matrix-toolbar">
      <label>
        <span>任务</span>
        <select v-model="selectedTaskId">
          <option v-for="task in matrixTasks" :key="task.id" :value="task.id">
            {{ task.number }} · {{ task.name }}
          </option>
        </select>
      </label>
      <label>
        <span>Shell / 运行体</span>
        <select v-model="selectedRuntimeId">
          <option v-for="runtime in matrixRuntimes" :key="runtime.id" :value="runtime.id">
            {{ runtime.name }}
          </option>
        </select>
      </label>
    </div>

    <div class="matrix-summary">
      <div class="matrix-summary-main">
        <strong>任务 {{ variant.task.number }} · {{ variant.task.name }}</strong>
        <span>{{ variant.task.description }}</span>
      </div>
      <dl>
        <div>
          <dt>运行体</dt>
          <dd>{{ variant.runtime.name }}</dd>
        </div>
        <div>
          <dt>平台</dt>
          <dd>{{ variant.runtime.platform }}</dd>
        </div>
        <div>
          <dt>采集</dt>
          <dd>{{ variant.runtime.collection }}</dd>
        </div>
      </dl>
      <p><span>验证点</span>{{ variant.task.verification }}</p>
    </div>

    <div class="matrix-panels">
      <section class="matrix-panel input-panel">
        <h3 v-if="variant.inputs.length === 1" class="panel-title">脚本：{{ variant.sourceFile }}</h3>

        <div v-else class="input-tabs" role="tablist" aria-label="输入文件">
          <button
            v-for="input in variant.inputs"
            :key="input.id"
            type="button"
            role="tab"
            :aria-selected="activeInputId === input.id"
            :class="{ active: activeInputId === input.id }"
            @click="activeInputId = input.id"
          >
            {{ input.kind === 'source' ? `脚本：${input.name}` : `输入：${input.name}` }}
          </button>
        </div>

        <p class="input-description">{{ activeInput.description }}</p>

        <div class="matrix-code-block">
          <span class="code-language">{{ activeInputLanguage }}</span>
          <button
            type="button"
            class="code-copy"
            :aria-label="`复制 ${activeInput.name}`"
            @click="copyText(activeInput.content, 'input')"
          >
            {{ copiedTarget === 'input' ? '已复制' : '复制' }}
          </button>
          <div v-if="highlightedInput" class="highlighted-code" v-html="highlightedInput"></div>
          <pre v-else class="plain-code"><code>{{ activeInput.content }}</code></pre>
        </div>
      </section>

      <section class="matrix-panel output-panel">
        <h3 class="panel-title">输出：{{ variant.outputFile }}</h3>
        <div class="matrix-code-block">
          <span class="code-language">text</span>
          <button
            type="button"
            class="code-copy"
            :aria-label="`复制 ${variant.outputFile}`"
            @click="copyText(variant.output, 'output')"
          >
            {{ copiedTarget === 'output' ? '已复制' : '复制' }}
          </button>
          <div v-if="highlightedOutput" class="highlighted-code" v-html="highlightedOutput"></div>
          <pre v-else class="plain-code"><code>{{ variant.output }}</code></pre>
        </div>
      </section>
    </div>

    <p class="copy-status" aria-live="polite">{{ copyMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  getMatrixVariant,
  matrixRuntimes,
  matrixTasks,
  type MatrixRuntimeId,
} from '../data/matrixExperiments'

const selectedTaskId = ref(matrixTasks[0].id)
const selectedRuntimeId = ref<MatrixRuntimeId>('bash')
const activeInputId = ref('source')
const copiedTarget = ref<'input' | 'output' | null>(null)
const copyMessage = ref('')
const highlightedInput = ref('')
const highlightedOutput = ref('')
let copyTimer: ReturnType<typeof setTimeout> | undefined
let highlightSequence = 0

const variant = computed(() => getMatrixVariant(selectedTaskId.value, selectedRuntimeId.value))
const activeInput = computed(() => (
  variant.value.inputs.find((input) => input.id === activeInputId.value) ?? variant.value.inputs[0]
))
const activeInputLanguage = computed(() => {
  if (activeInput.value.kind === 'source') return variant.value.runtime.language
  return activeInput.value.path.endsWith('.csv') ? 'csv' : 'text'
})

watch([selectedTaskId, selectedRuntimeId], () => {
  activeInputId.value = 'source'
  copiedTarget.value = null
  copyMessage.value = ''
})

watch([activeInput, () => variant.value.output], () => {
  void refreshHighlights()
})

onMounted(() => {
  void refreshHighlights()
})

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
  highlightSequence += 1
})

async function refreshHighlights() {
  const sequence = ++highlightSequence
  highlightedInput.value = ''
  highlightedOutput.value = ''

  try {
    const { codeToHtml } = await import('shiki/bundle/web')
    const themes = { light: 'github-light', dark: 'github-dark' } as const
    const [inputHtml, outputHtml] = await Promise.all([
      codeToHtml(activeInput.value.content, { lang: activeInputLanguage.value as any, themes }),
      codeToHtml(variant.value.output, { lang: 'text', themes }),
    ])
    if (sequence !== highlightSequence) return
    highlightedInput.value = inputHtml
    highlightedOutput.value = outputHtml
  } catch {
    // 保留纯文本代码块；证据内容不因高亮加载失败而消失。
  }
}

async function copyText(value: string, target: 'input' | 'output') {
  if (!navigator.clipboard) {
    copyMessage.value = '当前浏览器不允许访问剪贴板。'
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    copiedTarget.value = target
    copyMessage.value = target === 'input' ? '输入内容已复制。' : '输出快照已复制。'
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedTarget.value = null
      copyMessage.value = ''
    }, 1800)
  } catch {
    copyMessage.value = '复制失败，请手动选择文本。'
  }
}
</script>

<style scoped>
.matrix-viewer {
  position: relative;
  margin: 1.25rem 0 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.matrix-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0.85rem;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
}

.matrix-toolbar label > span {
  display: block;
  margin-bottom: 0.28rem;
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-weight: 600;
}

.matrix-toolbar select {
  width: 100%;
  height: 2.25rem;
  padding: 0 0.65rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
  font-size: 0.85rem;
}

.matrix-toolbar select:focus-visible,
.matrix-viewer button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.matrix-summary {
  padding: 0.8rem 0.9rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.matrix-summary-main {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.matrix-summary-main strong {
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
}

.matrix-summary-main span,
.matrix-summary p {
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
}

.matrix-summary dl {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.1rem;
  margin: 0.65rem 0 0;
}

.matrix-summary dl div {
  display: flex;
  gap: 0.35rem;
  font-size: 0.76rem;
}

.matrix-summary dt {
  color: var(--vp-c-text-3);
}

.matrix-summary dd {
  margin: 0;
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.matrix-summary p {
  margin: 0.5rem 0 0;
}

.matrix-summary p span {
  margin-right: 0.4rem;
  color: var(--vp-c-text-3);
}

.matrix-panels {
  display: flex;
  flex-direction: column;
}

.matrix-panel {
  min-width: 0;
  background: var(--vp-c-bg);
}

.matrix-panel + .matrix-panel {
  border-top: 1px solid var(--vp-c-divider);
}

.panel-title {
  margin: 0;
  padding: 0.8rem 0.8rem 0.45rem;
  border: 0;
  color: var(--vp-c-text-1);
  font-size: 0.9rem;
}

.input-tabs {
  display: flex;
  gap: 0.25rem;
  margin: 0.75rem 0.75rem 0.55rem;
  overflow-x: auto;
}

.input-tabs button {
  flex: none;
  padding: 0.24rem 0.52rem;
  border: 1px solid transparent;
  border-radius: 5px;
  color: var(--vp-c-text-2);
  background: transparent;
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}

.input-tabs button:hover,
.input-tabs button.active {
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.input-tabs button.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.input-description {
  margin: 0 0.8rem 0.55rem;
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  line-height: 1.5;
}

.matrix-code-block {
  position: relative;
  margin: 0 0.75rem 0.85rem;
  overflow: hidden;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
}

.code-language {
  position: absolute;
  top: 0.65rem;
  left: 0.8rem;
  z-index: 1;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 0.68rem;
  line-height: 1;
}

.code-copy {
  position: absolute;
  top: 0.42rem;
  right: 0.5rem;
  z-index: 2;
  padding: 0.2rem 0.52rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  color: var(--vp-c-text-2);
  background: var(--vp-code-block-bg);
  font: inherit;
  font-size: 0.7rem;
  cursor: pointer;
}

.code-copy:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.plain-code,
.highlighted-code :deep(.shiki) {
  max-height: 32rem;
  margin: 0;
  padding: 2.3rem 0.85rem 0.9rem;
  overflow: auto;
  border-radius: 0;
  color: var(--vp-code-block-color, var(--vp-c-text-1));
  background: transparent !important;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  line-height: 1.55;
  tab-size: 2;
  white-space: pre;
}

.highlighted-code :deep(.shiki span) {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
  font-style: var(--shiki-light-font-style);
  font-weight: var(--shiki-light-font-weight);
  text-decoration: var(--shiki-light-text-decoration);
}

:global(.dark) .highlighted-code :deep(.shiki span) {
  color: var(--shiki-dark);
  background-color: var(--shiki-dark-bg);
  font-style: var(--shiki-dark-font-style);
  font-weight: var(--shiki-dark-font-weight);
  text-decoration: var(--shiki-dark-text-decoration);
}

.copy-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 760px) {
  .matrix-toolbar {
    grid-template-columns: 1fr;
  }

  .plain-code,
  .highlighted-code :deep(.shiki) {
    max-height: 22rem;
  }
}
</style>
