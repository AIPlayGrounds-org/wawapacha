<script setup lang="ts">
import { computed } from 'vue'
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { useActiveId } from '~/composables/useActiveId'
import { buildOisstMap, cropOisst } from '~/utils/oisstMap'
import { formatAnomaly } from '~/utils/enso'
import { formatDay, formatDegrees, formatMonth } from '~/utils/format'
import { icenEpisodesAbove, icenPeak } from '~/utils/icen'
import { ENFEN_COMUNICADOS, SENAMHI_AVISOS } from '~/links'
import { useSiteSeo } from '~/composables/useSiteSeo'
import IcenTimeline, { type TimelineMark } from '~/components/IcenTimeline.vue'
import SeaMap from '~/components/SeaMap.vue'

const story = messages.story

const oisst = await useDataset('noaa-oisst', cropOisst)
const weekly = await useDataset('noaa-cpc-nino-weekly')
const icen = await useDataset('enfen-icen')
const enfen = await useDataset('enfen-communique')
// One stripe per year since 1950: the mean Niño 3.4 anomaly, built on the server so the payload stays small.
const oniYears = await useDataset(
  'noaa-cpc-oni',
  (dataset) => {
    const byYear = new Map<number, number[]>()
    for (const record of dataset.records) {
      const [year, month] = record.start.split('-').map(Number) as [number, number]
      const centre = month === 12 ? year + 1 : year
      if (centre < 1950) continue
      byYear.set(centre, [...(byYear.get(centre) ?? []), record.anomaly])
    }
    return [...byYear].map(([year, values]) => ({
      year,
      step: Math.max(
        1,
        Math.min(
          9,
          Math.round(
            ((Math.max(-2, Math.min(2, values.reduce((a, b) => a + b, 0) / values.length)) + 2) /
              4) *
              8,
          ) + 1,
        ),
      ),
    }))
  },
  'home:oni-years',
)

const latestIcen = icen.records.at(-1)
const latestIcenMonth = latestIcen ? formatMonth(latestIcen.start) : null
const icenSince = icen.records[0]?.start.slice(0, 4) ?? ''
const heroAnswer = latestIcen
  ? story.hero.answer(icenEpisodesAbove(icen.records, latestIcen.icen), icenSince)
  : story.hero.empty
const todayMark: TimelineMark[] = latestIcen
  ? [
      {
        id: 'hoy',
        start: latestIcen.start,
        value: latestIcen.icen,
        label: story.timeline.mark(story.timeline.today, formatAnomaly(latestIcen.icen)),
      },
    ]
  : []

// Where the heat is: the latest map and the latest week against its normal.
const seaRecord = oisst.records[0]
const warmest = seaRecord ? buildOisstMap(seaRecord).warmest : null
const warmestValue = warmest ? formatDegrees(warmest.value) : null
const calorAnswer = warmestValue ? story.calor.answer(warmestValue) : story.calor.empty
const mapWarmest = warmest
  ? { lat: warmest.lat, lon: warmest.lon, label: story.map.warmest(warmestValue!) }
  : null
const latestWeek = weekly.records.findLast(
  (record) => record.nino_1_2_anomaly !== null && record.nino_1_2_sst !== null,
)
const weekLine = latestWeek
  ? story.calor.week(
      formatDay(latestWeek.end),
      formatDegrees(latestWeek.nino_1_2_sst!),
      formatDegrees(latestWeek.nino_1_2_sst! - latestWeek.nino_1_2_anomaly!),
    )
  : null

// The three past events against the latest value.
const pastEvents = (
  [
    ['1982-83', '1982-07', '1983-11'],
    ['1997-98', '1997-04', '1998-08'],
    ['2017', '2017-01', '2017-04'],
  ] as const
).map(([id, start, end]) => ({
  id,
  name: story.historia.events[id],
  peak: icenPeak(icen.records, start, end),
}))
const comparedEvents = pastEvents.filter((event) => event.peak && latestIcen)
const historiaAnswer = latestIcen
  ? story.historia.answer(
      comparedEvents
        .filter((event) => latestIcen.icen > event.peak!.icen)
        .map((event) => event.name),
      comparedEvents
        .filter((event) => latestIcen.icen <= event.peak!.icen)
        .map((event) => event.name),
    )
  : story.historia.empty
