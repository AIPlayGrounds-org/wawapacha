<script setup lang="ts">
import { computed } from 'vue'
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { useClaimSources } from '~/composables/useClaimSources'
import { useActiveId } from '~/composables/useActiveId'
import { buildOisstMap, cropOisst, formatCoordinate } from '~/utils/oisstMap'
import { shapeSenamhiDataset } from '~/utils/senamhi'
import { formatAnomaly } from '~/utils/enso'
import { formatDay, formatDegrees, formatMonth } from '~/utils/format'
import { icenCategory, icenPeak, icenRank } from '~/utils/icen'
import { ENFEN_COMUNICADOS, SENAMHI_AVISOS } from '~/links'
import { useSiteSeo } from '~/composables/useSiteSeo'
import IcenTimeline, { type TimelineMark } from '~/components/IcenTimeline.vue'
import LagChart from '~/components/LagChart.vue'
import SeaMap from '~/components/SeaMap.vue'
import SenamhiRainChart from '~/components/SenamhiRainChart.vue'
import SourceCard from '~/components/SourceCard.vue'
import StoryRail from '~/components/StoryRail.vue'

const story = messages.story

const oisst = await useDataset('noaa-oisst', cropOisst)
const weekly = await useDataset('noaa-cpc-nino-weekly')
const icen = await useDataset('enfen-icen')
const enfen = await useDataset('enfen-communique')
const senamhi = await useDataset('senamhi-estaciones', shapeSenamhiDataset)
const quotes = await useClaimSources([
  'coastal-event-plain-criterion',
  'impact-2017-plain',
  'forecast-uncertainty-plain',
] as const)
const ruleQuote = quotes['coastal-event-plain-criterion'][0]
// The second passage of the 2017 report is the one about rain and floods.
const impactQuote = quotes['impact-2017-plain'].at(-1)
const uncertaintyQuote = quotes['forecast-uncertainty-plain'][0]

const QUESTION_IDS = ['calor', 'metodo', 'historia', 'lluvia', 'hacer'] as const
const questions = QUESTION_IDS.map((id, index) => ({
  id,
  short: story.questions[id].short,
  title: story.questions[id].title,
  count: story.questionNumber(index + 1, QUESTION_IDS.length),
}))
const question = (id: (typeof QUESTION_IDS)[number]) => questions.find((item) => item.id === id)!

const enfenRecord = enfen.records[0]
const latestIcen = icen.records.at(-1)
const latestIcenMonth = latestIcen ? formatMonth(latestIcen.start) : null
const icenSince = icen.records[0]?.start.slice(0, 4) ?? ''
const heroAnswer = latestIcen
  ? story.hero.answer(icenRank(icen.records, latestIcen.icen), icenSince)
  : story.hero.empty

// Chapter 1: the latest week against its normal, and the map.
const latestWeek = weekly.records.findLast((record) => record.nino_1_2_anomaly !== null)
const weekAnomaly = latestWeek?.nino_1_2_anomaly ?? null
const weekSst = latestWeek?.nino_1_2_sst ?? null
const latestWeekDay = latestWeek ? formatDay(latestWeek.end) : null
const calorAnswer =
  latestWeekDay && weekSst !== null && weekAnomaly !== null
    ? story.calor.answer(
        latestWeekDay,
        formatDegrees(weekSst),
        formatDegrees(weekSst - weekAnomaly),
      )
    : story.calor.empty
const seaRecord = oisst.records[0]
const warmest = seaRecord ? buildOisstMap(seaRecord).warmest : null
const warmestValue = warmest ? formatDegrees(warmest.value) : null
const mapTitle = warmestValue ? story.calor.mapTitle(warmestValue) : story.calor.mapEmptyTitle
const mapSummary =
  seaRecord && warmest
    ? story.map.summary(
        formatDay(seaRecord.end),
        warmestValue!,
        `${formatCoordinate(warmest.lat, 'latitude')}, ${formatCoordinate(warmest.lon, 'longitude')}`,
      )
    : ''
