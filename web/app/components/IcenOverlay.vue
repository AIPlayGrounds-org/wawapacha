<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useChartFrame } from '~/composables/useChartFrame'
import { formatAnomaly } from '~/utils/enso'
import { formatMonth, formatMonthName } from '~/utils/format'
import { ICEN_NEUTRAL, alignEvent } from '~/utils/icen'

export type OverlaySeries = {
  id: string
  label: string
  /** The first month drawn, as YYYY-MM. Every series starts in the same calendar month. */
  from: string
  /** The month labelled as the event's peak, or null for none. */
  peak: string | null
  /** The accent series is the one the step is about; it draws on scroll. */
  tone: 'accent' | 'past'
}

/** A dot on one series' line with a serif italic note, such as a forecast made that month. */
export type OverlayPin = { seriesId: string; start: string; label: string }

const props = withDefaults(
  defineProps<{
    records: readonly { start: string; icen: number }[]
    series: readonly OverlaySeries[]
    months?: number
    pin?: OverlayPin
    bandLabel: string
    /** Names the slider for a screen reader. */
    scrubLabel: string
    tableCaption: string
  }>(),
  { months: 21, pin: undefined },
)

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const YEAR_ROW = 16

const root = ref<HTMLElement | null>(null)
const { width, drawn } = useChartFrame(root)
const narrow = computed(() => width.value < 480)
const margin = computed(() => ({
  top: 52,
  right: 16,
  bottom: 28 + YEAR_ROW * props.series.length,
  left: 36,
}))
const height = computed(() => Math.round(Math.min(420, Math.max(260, width.value * 0.46))))

const aligned = computed(() =>
  props.series.map((line) => ({
    ...line,
    months: alignEvent(props.records, line.from, props.months),
  })),
)
const values = computed(() =>
  aligned.value.flatMap((line) =>
    line.months.flatMap((month) => (month.icen === null ? [] : [month.icen])),
  ),
)
/** Whole-degree ticks from below the neutral band to above the highest month. */
const scale = computed(() => {
  const low = Math.floor(Math.min(ICEN_NEUTRAL.low, ...values.value))
  const high = Math.ceil(Math.max(ICEN_NEUTRAL.high, ...values.value))
  const step = high - low > 6 ? 2 : 1
  const ticks = Array.from(
    { length: Math.floor((high - low) / step) + 1 },
    (_, i) => low + i * step,
  )
  return { low, high, ticks }
})

const x = (index: number) =>
  margin.value.left +
  (index / Math.max(1, props.months - 1)) * (width.value - margin.value.left - margin.value.right)
const y = (value: number) =>
  margin.value.top +
  ((scale.value.high - value) / (scale.value.high - scale.value.low)) *
    (height.value - margin.value.top - margin.value.bottom)
const plotBottom = computed(() => height.value - margin.value.bottom)

/** A month with no record breaks the line instead of joining across the gap. */
const path = (months: readonly { index: number; icen: number | null }[]) => {
  let pen = 'M'
  return months
    .map((month) => {
      if (month.icen === null) {
        pen = 'M'
        return ''
      }
      const step = `${pen}${x(month.index).toFixed(1)} ${y(month.icen).toFixed(1)}`
      pen = 'L'
      return step
    })
    .join('')
}

const calendarMonth = (index: number) => {
  const first = Number(props.series[0]?.from.slice(5, 7) ?? 1)
  return ((first - 1 + index) % 12) + 1
}
const ticks = computed(() =>
  Array.from({ length: props.months }, (_, index) => index).flatMap((index) => {
    const month = calendarMonth(index)
    const every = narrow.value ? 6 : 3
    return (month - 1) % every === 0 ? [{ index, label: MONTHS[month - 1]! }] : []
  }),
)
/** Each series' years under the month ticks, at its first month and at each January. */
const yearRows = computed(() =>
  aligned.value.map((line, row) => ({
    id: line.id,
    tone: line.tone,
    y: plotBottom.value + 20 + YEAR_ROW * (row + 1),
    years: line.months.flatMap((month) =>
      month.index === 0 || month.start.endsWith('-01')
        ? [{ index: month.index, year: month.start.slice(0, 4) }]
        : [],
    ),
  })),
)
const monthsIn = (pixels: number) =>
  Math.ceil((pixels / (width.value - margin.value.left - margin.value.right)) * (props.months - 1))

