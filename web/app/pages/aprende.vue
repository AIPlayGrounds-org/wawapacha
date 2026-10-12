<script setup lang="ts">
import { ENFEN_NOTAS_TECNICAS, NOAA_ENSO_EXPLAINER, NOAA_NINO_INDICES, NOAA_ONI } from '~/links'
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import { useSiteSeo } from '~/composables/useSiteSeo'
import ChartShell from '~/components/ChartShell.vue'
import OniChart from '~/components/OniChart.vue'
import {
  ensoPhase,
  formatAnomaly,
  formatTemperature,
  seasonLabel,
  seasonMonths,
} from '~/utils/enso'

const oni = await useDataset('noaa-cpc-oni')
const oniRecords = oni.records
const lastOni = oniRecords.at(-1)
const recentOni = oniRecords.slice(-12).reverse()
const phaseLabel = {
  warm: messages.oni.rangeLabel('warm'),
  neutral: messages.oni.rangeLabel('neutral'),
  cold: messages.oni.rangeLabel('cold'),
} as const
const oniSummary = lastOni
  ? messages.oni.summary(
      seasonMonths(oniRecords[0]!),
      seasonMonths(lastOni),
      `${seasonLabel(lastOni)}, ${formatAnomaly(lastOni.anomaly)} ${messages.page.degreeC}`,
      phaseLabel[ensoPhase(lastOni.anomaly)],
    )
  : messages.page.emptyTitle

const learn = messages.aprende

useSiteSeo({ title: learn.seoTitle, description: learn.seoDescription })
</script>

