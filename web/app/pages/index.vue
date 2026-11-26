<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { useActiveId } from '~/composables/useActiveId'
import { coastalReach, cropOisst, recordAYearBefore, valueAt, warmestCell } from '~/utils/oisstMap'
import type { GridRecord } from '~/types/dataset'
import { formatAnomaly } from '~/utils/enso'
import {
  formatDay,
  formatDayMonth,
  formatDegrees,
  formatMonth,
  formatMonthName,
  formatValue,
} from '~/utils/format'
import { REGIONS, regionRain, regionSea, shapeCoastalRain } from '~/utils/region'
import { formatCount, formatFlow } from '~/utils/units'
import { icenPeak } from '~/utils/icen'
import {
  RAIN_THRESHOLD,
  formatSeason,
  monthsAbove,
  normalCurve,
  seasonDay,
  seasonOf,
  seasonPoints,
  shapeSeasons,
  warmestNormalMonth,
  weekBefore,
  weekNearest,
  weeksBetween,
} from '~/utils/season'
import { STEPS_2017, STEPS_2026, tollMarks, wordMarks, type PressStep } from '~/utils/palabra'
import { ENFEN_COMUNICADOS, SENAMHI_AVISOS } from '~/links'
import { useSiteSeo } from '~/composables/useSiteSeo'
import { paperCard } from '~/data/claims'
import IcenOverlay, { type OverlaySeries } from '~/components/IcenOverlay.vue'
import IcenTimeline, { type TimelineMark } from '~/components/IcenTimeline.vue'
import PaperCard from '~/components/PaperCard.vue'
import PressTimeline from '~/components/PressTimeline.vue'
import ScaleBars from '~/components/ScaleBars.vue'
import SeaMap, { type SeaPanel, type SeaRing } from '~/components/SeaMap.vue'
import SeasonChart, { type SeasonLine } from '~/components/SeasonChart.vue'
import UnitGrid from '~/components/UnitGrid.vue'

const story = messages.story

const oisst = await useDataset('noaa-oisst', cropOisst)
const weekly = await useDataset('noaa-cpc-nino-weekly', shapeSeasons([2016]))
const icen = await useDataset('enfen-icen')
const enfen = await useDataset('enfen-communique')
const rain6 = await useDataset('chirps', shapeCoastalRain)

// How hot: this week against its normal, a year earlier and the warmest month of a normal year.
const week = weekly.records.at(-1) ?? null
const season = week ? seasonOf(week.start) : null
const normal = normalCurve(weekly.records)
const peakMonth = warmestNormalMonth(normal)
const gap = week ? Math.round((week.sst - week.normal) * 10) / 10 : null
const heroAnswer =
  gap === null
    ? story.hero.empty
    : story.hero.answer(formatDegrees(Math.abs(gap)), Math.abs(gap) < 0.3 ? null : gap > 0)
const yearBefore = week ? weekBefore(weekly.records, week) : null
const yearBeforeRelation = (anomaly: number) =>
  anomaly < -0.5
    ? 'below'
    : anomaly <= -0.2
      ? 'slightlyBelow'
      : anomaly < 0.2
        ? 'normal'
        : anomaly <= 0.5
          ? 'slightlyAbove'
          : 'above'
const heroLead = week
  ? [
      story.hero.week(formatDay(week.start), formatDegrees(week.sst), formatDegrees(week.normal)),
      yearBefore
        ? story.hero.yearBefore(
            formatDegrees(yearBefore.sst),
            yearBeforeRelation(Math.round((yearBefore.sst - yearBefore.normal) * 10) / 10),
          )
        : '',
    ]
      .filter(Boolean)
      .join(' ')
  : null
const peakLine =
  week && peakMonth && gap !== null
    ? week.sst > peakMonth.value
      ? story.hero.warmerThanPeak(
          formatDegrees(gap),
          formatMonthName(Number(week.start.slice(5, 7))),
          formatMonthName(peakMonth.month),
          formatDegrees(peakMonth.value),
        )
      : story.hero.peak(formatMonthName(peakMonth.month), formatDegrees(peakMonth.value))
    : null
const peakPoint = peakMonth
  ? normal
      .filter((point) => Number(point.date.slice(5, 7)) === peakMonth.month)
      .reduce((best, point) => (point.value > best.value ? point : best))
  : null