type Box = { x0: number; x1: number; y0: number; y1: number }
/** Whether any line passes through a box, sampled every half month. */
const crossed = (box: Box) =>
  aligned.value.some((line) =>
    line.months.some((month, i) => {
      const next = line.months[i + 1]
      const points = [month.icen]
      if (next && month.icen !== null && next.icen !== null)
        points.push((month.icen + next.icen) / 2)
      return points.some((value, half) => {
        if (value === null) return false
        const px = x(month.index + half / 2)
        const py = y(value)
        return px >= box.x0 && px <= box.x1 && py >= box.y0 && py <= box.y1
      })
    }),
  )
const NOTE_GAP = 8
/**
 * A peak's two-line note, label over value, goes above its dot, then above to
 * the right, above to the left, then below: the first place no line crosses.
 * Text widths are estimated from the type sizes, not measured.
 */
const peaks = computed(() =>
  aligned.value.flatMap((line) => {
    const month = line.months.find((entry) => entry.start === line.peak)
    if (!month || month.icen === null) return []
    const cx = x(month.index)
    const dot = y(month.icen)
    const valueSize = narrow.value ? 16 : 20
    const noteWidth = Math.max(
      line.label.length * 14 * 0.6,
      formatAnomaly(month.icen).length * valueSize * 0.62,
    )
    const noteHeight = 14 + valueSize + 6
    const above = { y0: dot - NOTE_GAP - noteHeight, y1: dot - NOTE_GAP }
    const places = [
      { anchor: 'middle', x: cx, x0: cx - noteWidth / 2, x1: cx + noteWidth / 2, ...above },
      {
        anchor: 'start',
        x: cx + NOTE_GAP,
        x0: cx + NOTE_GAP,
        x1: cx + NOTE_GAP + noteWidth,
        ...above,
      },
      {
        anchor: 'end',
        x: cx - NOTE_GAP,
        x0: cx - NOTE_GAP - noteWidth,
        x1: cx - NOTE_GAP,
        ...above,
      },
      {
        anchor: 'middle',
        x: cx,
        x0: cx - noteWidth / 2,
        x1: cx + noteWidth / 2,
        y0: dot + NOTE_GAP,
        y1: dot + NOTE_GAP + noteHeight,
      },
    ] as const
    const place = places.find((candidate) => !crossed(candidate)) ?? places[0]
    return [
      {
        id: line.id,
        tone: line.tone,
        label: line.label,
        index: month.index,
        icen: month.icen,
        anchor: place.anchor,
        x: place.x,
        labelY: place.y0 + 12,
        valueY: place.y1 - 4,
        box: place as Box,
      },
    ]
  }),
)
const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
/** The band's name goes at the rightmost month where no line or peak note covers it. */
const bandLabelIndex = computed(() => {
  const middle = (y(ICEN_NEUTRAL.high) + y(ICEN_NEUTRAL.low)) / 2
  const labelBox = (end: number): Box => ({
    x0: x(end) - 64,
    x1: x(end),
    y0: middle - 10,
    y1: middle + 10,
  })
  for (let end = lastIndex.value; end >= monthsIn(64); end -= 1) {
    const box = labelBox(end)
    if (!crossed(box) && !peaks.value.some((peak) => overlaps(box, peak.box))) return end
  }
  return lastIndex.value
})
const pinPoint = computed(() => {
  if (!props.pin) return null
  const line = aligned.value.find((entry) => entry.id === props.pin!.seriesId)
  const month = line?.months.find((entry) => entry.start === props.pin!.start)
  if (!month || month.icen === null) return null
  const cx = x(month.index)
  const dot = y(month.icen)
  const size = narrow.value ? 14 : 16
  const noteWidth = props.pin!.label.length * size * 0.5
  /** Up and to the left of the ring, then straight above it, then down and to the right. */
  const places = [
    {
      anchor: 'end',
      x: cx - 10,
      x0: cx - 10 - noteWidth,
      x1: cx - 10,
      y0: dot - 10 - size,
      y1: dot - 6,
    },
    {
      anchor: 'middle',
      x: cx,
      x0: cx - noteWidth / 2,
      x1: cx + noteWidth / 2,
      y0: dot - 14 - size,
      y1: dot - 10,
    },
    {
      anchor: 'start',
      x: cx + 10,
      x0: cx + 10,
      x1: cx + 10 + noteWidth,
      y0: dot + 8,
      y1: dot + 12 + size,
    },
  ] as const
  const free = (box: Box) =>
    box.x0 >= margin.value.left &&
    box.x1 <= width.value - margin.value.right &&
    !crossed(box) &&
    !peaks.value.some((peak) => overlaps(box, peak.box))
  const place = places.find(free) ?? places[0]
  return { index: month.index, icen: month.icen, anchor: place.anchor, x: place.x, y: place.y1 - 4 }
})

