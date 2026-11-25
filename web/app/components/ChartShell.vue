<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ageDays, ageLabel, dataTypeLabel, messages } from '~/messages'
import { staleAfterHours, type DatasetId } from '~/types/dataset'
import type { DatasetLike } from '~/types/datasets'

const props = defineProps<{
  dataset: DatasetLike
  summary: string
  /** Shows the chart with a one-line caption. The stale notice still applies. */
  bare?: boolean
}>()

const firstRecord = props.dataset.records[0]
const lastRecord = props.dataset.records.at(-1)
// The registry owns the update tolerance for each automatic source.
const staleUpdateHours = staleAfterHours[props.dataset.id as DatasetId]
const STALE_RECORD_DAYS = 90
const now = ref<Date | null>(null)
onMounted(() => (now.value = new Date()))
const formatDate = (date: string) =>
  new Intl.DateTimeFormat('es', {
    dateStyle: 'long',
    timeZone: 'America/Lima',
  }).format(new Date(date))
const updateDate = formatDate(props.dataset.ingestion_time)
const updateAge = computed(() =>
  now.value ? ageLabel(props.dataset.ingestion_time, now.value) : null,
)
const dataAge = computed(() =>
  now.value && lastRecord ? ageLabel(lastRecord.end, now.value) : null,
)
const staleNotice = computed(() => {
  if (!now.value) return false
  const updateHours =
    (now.value.getTime() - new Date(props.dataset.ingestion_time).getTime()) / 3_600_000
  const recordDays = lastRecord ? ageDays(lastRecord.end, now.value) : 0
  return (
    (staleUpdateHours !== undefined && updateHours > staleUpdateHours) ||
    recordDays >= STALE_RECORD_DAYS
  )
})
const period =
  firstRecord && lastRecord
    ? firstRecord.start === lastRecord.end
      ? firstRecord.start
      : `${firstRecord.start}–${lastRecord.end}`
    : '—'
const periodDetails = [
  props.dataset.temporal_resolution,
  period,
  props.dataset.reference_period
    ? messages.provenance.periodValue(props.dataset.reference_period)
    : null,
]
  .filter(Boolean)
  .join(' · ')
</script>

<template>
  <figure v-if="bare" class="chart-bare">
    <slot />
    <figcaption>
      {{ summary }}
      <a :href="dataset.source.url" target="_blank" rel="noopener">
        {{ dataset.source.institution }}<span class="sr-only">{{ messages.page.newTab }}</span>
      </a>
    </figcaption>
    <p v-if="staleNotice" class="stale-notice" role="status">
      {{ messages.provenance.staleSource }}
      <a :href="dataset.source.url" target="_blank" rel="noopener">
        {{ messages.page.reviewSource }}
        <span class="sr-only">{{ messages.page.newTab }}</span>
      </a>
    </p>
  </figure>
  <div
    v-else
    class="chart-shell"
    role="group"
    :aria-label="`${dataset.variable} · ${dataset.unit}`"
  >
    <div class="chart-region">
      <slot />
    </div>
    <p class="chart-summary">{{ summary }}</p>
    <p class="provenance-line">
      <a :href="dataset.source.url" target="_blank" rel="noopener">
        {{ dataset.source.institution }}
        <span class="sr-only">{{ messages.page.newTab }}</span>
      </a>
      · {{ dataset.unit }} · {{ period }} · {{ messages.provenance.lastUpdate }}
      <time :datetime="dataset.ingestion_time">{{ updateAge ?? updateDate }}</time>
    </p>
    <details class="provenance-details">
      <summary>{{ messages.provenance.howMeasured }}</summary>
      <dl class="provenance">
        <div>
          <dt>{{ messages.provenance.variable }}</dt>
          <dd>{{ dataset.variable }}</dd>
        </div>
        <div>
          <dt>{{ messages.provenance.unit }}</dt>
          <dd>{{ dataset.unit }}</dd>
        </div>
        <div>
          <dt>{{ messages.provenance.period }}</dt>
          <dd>{{ periodDetails }}</dd>
        </div>
        <div>
          <dt>{{ messages.provenance.dataType }}</dt>
          <dd>{{ dataTypeLabel(dataset.data_type) }}</dd>
        </div>
        <div>
          <dt>{{ messages.provenance.source }}</dt>
          <dd>
            <a :href="dataset.source.url" target="_blank" rel="noopener">
              {{ dataset.source.institution }}
              <span class="sr-only">{{ messages.page.newTab }}</span>
            </a>
            <span aria-hidden="true"> · {{ dataset.source.product }}</span>
          </dd>
        </div>
        <div>
          <dt>{{ messages.provenance.lastUpdate }}</dt>
          <dd>
            <time :datetime="dataset.ingestion_time">{{ updateDate }}</time>
            <span v-if="updateAge"> ({{ updateAge }})</span>
          </dd>
        </div>
      </dl>
    </details>
    <p v-if="dataAge" class="data-age">
      {{ messages.provenance.latestData }}: {{ lastRecord?.end ?? '—' }} ({{ dataAge }}).
    </p>
    <p v-if="staleNotice" class="stale-notice" role="status">
      {{ messages.provenance.staleSource }}
      <a :href="dataset.source.url" target="_blank" rel="noopener">
        {{ messages.page.reviewSource }}
        <span class="sr-only">{{ messages.page.newTab }}</span>
      </a>
    </p>
  </div>
</template>

<style scoped>
.chart-bare {
  min-width: 0;
  margin: 0;
}
.chart-bare figcaption {
  max-width: var(--reading-width);
  margin-top: var(--space-3);
  color: var(--muted);
  font-size: var(--text-meta);
  line-height: 1.45;
}
.chart-bare figcaption a {
  color: inherit;
}
.chart-bare .stale-notice {
  margin: var(--space-2) 0 0;
}
.chart-shell {
  min-width: 0;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.chart-region {
  padding: 16px 16px 0;
}
.chart-summary {
  max-width: 60rem;
  margin: 12px 16px 0;
  color: var(--muted);
  font-size: var(--text-meta);
}
.provenance-line {
  margin: 12px 16px 0;
  color: var(--muted);
  font-size: var(--text-meta);
}
.provenance-details {
  margin: 12px 16px 0;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: var(--text-meta);
}
.provenance-details summary {
  width: fit-content;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
}
.provenance {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 12px 20px;
  margin: 12px 0 0;
}
.provenance div {
  min-width: 0;
}
.provenance dt {
  color: var(--muted);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.provenance dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
}
.data-age {
  margin: 16px;
  padding: 10px 12px;
  border-left: 3px solid var(--accent);
  background: var(--band);
  font-size: var(--text-meta);
}
.stale-notice {
  margin: 0 16px 16px;
  color: var(--muted);
  font-size: var(--text-meta);
}
</style>