const accentLine: SeasonLine | null =
  season === null
    ? null
    : {
        id: 'season',
        label: formatSeason(season),
        points: seasonPoints(weekly.records, season),
        tone: 'accent',
      }
const pastLine: SeasonLine | null =
  season === null || seasonPoints(weekly.records, season - 1).length === 0
    ? null
    : {
        id: 'past',
        label: formatSeason(season - 1),
        points: seasonPoints(weekly.records, season - 1),
        tone: 'past',
      }
const heroArrow =
  week && peakPoint && peakMonth && week.sst > peakMonth.value
    ? {
        from: { day: seasonDay(week.start), value: week.sst },
        to: { day: peakPoint.day, value: peakPoint.value },
        label: story.hero.arrow(formatMonthName(peakMonth.month)),
      }
    : undefined

// Why it does not rain: the normal crosses 26 °C only in late summer.
const normalAboveMonths = monthsAbove(normal, RAIN_THRESHOLD).map(formatMonthName)
const seasonAbove = accentLine?.points.find((point) => point.value > RAIN_THRESHOLD)
const thresholdSummary = [
  story.porque.normalAbove(normalAboveMonths),
  seasonAbove && accentLine
    ? story.porque.seasonAbove(
        accentLine.label,
        formatMonthName(Number(seasonAbove.date.slice(5, 7))),
      )
    : '',
]
  .filter(Boolean)
  .join(' ')

const latestIcen = icen.records.at(-1)
const latestIcenMonth = latestIcen ? formatMonth(latestIcen.start) : null
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

// Where the heat is: the latest map beside the same day a year before.
const seaRecord = oisst.records[0]
const seaYearBefore = recordAYearBefore(oisst.records)
const warmest = warmestCell(seaRecord)
const reach = coastalReach(seaRecord)
const calorAnswer = reach
  ? story.calor.answer(reach.from.name, reach.toEnd ? null : reach.to.name)
  : story.calor.unreached
const warmestThen =
  warmest && seaYearBefore ? valueAt(seaYearBefore, warmest.lat, warmest.lon) : null
const calorLead = [
  warmest ? story.calor.warmest(formatDegrees(warmest.value)) : null,
  warmestThen === null
    ? null
    : story.calor.yearBefore(
        formatDegrees(Math.abs(warmestThen)),
        formatDegrees(warmestThen) === formatDegrees(0)
          ? 'normal'
          : warmestThen > 0
            ? 'above'
            : 'below',
      ),
]
  .filter(Boolean)
  .join(' ')
const ringAt = (record: GridRecord, muted: boolean): SeaRing | null => {
  const value = warmest ? valueAt(record, warmest.lat, warmest.lon) : null
  return warmest && value !== null
    ? { lat: warmest.lat, lon: warmest.lon, label: story.map.ring(formatValue(value)), muted }
    : null
}
const seaPanels: SeaPanel[] = [
  { title: story.map.today, record: seaRecord, ring: ringAt(seaRecord, false), locator: true },
  ...(seaYearBefore
    ? [{ title: story.map.yearBefore, record: seaYearBefore, ring: ringAt(seaYearBefore, true) }]
    : []),
]
const seaSummary = story.map.summary(
  formatDay(seaRecord.end),
  seaYearBefore ? formatDay(seaYearBefore.end) : null,
)

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
// Each overlay lines events up by calendar month, from April of the first year.
const overlayFrom = { '1982-83': '1982-04', '1997-98': '1997-04', '2017': '2016-04' } as const
const overlayLabel = { '1982-83': '1982–83', '1997-98': '1997–98', '2017': '2016–17' } as const
const overlaySeries = (past: keyof typeof overlayFrom, accent: keyof typeof overlayFrom) =>
  ([past, accent] as const).map((id): OverlaySeries => ({
    id,
    label: overlayLabel[id],
    from: overlayFrom[id],
    peak: pastEvents.find((event) => event.id === id)?.peak?.start ?? null,
    tone: id === accent ? 'accent' : 'past',
  }))
