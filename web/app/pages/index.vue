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
    <div class="on-stage">
      <SiteHeader />
    </div>

    <main id="main-content">
      <section class="hero" aria-labelledby="home-title">
        <h1 id="home-title">
          <span class="ask">{{ story.hero.question }}</span>
          <span class="answer">{{ heroAnswer }}</span>
        </h1>
        <p v-if="latestIcen" class="lead">
          {{ story.hero.detail(latestIcenMonth!, formatDegrees(latestIcen.icen)) }}
        </p>
        <div v-if="latestIcen" class="on-stage figure">
          <ChartShell bare :dataset="icen" :summary="story.hero.chartSummary(icenSince)">
            <IcenTimeline
              :records="icen.records"
              :marks="todayMark"
              :level="latestIcen.icen"
              :focus="null"
            />
          </ChartShell>
        </div>
      </section>

      <section id="calor" class="chapter" aria-labelledby="calor-title">
        <h2 id="calor-title">
          <span class="ask">{{ story.calor.question }}</span>
          <span class="answer">{{ calorAnswer }}</span>
        </h2>
        <p v-if="weekLine" class="lead">{{ weekLine }}</p>
        <div v-if="seaRecord" class="on-stage figure figure--map">
          <ChartShell bare :dataset="oisst" :summary="story.map.summary(formatDay(seaRecord.end))">
            <SeaMap :record="seaRecord" :warmest="mapWarmest" />
          </ChartShell>
        </div>
      </section>

      <section id="historia" class="chapter" aria-labelledby="historia-title">
        <h2 id="historia-title">
          <span class="ask">{{ story.historia.question }}</span>
          <span class="answer">{{ historiaAnswer }}</span>
        </h2>
        <div v-if="latestIcen" class="scrolly">
          <div class="on-stage scrolly-chart">
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
        <p class="punch">{{ story.historia.punch }}</p>
      </section>

      <section id="lluvia" class="chapter" aria-labelledby="lluvia-title">
        <h2 id="lluvia-title">
          <span class="ask">{{ story.lluvia.question }}</span>
          <span class="answer">{{ forecastTitle }}</span>
        </h2>
        <template v-if="enfenRecord">
          <p class="lead">{{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}</p>
          <p class="source">
            <strong class="status">{{ enfenRecord.status }}.</strong>{{ ' ' }}
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
      </section>

      <section id="hacer" class="chapter" aria-labelledby="hacer-title">
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
      </section>
    </main>

    <footer class="site-footer">
      <NuxtLink class="brand" to="/">{{ messages.page.brand }}</NuxtLink>
      <span>{{ messages.page.officialSources }}</span>
      <NuxtLink to="/metodologia">{{ messages.page.methodologyLink }}</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.home {
  --stage-line: color-mix(in srgb, var(--on-deep-muted) 30%, transparent);
  min-height: 100svh;
  background: var(--deep);
  color: var(--on-deep);
}
/* Shared components read the page tokens, so the stage restates them in its own colours. */
.on-stage {
  --text: var(--on-deep);
  --muted: var(--on-deep-muted);
  --faint: var(--on-deep-muted);
  --border: var(--stage-line);
  --surface: transparent;
  --band: color-mix(in srgb, var(--on-deep) 8%, transparent);
  --accent: var(--warm-on-deep);
  --link: var(--on-deep);
  --focus: var(--warm-on-deep);
  color: var(--on-deep);
}
a {
  color: var(--on-deep);
}
a:focus-visible {
  outline-color: var(--warm-on-deep);
}
h1,
h2,
p {
  margin: 0;
}
.hero,
.chapter {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-24) var(--gutter);
}
.hero {
  padding-top: var(--space-16);
}
.hero > * + *,
.chapter > * + * {
  margin-top: var(--space-6);
}
.hero > .figure,
.chapter > .figure,
.chapter > .scrolly {
  margin-top: var(--space-12);
}
.ask,
.answer {
  display: block;
  max-width: 22ch;
}
.ask {
  color: var(--warm-on-deep);
  font-size: clamp(1.25rem, 1rem + 1vw, 1.75rem);
  font-style: italic;
  font-weight: 400;
  line-height: 1.25;
}
.answer {
  margin-top: var(--space-3);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.05;
}
h1 .answer {
  font-size: clamp(2.5rem, 1.5rem + 4.5vw, 4.5rem);
}
h2 .answer {
  font-size: clamp(1.875rem, 1.3rem + 2.4vw, 3rem);
}
.lead {
  max-width: var(--reading-width);
  color: var(--on-deep-muted);
  font-size: var(--text-lead);
  line-height: 1.5;
}
.figure {
  min-width: 0;
}
.figure--map {
  max-width: 52rem;
}
.source {
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
}
.source a {
  color: inherit;
}
.status {
  color: var(--on-deep);
}
.punch {
  max-width: 20ch;
  color: var(--warm-on-deep);
  font-size: clamp(2rem, 1.3rem + 3vw, 3.5rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.1;
}
.chapter > .punch {
  margin-top: var(--space-16);
}
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
  max-width: var(--reading-width);
  min-height: 60vh;
  padding: var(--space-8) 0;
  color: var(--on-deep-muted);
  font-size: var(--text-lead);
  line-height: 1.5;
  transition: opacity 200ms ease-out;
}
.step-lead {
  color: var(--on-deep);
  font-size: var(--text-title);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.chapter > .actions {
  margin-top: var(--space-8);
}
.actions a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid var(--on-deep);
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
}
.actions a:first-child {
  border-color: var(--warm-on-deep);
  background: var(--warm-on-deep);
  color: var(--deep);
}
.site-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-6);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-5) var(--gutter);
  border-top: 1px solid var(--stage-line);
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
}
.site-footer a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
@media (max-width: 860px) {
  .hero,
  .chapter {
    padding-top: var(--space-16);
    padding-bottom: var(--space-16);
  }
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
    border-bottom: 1px solid var(--stage-line);
    background: var(--deep);
  }
  .scrolly-steps {
    grid-row: 2;
  }
}
@media (scripting: enabled) {
  .scrolly-step {
    opacity: 0.4;
  }
  .scrolly-step.is-active {
    opacity: 1;
  }
}
</style>