const marks: TimelineMark[] = [
  ...pastEvents.flatMap((event) =>
    event.peak
      ? [
          {
            id: event.id,
            start: event.peak.start,
            value: event.peak.icen,
            label: story.timeline.mark(event.name, formatAnomaly(event.peak.icen)),
          },
        ]
      : [],
  ),
  ...todayMark,
]
const steps = [
  ...pastEvents.flatMap((event) =>
    event.peak
      ? [
          {
            id: event.id,
            lead: story.historia.peak(
              formatAnomaly(event.peak.icen),
              formatMonth(event.peak.start),
            ),
          },
        ]
      : [],
  ),
  ...(latestIcen
    ? [
        {
          id: 'hoy',
          lead: story.historia.todayStep(formatAnomaly(latestIcen.icen), latestIcenMonth!),
        },
      ]
    : []),
]
const stepId = (id: string) => `historia-${id}`
// The band sits below the middle because the sticky chart covers the top of a narrow viewport.
const activeStep = useActiveId(
  steps.map((step) => stepId(step.id)),
  '-50% 0px -30% 0px',
)
const focus = computed(() => (activeStep.value ? activeStep.value.slice(stepId('').length) : null))

// Rain and what to do, from the communiqué in force.
const enfenRecord = enfen.records[0]
const forecastTitle = enfenRecord
  ? messages.page.forecastTitle(enfenRecord.number, enfenRecord.year)
  : messages.page.forecastEmptyTitle
const actionLead = enfenRecord
  ? messages.page.actionLead(enfenRecord.number, enfenRecord.year)
  : null

useSiteSeo({
  title: messages.page.seoTitle,
  description: messages.page.seoDescription,
  ogDescription: `${story.hero.question} ${heroAnswer}`,
})
</script>