const peak1983 = pastEvents[0]!.peak
const peak2017 = pastEvents[2]!.peak
const before1983 = peak1983 ? story.historia.before1983(formatAnomaly(peak1983.icen)) : null
const third2017 =
  peak1983 && peak2017
    ? story.historia.third2017(
        formatAnomaly(peak2017.icen),
        formatAnomaly(peak1983.icen),
        peak2017.icen < peak1983.icen / 3,
      )
    : null
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

// The word and the water: each step names the sea of its week beside the word.
const palabra = (prefix: string, steps: readonly PressStep[], from: string, to: string) => {
  const weeks = weeksBetween(weekly.records, from, to)
  const items = steps.map((step) => {
    const water = weekNearest(weeks, step.date)
    return {
      ...step,
      domId: `${prefix}-${step.id}`,
      lead: water
        ? story.palabra.water(formatDegrees(water.sst), formatDegrees(water.normal))
        : null,
    }
  })
  const active = useActiveId(
    items.map((item) => item.domId),
    '-50% 0px -30% 0px',
  )
  // Before the first step crosses the band the chart waits at that step's date.
  const until = computed(() =>
    active.value === null
      ? mounted.value
        ? (items[0]?.date ?? null)
        : null
      : (items.find((item) => item.domId === active.value)?.date ?? null),
  )
  return { from, to, weeks, items, active, until }
}
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
const palabra2017 = palabra('palabra17', STEPS_2017, '2017-01-01', '2017-06-30')
const palabra2026 = palabra('palabra26', STEPS_2026, '2026-01-01', '2026-09-30')

// Rain and what to do, from the communiqué in force.
const enfenRecord = enfen.records[0]
const forecastTitle = enfenRecord
  ? messages.page.forecastTitle(enfenRecord.number, enfenRecord.year)
  : messages.page.forecastEmptyTitle
const actionLead = enfenRecord
  ? messages.page.actionLead(enfenRecord.number, enfenRecord.year)
  : null

// Each coastal region: the sea off its coast, its rivers and its rain of the last month.
const regions = REGIONS.map((region) => {
  const sea = regionSea(seaRecord, region)
  const rain = regionRain(rain6.records, region.code)
  return {
    ...region,
    sea: sea
      ? story.region.seaValue(
          formatDay(seaRecord.end),
          region.coast.name,
          formatDegrees(Math.abs(sea.value)),
          formatDegrees(sea.value) === formatDegrees(0)
            ? 'normal'
            : sea.value > 0
              ? 'above'
              : 'below',
        )
      : story.region.seaEmpty,
    rivers: enfenRecord
      ? story.region.rivers(enfenRecord.number, enfenRecord.year, region.code)
      : null,
    rain,
    rainBars: rain
      ? [
          {
            id: 'total',
            label: story.region.rainSpan(formatDayMonth(rain.start), formatDayMonth(rain.end)),
            value: rain.total,
          },
          { id: 'normal', label: story.region.rainNormal, value: rain.normal },
        ]
      : [],
  }
})
const regionAnswer = regions.some((region) => region.rain)
  ? story.region.answer(
      regions.filter((region) => region.rain?.relation === 'above').map((region) => region.name),
    )
  : story.region.empty
const picked = ref(REGIONS[0]!.code)
const formatRain = (value: number) => formatCount(Math.round(value))

useSiteSeo({
  title: messages.page.seoTitle,
  description: messages.page.seoDescription,
  ogDescription: `${story.hero.question} ${heroAnswer}`,
})
</script>