// Scrub: one month per arrow key, or the pointer's position on the axis.
const scrubIndex = ref<number | null>(null)
const lastIndex = computed(() => props.months - 1)
const readout = computed(() => {
  if (scrubIndex.value === null) return []
  return aligned.value.flatMap((line) => {
    const month = line.months[scrubIndex.value!]
    return month && month.icen !== null
      ? [{ id: line.id, tone: line.tone, index: month.index, icen: month.icen }]
      : []
  })
})
const describe = (index: number) =>
  aligned.value.flatMap((line) => {
    const month = line.months[index]
    return month && month.icen !== null
      ? [`${line.label}, ${formatMonth(month.start)}, ${formatAnomaly(month.icen)} °C`]
      : []
  })
const valueText = computed(() => {
  const index = scrubIndex.value ?? lastIndex.value
  return [formatMonthName(calendarMonth(index)), ...describe(index)].join('; ')
})
const clampIndex = (index: number) => Math.min(lastIndex.value, Math.max(0, index))
const onPointer = (event: PointerEvent) => {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const ratio =
    (event.clientX - box.left - margin.value.left) /
    (box.width - margin.value.left - margin.value.right)
  scrubIndex.value = clampIndex(Math.round(ratio * lastIndex.value))
}
const onLeave = () => {
  scrubIndex.value = null
}
const onKey = (event: KeyboardEvent) => {
  const index = scrubIndex.value ?? lastIndex.value
  const next =
    event.key === 'ArrowRight' || event.key === 'ArrowUp'
      ? index + 1
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
        ? index - 1
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? lastIndex.value
            : null
  if (next === null) return
  event.preventDefault()
  scrubIndex.value = clampIndex(next)
}

const rows = computed(() =>
  Array.from({ length: props.months }, (_, index) => ({
    index,
    values: aligned.value.map((line) => line.months[index]!),
  })),
)

const tableId = `overlay-table-${useId()}`
</script>