<template>
  <div class="home">
    <div class="scene scene--a">
      <SiteHeader />
      <main id="main-content">
        <section class="hero beat" aria-labelledby="home-title">
          <p class="kicker">01 / 05 · {{ story.kickers[0] }}</p>
          <h1 id="home-title">
            <span class="ask">{{ story.hero.question }}</span>
            <span class="answer"
              ><span class="strip">{{ heroAnswer }}</span></span
            >
          </h1>
          <p v-if="latestIcen" class="lead">
            {{ story.hero.detail(latestIcenMonth!, formatDegrees(latestIcen.icen)) }}
          </p>
          <div v-if="latestIcen" class="figure figure--wide">
            <ChartShell bare :dataset="icen" :summary="story.hero.chartSummary(icenSince)">
              <IcenTimeline
                :records="icen.records"
                :marks="todayMark"
                :level="latestIcen.icen"
                :focus="null"
              />
            </ChartShell>
          </div>
          <div
            class="stripes"
            role="img"
            :aria-label="story.hero.stripes(oniYears[0]!.year, oniYears.at(-1)!.year)"
          >
            <i v-for="item in oniYears" :key="item.year" :class="`r${item.step}`" />
          </div>
          <p class="kicker caption" aria-hidden="true">
            <span>{{ oniYears[0]!.year }}</span
            ><span>{{ oniYears.at(-1)!.year }}</span>
          </p>
        </section>
      </main>
    </div>

    <section id="calor" class="scene scene--sea" aria-labelledby="calor-title">
      <div class="beat beat--split">
        <div class="beat-text">
          <p class="kicker">02 / 05 · {{ story.kickers[1] }}</p>
          <h2 id="calor-title">
            <span class="ask">{{ story.calor.question }}</span>
            <span class="answer"
              ><span class="strip">{{ calorAnswer }}</span></span
            >
          </h2>
          <p v-if="weekLine" class="lead">{{ weekLine }}</p>
        </div>
        <div v-if="seaRecord" class="figure figure--map">
          <ChartShell bare :dataset="oisst" :summary="story.map.summary(formatDay(seaRecord.end))">
            <SeaMap :record="seaRecord" :warmest="mapWarmest" />
          </ChartShell>
        </div>
      </div>
    </section>

    <section id="historia" class="scene scene--a" aria-labelledby="historia-title">
      <div class="beat">
        <p class="kicker">03 / 05 · {{ story.kickers[2] }}</p>
        <h2 id="historia-title">
          <span class="ask">{{ story.historia.question }}</span>
          <span class="answer">{{ historiaAnswer }}</span>
        </h2>
        <div v-if="latestIcen" class="scrolly">
          <div class="scrolly-chart">
            <ChartShell bare :dataset="icen" :summary="story.historia.chartSummary">
              <IcenTimeline
                :records="icen.records"
                :marks="marks"
                :level="latestIcen.icen"
                :focus="focus"
              />
            </ChartShell>
          </div>
          <ol class="scrolly-steps">
            <li
              v-for="step in steps"
              :id="stepId(step.id)"
              :key="step.id"
              class="scrolly-step"
              :class="{ 'is-active': activeStep === stepId(step.id) }"
            >
              <p class="step-lead">{{ step.lead }}</p>
              <p v-if="step.id === '1997-98'">{{ story.historia.damage8298 }}</p>
              <template v-if="step.id === '2017'">
                <p>{{ story.historia.low2017 }}</p>
                <p>{{ story.historia.people }}</p>
              </template>
            </li>
          </ol>
        </div>
        <p class="punch">
          <span class="strip">{{ story.historia.punch }}</span>
        </p>
      </div>
    </section>

    <section id="lluvia" class="scene scene--b" aria-labelledby="lluvia-title">
      <div class="beat">
        <p class="kicker">04 / 05 · {{ story.kickers[3] }}</p>
        <h2 id="lluvia-title">
          <span class="ask">{{ story.lluvia.question }}</span>
          <span class="answer">{{ forecastTitle }}</span>
        </h2>
        <template v-if="enfenRecord">
          <p class="lead">{{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}</p>
          <p class="source">
            <strong class="status"
              ><i class="dot" aria-hidden="true" />{{ enfenRecord.status }}.</strong
            >{{ ' ' }}
            <a :href="enfenRecord.url" target="_blank" rel="noopener">
              {{
                messages.page.forecastSource(
                  enfenRecord.number,
                  enfenRecord.year,
                  formatDay(enfenRecord.start),
                )
              }}<span class="sr-only">{{ messages.page.newTab }}</span>
            </a>
          </p>
          <p v-if="enfenRecord.stale" class="source" role="status">
            {{ messages.panels.enfen.nextDueStale(formatDay(enfenRecord.end)) }}
          </p>
        </template>
      </div>
    </section>

    <section id="hacer" class="scene scene--deep" aria-labelledby="hacer-title">
      <div class="beat">
        <p class="kicker">05 / 05 · {{ story.kickers[4] }}</p>
        <h2 id="hacer-title">
          <span class="ask">{{ story.hacer.question }}</span>
          <span class="answer">{{ messages.page.actionTitle }}</span>
        </h2>
        <p v-if="actionLead" class="lead">{{ actionLead }}</p>
        <p class="lead">{{ messages.page.notShown }}</p>
        <div class="actions">
          <a :href="ENFEN_COMUNICADOS" target="_blank" rel="noopener">
            {{ messages.page.enfenLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
          <a :href="SENAMHI_AVISOS" target="_blank" rel="noopener">
            {{ messages.page.senamhiLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
        </div>
      </div>
    </section>

    <footer class="scene scene--b">
      <div class="site-footer">
        <NuxtLink class="brand" to="/">{{ messages.page.brand }}</NuxtLink>
        <span>{{ messages.page.officialSources }}</span>
        <NuxtLink to="/metodologia">{{ messages.page.methodologyLink }}</NuxtLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Each scene restates the shared tokens in its own colours, so SiteHeader, ChartShell
   and the charts need no dark variant. */
.scene {
  --strip-kind: var(--strip-hot);
  --deep: var(--ground);
  --on-deep: var(--on-scene);
  --on-deep-muted: var(--on-scene-muted);
  --text: var(--on-scene);
  --muted: var(--on-scene-muted);
  --faint: var(--on-scene-muted);
  --border: color-mix(in srgb, var(--on-scene) 18%, transparent);
  --surface: transparent;
  --band: color-mix(in srgb, var(--on-scene) 8%, transparent);
  --accent: var(--scene-accent);
  --warm-on-deep: var(--ramp-7);
  --scene-cold: var(--ramp-3);
  --link: var(--on-scene);
  --focus: var(--on-scene);
  position: relative;
  isolation: isolate;
  background: var(--ground);
  color: var(--on-scene);
}
.scene::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: var(--grain);
  mix-blend-mode: overlay;
  opacity: 0.12;
  pointer-events: none;
}
.scene--a {
  --ground: var(--scene-a);
}
.scene--b {
  --ground: var(--scene-b);
}
/* The sea scene speaks in cold: a teal strip and accent. */
.scene--sea {
  --ground: var(--scene-sea);
  --scene-accent: var(--scene-cold);
  --strip-kind: var(--strip-cold);
}
/* The last scene is the call to act: deep teal with an amber accent. */
.scene--deep {
  --ground: var(--scene-deep);
  --on-scene: var(--on-deep-scene);
  --on-scene-muted: var(--on-deep-scene-muted);
  --scene-accent: #ffd27a;
}
.scene + .scene {
  border-top: 1px solid var(--border);
}
a {
  color: var(--on-scene);
  text-decoration-color: var(--scene-accent);
  text-decoration-thickness: 2px;
}
h1,
h2,
p {
  margin: 0;
}
.beat {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: clamp(5rem, 4rem + 6vw, 10rem) var(--gutter);
}
.hero {
  padding-top: clamp(3rem, 2rem + 6vw, 7rem);
}
.beat > * + *,
.beat-text > * + * {
  margin-top: var(--space-8);
}
.beat > .figure,
.beat > .scrolly {
  margin-top: var(--space-16);
}

.kicker {
  color: var(--on-scene-muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.kicker.caption {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-2);
}
.dot {
  display: inline-block;
  width: 0.7em;
  height: 0.7em;
  margin-right: 0.5em;
  border-radius: 50%;
  background: var(--scene-accent);
}
/* Two voices: the reader's question in a light serif, the answer in a heavy grotesque. */
.ask,
.answer {
  display: block;
}
.ask {
  max-width: 30ch;
  font-size: clamp(1.375rem, 1rem + 1.5vw, 2.25rem);
  font-weight: 300;
  line-height: 1.2;
}
.answer {
  max-width: 17ch;
  margin-top: var(--space-4);
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}
h1 .answer {
  max-width: 15ch;
  font-size: clamp(2.75rem, 1.2rem + 6.4vw, 7rem);
  line-height: 1.04;
}
h2 .answer {
  font-size: clamp(2.25rem, 1.2rem + 4vw, 4.5rem);
}
/* A torn paper strip under the key words; each line gets its own piece. */
.strip {
  padding: 0.04em 0.16em 0.1em;
  margin-left: -0.16em;
  background: var(--strip-kind) center / 100% 100% no-repeat;
  color: var(--on-strip);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
/* Warming stripes: one band per year, cold to warm, closing the first scene. */
.stripes {
  display: flex;
  height: 4rem;
  margin-top: var(--space-16);
}
.stripes i {
  flex: 1;
}
.r1 {
  background: var(--ramp-1);
}
.r2 {
  background: var(--ramp-2);
}
.r3 {
  background: var(--ramp-3);
}
.r4 {
  background: var(--ramp-4);
}
.r5 {
  background: var(--ramp-5);
}
.r6 {
  background: var(--ramp-6);
}
.r7 {
  background: var(--ramp-7);
}
.r8 {
  background: var(--ramp-8);
}
.r9 {
  background: var(--ramp-9);
}
.lead {
  max-width: 36rem;
  color: var(--on-scene-muted);
  font-size: clamp(1.125rem, 1rem + 0.45vw, 1.375rem);
  line-height: 1.5;
}
.figure {
  min-width: 0;
}

/* Where: the words on the left, the sea on the right. */
.beat--split {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: center;
  gap: var(--space-12);
}
.beat--split .answer {
  max-width: 12ch;
}

/* History: the steps scroll past one chart. */
.scrolly {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-12);
}
.scrolly-chart {
  --timeline-aspect: 3 / 2;
  position: sticky;
  top: var(--space-12);
  grid-column: 2;
  grid-row: 1;
  align-self: start;
}
.scrolly-steps {
  grid-column: 1;
  grid-row: 1;
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.scrolly-step {
  display: grid;
  align-content: center;
  gap: var(--space-4);
  max-width: 30rem;
  min-height: 70vh;
  padding: var(--space-8) 0;
  color: var(--on-scene-muted);
  font-size: var(--text-lead);
  line-height: 1.5;
  transition: opacity 200ms ease-out;
}
.step-lead {
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 1.3rem + 1.4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.08;
}
.punch {
  max-width: 14ch;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 1.4rem + 4.4vw, 5.5rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.08;
}
.beat > .punch {
  margin-top: var(--space-24);
}

/* Rain: the official status is the one thing to read. */
.source {
  max-width: 40rem;
  color: var(--on-scene-muted);
  font-size: var(--text-body);
  line-height: 1.7;
}
.source a {
  color: inherit;
}
.status {
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* What to do: two ways out to the official sources. */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.beat > .actions {
  margin-top: var(--space-12);
}
.actions a {
  display: inline-flex;
  align-items: center;
  min-height: 52px;
  padding: 0 var(--space-6);
  border: 2px solid var(--on-scene);
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-weight: 700;
  letter-spacing: -0.01em;
  text-decoration: none;
}
.actions a:first-child {
  background: var(--on-scene);
  color: var(--ground);
}
.actions a:hover,
.actions a:focus-visible {
  border-color: var(--scene-accent);
}
.site-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-8) var(--gutter);
  color: var(--on-scene-muted);
  font-size: var(--text-meta);
}
.site-footer a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
.site-footer .brand {
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: var(--text-title-sm);
  font-weight: 800;
  letter-spacing: -0.03em;
  text-decoration: none;
}
@media (max-width: 960px) {
  .beat--split {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 860px) {
  .scrolly {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
  .scrolly-chart {
    --timeline-aspect: 16 / 9;
    --timeline-max-height: 32vh;
    z-index: 2;
    top: 0;
    grid-column: 1;
    margin: 0 calc(var(--gutter) * -1);
    padding: var(--space-6) var(--gutter) var(--space-3);
    border-bottom: 1px solid var(--border);
    background: var(--ground);
  }
  .scrolly-steps {
    grid-row: 2;
  }
}
@media (scripting: enabled) {
  .scrolly-step {
    opacity: 0.35;
  }
  .scrolly-step.is-active {
    opacity: 1;
  }
}
</style>
