<script setup lang="ts">
import { formatCount } from '~/utils/units'

export type ScaleBar = { id: string; label: string; value: number }

const props = defineProps<{
  /** Drawn on one scale from zero, so a small value stays a sliver beside a big one. */
  bars: readonly ScaleBar[]
  unit: string
  /** A level the bars are read against, such as the flow that closes the bridges. */
  line?: { value: number; label: string }
}>()

const max = Math.max(...props.bars.map((bar) => bar.value), props.line?.value ?? 0)
const share = (value: number) => `${((value / max) * 100).toFixed(2)}%`
const at = props.line ? share(props.line.value) : null
// Past the middle the label ends at the line, so it stays inside the column.
const lineEnds = props.line ? props.line.value / max > 0.5 : false
</script>

<template>
  <div class="scale" :style="at ? { '--at': at } : undefined">
    <p v-if="line" class="line-label" :class="{ 'is-end': lineEnds }">
      <strong>{{ formatCount(line.value) }} {{ unit }}</strong>
      <span>{{ line.label }}</span>
    </p>
    <ul class="bars">
      <li v-for="bar in bars" :key="bar.id" class="bar">
        <p class="label">
          {{ bar.label }}
          <strong>{{ formatCount(bar.value) }} {{ unit }}</strong>
        </p>
        <span class="track" :class="{ 'has-line': line }" aria-hidden="true">
          <span class="fill" :style="{ width: share(bar.value) }" />
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.scale {
  display: grid;
  gap: var(--space-2);
}
.bars {
  display: grid;
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.bar {
  display: grid;
  gap: var(--space-1);
}
.label {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--space-2);
  align-items: baseline;
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
}
.label strong {
  color: var(--on-deep);
  font-family: var(--font-display);
  font-size: 1.5em;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.track {
  position: relative;
  display: block;
  height: 1.25rem;
}
.fill {
  display: block;
  min-width: 2px;
  height: 100%;
  border-radius: 0 2px 2px 0;
  background: var(--accent);
}
.track.has-line::after {
  position: absolute;
  top: -0.25rem;
  bottom: -0.25rem;
  left: var(--at);
  border-left: 2px dotted var(--on-deep);
  content: '';
}
/* Two short lines, so the label fits beside the line on a phone. */
.line-label {
  display: grid;
  padding-left: var(--at);
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
  line-height: 1.3;
}
.line-label strong {
  color: var(--on-deep);
  font-family: var(--font-display);
  white-space: nowrap;
}
.line-label.is-end {
  padding-right: calc(100% - var(--at));
  padding-left: 0;
  text-align: right;
}
</style>
