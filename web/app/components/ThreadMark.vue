<script setup lang="ts">
import { messages } from '~/messages'
import { THREADS, type ThreadId } from '~/utils/threads'

defineProps<{ thread: ThreadId }>()
</script>

<template>
  <p class="thread-mark">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="THREADS[thread].glyph" /></svg>
    <span
      ><span class="sr-only">{{ messages.threads.mark }}</span
      >{{ messages.threads.names[thread] }}</span
    >
  </p>
</template>

<style scoped>
.thread-mark {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-2);
  color: var(--on-scene);
  font-family: var(--font);
  font-size: var(--text-meta);
  font-style: italic;
  line-height: 1.3;
}
svg {
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: var(--accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}
</style>
