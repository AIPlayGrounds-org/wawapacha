<script setup lang="ts">
import { ref } from 'vue'
import { useReveal } from '~/composables/useReveal'
import { messages } from '~/messages'
import { THREADS } from '~/utils/threads'

const props = defineProps<{
  /** One row per drain mark: the year of its card and the drain words lifted from it. */
  rows: readonly { readonly year: string; readonly words: string }[]
}>()

const root = ref<HTMLElement | null>(null)
const placed = useReveal(root)
const label = messages.threads.column(props.rows[0]?.year ?? '', props.rows.at(-1)?.year ?? '')
</script>

<template>
  <ol ref="root" class="drain-column" :class="{ 'is-placed': placed }" :aria-label="label">
    <li v-for="(row, position) in rows" :key="row.year + row.words" :style="{ '--row': position }">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="THREADS.dren.glyph" /></svg>
      <span class="year">{{ row.year }}</span>
      <span class="words">«{{ row.words }}»</span>
    </li>
  </ol>
</template>

<style scoped>
.drain-column {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: grid;
  grid-template-columns: 1.5rem 3.5rem 1fr;
  align-items: baseline;
  gap: var(--space-3);
  color: var(--on-scene);
  transition:
    opacity 240ms ease-out calc(var(--row) * 120ms),
    translate 320ms cubic-bezier(0.2, 0.9, 0.3, 1) calc(var(--row) * 120ms);
}
/* The marks slide in from the margin, one after another, and stack into one column. */
.drain-column:not(.is-placed) li {
  opacity: 0;
  translate: -1.5rem 0;
}
svg {
  align-self: center;
  width: 1.5rem;
  height: 1.5rem;
  fill: none;
  stroke: var(--accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}
.year {
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.words {
  font-family: var(--font);
  font-size: var(--text-lead);
  font-style: italic;
  line-height: 1.3;
}
@media (prefers-reduced-motion: reduce) {
  li {
    transition: none;
  }
}
</style>
