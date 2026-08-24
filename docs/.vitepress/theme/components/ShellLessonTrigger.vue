<template>
  <button type="button" class="lesson-trigger" @click="loadCase">
    {{ label || '载入实验' }}
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  caseId: string
  variant?: string
  label?: string
}>()

function loadCase() {
  window.dispatchEvent(new CustomEvent('shell-lesson:load', {
    detail: { caseId: props.caseId, variant: props.variant },
  }))
  requestAnimationFrame(() => {
    document.getElementById('shell-lesson-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>

<style scoped>
.lesson-trigger {
  display: inline-flex;
  align-items: center;
  margin: 0.25rem 0.35rem 0.25rem 0;
  padding: 0.38rem 0.72rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 999px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.lesson-trigger:hover {
  color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}
</style>
