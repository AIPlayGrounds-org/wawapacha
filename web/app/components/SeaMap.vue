<script setup lang="ts">
import { computed } from 'vue'
import type { GridRecord } from '~/types/dataset'
import { messages } from '~/messages'
import { formatValue } from '~/utils/format'
import { SEA_STEPS, buildSeaGrid, seaPosition } from '~/utils/seaGrid'

const props = defineProps<{
  record: GridRecord
  warmest: { lat: number; lon: number; label: string } | null
}>()

const PLACES = [
  { name: 'Tumbes', lon: -80.45, lat: -3.57 },
  { name: 'Piura', lon: -80.63, lat: -5.19 },
  { name: 'Chiclayo', lon: -79.84, lat: -6.77 },
  { name: 'Trujillo', lon: -79.03, lat: -8.11 },
  { name: 'Lima', lon: -77.04, lat: -12.05 },
]
/** Degrees around the warmest point kept free of place names, so its ring stays legible. */
const WARMEST_CLEARANCE = 1.2
const places = computed(() =>
  PLACES.filter(
    (place) =>
      !props.warmest ||
      Math.hypot(place.lon - props.warmest.lon, place.lat - props.warmest.lat) > WARMEST_CLEARANCE,
  ),
)
const grid = computed(() => buildSeaGrid(props.record))
const at = (lon: number, lat: number) => seaPosition(grid.value, lon, lat)
const legend = computed(() => {
  const present = grid.value.paths.map((path) => path.step)
  const first = Math.max(1, Math.min(...present))
  const last = Math.max(...present)
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const step = first + index
    return { step, edge: step > first ? formatValue(SEA_STEPS[step - 1]!) : null }
  })
})
</script>

<template>
  <div class="sea-map">
    <div class="sea-frame" :style="{ aspectRatio: `${grid.columns} / ${grid.rows}` }">
      <svg
        class="sea-cells"
        :viewBox="`0 0 ${grid.columns} ${grid.rows}`"
        preserveAspectRatio="none"
        shape-rendering="crispEdges"
        aria-hidden="true"
      >
        <path
          v-for="path in grid.paths"
          :key="path.step"
          :d="path.d"
          :class="`step-${path.step}`"
        />
      </svg>
      <span
        v-for="place in places"
        :key="place.name"
        class="place"
        :style="at(place.lon, place.lat)"
        aria-hidden="true"
        >{{ place.name }}</span
      >
      <span v-if="warmest" class="warmest" :style="at(warmest.lon, warmest.lat)" aria-hidden="true">
        <svg class="chalk" viewBox="0 0 64 64">
          <filter id="sea-map-chalk">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feDisplacementMap in="SourceGraphic" scale="2.5" />
          </filter>
          <path
            filter="url(#sea-map-chalk)"
            d="M9 35C6 19 21 6 37 8s23 15 19 30-22 22-35 18S5 41 11 26c3-7 9-12 16-14"
          />
        </svg>
        <span class="warmest-label">{{ warmest.label }}</span>
      </span>
    </div>
    <div class="legend" aria-hidden="true">
      <span class="legend-title">{{ messages.story.map.legend }}</span>
      <ol>
        <li v-for="item in legend" :key="item.step" :class="`step-${item.step}`">
          <span v-if="item.edge">{{ item.edge }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sea-map {
  --step-0: #4f8fc4;
  --step-1: #1d5059;
  --step-2: #5a3a3c;
  --step-3: #7d3b30;
  --step-4: #a3472e;
  --step-5: #c9582b;
  --step-6: #e57a2c;
  --step-7: #f5a23c;
  --step-8: #fcd062;
  --step-9: #fff3b8;
  --land-on-deep: #17241e;
  --map-on: #f6f7f4;
  --map-ring: #ff9a5a;
  display: grid;
  gap: var(--space-3);
}
.sea-frame {
  position: relative;
  isolation: isolate;
  width: 100%;
  background: var(--land-on-deep);
  overflow: hidden;
}
/* Grain over sea and land alike, so the map reads as one printed sheet. */
.sea-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--grain);
  mix-blend-mode: overlay;
  opacity: 0.35;
  pointer-events: none;
}
.sea-cells {
  display: block;
  width: 100%;
  height: 100%;
}
.step-0 {
  fill: var(--step-0);
  background: var(--step-0);
}
.step-1 {
  fill: var(--step-1);
  background: var(--step-1);
}
.step-2 {
  fill: var(--step-2);
  background: var(--step-2);
}
.step-3 {
  fill: var(--step-3);
  background: var(--step-3);
}
.step-4 {
  fill: var(--step-4);
  background: var(--step-4);
}
.step-5 {
  fill: var(--step-5);
  background: var(--step-5);
}
.step-6 {
  fill: var(--step-6);
  background: var(--step-6);
}
.step-7 {
  fill: var(--step-7);
  background: var(--step-7);
}
.step-8 {
  fill: var(--step-8);
  background: var(--step-8);
}
.step-9 {
  fill: var(--step-9);
  background: var(--step-9);
}
.place,
.warmest {
  z-index: 1;
}
.place {
  position: absolute;
  line-height: 1;
  white-space: nowrap;
  padding-left: 10px;
  transform: translateY(-50%);
  color: var(--map-on);
  font-size: var(--text-meta);
  font-style: italic;
  letter-spacing: 0.16em;
  text-shadow:
    0 0 3px var(--land-on-deep),
    0 0 3px var(--land-on-deep);
}
.place::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--map-on);
  transform: translateY(-50%);
}
.warmest {
  position: absolute;
  width: 56px;
  height: 56px;
  transform: translate(-50%, -50%);
}
.chalk {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.chalk path {
  fill: none;
  stroke: var(--map-ring);
  stroke-linecap: round;
  stroke-width: 2.5;
}
.warmest-label {
  position: absolute;
  right: calc(100% + 4px);
  top: 50%;
  transform: translateY(-50%);
  color: var(--map-on);
  font-family: var(--font-display);
  font-size: var(--text-title-sm);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
  white-space: nowrap;
  text-shadow:
    0 0 6px var(--land-on-deep),
    0 0 2px var(--land-on-deep);
}
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-2) var(--space-4);
  color: var(--on-deep-muted);
  font-size: var(--text-label);
}
.legend-title {
  line-height: 14px;
}
.legend ol {
  display: flex;
  flex: 1 1 12rem;
  max-width: 24rem;
  margin: 0;
  padding: 0 0 18px;
  list-style: none;
}
.legend li {
  position: relative;
  flex: 1;
  height: 14px;
}
.legend li span {
  position: absolute;
  top: 18px;
  left: 0;
  transform: translateX(-50%);
  font-variant-numeric: tabular-nums;
}
@media (max-width: 520px) {
  .place {
    font-size: 0.6875rem;
  }
}
</style>
