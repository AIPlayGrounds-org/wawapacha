<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Weekly anomaly, oldest first, each dated YYYY-MM-DD. */
  weekly: { start: string; value: number }[]
  /** Monthly ICEN, oldest first, each dated YYYY-MM. */
  monthly: { start: string; value: number }[]
  weeklyLabel: string
  monthlyLabel: string
  zeroLabel: string
}>()

const WIDTH = 1000
const HEIGHT = 400
const DAY = 86_400_000

const time = (date: string) => Date.parse(date.length === 7 ? `${date}-15` : date)
const span = computed(() => {
  const first = props.weekly[0]
  const last = props.weekly.at(-1)
  return first && last ? { from: time(first.start), to: time(last.start) + 7 * DAY } : null
})
const domain = computed(() => {
  const values = [...props.weekly, ...props.monthly].map((point) => point.value)
  return { min: Math.floor(Math.min(...values, 0)), max: Math.ceil(Math.max(...values, 1)) + 1 }
})
const x = (date: string) =>
  span.value ? ((time(date) - span.value.from) / (span.value.to - span.value.from)) * WIDTH : 0
const y = (value: number) =>
  ((domain.value.max - value) / (domain.value.max - domain.value.min)) * HEIGHT
const path = (points: { start: string; value: number }[]) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${x(point.start).toFixed(1)} ${y(point.value).toFixed(1)}`,
    )
    .join('')
const visibleMonthly = computed(() =>
  span.value ? props.monthly.filter((point) => time(point.start) >= span.value!.from) : [],
)
const end = (points: { start: string; value: number }[]) => {
  const last = points.at(-1)
  return last
    ? { left: `${(x(last.start) / WIDTH) * 100}%`, top: `${(y(last.value) / HEIGHT) * 100}%` }
    : null
}
const weeklyEnd = computed(() => end(props.weekly))
const monthlyEnd = computed(() => end(visibleMonthly.value))
const gap = computed(() =>
  weeklyEnd.value && monthlyEnd.value
    ? { left: monthlyEnd.value.left, right: `calc(100% - ${weeklyEnd.value.left})` }
    : null,
)
const years = computed(() => {
  if (!span.value) return []
  const first = new Date(span.value.from).getUTCFullYear() + 1
  const last = new Date(span.value.to).getUTCFullYear()
  return Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => {
    const year = first + index
    return { year, left: `${(x(`${year}-01-01`) / WIDTH) * 100}%` }
  })
})
</script>

<template>
  <div class="lag">
    <div class="plot">
      <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
        <line class="zero" x1="0" :x2="WIDTH" :y1="y(0)" :y2="y(0)" />
        <path class="weekly" :d="path(weekly)" />
        <path class="monthly" :d="path(visibleMonthly)" />
      </svg>
      <span class="zero-label" :style="{ top: `${(y(0) / HEIGHT) * 100}%` }">{{ zeroLabel }}</span>
      <span v-if="gap" class="gap" :style="gap" aria-hidden="true" />
      <span v-if="monthlyEnd" class="dot dot--monthly" :style="monthlyEnd">
        <span class="dot-label">{{ monthlyLabel }}</span>
      </span>
      <span v-if="weeklyEnd" class="dot dot--weekly" :style="weeklyEnd">
        <span class="dot-label">{{ weeklyLabel }}</span>
      </span>
    </div>
    <div class="years" aria-hidden="true">
      <span v-for="item in years" :key="item.year" :style="{ left: item.left }">{{
        item.year
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.lag {
  min-width: 0;
}
.plot {
  position: relative;
  aspect-ratio: 16 / 8;
  min-height: 16rem;
  max-height: 60vh;
  width: 100%;
}
svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
path,
line {
  fill: none;
  vector-effect: non-scaling-stroke;
}
.zero {
  stroke: var(--on-deep-muted);
  stroke-width: 1;
}
.weekly {
  stroke: var(--on-deep-muted);
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.monthly {
  stroke: var(--warm-on-deep);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.zero-label {
  position: absolute;
  left: 0;
  transform: translateY(2px);
  color: var(--on-deep-muted);
  font-size: var(--text-label);
}
.gap {
  position: absolute;
  top: 0;
  bottom: 0;
  border-left: 1px dashed var(--warm-on-deep);
  background: repeating-linear-gradient(
    135deg,
    color-mix(in srgb, var(--warm-on-deep) 16%, transparent) 0 2px,
    transparent 2px 8px
  );
}
.dot {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border: 2px solid var(--deep);
  border-radius: 50%;
}
.dot--weekly {
  background: var(--on-deep);
}
.dot--monthly {
  background: var(--warm-on-deep);
}
.dot-label {
  position: absolute;
  right: -4px;
  width: max-content;
  max-width: 11rem;
  font-family: var(--font-hand);
  font-size: var(--text-lead);
  line-height: 1.1;
  text-align: right;
  white-space: pre-line;
}
.dot--weekly .dot-label {
  bottom: calc(100% + 6px);
  color: var(--on-deep);
}
.dot--monthly .dot-label {
  top: calc(100% + 6px);
  color: var(--warm-on-deep);
}
.years {
  position: relative;
  height: 1.5rem;
  margin-top: var(--space-1);
  border-top: 1px solid color-mix(in srgb, var(--on-deep-muted) 40%, transparent);
  color: var(--on-deep-muted);
  font-size: var(--text-label);
  font-variant-numeric: tabular-nums;
}
.years span {
  position: absolute;
  top: 4px;
  padding-left: 4px;
  border-left: 1px solid color-mix(in srgb, var(--on-deep-muted) 60%, transparent);
  line-height: 1.2;
}
@media (max-width: 520px) {
  .dot-label {
    font-size: var(--text-body);
    max-width: 8.5rem;
  }
}
</style>
