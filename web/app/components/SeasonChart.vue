<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { formatDegrees, formatSeasonDay } from '~/utils/format'
import { SEASON_DAYS, pointAt, type SeasonPoint } from '~/utils/season'

export type SeasonLine = {
  id: string
  label: string
  points: SeasonPoint[]
  /** The accent line is the season the beat is about; it draws on scroll and ends in its value. */
  tone: 'accent' | 'past'
}

/** A hand-drawn arrow from one point of the chart to another. */
export type SeasonArrow = {
  from: { day: number; value: number }
  to: { day: number; value: number }
  label: string
}

const props = defineProps<{
  normal: SeasonPoint[]
  normalLabel: string
  lines: SeasonLine[]
  /** A level drawn across the season. The normal brightens where it reaches it. */
  threshold?: { value: number; label: string }
  /** A bracket from the end of this line down to the normal, with its label. */
  gap?: { lineId: string; label: string }
  arrow?: SeasonArrow
  /** Ends the accent line with its season label only, for a beat whose number is elsewhere. */
  plainEnd?: boolean
  /** Names the slider for a screen reader. */
  scrubLabel: string
  tableCaption: string
}>()

// The first day of each month on the July–June axis.
const MONTH_DAYS = [0, 31, 62, 92, 123, 153, 184, 215, 243, 274, 304, 335]
const MONTHS = ['jul', 'ago', 'sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun']
const MARGIN = { top: 36, right: 72, bottom: 28, left: 36 }
const WEEK = 7

const root = ref<HTMLElement | null>(null)
const width = ref(1000)
const height = computed(() => Math.round(Math.min(520, Math.max(280, width.value * 0.52))))
const narrow = computed(() => width.value < 480)

