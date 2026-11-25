<script setup lang="ts">
import { useId } from 'vue'
import { formatCount, runs } from '~/utils/units'

export type UnitRow = {
  id: string
  /** The filled units. */
  count: number
  /** All the units drawn; the ones past `count` are empty. Defaults to `count`. */
  total?: number
  label: string
  /** The label of the empty units, with their number. */
  rest?: string
  /** A second count of the same thing, drawn lighter. */
  muted?: boolean
}

const props = withDefaults(
  defineProps<{
    shape: 'dot' | 'square'
    rows: readonly UnitRow[]
    /** What one unit stands for, said once above the grid. */
    unit: string
    cols?: number
  }>(),
  { cols: 40 },
)

// One unit is a 10×10 cell; the SVG scales, so the grid is the same with or without JS.
const CELL = 10
const id = useId()
const filledId = `units-filled-${id}`
const emptyId = `units-empty-${id}`

const layout = (row: UnitRow) => {
  const total = Math.max(row.total ?? row.count, row.count)
  return {
    ...row,
    total,
    height: Math.ceil(total / props.cols),
    filled: runs(0, row.count, props.cols),
    empty: runs(row.count, total, props.cols),
    left: total - row.count,
  }
}
const placed = props.rows.map(layout)
</script>

<template>
  <div class="units" :class="`units--${shape}`">
    <p class="unit">{{ unit }}</p>
    <div v-for="row in placed" :key="row.id" class="row" :class="{ 'is-muted': row.muted }">
      <p class="label">
        <strong>{{ formatCount(row.count) }}</strong> {{ row.label }}
      </p>
      <svg
        :viewBox="`0 0 ${cols * CELL} ${row.height * CELL}`"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
      >
        <defs>
          <pattern
            :id="`${filledId}-${row.id}`"
            :width="CELL"
            :height="CELL"
            patternUnits="userSpaceOnUse"
          >
            <circle v-if="shape === 'dot'" class="filled" cx="5" cy="5" r="3.6" />
            <rect v-else class="filled" x="1" y="1" width="8" height="8" rx="1" />
          </pattern>
          <pattern
            :id="`${emptyId}-${row.id}`"
            :width="CELL"
            :height="CELL"
            patternUnits="userSpaceOnUse"
          >
            <circle v-if="shape === 'dot'" class="empty" cx="5" cy="5" r="3.1" />
            <rect v-else class="empty" x="1.5" y="1.5" width="7" height="7" rx="1" />
          </pattern>
        </defs>
        <rect
          v-for="(run, index) in row.filled"
          :key="`f${index}`"
          :x="run.x * CELL"
          :y="run.y * CELL"
          :width="run.width * CELL"
          :height="run.height * CELL"
          :fill="`url(#${filledId}-${row.id})`"
        />
        <rect
          v-for="(run, index) in row.empty"
          :key="`e${index}`"
          :x="run.x * CELL"
          :y="run.y * CELL"
          :width="run.width * CELL"
          :height="run.height * CELL"
          :fill="`url(#${emptyId}-${row.id})`"
        />
      </svg>
      <p v-if="row.rest && row.left > 0" class="label label--rest">
        <strong>{{ formatCount(row.left) }}</strong> {{ row.rest }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.units {
  display: grid;
  gap: var(--space-4);
}
.row {
  display: grid;
  gap: var(--space-2);
}
.unit {
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
  font-style: italic;
}
.label {
  color: var(--on-deep);
  font-size: var(--text-meta);
  line-height: 1.35;
}
.label strong {
  font-family: var(--font-display);
  font-size: 1.5em;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
.filled {
  fill: var(--accent);
}
.empty {
  fill: none;
  stroke: var(--on-deep-muted);
  stroke-width: 1;
}
.is-muted .filled {
  fill: var(--on-deep-muted);
}
.is-muted .label {
  color: var(--on-deep-muted);
}
</style>
