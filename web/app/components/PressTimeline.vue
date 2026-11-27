<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { formatDay, formatDegrees } from '~/utils/format'
import type { PressMark } from '~/utils/palabra'
import { weekNearest, type SeasonWeek } from '~/utils/season'

const props = defineProps<{
  /** The weeks between `from` and `to`. */
  weeks: readonly SeasonWeek[]
  from: string
  to: string
  sstLabel: string
  normalLabel: string
  /** The words of the press and the forecaster, set above the line at their dates. */
  words: readonly PressMark[]
  /** The death counts, set below the line at their cut dates. */
  tolls?: readonly PressMark[]
  threshold?: { value: number; label: string }
  /** The week the chalk ring circles. */
  ring?: string
  /** Draws the chart up to this date; null draws all of it. */
  until: string | null
  tableCaption: string
}>()

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MARGIN = { top: 28, right: 16, bottom: 28, left: 36 }
// A bold 14px label averages about 8px a character; the server has no text metrics.
const LABEL_CHAR = 8
const ROW = 20

const root = ref<HTMLElement | null>(null)
const width = ref(1000)
const narrow = computed(() => width.value < 480)

const utc = (date: string) => Date.parse(`${date}T00:00:00Z`)
const start = utc(props.from)
const span = utc(props.to) - start
const x = (date: string) =>
  MARGIN.left + ((utc(date) - start) / span) * (width.value - MARGIN.left - MARGIN.right)

/**
 * Puts each label on the first row where it clears the one before, so close dates stack
 * instead of overlapping. Returns each label's row with the number of rows used.
 */
const stack = (marks: readonly PressMark[]) => {
  const ends: number[] = []
  const edge = width.value - MARGIN.right
  const placed = marks.map((mark) => {
    const labelWidth = mark.label.length * LABEL_CHAR + 12
    // A label that would run past the plot ends at its date instead of starting there.
    const end = x(mark.date) - 4 + labelWidth > edge
    const left = end ? x(mark.date) - labelWidth : x(mark.date) - 4
    let row = ends.findIndex((rowEnd) => rowEnd <= left)
    if (row === -1) row = ends.length
    ends[row] = left + labelWidth
    return {
      ...mark,
      row,
      left: x(mark.date),
      textX: end ? x(mark.date) + 4 : x(mark.date) - 4,
      anchor: end ? 'end' : 'start',
    }
  })
  return { placed, rows: ends.length }
}
const wordRows = computed(() => stack(props.words))
const tollRows = computed(() => stack(props.tolls ?? []))
const top = computed(() => MARGIN.top + wordRows.value.rows * ROW)
const plotHeight = computed(() => Math.round(Math.min(300, Math.max(150, width.value * 0.32))))
const bottom = computed(() => top.value + plotHeight.value)
const height = computed(() => bottom.value + tollRows.value.rows * ROW + MARGIN.bottom + 8)

const values = computed(() => [
  ...props.weeks.flatMap((week) => [week.sst, week.normal]),
  ...(props.threshold ? [props.threshold.value] : []),
])
const scale = computed(() => {
  const all = values.value.length > 0 ? values.value : [0, 1]
  const low = Math.floor(Math.min(...all))
  const high = Math.ceil(Math.max(...all))
  const step = high - low > 8 ? 4 : 2
  const ticks: number[] = []
  for (let tick = Math.ceil(low / step) * step; tick <= high; tick += step) ticks.push(tick)
  return { low, high: high === low ? low + 1 : high, ticks }
})
const y = (value: number) =>
  top.value + ((scale.value.high - value) / (scale.value.high - scale.value.low)) * plotHeight.value
const path = (key: 'sst' | 'normal') =>
  props.weeks
    .map(
      (week, index) => `${index ? 'L' : 'M'}${x(week.start).toFixed(1)} ${y(week[key]).toFixed(1)}`,
    )
    .join('')

const months = computed(() => {
  const first = new Date(start)
  const items: { date: string; label: string }[] = []
  for (
    let date = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
    date.getTime() <= utc(props.to);
    date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  ) {
    if (date.getTime() < start) continue
    if (narrow.value && date.getUTCMonth() % 2 && items.length > 0) continue
    items.push({ date: date.toISOString().slice(0, 10), label: MONTHS[date.getUTCMonth()]! })
  }
  return items
})

const weekAt = (date: string) => weekNearest(props.weeks, date)
const ringWeek = computed(() => (props.ring ? weekAt(props.ring) : null))
const shown = (date: string) => props.until === null || date <= props.until
const clipRight = computed(() =>
  props.until === null ? width.value : Math.min(width.value, x(props.until) + 2),
)

let resize: ResizeObserver | undefined
onMounted(() => {
  const element = root.value
  if (!element) return
  width.value = element.clientWidth || width.value
  resize = new ResizeObserver(([entry]) => {
    if (entry) width.value = entry.contentRect.width
  })
  resize.observe(element)
})
onBeforeUnmount(() => resize?.disconnect())

const id = useId()
const clipId = `press-clip-${id}`
const chalkId = `press-chalk-${id}`
</script>

