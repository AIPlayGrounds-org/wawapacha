<script setup lang="ts">
import { computed } from 'vue'
import LocatorGlobe from '~/components/LocatorGlobe.vue'
import type { GridRecord } from '~/types/dataset'
import { messages } from '~/messages'
import { COAST_POINTS } from '~/utils/oisstMap'
import { SEA_STEPS, buildSeaGrid, seaPosition } from '~/utils/seaGrid'

export type SeaRing = { lat: number; lon: number; label: string; muted?: boolean }
export type SeaPanel = {
  title: string
  record: GridRecord
  ring: SeaRing | null
  /** Shows the globe that places the map on the continent. */
  locator?: boolean
}

const props = defineProps<{ panels: SeaPanel[] }>()

const map = messages.story.map
const PLACES = COAST_POINTS.filter((point) => point.labelled)
/** Set on land, or on the open sea for the ocean, clear of the places and the coast. */
const AREAS = [
  { name: map.ecuador, lon: -77.6, lat: -1.4, kind: 'land' },
  { name: map.peru, lon: -75, lat: -9.5, kind: 'land' },
  { name: map.ocean, lon: -85.5, lat: -13, kind: 'sea' },
] as const
/** Degrees around a ring kept free of place names, so the ring stays legible. */
const RING_CLEARANCE = 1.2

const panels = computed(() =>
  props.panels.map((panel) => {
    const grid = buildSeaGrid(panel.record)
    const { ring } = panel
    return {
      ...panel,
      grid,
      at: (lon: number, lat: number) => seaPosition(grid, lon, lat),
      places: PLACES.filter(
        (place) => !ring || Math.hypot(place.lon - ring.lon, place.lat - ring.lat) > RING_CLEARANCE,
      ),
    }
  }),
)

/** One legend for every map: the steps any of them uses, always with the normal one. */
const legend = computed(() => {
  const present = panels.value.flatMap((panel) => panel.grid.paths.map((path) => path.step))
  const first = Math.min(1, ...present)
  const last = Math.max(1, ...present)
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const step = first + index
    const edge = SEA_STEPS[step - 1]
    return { step, edge: edge !== undefined && edge >= 1 ? `+${edge}` : null }
  })
})
</script>

<template>
  <div class="sea-maps">
    <svg class="defs" aria-hidden="true">
      <filter id="sea-map-chalk">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
        <feDisplacementMap in="SourceGraphic" scale="2.5" />
      </filter>
    </svg>
    <div class="sea-pair">
      <div v-for="panel in panels" :key="panel.title" class="sea-panel">
        <p class="sea-title" aria-hidden="true">{{ panel.title }}</p>
        <div
          class="sea-frame"
          :style="{ aspectRatio: `${panel.grid.columns} / ${panel.grid.rows}` }"
        >
          <svg
            class="sea-cells"
            :viewBox="`0 0 ${panel.grid.columns} ${panel.grid.rows}`"
            preserveAspectRatio="none"
            shape-rendering="crispEdges"
            aria-hidden="true"
          >
            <path
              v-for="path in panel.grid.paths"
              :key="path.step"
              :d="path.d"
              :class="`step-${path.step}`"
            />
            <path class="coast" :d="panel.grid.coast" />
          </svg>
          <span
            v-for="area in AREAS"
            :key="area.name"
            class="area"
            :class="`area--${area.kind}`"
            :style="panel.at(area.lon, area.lat)"
            aria-hidden="true"
            >{{ area.name }}</span
          >
          <span
            v-for="place in panel.places"
            :key="place.name"
            class="place"
            :style="panel.at(place.lon, place.lat)"
            aria-hidden="true"
            >{{ place.name }}</span
          >
          <span
            v-if="panel.ring"
            class="ring"
            :class="{ 'ring--muted': panel.ring.muted }"
            :style="panel.at(panel.ring.lon, panel.ring.lat)"
            aria-hidden="true"
          >
            <svg class="chalk" viewBox="0 0 64 64">
              <path
                filter="url(#sea-map-chalk)"
                d="M9 35C6 19 21 6 37 8s23 15 19 30-22 22-35 18S5 41 11 26c3-7 9-12 16-14"
              />
            </svg>
            <span class="ring-label">{{ panel.ring.label }}</span>
          </span>
          <span v-if="panel.locator" class="locator" aria-hidden="true">
            <LocatorGlobe />
          </span>
        </div>
      </div>
    </div>
    <div class="legend" aria-hidden="true">
      <span class="legend-title">{{ map.legend }}</span>
      <ol>
        <li v-for="item in legend" :key="item.step" :class="`step-${item.step}`">
          <span v-if="item.step === 1" class="legend-normal">{{ map.normal }}</span>
          <span v-else-if="item.edge" class="legend-edge">{{ item.edge }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sea-maps {
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
  --map-muted: #aacac5;
  --map-ring: #ff9a5a;
  --globe-sea: var(--step-1);
  --globe-land: var(--land-on-deep);
  display: grid;
  gap: var(--space-4);
}
.defs {
  position: absolute;
  width: 0;
  height: 0;
}
.sea-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-6);
}
.sea-panel {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
}
.sea-title {
  margin: 0;
  color: var(--on-deep);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.2;
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
.coast {
  fill: none;
  stroke: color-mix(in srgb, var(--map-on) 70%, transparent);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
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
.area,
.place,
.ring,
.locator {
  z-index: 1;
}
.area {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: var(--text-label);
  letter-spacing: 0.32em;
  line-height: 1.5;
  text-align: center;
  white-space: pre-line;
}
.area--land {
  color: var(--map-muted);
}
.area--sea {
  color: var(--map-on);
  font-style: italic;
  text-shadow:
    0 0 4px var(--step-1),
    0 0 2px var(--step-1);
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
.ring {
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
.ring-label {
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
.ring--muted .chalk path {
  stroke: var(--map-muted);
  stroke-dasharray: 4 6;
}
.ring--muted .ring-label {
  color: var(--map-muted);
  font-weight: 700;
}
.locator {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: clamp(3rem, 16%, 4.5rem);
  aspect-ratio: 1;
}
/* Title above the bar, so the bar keeps its full width on a phone. */
.legend {
  display: grid;
  gap: var(--space-2);
  max-width: 28rem;
  color: var(--on-deep-muted);
  font-size: var(--text-label);
}
.legend ol {
  display: flex;
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
  transform: translateX(-50%);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.legend-edge {
  left: 0;
}
.legend-normal {
  left: 50%;
  color: var(--on-deep);
}
@media (max-width: 520px) {
  .place {
    font-size: 0.6875rem;
  }
}
</style>