const allValues = computed(() => [
  ...props.normal.map((point) => point.value),
  ...props.lines.flatMap((line) => line.points.map((point) => point.value)),
  ...(props.threshold ? [props.threshold.value] : []),
])
/** Whole-degree ticks: the smallest step that spans the values in four intervals or fewer. */
const scale = computed(() => {
  const values = allValues.value.length > 0 ? allValues.value : [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  for (const step of [1, 2, 3, 4, 5, 10]) {
    const low = Math.floor(min / step) * step
    const high = Math.ceil(max / step) * step
    if ((high - low) / step <= 4) {
      const ticks = Array.from(
        { length: (high - low) / step + 1 },
        (_, index) => low + index * step,
      )
      return { low, high: high === low ? low + step : high, ticks }
    }
  }
  return { low: Math.floor(min), high: Math.ceil(max), ticks: [] }
})

const x = (day: number) =>
  MARGIN.left + (day / (SEASON_DAYS - 1)) * (width.value - MARGIN.left - MARGIN.right)
const y = (value: number) =>
  MARGIN.top +
  ((scale.value.high - value) / (scale.value.high - scale.value.low)) *
    (height.value - MARGIN.top - MARGIN.bottom)
const path = (points: readonly SeasonPoint[]) =>
  points
    .map(
      (point, index) =>
        `${index ? 'L' : 'M'}${x(point.day).toFixed(1)} ${y(point.value).toFixed(1)}`,
    )
    .join('')

const months = computed(() =>
  MONTH_DAYS.flatMap((day, index) =>
    narrow.value && index % 2 ? [] : [{ day, label: MONTHS[index]!, left: x(day) }],
  ),
)
const normalPeak = computed(() =>
  props.normal.reduce<SeasonPoint | null>(
    (best, point) => (!best || point.value > best.value ? point : best),
    null,
  ),
)
const accent = computed(() => props.lines.find((line) => line.tone === 'accent') ?? null)
const accentEnd = computed(() => accent.value?.points.at(-1) ?? null)
/** The end value reads away from the nearer edge, so early in the season it clears the y ticks. */
const endAnchor = computed(() =>
  accentEnd.value && accentEnd.value.day < SEASON_DAYS / 2
    ? { x: x(accentEnd.value.day) - 6, anchor: 'start' as const }
    : { x: x(accentEnd.value?.day ?? 0) + 6, anchor: 'end' as const },
)
const pastEnds = computed(() =>
  props.lines.flatMap((line) => {
    const end = line.tone === 'past' ? line.points.at(-1) : undefined
    return end ? [{ id: line.id, label: line.label, end }] : []
  }),
)
const gapBracket = computed(() => {
  if (!props.gap) return null
  const end = props.lines.find((line) => line.id === props.gap!.lineId)?.points.at(-1)
  const normal = end ? pointAt(props.normal, end.day) : null
  if (!end || !normal) return null
  return {
    x: x(end.day) + 14,
    top: y(Math.max(end.value, normal.value)),
    bottom: y(Math.min(end.value, normal.value)),
    label: props.gap.label,
  }
})
// A 14px bold serif averages about 7.5px a character; the server has no text metrics.
const LABEL_CHAR = 7.5
const LABEL_HEIGHT = 14
/**
 * The threshold label sits just above or below its line at the first place no series
 * crosses, then higher above it on a narrow chart, so it stays clear as the season's line
 * grows. With no clear place it ends the line.
 */
const thresholdLabel = computed(() => {
  if (!props.threshold) return null
  const labelWidth = props.threshold.label.length * LABEL_CHAR
  const level = y(props.threshold.value)
  const points = [...props.normal, ...props.lines.flatMap((line) => line.points)].map((point) => ({
    x: x(point.day),
    y: y(point.value),
  }))
  const end = accentEnd.value ? { x: x(accentEnd.value.day), y: y(accentEnd.value.value) } : null
  const clear = (left: number, baseline: number) => {
    const box = {
      x0: left - 8,
      x1: left + labelWidth + 8,
      y0: baseline - LABEL_HEIGHT - 6,
      y1: baseline + 6,
    }
    const inside = (point: { x: number; y: number }, pad = 0) =>
      point.x >= box.x0 - pad &&
      point.x <= box.x1 + pad &&
      point.y >= box.y0 - pad &&
      point.y <= box.y1 + pad
    return !points.some((point) => inside(point)) && !(end && inside(end, 24))
  }
  const right = width.value - MARGIN.right - labelWidth
  const baselines = [level - 8, level + LABEL_HEIGHT + 6, level - 26, level - 44]
  for (const baseline of baselines) {
    for (let left = right; left >= MARGIN.left; left -= 12) {
      if (clear(left, baseline)) return { x: left, y: baseline }
    }
  }
  return { x: right, y: level - 8 }
})
/** A quadratic curve that bows above both ends, with its arrowhead at `to`. */
const arrowPath = computed(() => {
  if (!props.arrow) return null
  const from = { x: x(props.arrow.from.day), y: y(props.arrow.from.value) }
  const to = { x: x(props.arrow.to.day), y: y(props.arrow.to.value) }
  const lift = Math.max(40, Math.abs(to.x - from.x) * 0.3)
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - lift }
  const start = { x: from.x + Math.sign(to.x - from.x) * 10, y: from.y - 12 }
  const end = { x: to.x, y: to.y - 10 }
  const angle = Math.atan2(end.y - control.y, end.x - control.x)
  const head = (turn: number) =>
    `${(end.x - 10 * Math.cos(angle + turn)).toFixed(1)} ${(end.y - 10 * Math.sin(angle + turn)).toFixed(1)}`
  return {
    d: `M${start.x.toFixed(1)} ${start.y.toFixed(1)}Q${control.x.toFixed(1)} ${control.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
    head: `M${head(0.45)}L${end.x.toFixed(1)} ${end.y.toFixed(1)}L${head(-0.45)}`,
    label: { x: control.x, y: Math.min(from.y, to.y) - lift / 2 - 8 },
  }
})

// Scrub: one week per arrow key, or the pointer's position on the axis.
const scrubDay = ref<number | null>(null)
const scrubbing = computed(() => scrubDay.value !== null)
const lastDay = computed(() => accentEnd.value?.day ?? SEASON_DAYS - 1)
const series = computed(() => [
  { id: 'normal', label: props.normalLabel, points: props.normal, tone: 'normal' as const },
  ...props.lines,
])
const readout = computed(() => {
  if (scrubDay.value === null) return []
  return series.value.flatMap((line) => {
    const point = pointAt(line.points, scrubDay.value!)
    return point ? [{ id: line.id, tone: line.tone, label: line.label, point }] : []
  })
})
const valueText = computed(() => {
  const day = scrubDay.value ?? lastDay.value
  const values = series.value.flatMap((line) => {
    const point = pointAt(line.points, day)
    return point ? [`${line.label}, ${formatDegrees(point.value)} °C`] : []
  })
  return [formatSeasonDay(day), ...values].join('; ')
})
const clampDay = (day: number) => Math.min(SEASON_DAYS - 1, Math.max(0, day))
const dayAt = (event: PointerEvent) => {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio = (event.clientX - box.left - MARGIN.left) / (box.width - MARGIN.left - MARGIN.right)
  return clampDay(Math.round(ratio * (SEASON_DAYS - 1)))
}
const onPointer = (event: PointerEvent) => {
  scrubDay.value = dayAt(event)
}
const onLeave = () => {
  scrubDay.value = null
}
const onKey = (event: KeyboardEvent) => {
  const day = scrubDay.value ?? lastDay.value
  const next =
    event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? day + WEEK
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? day - WEEK
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? lastDay.value
            : null
  if (next === null) return
  event.preventDefault()
  scrubDay.value = clampDay(next)
}

// The table lists every week of the normal with each season's value that week.
const rows = computed(() =>
  props.normal.map((point) => ({
    day: point.day,
    label: formatSeasonDay(point.day),
    values: series.value.map((line) => pointAt(line.points, point.day)?.value ?? null),
  })),
)

// The accent line starts drawn, so the server HTML, a reader without JavaScript and a reader
// who asked for less motion all see the whole chart. Only a chart still below the fold redraws.
const drawn = ref(true)
let resize: ResizeObserver | undefined
let reveal: IntersectionObserver | undefined
onMounted(() => {
  const element = root.value
  if (!element) return
  width.value = element.clientWidth || width.value
  resize = new ResizeObserver(([entry]) => {
    if (entry) width.value = entry.contentRect.width
  })
  resize.observe(element)
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (still || element.getBoundingClientRect().top < window.innerHeight) return
  drawn.value = false
  reveal = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      drawn.value = true
      reveal?.disconnect()
    },
    { rootMargin: '0px 0px -25% 0px' },
  )
  reveal.observe(element)
})
onBeforeUnmount(() => {
  resize?.disconnect()
  reveal?.disconnect()
})

const clipId = `season-hot-${useId()}`
const tableId = `season-table-${useId()}`
</script>

<template>
  <div ref="root" class="season" :class="{ 'is-drawn': drawn, 'is-scrubbing': scrubbing }">
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <defs v-if="threshold">
        <clipPath :id="clipId">
          <rect x="0" y="0" :width="width" :height="y(threshold.value)" />
        </clipPath>
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
        <text v-for="month in months" :key="month.day" class="tick" :x="month.left" :y="height - 8">
          {{ month.label }}
        </text>
      </g>

      <path class="normal" :d="path(normal)" />
      <path
        v-if="threshold"
        class="normal normal--hot"
        :d="path(normal)"
        :clip-path="`url(#${clipId})`"
      />
      <text
        v-if="normalPeak"
        class="label label--normal"
        :x="x(normalPeak.day)"
        :y="y(normalPeak.value) + 32"
        text-anchor="middle"
      >
        {{ normalLabel }}
      </text>

      <g v-if="threshold" class="threshold">
        <line
          :x1="MARGIN.left"
          :x2="width - MARGIN.right"
          :y1="y(threshold.value)"
          :y2="y(threshold.value)"
        />
        <text v-if="thresholdLabel" class="label" :x="thresholdLabel.x" :y="thresholdLabel.y">
          {{ threshold.label }}
        </text>
      </g>

      <template v-for="line in lines" :key="line.id">
        <path
          class="line"
          :class="`line--${line.tone}`"
          :d="path(line.points)"
          :pathLength="line.tone === 'accent' ? 1 : undefined"
        />
      </template>
      <text
        v-for="end in pastEnds"
        :key="end.id"
        class="label label--past"
        :x="x(end.end.day) + 6"
        :y="y(end.end.value)"
        dy="0.32em"
      >
        {{ end.label }}
      </text>

      <g class="notes">
        <g v-if="gapBracket" class="gap">
          <path :d="`M${gapBracket.x - 5} ${gapBracket.top}h5V${gapBracket.bottom}h-5`" />
          <text
            class="label label--gap"
            :x="gapBracket.x + 8"
            :y="gapBracket.top + Math.max(12, (gapBracket.bottom - gapBracket.top) * 0.3)"
            dy="0.32em"
          >
            {{ gapBracket.label }}
          </text>
        </g>
        <g v-if="arrowPath && arrow" class="arrow">
          <path :d="arrowPath.d" />
          <path :d="arrowPath.head" />
          <text
            class="label label--hand"
            :x="arrowPath.label.x"
            :y="arrowPath.label.y"
            text-anchor="middle"
          >
            {{ arrow.label }}
          </text>
        </g>
      </g>

      <g v-if="accent && accentEnd" class="end">
        <circle :cx="x(accentEnd.day)" :cy="y(accentEnd.value)" r="5" />
        <text
          v-if="!plainEnd"
          class="end-value"
          :x="endAnchor.x"
          :y="y(accentEnd.value) - 30"
          :text-anchor="endAnchor.anchor"
        >
          {{ formatDegrees(accentEnd.value) }} °C
        </text>
        <text
          class="label label--accent"
          :x="endAnchor.x"
          :y="y(accentEnd.value) - 12"
          :text-anchor="endAnchor.anchor"
        >
          {{ accent.label }}
        </text>
      </g>

      <g v-if="scrubDay !== null" class="rule">
        <line
          :x1="x(scrubDay)"
          :x2="x(scrubDay)"
          :y1="MARGIN.top - 12"
          :y2="height - MARGIN.bottom"
        />
        <text class="rule-day" :x="x(scrubDay)" :y="MARGIN.top - 18" text-anchor="middle">
          {{ formatSeasonDay(scrubDay) }}
        </text>
        <g v-for="item in readout" :key="item.id">
          <circle
            :class="`dot--${item.tone}`"
            :cx="x(item.point.day)"
            :cy="y(item.point.value)"
            r="4"
          />
          <text
            class="readout"
            :x="x(item.point.day) + (x(scrubDay) > width * 0.75 ? -8 : 8)"
            :y="y(item.point.value)"
            dy="0.32em"
            :text-anchor="x(scrubDay) > width * 0.75 ? 'end' : 'start'"
          >
            {{ formatDegrees(item.point.value) }}
          </text>
        </g>
      </g>
    </svg>
    <div
      class="scrub"
      role="slider"
      tabindex="0"
      :aria-label="scrubLabel"
      :aria-describedby="tableId"
      aria-valuemin="0"
      :aria-valuemax="SEASON_DAYS - 1"
      :aria-valuenow="scrubDay ?? lastDay"
      :aria-valuetext="valueText"
      @pointerdown="onPointer"
      @pointermove="onPointer"
      @pointerleave="onLeave"
      @keydown="onKey"
      @blur="onLeave"
    />
    <table :id="tableId" class="sr-only">
      <caption>
        {{
          tableCaption
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">Semana</th>
          <th v-for="line in series" :key="line.id" scope="col">{{ line.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.day">
          <th scope="row">{{ row.label }}</th>
          <td v-for="(value, index) in row.values" :key="series[index]!.id">
            {{ value === null ? '—' : `${formatDegrees(value)} °C` }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.season {
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
.normal--hot {
  stroke: var(--on-deep);
}
.line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.line--past {
  stroke: var(--on-deep-muted);
  stroke-width: 1.5;
}
.line--accent {
  stroke: var(--accent);
  stroke-width: 3;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 1600ms cubic-bezier(0.4, 0, 0.2, 1);
}
.is-drawn .line--accent {
  stroke-dashoffset: 0;
}
.label {
  fill: var(--on-deep-muted);
  font-size: var(--text-meta);
  font-weight: 700;
  paint-order: stroke;
  stroke: var(--deep);
  stroke-width: 4px;
  stroke-linejoin: round;
}
.label--normal {
  font-style: italic;
  font-weight: 600;
}
.label--accent,
.label--gap {
  fill: var(--accent);
}
.label--gap {
  font-family: var(--font-display);
  font-size: var(--text-lead);
}
.threshold line {
  stroke: var(--on-deep);
  stroke-width: 2;
  stroke-dasharray: 1 6;
  stroke-linecap: round;
}
.threshold .label {
  fill: var(--on-deep);
}
.gap path,
.arrow path {
  fill: none;
  stroke: var(--on-deep);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.label--hand {
  fill: var(--on-deep);
  font-size: var(--text-body);
  font-style: italic;
  font-weight: 400;
}
.end circle {
  fill: var(--accent);
  stroke: var(--deep);
  stroke-width: 2;
}
.end-value {
  fill: var(--accent);
  font-family: var(--font-display);
  font-size: var(--text-title);
  font-weight: 800;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  paint-order: stroke;
  stroke: var(--deep);
  stroke-width: 6px;
  stroke-linejoin: round;
}
.notes,
.end {
  opacity: 0;
  transition: opacity 300ms ease-out 1400ms;
}
.is-drawn .notes,
.is-drawn .end {
  opacity: 1;
}
.is-scrubbing .notes,
.is-scrubbing .end text {
  opacity: 0.2;
  transition-delay: 0ms;
}
.rule line {
  stroke: var(--on-deep);
  stroke-width: 1;
}
.rule-day,
.readout {
  fill: var(--on-deep);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  paint-order: stroke;
  stroke: var(--deep);
  stroke-width: 4px;
}
.dot--normal {
  fill: var(--on-deep-muted);
}
.dot--past {
  fill: var(--on-deep-muted);
}
.dot--accent {
  fill: var(--accent);
}
.scrub {
  position: absolute;
  inset: 0 0 auto;
  height: 100%;
  cursor: crosshair;
  touch-action: pan-y;
}
.scrub:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 4px;
}
@media (max-width: 520px) {
  .end-value {
    font-size: var(--text-title-sm);
  }
  .label--hand {
    font-size: var(--text-meta);
  }
}
</style>
