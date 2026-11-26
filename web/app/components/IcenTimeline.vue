<script setup lang="ts">
import { computed } from 'vue'
import { ICEN_NEUTRAL } from '~/utils/icen'

export type TimelineMark = {
  id: string
  /** Month of the mark, as YYYY-MM. */
  start: string
  value: number
  label: string
}

const props = defineProps<{
  records: { start: string; icen: number }[]
  marks: TimelineMark[]
  /** Value drawn as a level line across the whole series, such as the latest month. */
  level: number | null
  /** Id of the mark to bring forward. Null shows every mark alike. */
  focus: string | null
  /** Names ENFEN's neutral band, drawn behind the series. */
  bandLabel?: string
}>()

const WIDTH = 1000
const HEIGHT = 400
const domain = computed(() => {
  const values = props.records.map((record) => record.icen)
  return {
    min: Math.floor(Math.min(...values, 0)),
    max: Math.ceil(Math.max(...values, 0)) + 1,
  }
})
const x = (index: number) => (index / Math.max(1, props.records.length - 1)) * WIDTH
const y = (value: number) =>
  ((domain.value.max - value) / (domain.value.max - domain.value.min)) * HEIGHT
const percent = (value: number, total: number) => `${(value / total) * 100}%`

const area = computed(() => {
  if (props.records.length === 0) return ''
  const line = props.records
    .map((record, index) => `L${x(index).toFixed(1)} ${y(record.icen).toFixed(1)}`)
    .join('')
  return `M0 ${y(0)}${line}L${WIDTH} ${y(0)}Z`
})
const placedMarks = computed(() =>
  props.marks.flatMap((mark) => {
    const index = props.records.findIndex((record) => record.start === mark.start)
    if (index < 0) return []
    return [
      {
        ...mark,
        left: percent(x(index), WIDTH),
        top: percent(y(mark.value), HEIGHT),
        edge: index > props.records.length * 0.94,
      },
    ]
  }),
)
const decades = computed(() =>
  props.records.flatMap((record, index) =>
    record.start.endsWith('0-01')
      ? [{ year: record.start.slice(0, 4), left: percent(x(index), WIDTH) }]
      : [],
  ),
)
</script>

<template>
  <div class="timeline" :class="{ 'timeline--focused': focus !== null }">
    <div class="plot">
      <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id="timeline-above">
            <rect x="0" y="0" :width="WIDTH" :height="y(0)" />
          </clipPath>
          <clipPath id="timeline-below">
            <rect x="0" :y="y(0)" :width="WIDTH" :height="HEIGHT - y(0)" />
          </clipPath>
        </defs>
        <rect
          class="band"
          x="0"
          :y="y(ICEN_NEUTRAL.high)"
          :width="WIDTH"
          :height="y(ICEN_NEUTRAL.low) - y(ICEN_NEUTRAL.high)"
        />
        <path class="area area--warm" :d="area" clip-path="url(#timeline-above)" />
        <path class="area area--cold" :d="area" clip-path="url(#timeline-below)" />
        <line class="zero" x1="0" :x2="WIDTH" :y1="y(0)" :y2="y(0)" />
        <line
          v-if="level !== null"
          class="level"
          x1="0"
          :x2="WIDTH"
          :y1="y(level)"
          :y2="y(level)"
        />
      </svg>
      <span
        v-if="bandLabel"
        class="band-label"
        :style="{ top: percent(y(ICEN_NEUTRAL.high), HEIGHT) }"
        aria-hidden="true"
        >{{ bandLabel }}</span
      >
      <span
        v-for="mark in placedMarks"
        :key="mark.id"
        class="mark"
        :class="{
          'mark--edge': mark.edge,
          'mark--focus': focus === mark.id,
          'mark--dim': focus !== null && focus !== mark.id,
        }"
        :style="{ left: mark.left, top: mark.top }"
      >
        <span class="mark-label">{{ mark.label }}</span>
      </span>
    </div>
    <div class="decades" aria-hidden="true">
      <span v-for="decade in decades" :key="decade.year" :style="{ left: decade.left }">{{
        decade.year
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  --cold-on-deep: var(--scene-cold-data, #6fa8dc);
  min-width: 0;
}
.plot {
  position: relative;
  aspect-ratio: var(--timeline-aspect, 16 / 6);
  min-height: 15rem;
  max-height: var(--timeline-max-height, 60vh);
  width: 100%;
}
svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.band {
  fill: color-mix(in srgb, var(--on-deep-muted) 16%, transparent);
}
.band-label {
  position: absolute;
  left: 0;
  padding: 2px 0 0 4px;
  color: var(--on-deep-muted);
  font-size: var(--text-label);
  font-style: italic;
  line-height: 1.2;
  text-shadow:
    0 0 4px var(--deep),
    0 0 2px var(--deep);
}
.area--warm {
  fill: var(--warm-on-deep);
}
.area--cold {
  fill: var(--cold-on-deep);
  opacity: 0.75;
}
line {
  vector-effect: non-scaling-stroke;
  stroke: var(--on-deep-muted);
  stroke-width: 1;
}
.level {
  stroke: var(--on-deep);
  stroke-dasharray: 1 5;
  stroke-linecap: round;
  stroke-width: 2;
}
.mark {
  position: absolute;
  width: 10px;
  height: 10px;
  margin: -5px 0 0 -5px;
  border: 2px solid var(--deep);
  border-radius: 50%;
  background: var(--on-deep);
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out;
}
.mark-label {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translateX(-50%);
  color: var(--on-deep);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 700;
  text-shadow:
    0 0 4px var(--deep),
    0 0 2px var(--deep);
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
  text-align: center;
  white-space: pre;
}
.mark--edge .mark-label {
  left: auto;
  right: -4px;
  transform: none;
  text-align: right;
}
.mark--dim {
  opacity: 0.3;
}
.mark--dim .mark-label {
  visibility: hidden;
}
.mark--focus {
  transform: scale(1.25);
  background: var(--warm-on-deep);
}
.decades {
  position: relative;
  height: 1.5rem;
  margin-top: var(--space-1);
  border-top: 1px solid color-mix(in srgb, var(--on-deep-muted) 40%, transparent);
  color: var(--on-deep-muted);
  font-size: var(--text-label);
  font-style: italic;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
}
.decades span {
  position: absolute;
  top: 4px;
  padding-left: 4px;
  border-left: 1px solid color-mix(in srgb, var(--on-deep-muted) 60%, transparent);
  line-height: 1.2;
}
@media (max-width: 520px) {
  .mark-label {
    font-size: var(--text-label);
  }
  .decades span:nth-child(even) {
    display: none;
  }
}
</style>
