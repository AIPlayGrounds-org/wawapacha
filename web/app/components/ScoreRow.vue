<script setup lang="ts">
import { messages } from '~/messages'
import type { MarkState } from '~/utils/score'

const props = defineProps<{
  title: string
  labels: readonly string[]
  /** One state per label. Without states the row only shows the frame, every mark empty. */
  states?: readonly MarkState[]
  /** Words that replace a mark's state word, such as where the page answers it. */
  notes?: readonly (string | null)[]
}>()

const stateAt = (index: number): MarkState => props.states?.[index] ?? 'empty'
const wordAt = (index: number) =>
  props.notes?.[index] ?? messages.story.score.states[stateAt(index)]
</script>

<template>
  <figure class="score">
    <figcaption>{{ title }}</figcaption>
    <ol>
      <li v-for="(label, index) in labels" :key="label" :class="`mark--${stateAt(index)}`">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect class="box" x="1" y="1" width="22" height="22" rx="2" />
          <rect
            v-if="stateAt(index) === 'filled'"
            class="fill"
            x="1"
            y="1"
            width="22"
            height="22"
            rx="2"
          />
          <rect v-if="stateAt(index) === 'half'" class="fill" x="1" y="1" width="11" height="22" />
          <text v-if="stateAt(index) === 'unknown'" x="12" y="17" text-anchor="middle">?</text>
        </svg>
        <span class="label"
          >{{ label }}<span v-if="states" class="state"> · {{ wordAt(index) }}</span></span
        >
      </li>
    </ol>
  </figure>
</template>

<style scoped>
.score {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}
figcaption {
  color: var(--on-deep);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 700;
}
ol {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 9rem));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: grid;
  gap: var(--space-2);
  align-content: start;
}
svg {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
}
.box {
  fill: none;
  stroke: var(--on-deep-muted);
  stroke-width: 1.5;
}
.fill {
  fill: var(--accent);
}
.mark--filled .box,
.mark--half .box {
  stroke: var(--accent);
}
.mark--pending .box {
  stroke-dasharray: 3 3;
}
text {
  fill: var(--on-deep);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}
.label {
  color: var(--on-deep);
  font-size: var(--text-label);
  line-height: 1.35;
}
.state {
  color: var(--on-deep-muted);
}
</style>
