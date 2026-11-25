<script setup lang="ts">
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { buildOisstMap, cropOisst, formatCoordinate } from '~/utils/oisstMap'
import { shapeSenamhiDataset } from '~/utils/senamhi'
import { formatAnomaly } from '~/utils/enso'
import { formatDay, formatMonth, formatValue } from '~/utils/format'
import { icenCategory, icenPeak, icenRank } from '~/utils/icen'
import { ENFEN_COMUNICADOS, SENAMHI_AVISOS } from '~/links'
import { useSiteSeo } from '~/composables/useSiteSeo'
import IcenChart from '~/components/IcenChart.vue'
import NinoWeeklyPanel from '~/components/NinoWeeklyPanel.vue'
import OutlookPanel from '~/components/OutlookPanel.vue'
import OisstMap from '~/components/OisstMap.vue'
import SenamhiRainChart from '~/components/SenamhiRainChart.vue'

const oisst = await useDataset('noaa-oisst', cropOisst)
const weekly = await useDataset('noaa-cpc-nino-weekly')
const icen = await useDataset('enfen-icen')
const enfen = await useDataset('enfen-communique')
const outlook = await useDataset('noaa-cpc-outlook')
const senamhi = await useDataset('senamhi-estaciones', shapeSenamhiDataset)

const enfenRecord = enfen.records[0]
const latestIcen = icen.records.at(-1)
const latestIcenMonth = latestIcen ? formatMonth(latestIcen.start) : null
const icenSince = icen.records[0]?.start.slice(0, 4) ?? ''
const headline = latestIcen
  ? messages.page.homeHeadline(
      latestIcenMonth!,
      formatAnomaly(latestIcen.icen),
      icenRank(icen.records, latestIcen.icen),
      icenSince,
    )
  : messages.page.homeEmptyHeadline
const category = latestIcen ? icenCategory(latestIcen.icen) : null

const pastEvents = (
  [
    ['1982-83', '1982-07', '1983-11'],
    ['1997-98', '1997-04', '1998-08'],
    ['2017', '2017-01', '2017-04'],
  ] as const
).map(([id, start, end]) => ({
  id,
  label: messages.historico.events[id],
  name: messages.page.comparisonEvents[id],
  peak: icenPeak(icen.records, start, end),
}))
const comparison = [
  ...pastEvents,
  {
    id: 'current',
    label: messages.page.currentLabel(latestIcen?.start.slice(0, 4) ?? '—'),
    peak: latestIcen ?? null,
  },
].map((event) => ({
  ...event,
  value: event.peak?.icen ?? null,
  metricLabel:
    event.id === 'current'
      ? messages.page.latestLabel
      : event.peak
        ? messages.page.peakLabel(formatMonth(event.peak.start))
        : messages.historico.noPeak,
}))
const comparedEvents = pastEvents.filter((event) => event.peak && latestIcen)
const comparisonTitle = messages.page.comparisonTitle(
  comparedEvents.filter((event) => latestIcen!.icen > event.peak!.icen).map((event) => event.name),
  comparedEvents.filter((event) => latestIcen!.icen <= event.peak!.icen).map((event) => event.name),
)
const maxComparison = Math.max(...comparison.map((event) => event.value ?? 0), 1)
const comparisonWidth = (value: number | null) =>
  `${Math.max(4, ((value ?? 0) / maxComparison) * 100)}%`

const warmest = oisst.records[0] ? buildOisstMap(oisst.records[0]).warmest : null
const mapTitle = warmest
  ? messages.page.mapTitle(
      formatAnomaly(warmest.value),
      `${formatCoordinate(warmest.lat, 'latitude')}, ${formatCoordinate(warmest.lon, 'longitude')}`,
    )
  : messages.page.mapEmptyTitle

const latestWeek = weekly.records.findLast((record) => record.nino_1_2_anomaly !== null)
const latestWeekDay = latestWeek ? formatDay(latestWeek.end) : null
const weeklyTitle =
  latestWeek && latestWeek.nino_1_2_anomaly !== null
    ? messages.page.weeklyTitle(
        latestWeekDay!,
        formatValue(latestWeek.nino_1_2_anomaly),
        latestWeek.nino_1_2_anomaly > 0,
      )
    : messages.page.weeklyEmptyTitle