<template>
  <div ref="root" class="press">
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <defs>
        <clipPath :id="clipId">
          <rect class="clip" x="0" y="0" :height="height" :style="{ width: `${clipRight}px` }" />
        </clipPath>
        <filter :id="chalkId">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feDisplacementMap in="SourceGraphic" scale="2.5" />
        </filter>
      </defs>

      <g class="axis">
        <g v-for="tick in scale.ticks" :key="tick">
          <line
            class="grid"
            :x1="MARGIN.left"
            :x2="width - MARGIN.right"
            :y1="y(tick)"
            :y2="y(tick)"
          />
          <text class="tick" :x="MARGIN.left - 8" :y="y(tick)" dy="0.32em" text-anchor="end">
            {{ tick }}°
          </text>
        </g>
        <text
          v-for="month in months"
          :key="month.date"
          class="tick"
          :x="x(month.date)"
          :y="height - 8"
        >
          {{ month.label }}
        </text>
      </g>

      <path class="normal" :d="path('normal')" />
      <g v-if="threshold" class="threshold">
        <line
          :x1="MARGIN.left"
          :x2="width - MARGIN.right"
          :y1="y(threshold.value)"
          :y2="y(threshold.value)"
        />
        <text class="label" :x="width - MARGIN.right" :y="y(threshold.value) - 8" text-anchor="end">
          {{ threshold.label }}
        </text>
      </g>

      <g :clip-path="`url(#${clipId})`">
        <path class="sst" :d="path('sst')" />
      </g>

      <g
        v-for="word in wordRows.placed"
        :key="word.id"
        class="word"
        :class="{ 'is-shown': shown(word.date) }"
      >
        <line
          :x1="word.left"
          :x2="word.left"
          :y1="MARGIN.top + word.row * ROW + 6"
          :y2="weekAt(word.date) ? y(weekAt(word.date)!.sst) - 6 : bottom"
        />
        <text :x="word.textX" :y="MARGIN.top + word.row * ROW" :text-anchor="word.anchor">
          {{ word.label }}
        </text>
      </g>

      <g
        v-for="toll in tollRows.placed"
        :key="toll.id"
        class="toll"
        :class="{ 'is-shown': shown(toll.date) }"
      >
        <line :x1="toll.left" :x2="toll.left" :y1="bottom - 12" :y2="bottom + toll.row * ROW + 8" />
        <text :x="toll.textX" :y="bottom + toll.row * ROW + 22" :text-anchor="toll.anchor">
          {{ toll.label }}
        </text>
      </g>

      <g
        v-if="ringWeek"
        class="ring"
        :class="{ 'is-shown': shown(ringWeek.start) }"
        :transform="`translate(${x(ringWeek.start) - 26} ${y(ringWeek.sst) - 26})`"
      >
        <path
          :filter="`url(#${chalkId})`"
          d="M9 35C6 19 21 6 37 8s23 15 19 30-22 22-35 18S5 41 11 26c3-7 9-12 16-14"
          transform="scale(0.82)"
        />
      </g>
    </svg>

    <div class="sr-only">
      <table>
        <caption>
          {{
            tableCaption
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col">{{ sstLabel }}</th>
            <th scope="col">{{ normalLabel }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in weeks" :key="week.start">
            <th scope="row">{{ formatDay(week.start) }}</th>
            <td>{{ formatDegrees(week.sst) }} °C</td>
            <td>{{ formatDegrees(week.normal) }} °C</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.press {
  position: relative;
  min-width: 0;
}
svg {
  display: block;
  overflow: visible;
  font-family: var(--font);
}
.grid {
  stroke: color-mix(in srgb, var(--on-deep-muted) 22%, transparent);
  stroke-width: 1;
}
.tick {
  fill: var(--on-deep-muted);
  font-size: var(--text-label);
  font-style: italic;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
.normal {
  fill: none;
  stroke: color-mix(in srgb, var(--on-deep-muted) 55%, transparent);
  stroke-width: 7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.sst {
  fill: none;
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.clip {
  transition: width 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
.threshold line {
  stroke: var(--on-deep);
  stroke-width: 2;
  stroke-dasharray: 1 6;
  stroke-linecap: round;
}
.label,
.word text,
.toll text {
  fill: var(--on-deep);
  font-size: var(--text-meta);
  font-weight: 700;
  paint-order: stroke;
  stroke: var(--deep);
  stroke-width: 4px;
  stroke-linejoin: round;
}
.word text {
  font-family: var(--font-display);
  font-style: italic;
}
.toll text {
  fill: var(--accent);
  font-family: var(--font-display);
  font-variant-numeric: tabular-nums;
}
.word line,
.toll line {
  stroke: var(--on-deep-muted);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}
.word,
.toll,
.ring {
  opacity: 0;
  transition: opacity 300ms ease-out;
}
.word.is-shown,
.toll.is-shown,
.ring.is-shown {
  opacity: 1;
}
.ring path {
  fill: none;
  stroke: var(--on-deep);
  stroke-width: 2.5;
  stroke-linecap: round;
}
@media (prefers-reduced-motion: reduce) {
  .clip,
  .word,
  .toll,
  .ring {
    transition: none;
  }
}
</style>
