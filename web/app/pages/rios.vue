<script setup lang="ts">
import RiosChart from '~/components/RiosChart.vue'
import { useDataset } from '~/composables/useDataset'
import { messages } from '~/messages'
import { ENFEN_COMUNICADOS, SENAMHI_AVISOS } from '~/links'
import { shapeRiosDataset } from '~/utils/rios'
import { useSiteSeo } from '~/composables/useSiteSeo'

const rios = await useDataset('open-meteo-glofas', shapeRiosDataset)

useSiteSeo({ title: messages.rios.seoTitle, description: messages.rios.seoDescription })
</script>

<template>
  <div class="page">
    <SiteHeader />

    <main id="main-content">
      <section class="intro" aria-labelledby="rios-title">
        <p class="eyebrow">{{ messages.page.brand }}</p>
        <h1 id="rios-title">{{ messages.rios.title }}</h1>
        <p>{{ messages.rios.lead }}</p>
        <p>{{ messages.rios.limitsNote }}</p>
      </section>

      <div class="figure">
        <RiosChart :dataset="rios" />
      </div>

      <section class="alerts" aria-labelledby="alerts-title">
        <h2 id="alerts-title">{{ messages.rios.alertsTitle }}</h2>
        <p>{{ messages.rios.alertsLead }}</p>
        <ul>
          <li>
            <a :href="ENFEN_COMUNICADOS" target="_blank" rel="noopener"
              >{{ messages.rios.enfenLink
              }}<span class="sr-only">{{ messages.page.newTab }}</span></a
            >
          </li>
          <li>
            <a :href="SENAMHI_AVISOS" target="_blank" rel="noopener"
              >{{ messages.rios.senamhiLink
              }}<span class="sr-only">{{ messages.page.newTab }}</span></a
            >
          </li>
        </ul>
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
  max-width: 42rem;
  margin-top: 24px;
  color: var(--muted);
  font-size: var(--text-body);
}
.figure {
  max-width: 68rem;
}
.alerts {
  max-width: 44rem;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--border);
}
.alerts h2 {
  margin: 0;
  font-size: var(--text-title-sm);
  line-height: 1.1;
}
.alerts p {
  margin: 12px 0 0;
  color: var(--muted);
}
.alerts ul {
  margin: 16px 0 0;
  padding-left: 1.2em;
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
