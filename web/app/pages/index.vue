<script setup lang="ts">
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { cropOisst } from '~/utils/oisstMap'
import { shapeSenamhiDataset } from '~/utils/senamhi'
import { formatDay, formatMonth, formatValue } from '~/utils/format'
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
const peakIcen = (start: string, end: string) =>
  icen.records
    .filter((record) => record.start >= start && record.start <= end)
    .reduce<(typeof icen.records)[number] | null>(
      (peak, record) => (peak === null || record.icen > peak.icen ? record : peak),
      null,
    )
const comparison = [
  {
    id: '1982-83',
    label: messages.historico.events['1982-83'],
    peak: peakIcen('1982-07', '1983-11'),
  },
  {
    id: '1997-98',
    label: messages.historico.events['1997-98'],
    peak: peakIcen('1997-04', '1998-08'),
  },
  {
    id: '2017',
    label: messages.historico.events['2017'],
    peak: peakIcen('2017-01', '2017-04'),
  },
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
const maxComparison = Math.max(...comparison.map((event) => event.value ?? 0), 1)
const comparisonWidth = (value: number | null) =>
  `${Math.max(4, ((value ?? 0) / maxComparison) * 100)}%`

useSiteSeo({
  title: messages.page.seoTitle,
  description: messages.page.seoDescription,
  ogDescription: enfenRecord
    ? messages.page.homeLead(enfenRecord.number, enfenRecord.year)
    : messages.page.emptyEnfenTitle,
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
          <h1 id="home-title">{{ enfenRecord?.status ?? messages.page.emptyEnfenTitle }}</h1>
          <p v-if="enfenRecord" class="hero-lead">
            {{ messages.page.homeLead(enfenRecord.number, enfenRecord.year) }}
          </p>
          <p v-if="enfenRecord" class="hero-meta">
            {{ messages.page.communiqueMeta(enfenRecord.number, enfenRecord.year) }}
            <time :datetime="enfenRecord.start">{{ formatDay(enfenRecord.start) }}</time>
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

      <section class="section coast" aria-labelledby="coast-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionSignal }}</p>
          <h2 id="coast-title">{{ messages.page.coastTitle }}</h2>
          <p>{{ messages.page.coastLead }}</p>
        </div>
        <div class="map-layout">
          <div class="map-note">
            <h3>{{ messages.page.mapTitle }}</h3>
            <p>{{ oisst.variable }}</p>
            <a :href="oisst.source.url" target="_blank" rel="noopener">
              {{ messages.page.reviewSource }} · {{ oisst.source.institution }}
              <span class="sr-only">{{ messages.page.newTab }}</span>
            </a>
          </div>
          <figure class="figure">
            <OisstMap :dataset="oisst" />
          </figure>
        </div>
      </section>

      <section class="section evidence" aria-labelledby="evidence-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionMeasure }}</p>
          <h2 id="evidence-title">{{ messages.page.evidenceTitle }}</h2>
          <p>{{ messages.page.weeklyLead }}</p>
        </div>
        <NinoWeeklyPanel :dataset="weekly" />
        <div class="subsection" aria-labelledby="icen-title">
          <div class="subsection-heading">
            <h3 id="icen-title">{{ messages.page.icenTitle }}</h3>
            <p>{{ messages.historico.icenSummary }}</p>
          </div>
          <IcenChart :dataset="icen" />
        </div>
      </section>

      <section class="section comparison-section" aria-labelledby="comparison-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionScale }}</p>
          <h2 id="comparison-title">{{ messages.page.comparisonTitle }}</h2>
          <p>{{ messages.page.comparisonLead }}</p>
        </div>
        <div class="comparison-grid">
          <article v-for="event in comparison" :key="event.id" class="comparison-card">
            <div class="comparison-topline">
              <h3>{{ event.label }}</h3>
              <strong v-if="event.value !== null"
                >{{ formatValue(event.value) }} {{ messages.page.degreeC }}</strong
              >
              <span v-else>—</span>
            </div>
            <div class="comparison-bar" aria-hidden="true">
              <span :style="{ width: comparisonWidth(event.value) }" />
            </div>
            <p>{{ event.metricLabel }}</p>
          </article>
        </div>
      </section>

      <section class="section impact" aria-labelledby="impact-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionPrecedent }}</p>
          <h2 id="impact-title">{{ messages.page.impactTitle }}</h2>
          <p>{{ messages.page.impactLead }}</p>
          <p class="coverage-note">{{ messages.page.impactCoverage }}</p>
        </div>
        <SenamhiRainChart :dataset="senamhi" />
      </section>

      <section class="section forecast" aria-labelledby="forecast-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionNext }}</p>
          <h2 id="forecast-title">{{ messages.page.forecastTitle }}</h2>
        </div>
        <div class="forecast-grid">
          <article class="forecast-copy">
            <p>{{ messages.page.forecastLead }}</p>
            <p>{{ messages.page.summerLead }}</p>
            <p>{{ messages.page.temperatureLead }}</p>
            <div class="source-links">
              <a :href="ENFEN_COMUNICADOS" target="_blank" rel="noopener">
                {{ messages.page.enfenLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
              </a>
              <a :href="SENAMHI_AVISOS" target="_blank" rel="noopener">
                {{ messages.page.senamhiLink
                }}<span class="sr-only">{{ messages.page.newTab }}</span>
              </a>
            </div>
          </article>
          <OutlookPanel :dataset="outlook" />
        </div>
      </section>

      <section class="section local" aria-labelledby="local-title">
        <div class="section-heading">
          <p class="eyebrow">{{ messages.page.sectionDecision }}</p>
          <h2 id="local-title">{{ messages.page.localTitle }}</h2>
          <p>{{ messages.page.localLead }}</p>
        </div>
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
  gap: 24px;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 18px 24px;
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
  min-height: 34rem;
  padding: var(--space-16) var(--gutter) var(--space-16);
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
  max-width: 10ch;
  margin: 0;
  font-size: var(--text-display);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1;
}
.hero-lead {
  max-width: 38rem;
  margin: var(--space-6) 0 0;
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
  line-height: 1.1;
}
h3 {
  margin: 0;
  font-size: var(--text-title-sm);
  line-height: 1.1;
}
.section-heading > p:last-child,
.subsection-heading p,
.coverage-note {
  margin: 0;
  color: var(--muted);
}
.map-layout {
  display: grid;
  grid-template-columns: minmax(12rem, 0.5fr) minmax(0, 1.5fr);
  align-items: start;
  gap: var(--space-12);
}
.map-note {
  padding-top: 22px;
  border-top: 2px solid var(--accent);
}
.map-note p {
  margin: var(--space-3) 0 var(--space-5);
  color: var(--muted);
}
.figure {
  min-width: 0;
  margin: 0;
}
.evidence {
  background: var(--sea);
}
.evidence :deep(.panel) {
  padding-top: 0;
}
.subsection {
  margin-top: var(--space-12);
}
.subsection-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}
.subsection-heading p {
  max-width: 30rem;
}
.comparison-section {
  padding-bottom: 0;
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
.impact {
  background: var(--sand);
}
.impact :deep(.chart-shell) {
  background: var(--paper);
}
.coverage-note {
  margin-top: 14px;
  font-size: var(--text-meta);
}
.forecast {
  padding-bottom: 0;
}
.forecast-grid {
  display: grid;
  grid-template-columns: minmax(16rem, 0.72fr) minmax(0, 1.28fr);
  align-items: start;
  gap: var(--space-12);
}
.forecast-copy {
  display: grid;
  gap: 18px;
  padding: var(--space-6);
  border-left: 4px solid var(--accent);
  background: var(--band);
}
.forecast-copy p {
  margin: 0;
}
.source-links {
  display: grid;
  gap: 2px;
  margin-top: 6px;
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
.local {
  padding-bottom: var(--space-16);
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
.site-footer {
  justify-content: space-between;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: var(--text-meta);
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
  .hero {
    min-height: auto;
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
    padding-inline: var(--gutter);
  }
  .hero,
  .section {
    padding-inline: var(--gutter);
  }
  h1 {
    font-size: var(--text-title);
  }
  .map-layout,
  .local-grid {
    grid-template-columns: 1fr;
  }
  .subsection-heading {
    display: grid;
    gap: 10px;
  }
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  .site-footer {
    gap: 10px 18px;
  }
}
</style>