const mapWarmest = warmest
  ? { lat: warmest.lat, lon: warmest.lon, label: story.map.warmest(warmestValue!) }
  : null

// Chapter 2: the rule, and the lag between the weekly value and the index.
const warmRun = (() => {
  const firstNotWarm = icen.records.findLastIndex((record) => {
    const category = icenCategory(record.icen)
    return category === null || category === 'neutral'
  })
  return icen.records.length - 1 - firstNotWarm
})()
const LAG_YEARS = 2
const lagFrom = latestWeek
  ? `${Number(latestWeek.start.slice(0, 4)) - LAG_YEARS}${latestWeek.start.slice(4)}`
  : ''
const recentWeeks = weekly.records.filter(
  (record) => record.nino_1_2_anomaly !== null && record.start >= lagFrom,
)
const lagDataset = { ...weekly, records: recentWeeks }
const weeklyPoints = recentWeeks.map((record) => ({
  start: record.start,
  value: record.nino_1_2_anomaly!,
}))
const monthlyPoints = icen.records.map((record) => ({ start: record.start, value: record.icen }))

// Chapter 3: the three past events against the latest value.
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
const TODAY = 'hoy'
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
  ...(latestIcen
    ? [
        {
          id: TODAY,
          start: latestIcen.start,
          value: latestIcen.icen,
          label: story.timeline.mark(story.timeline.today, formatAnomaly(latestIcen.icen)),
        },
      ]
    : []),
]
const stepId = (id: string) => `historia-${id}`
const steps = [
  ...pastEvents.flatMap((event) =>
    event.peak
      ? [
          {
            id: event.id,
            lead: story.historia.peak(
              event.name,
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
          id: TODAY,
          lead: story.historia.todayStep(formatAnomaly(latestIcen.icen), latestIcenMonth!),
        },
      ]
    : []),
]
// The band sits below the middle because the sticky chart covers the top of a narrow viewport.
const activeStep = useActiveId(
  steps.map((step) => stepId(step.id)),
  '-50% 0px -30% 0px',
)
const focus = computed(() => (activeStep.value ? activeStep.value.slice(stepId('').length) : null))
const timelineSummary = latestIcenMonth ? story.hero.chartSummary(icenSince, latestIcenMonth) : ''

// Chapter 4 and 5: the forecast and the action, from the communiqué in force.
const forecastTitle = enfenRecord
  ? messages.page.forecastTitle(enfenRecord.number, enfenRecord.year)
  : messages.page.forecastEmptyTitle
const actionLead = enfenRecord
  ? messages.page.actionLead(enfenRecord.number, enfenRecord.year)
  : null
const metodoAnswer = story.metodo.answer(warmRun)
const recap = [
  { ...question('calor'), answer: calorAnswer },
  { ...question('metodo'), answer: metodoAnswer },
  { ...question('historia'), answer: historiaAnswer },
  { ...question('lluvia'), answer: forecastTitle },
  { ...question('hacer'), answer: messages.page.actionTitle },
]
const sources = [oisst, weekly, icen, enfen, senamhi].map((dataset) => ({
  id: dataset.id,
  variable: dataset.variable,
  institution: dataset.source.institution,
  product: dataset.source.product,
  url: dataset.source.url,
}))

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
        <div class="hero-top">
          <div class="hero-copy">
            <p class="kicker">{{ story.kicker }}</p>
            <h1 id="home-title">
              <span class="ask">{{ story.hero.question }}</span>
              <span class="answer">{{ heroAnswer }}</span>
            </h1>
            <p v-if="latestIcen" class="hero-detail">
              {{ story.hero.detail(latestIcenMonth!, formatDegrees(latestIcen.icen)) }}
            </p>
          </div>
          <aside
            v-if="enfenRecord"
            class="status-card"
            :class="{ 'status-card--alert': enfenRecord.status.startsWith('Alerta') }"
            :aria-label="messages.page.officialStatus"
          >
            <span class="status-kicker">{{
              enfenRecord.stale ? messages.panels.enfen.latestStatus : messages.panels.enfen.status
            }}</span>
            <strong>{{ enfenRecord.status }}</strong>
            <span>
              {{ messages.page.communiqueMeta(enfenRecord.number, enfenRecord.year) }}
              <time :datetime="enfenRecord.start">{{ formatDay(enfenRecord.start) }}</time>
            </span>
            <span v-if="enfenRecord.stale" class="stale-status" role="status">
              {{ messages.panels.enfen.nextDueStale(formatDay(enfenRecord.end)) }}
            </span>
            <span v-else>{{ messages.page.homeNext(formatDay(enfenRecord.end)) }}</span>
            <a :href="enfenRecord.url" target="_blank" rel="noopener">
              {{ messages.panels.enfen.detail }}
              <span class="sr-only">{{ messages.page.newTab }}</span>
            </a>
          </aside>
          <p v-else class="status-empty">{{ messages.page.emptyEnfenTitle }}</p>
        </div>
        <div v-if="latestIcen" class="on-stage hero-chart">
          <ChartShell :dataset="icen" :summary="timelineSummary">
            <IcenTimeline
              :records="icen.records"
              :marks="marks"
              :level="latestIcen.icen"
              :focus="null"
            />
          </ChartShell>
        </div>
        <p class="cue">
          <a href="#calor">{{ story.hero.cue }} <span aria-hidden="true">↓</span></a>
        </p>
      </section>

      <StoryRail :label="story.railLabel" :steps="questions" />

      <section id="calor" class="chapter" aria-labelledby="calor-title">
        <header class="chapter-head">
          <p class="count">{{ question('calor').count }}</p>
          <h2 id="calor-title">
            <span class="ask">{{ question('calor').title }}</span>
            <span class="answer">{{ calorAnswer }}</span>
          </h2>
        </header>
        <p v-if="weekAnomaly !== null" class="prose">
          {{ story.calor.anomaly(formatDegrees(weekAnomaly)) }}
        </p>
        <h3 id="map-title" class="finding">{{ mapTitle }}</h3>
        <div class="split split--map">
          <div v-if="seaRecord" class="on-stage figure">
            <ChartShell :dataset="oisst" :summary="mapSummary">
              <SeaMap :record="seaRecord" :warmest="mapWarmest" />
            </ChartShell>
          </div>
          <div class="map-note">
            <p class="note-label">{{ story.map.box }}</p>
            <p class="prose">{{ story.calor.box }}</p>
            <p class="prose">{{ story.calor.boxNote }}</p>
          </div>
        </div>
        <p class="bridge">{{ story.calor.bridge }}</p>
      </section>

      <section id="metodo" class="chapter" aria-labelledby="metodo-title">
        <header class="chapter-head">
          <p class="count">{{ question('metodo').count }}</p>
          <h2 id="metodo-title">
            <span class="ask">{{ question('metodo').title }}</span>
            <span class="answer">{{ metodoAnswer }}</span>
          </h2>
        </header>
        <div class="split">
          <ol class="method-steps">
            <li v-for="(step, index) in story.metodo.steps" :key="step.label">
              <span class="step-number" aria-hidden="true">{{ index + 1 }}</span>
              <strong>{{ step.label }}</strong>
              <span>{{ step.text }}</span>
            </li>
          </ol>
          <SourceCard
            v-if="ruleQuote"
            :label="story.metodo.ruleSource"
            :quote="ruleQuote.quote"
            :href="ruleQuote.ref"
          />
        </div>
        <div v-if="latestIcen && latestWeekDay" class="doubt">
          <p class="doubt-label">{{ story.doubt }}</p>
          <p class="doubt-ask">{{ story.metodo.doubt(latestIcenMonth!) }}</p>
          <p class="prose">{{ story.metodo.lag(latestIcenMonth!, latestWeekDay) }}</p>
          <p class="prose">{{ story.metodo.revises }}</p>
        </div>
        <h3 id="weekly-title" class="finding">{{ story.metodo.lagTitle }}</h3>
        <div v-if="latestIcen && weekAnomaly !== null" class="on-stage figure">
          <ChartShell :dataset="lagDataset" :summary="story.metodo.lagSummary(LAG_YEARS * 12)">
            <LagChart
              :weekly="weeklyPoints"
              :monthly="monthlyPoints"
              :weekly-label="story.metodo.weeklyLabel(formatDegrees(weekAnomaly))"
              :monthly-label="story.metodo.monthlyLabel(formatDegrees(latestIcen.icen))"
              :zero-label="story.timeline.normal"
            />
          </ChartShell>
        </div>
        <p class="prose prose--muted">
          {{ story.metodo.measuredBy(weekly.source.institution, icen.source.institution) }}
        </p>
      </section>

      <section id="historia" class="chapter" aria-labelledby="historia-title">
        <header class="chapter-head">
          <p class="count">{{ question('historia').count }}</p>
          <h2 id="historia-title">
            <span class="ask">{{ question('historia').title }}</span>
            <span class="answer">{{ historiaAnswer }}</span>
          </h2>
        </header>
        <div v-if="latestIcen" class="scrolly">
          <figure class="scrolly-chart">
            <IcenTimeline
              :records="icen.records"
              :marks="marks"
              :level="latestIcen.icen"
              :focus="focus"
            />
            <figcaption>
              {{ story.historia.chartSummary }}
              <a :href="icen.source.url" target="_blank" rel="noopener">
                {{ icen.source.institution }}<span class="sr-only">{{ messages.page.newTab }}</span>
              </a>
            </figcaption>
          </figure>
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
                <p>{{ story.historia.impact }}</p>
                <p>{{ story.historia.people }}</p>
                <SourceCard
                  v-if="impactQuote"
                  :label="story.historia.impactSource"
                  :quote="impactQuote.quote"
                  :href="impactQuote.ref"
                />
              </template>
            </li>
          </ol>
        </div>
        <p class="punch">{{ story.historia.punch }}</p>
        <div class="doubt">
          <p class="doubt-label">{{ story.doubt }}</p>
          <p class="doubt-ask">{{ story.historia.doubt }}</p>
          <p class="prose">{{ story.historia.doubtAnswer }}</p>
        </div>
      </section>

      <section id="lluvia" class="chapter" aria-labelledby="lluvia-title">
        <header class="chapter-head">
          <p class="count">{{ question('lluvia').count }}</p>
          <h2 id="lluvia-title">
            <span class="ask">{{ question('lluvia').title }}</span>
            <span class="answer">{{ forecastTitle }}</span>
          </h2>
        </header>
        <template v-if="enfenRecord">
          <p class="prose">{{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}</p>
          <ul class="forecast-points">
            <li
              v-for="point in messages.page.forecastPoints(enfenRecord.number, enfenRecord.year)"
              :key="point.label"
            >
              <strong>{{ point.label }}</strong>
              <span>{{ point.text }}</span>
            </li>
          </ul>
          <p class="forecast-source">
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
        </template>
        <div class="doubt">
          <p class="doubt-label">{{ story.doubt }}</p>
          <p class="doubt-ask">{{ story.lluvia.doubt }}</p>
          <div class="split">
            <p class="prose">{{ story.lluvia.uncertainty }}</p>
            <SourceCard
              v-if="uncertaintyQuote"
              :label="story.lluvia.uncertaintySource"
              :quote="uncertaintyQuote.quote"
              :href="uncertaintyQuote.ref"
            />
          </div>
        </div>
        <div class="sheet">
          <p class="sheet-kicker">{{ story.lluvia.precedentKicker }}</p>
          <h3 id="impact-title">{{ messages.page.impactTitle }}</h3>
          <p>{{ messages.page.impactLead }}</p>
          <p>{{ messages.page.impactLimits }}</p>
          <p class="chart-lead">{{ messages.page.impactChartLead }}</p>
          <SenamhiRainChart :dataset="senamhi" />
          <p class="coverage-note">{{ messages.page.impactCoverage }}</p>
        </div>
        <div class="unknown">
          <h3>{{ story.lluvia.unknownTitle }}</h3>
          <p class="prose">{{ messages.page.notShown }}</p>
        </div>
      </section>

      <section id="hacer" class="chapter" aria-labelledby="hacer-title">
        <header class="chapter-head">
          <p class="count">{{ question('hacer').count }}</p>
          <h2 id="hacer-title">
            <span class="ask">{{ question('hacer').title }}</span>
            <span class="answer">{{ messages.page.actionTitle }}</span>
          </h2>
        </header>
        <p v-if="actionLead" class="prose">{{ actionLead }}</p>
        <div class="source-links">
          <a :href="ENFEN_COMUNICADOS" target="_blank" rel="noopener">
            {{ messages.page.enfenLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
          <a :href="SENAMHI_AVISOS" target="_blank" rel="noopener">
            {{ messages.page.senamhiLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
        </div>
        <p class="prose local-lead">{{ messages.page.localLead }}</p>
        <div class="local-grid">
          <NuxtLink class="local-card" to="/territorio">
            <span class="local-label">{{ messages.page.localTerritoryLabel }}</span>
            <strong>{{ messages.page.localTerritoryLink }}</strong>
            <span>{{ messages.page.localTerritoryDescription }}</span>
          </NuxtLink>
          <NuxtLink class="local-card" to="/rios">
            <span class="local-label">{{ messages.page.localRiversLabel }}</span>
            <strong>{{ messages.page.localRiversLink }}</strong>
            <span>{{ messages.page.localRiversDescription }}</span>
          </NuxtLink>
          <NuxtLink class="local-card" to="/historico">
            <span class="local-label">{{ messages.page.localArchiveLabel }}</span>
            <strong>{{ messages.page.localHistoryLink }}</strong>
            <span>{{ messages.page.localArchiveDescription }}</span>
          </NuxtLink>
        </div>

        <div class="recap">
          <h3 id="recap-title">{{ story.hacer.recapTitle }}</h3>
          <ol>
            <li v-for="item in recap" :key="item.id">
              <a :href="`#${item.id}`" class="recap-ask">{{ item.title }}</a>
              <span class="recap-answer">{{ item.answer }}</span>
            </li>
          </ol>
        </div>

        <div class="sources">
          <h3 id="sources-title">{{ messages.page.sourcesTitle }}</h3>
          <p class="prose prose--muted">{{ messages.page.sourcesLead }}</p>
          <ul class="source-list">
            <li v-for="source in sources" :key="source.id">
              <span>{{ source.variable }}</span>
              <a :href="source.url" target="_blank" rel="noopener">
                {{ source.institution }} · {{ source.product
                }}<span class="sr-only">{{ messages.page.newTab }}</span>
              </a>
            </li>
          </ul>
          <NuxtLink class="method-link" to="/metodologia">{{
            messages.page.methodologyLink
          }}</NuxtLink>
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
  --rail-height: 48px;
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
h3,
p {
  margin: 0;
  text-wrap: pretty;
}
.hero,
.chapter {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-16) var(--gutter);
}
.chapter {
  padding-top: var(--space-24);
  padding-bottom: var(--space-24);
  border-top: 1px solid var(--stage-line);
  scroll-margin-top: var(--rail-height);
}
.chapter > * + * {
  margin-top: var(--space-8);
}
.hero {
  padding-bottom: var(--space-8);
}
.hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(17rem, 0.5fr);
  align-items: end;
  gap: var(--space-12);
}
.kicker,
.count,
.doubt-label,
.sheet-kicker {
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 1.3;
  text-transform: uppercase;
}
.kicker,
.count {
  color: var(--on-deep-muted);
}
.ask,
.answer {
  display: block;
}
.ask {
  color: var(--warm-on-deep);
  font-family: var(--font-hand);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.1;
}
h1 {
  margin-top: var(--space-4);
}
h1 .ask {
  font-size: clamp(1.75rem, 1.2rem + 2.4vw, 2.75rem);
}
h1 .answer {
  max-width: 18ch;
  margin-top: var(--space-3);
  font-size: clamp(2.25rem, 1.4rem + 4vw, 4.25rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.02;
}
.hero-detail {
  max-width: var(--reading-width);
  margin-top: var(--space-5);
  color: var(--on-deep-muted);
  font-size: var(--text-lead);
  line-height: 1.4;
}
.status-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--stage-line);
  border-top: 4px solid var(--on-deep-muted);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--on-deep) 6%, transparent);
}
.status-card--alert {
  border-top-color: var(--warm-on-deep);
}
.status-kicker,
.local-label {
  color: var(--on-deep-muted);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.status-card strong {
  font-size: var(--text-title-sm);
  line-height: 1.1;
}
.status-card span:not(.status-kicker) {
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
  line-height: 1.45;
}
.status-card a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  font-size: var(--text-meta);
}
.status-empty {
  color: var(--on-deep-muted);
}
.hero-chart {
  margin-top: var(--space-12);
}
.cue {
  margin-top: var(--space-6);
  font-family: var(--font-hand);
  font-size: var(--text-lead);
  text-align: center;
}
.cue a {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  color: var(--warm-on-deep);
  text-decoration: none;
}
.chapter-head {
  max-width: 52rem;
}
h2 {
  margin-top: var(--space-3);
}
h2 .ask {
  font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.125rem);
}
h2 .answer {
  margin-top: var(--space-3);
  font-size: clamp(1.75rem, 1.2rem + 2.4vw, 3rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.08;
}
.prose {
  max-width: var(--reading-width);
  font-size: var(--text-lead);
  line-height: 1.5;
}
.prose--muted {
  color: var(--on-deep-muted);
  font-size: var(--text-body);
}
.finding {
  max-width: 44rem;
  font-size: var(--text-title-sm);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.finding + .figure,
.finding + .split {
  margin-top: var(--space-4);
}
.figure {
  min-width: 0;
}
.split.split--map {
  align-items: start;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
}
.map-note {
  display: grid;
  gap: var(--space-3);
}
.note-label {
  color: var(--warm-on-deep);
  font-family: var(--font-hand);
  font-size: var(--text-title-sm);
  line-height: 1.1;
}
.bridge,
.punch {
  max-width: 24ch;
  font-size: var(--text-title);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.punch {
  color: var(--warm-on-deep);
  font-size: clamp(2rem, 1.3rem + 3vw, 3.5rem);
}
.split {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  align-items: center;
  gap: var(--space-12);
}
.method-steps {
  display: grid;
  gap: var(--space-6);
  margin: 0;
  padding: 0;
  list-style: none;
}
.method-steps li {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  column-gap: var(--space-4);
  row-gap: var(--space-1);
}
.step-number {
  display: grid;
  grid-row: span 2;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--warm-on-deep);
  border-radius: 50%;
  color: var(--warm-on-deep);
  font-family: var(--font-hand);
  font-size: var(--text-title-sm);
  line-height: 1;
}
.method-steps strong {
  font-family: var(--font-hand);
  font-size: var(--text-title-sm);
  font-weight: 400;
  line-height: 1.1;
}
.method-steps li > span:last-child {
  grid-column: 2;
  font-size: var(--text-lead);
  line-height: 1.45;
}
.doubt {
  display: grid;
  gap: var(--space-3);
  padding-left: var(--space-5);
  border-left: 3px solid var(--warm-on-deep);
}
.doubt-label {
  color: var(--warm-on-deep);
}
.doubt-ask {
  font-family: var(--font-hand);
  font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2rem);
  line-height: 1.15;
}
.doubt .split {
  align-items: start;
}
.scrolly {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: var(--space-12);
}
.scrolly-chart {
  --timeline-aspect: 3 / 2;
  position: sticky;
  top: calc(var(--rail-height) + var(--space-12));
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  margin: 0;
}
.scrolly-chart figcaption {
  margin-top: var(--space-3);
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
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
  min-height: 55vh;
  padding: var(--space-8) 0;
  font-size: var(--text-lead);
  line-height: 1.5;
  transition: opacity 200ms ease-out;
}
.step-lead {
  font-size: var(--text-title);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.forecast-points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: var(--space-4);
  margin-bottom: 0;
  padding: 0;
  list-style: none;
}
.forecast-points li {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--stage-line);
  border-top: 3px solid var(--warm-on-deep);
  line-height: 1.45;
}
.forecast-points strong {
  color: var(--warm-on-deep);
  font-family: var(--font-hand);
  font-size: var(--text-title-sm);
  font-weight: 400;
  line-height: 1.1;
}
.forecast-source {
  margin-top: var(--space-3);
  font-size: var(--text-meta);
}
.forecast-source a,
.method-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
.sheet {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-8);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
}
.sheet > * {
  min-width: 0;
}
.sheet a {
  color: var(--link);
}
.sheet-kicker {
  color: var(--accent);
}
.sheet h3,
.unknown h3,
.recap h3,
.sources h3 {
  font-size: var(--text-title-sm);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.sheet p {
  max-width: 60rem;
  color: var(--muted);
}
.sheet .chart-lead {
  margin-top: var(--space-3);
  color: var(--text);
}
.sheet .coverage-note {
  font-size: var(--text-meta);
}
.unknown {
  display: grid;
  gap: var(--space-3);
}
.source-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.source-links a {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-5);
  border: 1px solid var(--on-deep);
  border-radius: var(--radius-sm);
  font-weight: 600;
  text-decoration: none;
}
.source-links a:first-child {
  border-color: var(--warm-on-deep);
  background: var(--warm-on-deep);
  color: var(--deep);
}
.local-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
}
.local-lead + .local-grid {
  margin-top: var(--space-4);
}
.local-card {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--stage-line);
  border-radius: var(--radius-md);
  line-height: 1.45;
  text-decoration: none;
}
.local-card:hover {
  border-color: var(--on-deep);
}
.local-card strong {
  font-size: var(--text-lead);
  text-decoration: underline;
}
.local-card span:last-child {
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
}
.recap,
.sources {
  display: grid;
  gap: var(--space-4);
  padding-top: var(--space-12);
  border-top: 1px solid var(--stage-line);
}
.chapter > .recap,
.chapter > .sources {
  margin-top: var(--space-16);
}
.recap ol {
  display: grid;
  gap: var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: recap;
}
.recap li {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: var(--space-2) var(--space-8);
  align-items: baseline;
}
.recap-ask {
  color: var(--warm-on-deep);
  font-family: var(--font-hand);
  font-size: var(--text-title-sm);
  line-height: 1.15;
  text-decoration: none;
}
.recap-ask:hover {
  text-decoration: underline;
}
.recap-answer {
  font-size: var(--text-lead);
  line-height: 1.4;
}
.source-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}
.source-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: var(--space-4);
  border-top: 1px solid var(--stage-line);
  font-size: var(--text-meta);
}
.source-list span {
  color: var(--on-deep-muted);
}
.site-footer {
  display: flex;
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
    padding-top: var(--space-12);
    padding-bottom: var(--space-12);
  }
  .hero-top,
  .split,
  .split.split--map,
  .local-grid,
  .recap li,
  .source-list li {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero-top,
  .split {
    gap: var(--space-8);
  }
  .source-list li {
    gap: 0;
    padding: var(--space-3) 0;
  }
  .sheet {
    margin-right: calc(var(--gutter) * -1);
    margin-left: calc(var(--gutter) * -1);
    padding: var(--space-6) var(--gutter);
    border-radius: 0;
  }
  .site-footer {
    flex-wrap: wrap;
  }
  .scrolly {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }
  .scrolly-chart {
    --timeline-aspect: 16 / 9;
    --timeline-max-height: 32vh;
    z-index: 2;
    top: var(--rail-height);
    grid-column: 1;
    margin: 0 calc(var(--gutter) * -1);
    padding: var(--space-8) var(--gutter) var(--space-3);
    border-bottom: 1px solid var(--stage-line);
    background: var(--deep);
  }
  .scrolly-steps {
    grid-row: 2;
  }
}
@media (scripting: enabled) {
  .scrolly-step {
    opacity: 0.45;
  }
  .scrolly-step.is-active {
    opacity: 1;
  }
}
</style>