const actionLead = enfenRecord
  ? messages.page.actionLead(enfenRecord.number, enfenRecord.year)
  : null
const sources = [oisst, weekly, icen, enfen, outlook, senamhi].map((dataset) => ({
  id: dataset.id,
  variable: dataset.variable,
  institution: dataset.source.institution,
  product: dataset.source.product,
  url: dataset.source.url,
}))

useSiteSeo({
  title: messages.page.seoTitle,
  description: messages.page.seoDescription,
  ogDescription: headline,
})
</script>

<template>
  <div class="home">
    <SiteHeader />

    <main id="main-content">
      <section class="hero" aria-labelledby="home-title">
        <div class="hero-copy">
          <p class="eyebrow">
            {{
              enfenRecord
                ? enfenRecord.stale
                  ? messages.panels.enfen.latestStatus
                  : messages.page.homeEyebrow(enfenRecord.number, enfenRecord.year)
                : messages.page.emptyEnfenTitle
            }}
          </p>
          <h1 id="home-title">{{ headline }}</h1>
          <p v-if="category" class="hero-category">
            {{ messages.page.homeCategory(messages.page.icenCategories[category]) }}
          </p>
          <p v-if="enfenRecord" class="hero-lead">
            {{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}
          </p>
          <p v-if="latestIcenMonth" class="hero-meta">
            {{ messages.page.homeSource(icen.source.institution, latestIcenMonth) }}
          </p>
        </div>
        <aside
          v-if="enfenRecord"
          class="status-card"
          :class="{
            'status-card--alert': enfenRecord.status.startsWith('Alerta'),
          }"
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
      </section>

      <section class="section comparison-section" aria-labelledby="comparison-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionScale }}</p>
          <h2 id="comparison-title">{{ comparisonTitle }}</h2>
          <p>{{ messages.page.comparisonLead }}</p>
        </div>
        <div class="comparison-grid">
          <article v-for="event in comparison" :key="event.id" class="comparison-card">
            <div class="comparison-topline">
              <h3>{{ event.label }}</h3>
              <strong v-if="event.value !== null"
                >{{ formatAnomaly(event.value) }} {{ messages.page.degreeC }}</strong
              >
              <span v-else>—</span>
            </div>
            <div class="comparison-bar" aria-hidden="true">
              <span :style="{ width: comparisonWidth(event.value) }" />
            </div>
            <p>{{ event.metricLabel }}</p>
          </article>
        </div>
        <aside class="note">
          <h3>{{ messages.page.damageTitle }}</h3>
          <p>{{ messages.page.damageLead }}</p>
        </aside>
      </section>

      <section class="section coast" aria-labelledby="map-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionMap }}</p>
          <h2 id="map-title">{{ mapTitle }}</h2>
          <p>{{ messages.page.coastLead }}</p>
        </div>
        <figure class="figure">
          <OisstMap :dataset="oisst" />
        </figure>
      </section>

      <section class="section evidence" aria-labelledby="weekly-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionWeekly }}</p>
          <h2 id="weekly-title">{{ weeklyTitle }}</h2>
          <p>{{ messages.page.weeklyLead }}</p>
        </div>
        <NinoWeeklyPanel :dataset="weekly" />
        <div class="subsection" aria-labelledby="icen-title">
          <div class="section-heading">
            <h3 id="icen-title">{{ messages.page.icenTitle }}</h3>
            <p>{{ messages.page.icenLead }}</p>
            <p v-if="latestIcenMonth && latestWeekDay" class="icen-lag">
              {{ messages.page.icenLag(latestIcenMonth, latestWeekDay) }}
            </p>
          </div>
          <IcenChart :dataset="icen" />
        </div>
      </section>

      <section class="section forecast" aria-labelledby="forecast-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionForecast }}</p>
          <h2 id="forecast-title">
            {{
              enfenRecord
                ? messages.page.forecastTitle(enfenRecord.number, enfenRecord.year)
                : messages.page.forecastEmptyTitle
            }}
          </h2>
        </div>
        <div class="forecast-grid">
          <article v-if="enfenRecord" class="forecast-copy">
            <ul class="forecast-points">
              <li
                v-for="point in messages.page.forecastPoints(enfenRecord.number, enfenRecord.year)"
                :key="point"
              >
                {{ point }}
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
          </article>
          <OutlookPanel :dataset="outlook" />
        </div>
      </section>

      <section class="section impact" aria-labelledby="impact-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionPrecedent }}</p>
          <h2 id="impact-title">{{ messages.page.impactTitle }}</h2>
          <p>{{ messages.page.impactLead }}</p>
          <p>{{ messages.page.impactLimits }}</p>
        </div>
        <p class="chart-lead">{{ messages.page.impactChartLead }}</p>
        <SenamhiRainChart :dataset="senamhi" />
        <p class="coverage-note">{{ messages.page.impactCoverage }}</p>
        <aside class="note not-shown">
          <h3>{{ messages.page.notShownTitle }}</h3>
          <p>{{ messages.page.notShown }}</p>
        </aside>
      </section>

      <section class="section action" aria-labelledby="action-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionAction }}</p>
          <h2 id="action-title">{{ messages.page.actionTitle }}</h2>
          <p v-if="actionLead">{{ actionLead }}</p>
        </div>
        <div class="source-links">
          <a :href="ENFEN_COMUNICADOS" target="_blank" rel="noopener">
            {{ messages.page.enfenLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
          <a :href="SENAMHI_AVISOS" target="_blank" rel="noopener">
            {{ messages.page.senamhiLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
          </a>
        </div>
        <p class="local-lead">{{ messages.page.localLead }}</p>
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
      </section>

      <section class="section sources" aria-labelledby="sources-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionSources }}</p>
          <h2 id="sources-title">{{ messages.page.sourcesTitle }}</h2>
          <p>{{ messages.page.sourcesLead }}</p>
        </div>
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
  min-height: 100svh;
  background: var(--paper);
}
.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 18px 24px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: var(--text-meta);
}
main {
  max-width: var(--content-width);
  margin: 0 auto;
}
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.6fr);
  align-items: end;
  gap: var(--space-12);
  padding: var(--space-16) var(--gutter);
  border-bottom: 1px solid var(--border);
}
.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 1.3;
  text-transform: uppercase;
}
h1,
h2,
h3,
p {
  text-wrap: pretty;
}
h1 {
  max-width: 20ch;
  margin: 0;
  font-size: var(--text-display);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.08;
}
.hero-category {
  margin: var(--space-4) 0 0;
  color: var(--warm);
  font-weight: 600;
}
.hero-lead {
  max-width: 38rem;
  margin: var(--space-4) 0 0;
  font-size: var(--text-body);
  line-height: 1.5;
}
.hero-meta {
  margin: var(--space-4) 0 0;
  color: var(--muted);
  font-size: var(--text-meta);
}
.status-card {
  display: grid;
  gap: 12px;
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-top: 4px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  box-shadow: var(--shadow-card);
}
.status-card--alert {
  border-top-color: var(--warm);
}
.status-kicker,
.local-label {
  color: var(--muted);
  font-size: var(--text-meta);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.status-card strong {
  font-size: var(--text-title-sm);
  line-height: 1.1;
}
.status-card span:not(.status-kicker) {
  color: var(--muted);
  font-size: var(--text-body);
  line-height: 1.45;
}
.section {
  padding: var(--space-16) var(--gutter) 0;
}
.section-heading {
  max-width: var(--reading-width);
  margin-bottom: var(--space-8);
}
h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--text-title-sm);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
h3 {
  margin: 0 0 var(--space-3);
  font-size: var(--text-body);
  line-height: 1.25;
}
.section-heading p {
  margin: 0 0 var(--space-3);
  color: var(--muted);
}
.section-heading p:last-child {
  margin-bottom: 0;
}
.figure {
  min-width: 0;
  margin: 0;
}
.evidence {
  margin-top: var(--space-16);
  padding-bottom: var(--space-16);
  background: var(--sea);
}
.evidence :deep(.panel) {
  padding-top: 0;
}
.subsection {
  margin-top: var(--space-12);
}
.icen-lag {
  color: var(--text) !important;
  font-weight: 600;
}
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  border: 1px solid var(--border);
  background: var(--border);
}
.comparison-card {
  display: grid;
  gap: 24px;
  min-height: 150px;
  padding: 20px;
  background: var(--paper);
}
.comparison-topline {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}
.comparison-topline h3 {
  margin: 0;
}
.comparison-topline strong {
  white-space: nowrap;
  font-size: var(--text-body);
  font-variant-numeric: tabular-nums;
}
.comparison-bar {
  align-self: end;
  height: 8px;
  background: var(--band);
}
.comparison-bar span {
  display: block;
  height: 100%;
  background: var(--warm);
}
.comparison-card p {
  margin: 0;
  color: var(--muted);
  font-size: var(--text-meta);
}
.note {
  max-width: var(--reading-width);
  margin-top: var(--space-8);
  padding: var(--space-5) var(--space-6);
  border-left: 4px solid var(--accent);
  background: var(--band);
}
.note p {
  margin: 0;
}
.forecast-grid {
  display: grid;
  grid-template-columns: minmax(16rem, 0.9fr) minmax(0, 1.1fr);
  align-items: start;
  gap: var(--space-12);
}
.forecast-copy {
  display: grid;
  gap: 18px;
  padding: var(--space-6);
  border-left: 4px solid var(--warm);
  background: var(--band);
}
.forecast-points {
  display: grid;
  gap: 14px;
  margin: 0;
  padding-left: 1.1rem;
}
.forecast-source {
  margin: 0;
  font-size: var(--text-meta);
  font-weight: 600;
}
.forecast-grid :deep(.outlook-panel) {
  padding-top: 0;
}
.forecast-grid :deep(.outlook-panel .prose) {
  padding-inline: 0;
}
.forecast-grid :deep(.outlook-panel .figure) {
  padding-inline: 0;
}
.impact {
  margin-top: var(--space-16);
  padding-bottom: var(--space-16);
  background: var(--sand);
}
.impact :deep(.chart-shell) {
  background: var(--paper);
}
.impact .note {
  background: var(--paper);
}
.chart-lead {
  max-width: var(--reading-width);
  margin: 0 0 var(--space-4);
  font-weight: 600;
}
.coverage-note {
  max-width: var(--reading-width);
  margin: 14px 0 0;
  color: var(--muted);
  font-size: var(--text-meta);
}
.source-links {
  display: grid;
  gap: 4px;
  margin-bottom: var(--space-8);
  font-weight: 600;
}
.local-lead {
  margin: 0 0 var(--space-4);
  color: var(--muted);
}
.local-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}
.local-card {
  display: grid;
  align-content: start;
  gap: 10px;
  min-height: 150px;
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}
.local-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}
.local-card strong {
  font-size: var(--text-title-sm);
}
.local-card span:last-child {
  color: var(--muted);
  font-size: var(--text-meta);
  line-height: 1.4;
}
.sources {
  padding-bottom: var(--space-16);
}
.source-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--space-3) var(--space-8);
  margin: 0 0 var(--space-6);
  padding: 0;
  list-style: none;
  font-size: var(--text-meta);
}
.source-list li {
  display: grid;
  gap: 2px;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}
.source-list span {
  color: var(--muted);
}
.method-link {
  font-weight: 600;
}
@media (prefers-reduced-motion: reduce) {
  .local-card {
    transition: none;
  }
}
@media (max-width: 900px) {
  .hero,
  .forecast-grid {
    grid-template-columns: 1fr;
  }
  .status-card {
    max-width: 30rem;
  }
  .comparison-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 599px) {
  .site-footer {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px 18px;
    padding-inline: var(--gutter);
  }
  .hero {
    gap: var(--space-6);
    padding-block: var(--space-8);
  }
  .hero,
  .section {
    padding-inline: var(--gutter);
  }
  h1 {
    font-size: var(--text-title);
  }
  .local-grid,
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
