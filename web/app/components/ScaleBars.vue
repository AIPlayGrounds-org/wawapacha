<script setup lang="ts">
import { formatCount } from '~/utils/units'

export type ScaleBar = { id: string; label: string; value: number }
export type ScaleLine = { value: number; label: string }

const props = withDefaults(
  defineProps<{
    /** Drawn on one scale from zero, so a small value stays a sliver beside a big one. */
    bars: readonly ScaleBar[]
    unit: string
    /** Levels the bars are read against, such as the flow that closes the bridges. */
    lines?: readonly ScaleLine[]
    format?: (value: number) => string
  }>(),
  { lines: () => [], format: formatCount },
)

const max = Math.max(
  ...props.bars.map((bar) => bar.value),
  ...props.lines.map((line) => line.value),
)
const share = (value: number) => `${((value / max) * 100).toFixed(2)}%`
// Each level's label sits on its own row, highest first, so near levels never collide.
// Past the middle a label ends at its line, so it stays inside the column.
const levels = [...props.lines]
  .sort((a, b) => b.value - a.value)
  .map((line) => ({ ...line, at: share(line.value), ends: line.value / max > 0.5 }))
</script>

<template>
  <div class="scale">
    <p
      v-for="level in levels"
      :key="level.value"
      class="line-label"
      :class="{ 'is-end': level.ends, 'is-row': levels.length > 1 }"
      :style="{ '--at': level.at }"
    >
      <strong>{{ format(level.value) }} {{ unit }}</strong>
      <span>{{ level.label }}</span>
    </p>
    <ul class="bars">
      <li v-for="bar in bars" :key="bar.id" class="bar">
        <p class="label">
          {{ bar.label }}
          <strong>{{ format(bar.value) }} {{ unit }}</strong>
        </p>
        <span class="track" aria-hidden="true">
          <span class="fill" :style="{ width: share(bar.value) }" />
          <span
            v-for="level in levels"
            :key="level.value"
            class="level"
            :style="{ left: level.at }"
          />
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
.level {
  position: absolute;
  top: -0.25rem;
  bottom: -0.25rem;
  border-left: 2px dotted var(--on-deep);
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
/* Several levels stack one row each, so each label keeps to one short line. */
.line-label.is-row {
  display: block;
}
.line-label.is-row span {
  margin-left: 0.4em;
}
.line-label.is-end {
  padding-right: calc(100% - var(--at));
  padding-left: 0;
  text-align: right;
}
</style>