<template>
  <div class="page">
    <header class="header">
      <NuxtLink class="brand" to="/">{{ messages.page.brand }}</NuxtLink>
      <NuxtLink to="/territorio">{{ messages.page.territoryLink }}</NuxtLink>
      <NuxtLink to="/historico">{{ messages.historico.historyNav }}</NuxtLink>
      <NuxtLink to="/rios">{{ messages.rios.sectionLabel }}</NuxtLink>
      <NuxtLink to="/aprende">{{ messages.page.learnLink }}</NuxtLink>
      <NuxtLink to="/metodologia">{{ messages.page.methodologyLink }}</NuxtLink>
    </header>

    <main id="main-content">
      <section class="intro" aria-labelledby="learn-title">
        <p class="eyebrow">{{ learn.sectionLabel }}</p>
        <h1 id="learn-title">{{ learn.title }}</h1>
        <p>{{ learn.lead }}</p>
      </section>

      <section class="learn-section" aria-labelledby="phenomenon-title">
        <h2 id="phenomenon-title">{{ learn.phenomenonTitle }}</h2>
        <p>
          {{ learn.phenomenonBody }}
          <a :href="NOAA_ENSO_EXPLAINER" target="_blank" rel="noopener"
            >{{ learn.noaaExplainer }}<span class="sr-only">{{ messages.page.newTab }}</span></a
          >.
        </p>
      </section>

      <section class="learn-section" aria-labelledby="regions-title">
        <h2 id="regions-title">{{ learn.regionsTitle }}</h2>
        <p>
          {{ learn.regionsLead }}
          <a :href="NOAA_NINO_INDICES" target="_blank" rel="noopener"
            >{{ learn.noaaIndices }}<span class="sr-only">{{ messages.page.newTab }}</span></a
          >.
        </p>
        <dl class="regions">
          <template v-for="region in learn.regions" :key="region[0]">
            <dt>{{ region[0] }}</dt>
            <dd>{{ region[1] }}</dd>
          </template>
        </dl>
      </section>

      <section class="learn-section" aria-labelledby="oni-title">
        <h2 id="oni-title">{{ learn.oniTitle }}</h2>
        <p>
          {{ learn.oniBody }}
          <a :href="NOAA_ONI" target="_blank" rel="noopener"
            >{{ learn.noaaOni }}<span class="sr-only">{{ messages.page.newTab }}</span></a
          >.
        </p>
      </section>

      <section class="learn-section" aria-labelledby="coast-title">
        <h2 id="coast-title">{{ learn.coastTitle }}</h2>
        <p>
          {{ learn.coastBody }}
          <a :href="ENFEN_NOTAS_TECNICAS" target="_blank" rel="noopener"
            >{{ learn.enfenDefinitions }}<span class="sr-only">{{ messages.page.newTab }}</span></a
          >.
        </p>
      </section>

      <section class="learn-section explorer" aria-labelledby="explorer-title">
        <h2 id="explorer-title">{{ learn.explorerTitle }}</h2>
        <p>{{ learn.explorerLead }}</p>
        <figure class="figure">
          <ChartShell :dataset="oni" :summary="oniSummary">
            <NuxtErrorBoundary>
              <ClientOnly>
                <OniChart v-if="lastOni" :dataset="oni" :description="oniSummary" />
                <template #fallback>
                  <div class="chart-placeholder">{{ messages.page.chartLoading }}</div>
                </template>
              </ClientOnly>
              <template #error>
                <div class="chart-placeholder">{{ messages.page.chartError }}</div>
              </template>
            </NuxtErrorBoundary>
          </ChartShell>
          <figcaption>{{ messages.chart.thresholdNote }}</figcaption>
        </figure>
        <details>
          <summary>{{ learn.explorerTable }}</summary>
          <div class="table-wrap" role="region" :aria-label="learn.explorerTable" tabindex="0">
            <table>
              <thead>
                <tr>
                  <th scope="col">{{ messages.page.tableMonths }}</th>
                  <th scope="col">{{ messages.page.tableCode }}</th>
                  <th scope="col">{{ messages.page.tableSeaTemperature }}</th>
                  <th scope="col">{{ messages.page.tableAnomaly }}</th>
                  <th scope="col">{{ messages.page.tableThreshold }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in recentOni" :key="record.start">
                  <th scope="row">{{ seasonMonths(record) }}</th>
                  <td>{{ seasonLabel(record) }}</td>
                  <td>{{ formatTemperature(record.sst) }} {{ messages.page.degreeC }}</td>
                  <td>{{ formatAnomaly(record.anomaly) }} {{ messages.page.degreeC }}</td>
                  <td>{{ phaseLabel[ensoPhase(record.anomaly)] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <aside class="source-note">{{ learn.sourceNote }}</aside>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
}
.header {
  display: flex;
  align-items: baseline;
  gap: 24px;
  max-width: 68rem;
  margin: 0 auto;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}
.brand {
  margin-right: auto;
  color: var(--text);
  font-family: var(--hand);
  font-size: 1.5rem;
  line-height: 1;
  text-decoration: none;
}
main {
  max-width: 68rem;
  margin: 0 auto;
  padding: 56px 20px 80px;
}
.intro {
  max-width: 44rem;
  margin-bottom: 64px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2.7rem, 8vw, 5.3rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.intro > p:last-child {
  max-width: 42rem;
  margin-top: 24px;
  color: var(--muted);
  font-size: 1.2rem;
}
.learn-section {
  max-width: 48rem;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--border);
}
h2 {
  margin: 0 0 12px;
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.1;
}
.learn-section p {
  margin: 0;
  color: var(--muted);
}
.regions {
  display: grid;
  grid-template-columns: minmax(8rem, 0.5fr) 1fr;
  max-width: 32rem;
  margin: 24px 0 0;
  border-top: 1px solid var(--border);
}
.regions dt,
.regions dd {
  margin: 0;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.regions dt {
  font-weight: 700;
}
.source-note {
  max-width: 48rem;
  margin-top: 48px;
  padding: 18px 20px;
  background: var(--sand);
  color: var(--muted);
}
.figure {
  margin: 24px 0 0;
}
.figure :deep(.chart) {
  width: 100%;
  height: 420px;
}
.chart-placeholder {
  height: 420px;
  display: grid;
  place-items: center;
  color: var(--muted);
}
figcaption {
  margin-top: 10px;
  color: var(--muted);
  font-size: var(--fs-small);
}
details {
  margin-top: 24px;
}
summary {
  cursor: pointer;
  font-weight: 650;
}
.table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.95rem;
}
th,
td {
  padding: 8px 14px 8px 0;
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
@media (max-width: 900px) {
  .header {
    flex-wrap: wrap;
    gap: 12px 20px;
  }
  .brand {
    flex-basis: 100%;
  }
}
@media (max-width: 599px) {
  .header {
    padding-inline: 16px;
  }
  main {
    padding: 40px 16px 56px;
  }
  .figure :deep(.chart),
  .chart-placeholder {
    height: 340px;
  }
}
</style>