<template>
  <div class="home">
    <div class="scene scene--green">
      <SiteHeader />
      <main id="main-content">
        <section class="apertura beat" aria-labelledby="home-title">
          <p class="lead">{{ story.apertura.words }}</p>
          <div class="clippings">
            <PaperCard featured :card="paperCard('panamericana-2026-09-16-devastador')" />
            <PaperCard :card="paperCard('apoyo-2026-trajectory')" />
            <PaperCard :card="paperCard('infobae-2026-11-17-tumbes')" />
          </div>
          <p class="lead">{{ story.apertura.headlines }}</p>
          <h1 id="home-title">
            <span class="answer">{{ story.apertura.question }}</span>
          </h1>
          <p class="lead">{{ story.apertura.promise }}</p>
        </section>
        <section class="hero beat" aria-labelledby="hero-title">
          <h2 id="hero-title">
            <span class="ask">{{ story.hero.question }}</span>
            <span class="answer"
              ><span class="strip">{{ heroAnswer }}</span></span
            >
          </h2>
          <p v-if="heroLead" class="lead">{{ heroLead }}</p>
          <p v-if="peakLine" class="lead">{{ peakLine }}</p>
          <div v-if="accentLine" class="figure">
            <ChartShell bare :dataset="weekly" :summary="story.hero.chartSummary">
              <SeasonChart
                :normal="normal"
                :normal-label="story.hero.normal"
                :lines="pastLine ? [pastLine, accentLine] : [accentLine]"
                :gap="
                  gap === null
                    ? undefined
                    : { lineId: accentLine.id, label: story.hero.gap(formatValue(gap)) }
                "
                :arrow="heroArrow"
                :scrub-label="story.hero.scrub"
                :table-caption="story.hero.table"
              />
            </ChartShell>
          </div>
          <p class="lead">{{ story.hero.handoff }}</p>
        </section>
      </main>
    </div>

    <section id="calor" class="scene scene--blue" aria-labelledby="calor-title">
      <div class="beat">
        <h2 id="calor-title">
          <span class="ask">{{ story.calor.question }}</span>
          <span class="answer">{{ calorAnswer }}</span>
        </h2>
        <p v-if="calorLead" class="lead">{{ calorLead }}</p>
        <div class="figure figure--map">
          <ChartShell bare :dataset="oisst" :summary="seaSummary">
            <SeaMap :panels="seaPanels" />
          </ChartShell>
        </div>
        <p class="lead">{{ story.calor.handoff }}</p>
      </div>
    </section>

    <section id="porque" class="scene scene--green" aria-labelledby="porque-title">
      <div class="beat">
        <h2 id="porque-title">
          <span class="ask">{{ story.porque.question }}</span>
          <span class="answer">{{ story.porque.answer }}</span>
        </h2>
        <p class="lead">
          {{ story.porque.physicist }} {{ story.porque.stable }} {{ story.porque.threshold }}
          {{ story.porque.season }}
        </p>
        <div v-if="accentLine" class="figure">
          <ChartShell bare :dataset="weekly" :summary="thresholdSummary">
            <SeasonChart
              :normal="normal"
              :normal-label="story.hero.normal"
              :lines="[accentLine]"
              :threshold="{ value: RAIN_THRESHOLD, label: story.porque.line }"
              plain-end
              :scrub-label="story.hero.scrub"
              :table-caption="story.porque.table"
            />
          </ChartShell>
        </div>
        <div class="press1925">
          <PaperCard :card="paperCard('elcomercio-1925-alisio')" />
          <p class="lead">{{ story.porque.press1925 }} {{ story.porque.seaAbsent }}</p>
        </div>
        <p class="lead">{{ story.porque.conditions }}</p>
        <p class="punch">
          <span class="strip">{{ story.porque.punch }}</span>
        </p>
      </div>
    </section>

    <section id="historia" class="scene scene--ink" aria-labelledby="historia-title">
      <div class="beat">
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
                :band-label="story.historia.overlay.band"
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
              <template v-if="step.id === '1982-83'">
                <figure class="units-figure">
                  <ScaleBars
                    :bars="story.historia.rain1983.bars"
                    :unit="story.historia.rain1983.unit"
                  />
                  <figcaption>{{ story.historia.rain1983.texts.join(' ') }}</figcaption>
                </figure>
                <p>{{ story.historia.dead1983.question }}</p>
                <figure class="units-figure">
                  <UnitGrid
                    shape="dot"
                    :rows="story.historia.dead1983.rows"
                    :unit="story.historia.dead1983.unit"
                  />
                  <figcaption>
                    {{ story.historia.dead1983.rows.map((row) => row.text).join(' ') }}
                  </figcaption>
                </figure>
              </template>
              <template v-if="step.id === '1997-98'">
                <p>{{ story.historia.woodman }}</p>
                <PaperCard :card="paperCard('igp-woodman-1997-lejos')" />
                <figure class="units-figure">
                  <IcenOverlay
                    :records="icen.records"
                    :series="overlaySeries('1982-83', '1997-98')"
                    :pin="{
                      seriesId: '1997-98',
                      start: '1997-07',
                      label: story.historia.overlay.lejos,
                    }"
                    :band-label="story.historia.overlay.band"
                    :scrub-label="story.historia.overlay.scrub"
                    :table-caption="story.historia.overlay.table('1982–83', '1997–98')"
                  />
                  <figcaption>{{ story.historia.overlay.caption }}</figcaption>
                </figure>
                <p v-if="before1983">{{ before1983 }}</p>
                <p>{{ story.historia.damage8298 }}</p>
                <figure class="units-figure">
                  <ScaleBars
                    :bars="story.historia.river.bars"
                    :unit="story.historia.river.unit"
                    :lines="[story.historia.river.line]"
                  />
                  <figcaption>{{ story.historia.river.texts.join(' ') }}</figcaption>
                </figure>
              </template>
              <template v-if="step.id === '2017'">
                <figure class="units-figure">
                  <IcenOverlay
                    :records="icen.records"
                    :series="overlaySeries('1982-83', '2017')"
                    :band-label="story.historia.overlay.band"
                    :scrub-label="story.historia.overlay.scrub"
                    :table-caption="story.historia.overlay.table('1982–83', '2016–17')"
                  />
                  <figcaption>{{ story.historia.overlay.caption }}</figcaption>
                </figure>
                <p v-if="third2017">{{ third2017 }}</p>
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

    <section id="palabra" class="scene scene--blue" aria-labelledby="palabra-title">
      <div class="beat">
        <h2 id="palabra-title">
          <span class="ask">{{ story.palabra.question }}</span>
          <span class="answer">{{ story.palabra.answer }}</span>
        </h2>
        <p class="lead">{{ story.palabra.intro }}</p>
        <!-- The figure holds the steps too, so its caption leaves the sticky chart small. -->
        <ChartShell
          v-if="palabra2017.weeks.length"
          bare
          class="press-figure"
          :dataset="weekly"
          :summary="story.palabra.chart2017"
        >
          <div class="scrolly">
            <div class="scrolly-chart">
              <PressTimeline
                :weeks="palabra2017.weeks"
                :from="palabra2017.from"
                :to="palabra2017.to"
                :sst-label="story.palabra.sst"
                :normal-label="story.hero.normal"
                :words="wordMarks(STEPS_2017)"
                :tolls="tollMarks(STEPS_2017)"
                :threshold="{ value: RAIN_THRESHOLD, label: story.porque.line }"
                ring="2017-03-16"
                :until="palabra2017.until.value"
                :table-caption="story.palabra.table2017"
              />
            </div>
            <ol class="scrolly-steps">
              <li
                v-for="step in palabra2017.items"
                :id="step.domId"
                :key="step.id"
                class="scrolly-step"
                :class="{ 'is-active': palabra2017.active.value === step.domId }"
              >
                <PaperCard v-if="step.card" :card="step.card" />
                <p v-if="step.toll" class="step-lead">{{ story.palabra.toll(step.toll) }}</p>
                <p v-if="step.lead" :class="step.toll ? null : 'step-lead'">{{ step.lead }}</p>
                <p v-for="text in step.texts" :key="text">{{ text }}</p>
              </li>
            </ol>
          </div>
        </ChartShell>
        <p class="lead">{{ story.palabra.scale }}</p>
        <p class="punch">
          <span class="strip">{{ story.palabra.punch }}</span>
        </p>
        <p class="lead">{{ story.palabra.ranking }}</p>
        <p class="lead">{{ story.palabra.before }}</p>
        <p class="lead">{{ story.palabra.prevention }} {{ story.palabra.credibility }}</p>
        <p class="punch punch--turn">{{ story.palabra.open2026 }}</p>
        <ChartShell
          v-if="palabra2026.weeks.length"
          bare
          class="press-figure"
          :dataset="weekly"
          :summary="story.palabra.chart2026"
        >
          <div class="scrolly">
            <div class="scrolly-chart">
              <PressTimeline
                :weeks="palabra2026.weeks"
                :from="palabra2026.from"
                :to="palabra2026.to"
                :sst-label="story.palabra.sst"
                :normal-label="story.hero.normal"
                :words="wordMarks(STEPS_2026)"
                :until="palabra2026.until.value"
                :table-caption="story.palabra.table2026"
              />
            </div>
            <ol class="scrolly-steps">
              <li
                v-for="step in palabra2026.items"
                :id="step.domId"
                :key="step.id"
                class="scrolly-step"
                :class="{ 'is-active': palabra2026.active.value === step.domId }"
              >
                <div v-if="step.report" class="press-pair">
                  <PaperCard v-if="step.card" :card="step.card" />
                  <PaperCard :card="step.report.card" />
                </div>
                <PaperCard v-else-if="step.card" :card="step.card" />
                <p v-if="step.lead" class="step-lead">{{ step.lead }}</p>
                <p v-for="text in step.texts" :key="text">{{ text }}</p>
                <p v-if="step.report">{{ step.report.text }}</p>
              </li>
            </ol>
          </div>
        </ChartShell>
        <p class="punch">
          <span class="strip">{{ story.palabra.handoff }}</span>
        </p>
      </div>
    </section>

    <section id="lluvia" class="scene scene--green" aria-labelledby="lluvia-title">
      <div class="beat">
        <h2 id="lluvia-title">
          <span class="ask">{{ story.lluvia.question }}</span>
          <span class="answer">{{ forecastTitle }}</span>
        </h2>
        <template v-if="enfenRecord">
          <p class="lead">{{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}</p>
          <p class="source">
            <strong class="status strip">{{ enfenRecord.status }}.</strong>{{ ' ' }}
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
            {{ messages.page.nextDueStale(formatDay(enfenRecord.end)) }}
          </p>
        </template>
      </div>
    </section>

    <section id="region" class="scene scene--blue" aria-labelledby="region-title">
      <div class="beat">
        <h2 id="region-title">
          <span class="ask">{{ story.region.question }}</span>
          <span class="answer">{{ regionAnswer }}</span>
        </h2>
        <p class="lead">{{ story.region.lead }}</p>
        <!-- Without JavaScript every region shows; the picker only narrows it to one. -->
        <label v-if="mounted" class="region-pick">
          <span>{{ story.region.pick }}</span>
          <select v-model="picked">
            <option v-for="region in regions" :key="region.code" :value="region.code">
              {{ region.name }}
            </option>
          </select>
        </label>
        <article
          v-for="region in regions"
          v-show="!mounted || picked === region.code"
          :key="region.code"
          class="region-panel"
          :aria-labelledby="`region-${region.code}`"
        >
          <!-- Once the picker shows, it names the region; the heading stays for screen readers. -->
          <h3 :id="`region-${region.code}`" :class="{ 'sr-only': mounted }">{{ region.name }}</h3>
          <h4>{{ story.region.sea }}</h4>
          <p>{{ region.sea }}</p>
          <h4>{{ story.region.river }}</h4>
          <figure v-if="region.code === 'PE24'" class="units-figure">
            <ScaleBars
              :bars="story.region.tumbes.bars"
              :unit="story.region.tumbes.unit"
              :lines="story.region.tumbes.lines"
              :format="formatFlow"
            />
            <figcaption>{{ story.region.tumbes.texts.join(' ') }}</figcaption>
          </figure>
          <p v-else>{{ story.region.noThreshold }}</p>
          <p v-if="region.rivers">{{ region.rivers }}</p>
          <h4>{{ story.region.rain }}</h4>
          <template v-if="region.rain">
            <ChartShell bare :dataset="rain6" :summary="story.region.rainSummary">
              <ScaleBars
                :bars="region.rainBars"
                :unit="story.region.rainUnit"
                :format="formatRain"
              />
            </ChartShell>
            <p>{{ story.region.rainValue(region.rain.relation) }}</p>
          </template>
          <p v-else>{{ story.region.rainEmpty }}</p>
        </article>
      </div>
    </section>

    <section id="hacer" class="scene scene--red" aria-labelledby="hacer-title">
      <div class="beat">
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

    <footer class="scene scene--ink">
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
  --deep: var(--ground);
  --on-deep: var(--on-scene);
  --on-deep-muted: var(--on-scene-muted);
  --text: var(--on-scene);
  --muted: var(--on-scene-muted);
  --faint: var(--on-scene-muted);
  --border: color-mix(in srgb, var(--on-scene) 18%, transparent);
  --surface: transparent;
  --band: color-mix(in srgb, var(--on-scene) 8%, transparent);
  --accent: var(--warm-on-deep);
  --link: var(--on-scene);
  --focus: var(--on-scene);
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(120% 80% at 20% 0%, color-mix(in srgb, white 7%, transparent), transparent 60%),
    var(--ground);
  color: var(--on-scene);
}
.scene::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: var(--grain);
  mix-blend-mode: overlay;
  opacity: 0.22;
  pointer-events: none;
}
.scene--green {
  --ground: var(--scene-green);
}
.scene--blue {
  --ground: var(--scene-blue);
}
.scene--ink {
  --ground: var(--scene-ink);
}
.scene--red {
  --ground: var(--scene-red);
  --on-deep-muted: var(--on-red-muted);
  --muted: var(--on-red-muted);
}
a {
  color: var(--on-scene);
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
.apertura {
  padding-top: clamp(3rem, 2rem + 6vw, 7rem);
}
.hero {
  padding-top: 0;
}

/* Press clippings: the headline card on its own row, the others beside each other, each laid
   down a little askew and a beat after the one before. */
.clippings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 26rem));
  gap: var(--space-8) var(--space-12);
  align-items: start;
}
.clippings > :first-child {
  grid-column: 1 / -1;
  --tilt: -1.2deg;
}
.clippings > :nth-child(2) {
  --tilt: 0.8deg;
  --drop-delay: 160ms;
}
.clippings > :nth-child(3) {
  --tilt: -0.6deg;
  --drop-delay: 320ms;
  margin-top: var(--space-8);
}
.press1925 {
  display: grid;
  grid-template-columns: minmax(0, 24rem) minmax(0, 36rem);
  gap: var(--space-12);
  align-items: center;
  --tilt: 1deg;
}
@media (max-width: 860px) {
  .clippings,
  .press1925 {
    grid-template-columns: minmax(0, 1fr);
  }
  .clippings > :nth-child(3) {
    margin-top: 0;
  }
}
.beat > * + *,
.beat-text > * + * {
  margin-top: var(--space-8);
}
.beat > .figure,
.beat > .scrolly,
.beat > .press-figure {
  margin-top: var(--space-16);
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
h1 .answer,
.hero .answer {
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
  background: var(--strip) center / 100% 100% no-repeat;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
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
/* Both days stay in one screen on a laptop: each map is close to square. */
.figure--map {
  max-width: 58rem;
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
/* The turn to 2026 opens the second chart, so it is a heading line, not a strip. */
.punch--turn {
  max-width: 20ch;
  font-size: clamp(2rem, 1.3rem + 2.8vw, 3.75rem);
}

/* A unit chart sits in its step, with the claims it draws as its caption. */
.units-figure {
  display: grid;
  gap: var(--space-3);
  margin: 0;
}
.units-figure figcaption {
  color: var(--on-scene-muted);
  font-size: var(--text-meta);
  line-height: 1.45;
}

/* The headline over what the forecaster wrote that fortnight. */
.press-pair {
  display: grid;
  gap: var(--space-6);
}
.press-pair > :first-child {
  --tilt: -1deg;
}
.press-pair > :last-child {
  --tilt: 0.6deg;
  --drop-delay: 160ms;
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
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-weight: 700;
  letter-spacing: -0.01em;
}

/* Region: one panel at a time, each row a short head over its sentence or chart. */
.region-pick {
  display: grid;
  gap: var(--space-2);
  max-width: 24rem;
  font-size: var(--text-meta);
  color: var(--on-scene-muted);
}
.region-pick select {
  min-height: 52px;
  padding: 0 var(--space-4);
  border: 2px solid var(--on-scene);
  border-radius: 0;
  background: var(--ground);
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: var(--text-lead);
  font-weight: 700;
}
.region-panel {
  display: grid;
  gap: var(--space-3);
  max-width: 40rem;
  color: var(--on-scene-muted);
  font-size: var(--text-body);
  line-height: 1.6;
}
.beat > .region-panel {
  margin-top: var(--space-8);
}
.region-panel > * {
  margin: 0;
}
.region-panel h3 {
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 1.3rem + 1.4vw, 2.5rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.08;
}
.region-panel > h4 {
  margin-top: var(--space-8);
  color: var(--on-scene);
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
  color: var(--scene-red);
}
.actions a:hover {
  text-decoration: underline;
  text-decoration-thickness: 2px;
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
