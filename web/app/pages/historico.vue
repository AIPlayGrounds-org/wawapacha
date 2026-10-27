<script setup lang="ts">
import { messages } from '~/messages'
import { useDataset } from '~/composables/useDataset'
import HistoricoChart from '~/components/HistoricoChart.vue'
import IcenChart from '~/components/IcenChart.vue'
import SenamhiRainChart from '~/components/SenamhiRainChart.vue'
import { shapeHistoricoDataset, shapeHistoricoOniDataset } from '~/utils/historico'
import { shapeSenamhiDataset } from '~/utils/senamhi'
import { useSiteSeo } from '~/composables/useSiteSeo'

const ersst = await useDataset('noaa-ersst', shapeHistoricoDataset)
const oni = await useDataset('noaa-cpc-oni', (dataset) =>
  shapeHistoricoOniDataset(dataset, ersst.records),
)
const icen = await useDataset('enfen-icen')
const senamhi = await useDataset('senamhi-estaciones', shapeSenamhiDataset)

useSiteSeo({
  title: messages.historico.seoTitle,
  description: messages.historico.seoDescription,
})
</script>

<template>
  <div class="page">
    <SiteHeader />
    <main id="main-content">
      <section class="intro" aria-labelledby="history-title">
        <p class="eyebrow">{{ messages.page.brand }}</p>
        <h1 id="history-title">{{ messages.historico.title }}</h1>
        <p>{{ messages.historico.lead }}</p>
      </section>
      <section class="figure" aria-labelledby="comparison-title" data-dataset="noaa-ersst">
        <h2 id="comparison-title">{{ messages.historico.comparisonTitle }}</h2>
        <HistoricoChart :dataset="ersst" :oni="oni" />
      </section>
      <section class="figure" aria-labelledby="icen-title" data-dataset="enfen-icen">
        <h2 id="icen-title">{{ messages.historico.icenTitle }}</h2>
        <IcenChart :dataset="icen" />
      </section>
      <section
        class="figure"
        aria-labelledby="station-rain-title"
        data-dataset="senamhi-estaciones"
      >
        <h2 id="station-rain-title">{{ messages.historico.stations.title }}</h2>
        <p class="section-lead">{{ messages.historico.stations.lead }}</p>
        <SenamhiRainChart :dataset="senamhi" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
}
main {
  max-width: 68rem;
  margin: 0 auto;
  padding: 56px 20px 80px;
}
.intro {
  max-width: 44rem;
  margin-bottom: 44px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  max-width: 15ch;
  margin: 0;
  font-size: var(--text-display);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.intro > p:last-child {
  max-width: 38rem;
  margin-top: 24px;
  color: var(--muted);
  font-size: var(--text-body);
}
h2 {
  margin: 0 0 16px;
  font-size: var(--text-title-sm);
}
.section-lead {
  max-width: 48rem;
  margin: -4px 0 16px;
  color: var(--muted);
}
.figure + .figure {
  margin-top: 56px;
}
@media (max-width: 599px) {
  main {
    padding: 40px 16px 56px;
  }
  h1 {
    font-size: var(--text-title);
  }
}
</style>