<template>
  <div
    ref="root"
    class="overlay"
    :class="{ 'is-drawn': drawn, 'is-scrubbing': scrubIndex !== null }"
  >
    <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" aria-hidden="true">
      <g class="band">
        <rect
          :x="margin.left"
          :y="y(ICEN_NEUTRAL.high)"
          :width="width - margin.left - margin.right"
          :height="y(ICEN_NEUTRAL.low) - y(ICEN_NEUTRAL.high)"
        />
        <text
          :x="x(bandLabelIndex) - 6"
          :y="(y(ICEN_NEUTRAL.high) + y(ICEN_NEUTRAL.low)) / 2"
          dy="0.32em"
          text-anchor="end"
        >
          {{ bandLabel }}
        </text>
      </g>
      <g class="axis">
        <g v-for="tick in scale.ticks" :key="tick">
          <line
            class="grid"
            :class="{ 'grid--zero': tick === 0 }"
            :x1="margin.left"
            :x2="width - margin.right"
            :y1="y(tick)"
            :y2="y(tick)"
          />
          <text class="tick" :x="margin.left - 8" :y="y(tick)" dy="0.32em" text-anchor="end">
            {{ tick > 0 ? `+${tick}` : tick < 0 ? `−${-tick}` : tick }}°
          </text>
        </g>
        <text
          v-for="tick in ticks"
          :key="tick.index"
          class="tick"
          :x="x(tick.index)"
          :y="plotBottom + 18"
          text-anchor="middle"
        >
          {{ tick.label }}
        </text>
        <g v-for="row in yearRows" :key="row.id" :class="`years years--${row.tone}`">
          <text v-for="year in row.years" :key="year.index" :x="x(year.index)" :y="row.y">
            {{ year.year }}
          </text>
        </g>
      </g>

      <path
        v-for="line in aligned"
        :key="line.id"
        class="line"
        :class="`line--${line.tone}`"
        :d="path(line.months)"
        :pathLength="line.tone === 'accent' ? 1 : undefined"
      />

      <g class="notes">
        <g v-for="peak in peaks" :key="peak.id" :class="`peak peak--${peak.tone}`">
          <circle :cx="x(peak.index)" :cy="y(peak.icen)" r="4" />
          <text class="peak-value" :x="peak.x" :y="peak.valueY" :text-anchor="peak.anchor">
            {{ formatAnomaly(peak.icen) }}
          </text>
          <text class="peak-label" :x="peak.x" :y="peak.labelY" :text-anchor="peak.anchor">
            {{ peak.label }}
          </text>
        </g>
        <g v-if="pin && pinPoint" class="pin">
          <circle :cx="x(pinPoint.index)" :cy="y(pinPoint.icen)" r="5" />
          <text :x="pinPoint.x" :y="pinPoint.y" :text-anchor="pinPoint.anchor">
            {{ pin.label }}
          </text>
        </g>
      </g>

      <g v-if="scrubIndex !== null" class="rule">
        <line :x1="x(scrubIndex)" :x2="x(scrubIndex)" :y1="margin.top - 12" :y2="plotBottom" />
        <text class="rule-month" :x="x(scrubIndex)" :y="margin.top - 18" text-anchor="middle">
          {{ formatMonthName(calendarMonth(scrubIndex)) }}
        </text>
        <g v-for="item in readout" :key="item.id">
          <circle :class="`dot--${item.tone}`" :cx="x(item.index)" :cy="y(item.icen)" r="4" />
          <text
            class="readout"
            :x="x(item.index) + (x(scrubIndex) > width * 0.75 ? -8 : 8)"
            :y="y(item.icen)"
            dy="0.32em"
            :text-anchor="x(scrubIndex) > width * 0.75 ? 'end' : 'start'"
          >
            {{ formatAnomaly(item.icen) }}
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
      :aria-valuemax="lastIndex"
      :aria-valuenow="scrubIndex ?? lastIndex"
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
          <th v-for="line in aligned" :key="line.id" scope="col">{{ line.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.index">
          <td v-for="(month, index) in row.values" :key="aligned[index]!.id">
            {{ formatMonth(month.start) }}:
            {{ month.icen === null ? '—' : `${formatAnomaly(month.icen)} °C` }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.overlay {
  position: relative;
  min-width: 0;
}
svg {
  display: block;
  overflow: visible;
  font-family: var(--font);
}
.band rect {
  fill: color-mix(in srgb, var(--on-deep-muted) 16%, transparent);
}
.band text {
  fill: var(--on-deep-muted);
  font-size: var(--text-meta);
  font-style: italic;
}
.grid {
  stroke: color-mix(in srgb, var(--on-deep-muted) 22%, transparent);
  stroke-width: 1;
}
.grid--zero {
  stroke: color-mix(in srgb, var(--on-deep-muted) 55%, transparent);
}
.tick,
.years text {
  fill: var(--on-deep-muted);
  font-size: var(--text-label);
  font-style: italic;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
.years--accent text {
  fill: var(--accent);
}
.line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.line--past {
  stroke: var(--on-deep-muted);
  stroke-width: 2;
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
.peak circle {
  stroke: var(--deep);
  stroke-width: 2;
}
.peak--past circle {
  fill: var(--on-deep-muted);
}
.peak--accent circle {
  fill: var(--accent);
}
.peak text,
.pin text,
.rule-month,
.readout {
  paint-order: stroke;
  stroke: var(--deep);
  stroke-width: 4px;
  stroke-linejoin: round;
}
.peak-value {
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-weight: 800;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.peak-label {
  font-size: var(--text-meta);
  font-weight: 700;
}
.peak--past text {
  fill: var(--on-deep-muted);
}
.peak--accent text {
  fill: var(--accent);
}
.pin circle {
  fill: none;
  stroke: var(--on-deep);
  stroke-width: 2;
}
.pin text {
  fill: var(--on-deep);
  font-size: var(--text-body);
  font-style: italic;
}
.notes {
  opacity: 0;
  transition: opacity 300ms ease-out 1400ms;
}
.is-drawn .notes {
  opacity: 1;
}
.is-scrubbing .notes {
  opacity: 0.2;
  transition-delay: 0ms;
}
.rule line {
  stroke: var(--on-deep);
  stroke-width: 1;
}
.rule-month,
.readout {
  fill: var(--on-deep);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
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
  .peak-value {
    font-size: var(--text-body);
  }
  .pin text {
    font-size: var(--text-meta);
  }
}
</style>
