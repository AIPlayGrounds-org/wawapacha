import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Component } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChartShell from '~/components/ChartShell.vue'
import NinoWeeklyPanel from '~/components/NinoWeeklyPanel.vue'
import OutlookPanel from '~/components/OutlookPanel.vue'
import HomePage from '~/pages/index.vue'
import { useDataset } from '~/composables/useDataset'
import { messages, outlookCategoryLabel } from '~/messages'
import { formatDay, formatMonth, formatValue } from '~/utils/format'
import { loadDataset } from '../server/utils/loadDataset'
import { enfenFixture, outlookFixture } from './fixtures/panels'

vi.mock('~/composables/useDataset', () => ({ useDataset: vi.fn() }))
vi.mock('~/composables/useSiteSeo', () => ({ useSiteSeo: vi.fn() }))

const passthrough = { template: '<div><slot /></div>' }

const mountChart = (component: Component, dataset: unknown) => {
  let option: any
  const wrapper = mount(component, {
    props: { dataset },
    global: {
      components: { ChartShell },
      stubs: {
        ClientOnly: passthrough,
        NuxtErrorBoundary: passthrough,
        echarts: {
          props: ['option'],
          setup(props: { option: unknown }) {
            option = props.option
            return () => null
          },
        },
      },
    },
  })
  return { wrapper, option: () => option }
}

const mountOutlook = (dataset: typeof outlookFixture) => mountChart(OutlookPanel, dataset)
const emptyRecords = <T extends { records: unknown[] }>(dataset: T) =>
  ({
    ...dataset,
    records: [],
  }) as unknown as T

const mountHome = async (enfen = enfenFixture) => {
  const ids = [
    'noaa-oisst',
    'noaa-cpc-nino-weekly',
    'enfen-icen',
    'noaa-cpc-outlook',
    'senamhi-estaciones',
  ] as const
  const datasets = new Map(
    await Promise.all(ids.map(async (id) => [id, await loadDataset(id)] as const)),
  )
  vi.mocked(useDataset).mockImplementation(async (id, shape) => {
    const dataset = id === 'enfen-communique' ? enfen : datasets.get(id)
    if (!dataset) throw new Error(`Missing test dataset: ${id}`)
    return shape ? shape(dataset) : dataset
  })
  const wrapper = mount(
    {
      components: { HomePage },
      template: '<Suspense><HomePage /></Suspense>',
    },
    {
      global: {
        stubs: {
          NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          IcenChart: passthrough,
          NinoWeeklyPanel: passthrough,
          OisstMap: passthrough,
          OutlookPanel: passthrough,
          SenamhiRainChart: passthrough,
        },
      },
    },
  )
  await flushPromises()
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.mocked(useDataset).mockReset()
})

const rampOf = (css: string) => [...css.matchAll(/--ramp-\d: (#[0-9a-f]{6});/g)].map((m) => m[1]!)
const luminance = (hex: string) => {
  const channel = (shift: number) => {
    const value = ((parseInt(hex.slice(1), 16) >> shift) & 255) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('outlook palette', () => {
  const appCss = readFileSync(join(import.meta.dirname, '../app/app.vue'), 'utf8')
  const [light, dark] = appCss.split('@media (prefers-color-scheme: dark)') as [string, string]
  const paper = (css: string) => /--paper: (#[0-9a-f]{6});/.exec(css)![1]!

  it.each([
    ['light', light],
    ['dark', dark],
  ])('has nine distinct steps with 3:1 contrast on the %s background', (_mode, css) => {
    const ramp = rampOf(css)
    const background = paper(css)

    expect(ramp).toHaveLength(9)
    expect(new Set(ramp).size).toBe(9)
    for (const color of ramp) expect(contrast(color, background)).toBeGreaterThanOrEqual(3)
  })

  it('keeps the same nine steps from the legend to the chart without a copy in script', () => {
    const { wrapper } = mountOutlook(outlookFixture)
    const swatches = wrapper.findAll('.swatch').map((swatch) => swatch.attributes('style'))

    expect(swatches).toHaveLength(9)
    swatches.forEach((style, index) => expect(style).toContain(`var(--ramp-${index + 1})`))
  })
})

describe('OutlookPanel', () => {
  it('shows a Spanish empty state without rendering an empty chart', () => {
    const { wrapper } = mountOutlook(emptyRecords(outlookFixture))

    expect(wrapper.text()).toContain(messages.panels.outlook.empty)
    expect(wrapper.find('.chart').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/NaN|undefined/)
  })

  it('provides a usable table fallback for the weekly series', async () => {
    const weekly = await loadDataset('noaa-cpc-nino-weekly')
    const { wrapper } = mountChart(NinoWeeklyPanel, weekly)

    expect(wrapper.get('details').text()).toContain(messages.panels.weekly.tableSummary)
    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe(
      messages.panels.weekly.tableSummary,
    )
    expect(wrapper.get('tbody tr').text()).toContain('°C')
  })

  it('draws each series from its own category even when a record orders them differently', () => {
    const [first, ...rest] = outlookFixture.records
    const reversed = { ...first!, categories: [...first!.categories].reverse() }
    const { option } = mountOutlook({ ...outlookFixture, records: [reversed, ...rest] })
    const series = option().series as { data: (number | null)[] }[]

    expect(series.map((entry) => entry.data[0])).toEqual([0, 0, 0, 0, 0, 0, 0, 23, 77])
    expect(series.map((entry) => entry.data[1])).toEqual([0, 0, 0, 0, 0, 0, 0, 23, 77])
  })

  it('counts the seasons from the records in the summary', () => {
    const { wrapper } = mountOutlook(outlookFixture)

    expect(wrapper.text()).toContain('Probabilidades · 3 temporadas')
  })

  it('shows the month-only issue date without a day', () => {
    const { wrapper } = mountOutlook(outlookFixture)

    expect(wrapper.get('.outlook-meta').text()).toBe('Emisión: septiembre de 2026')
    expect(wrapper.text()).not.toMatch(/\b1 de septiembre/)
  })

  it('provides a usable table fallback for forecast probabilities', () => {
    const { wrapper } = mountOutlook(outlookFixture)

    expect(wrapper.get('details').text()).toContain(messages.panels.outlook.tableSummary)
    expect(wrapper.get('[role="region"]').attributes('aria-label')).toBe(
      messages.panels.outlook.tableSummary,
    )
    expect(wrapper.findAll('tbody tr')).toHaveLength(outlookFixture.records.length)
  })

  it('puts the first season on top of the inverted category axis', () => {
    const { option } = mountOutlook(outlookFixture)

    expect(option().yAxis.inverse).toBe(true)
    expect(option().yAxis.data).toEqual(['ASO', 'SON', 'OND'])
  })

  it('labels every series and legend entry in Spanish', () => {
    const { wrapper, option } = mountOutlook(outlookFixture)
    const labels = Object.values(messages.panels.outlook.categoryLabels)

    expect(option().series.map((series: { name: string }) => series.name)).toEqual(labels)
    expect(wrapper.findAll('.category-key li').map((item) => item.text())).toEqual(labels)
    expect(wrapper.text()).not.toContain('Index')
    expect(wrapper.get('.source-label').text()).toBe(messages.panels.outlook.sourceLabel)
  })
})

describe('outlookCategoryLabel', () => {
  it('maps every category of the published dataset by its bounds', async () => {
    const outlook = await loadDataset('noaa-cpc-outlook')
    const labels = outlook.records[0]!.categories.map(outlookCategoryLabel)

    expect(labels).toEqual(Object.values(messages.panels.outlook.categoryLabels))
  })

  it('keeps the label attached to its bounds when the source reorders categories', () => {
    const [cold, ...rest] = outlookFixture.records[0]!.categories
    const reordered = [...rest, cold!]

    expect(reordered.map(outlookCategoryLabel).at(-1)).toBe('Índice ≤ −2,0 °C')
  })

  it('falls back to the source category when the bounds are unknown', () => {
    expect(outlookCategoryLabel({ category: 'Index > 9', lower_bound: 9, upper_bound: null })).toBe(
      'Index > 9',
    )
  })
})

describe('home ENFEN status card', () => {
  it('uses the verified lead only for its matching communiqué', () => {
    expect(messages.page.homeLead(17, 2026)).toContain('magnitud extraordinaria')
    expect(messages.page.homeLead(17, 2027)).toBe('Una lectura breve de la señal.')
    expect(messages.page.homeLead(17, 2027)).not.toBe(messages.page.coastLead)
  })

  it('shows the official status, dates and detail link of a current communique', async () => {
    const wrapper = await mountHome()

    expect(wrapper.get('.status-kicker').text()).toBe('Estado oficial')
    expect(wrapper.get('.status-card strong').text()).toBe('Alerta de El Niño Costero')
    expect(wrapper.text()).toContain('28 de septiembre de 2026')
    expect(wrapper.text()).toContain('Próximo comunicado previsto · 15 de octubre de 2026')
    expect(wrapper.find('.stale-status').exists()).toBe(false)
    expect(wrapper.get('.status-card a').attributes('href')).toBe(
      'https://example.com/comunicado-17-2026',
    )
    const comparison = wrapper.findAll('.comparison-card').map((card) => card.text())
    expect(comparison[0]).toContain('Pico ICEN · junio de 1983')
    expect(comparison[1]).toContain('Pico ICEN · noviembre de 1997')
    expect(comparison[2]).toContain('Pico ICEN · marzo de 2017')
  })

  it('shows the last official status and next communiqué when the record is stale', async () => {
    const wrapper = await mountHome({
      ...enfenFixture,
      records: [{ ...enfenFixture.records[0]!, stale: true }],
    })

    expect(wrapper.get('.eyebrow').text()).toBe('Último estado oficial')
    expect(wrapper.get('.status-kicker').text()).toBe('Último estado oficial')
    expect(wrapper.get('.stale-status').text()).toBe('Próximo comunicado · 15 de octubre de 2026')
    expect(wrapper.get('.status-card strong').text()).toBe('Alerta de El Niño Costero')
  })

  it('uses an ENFEN empty state without dereferencing a missing communique', async () => {
    const wrapper = await mountHome(emptyRecords(enfenFixture))

    expect(wrapper.get('.eyebrow').text()).toBe(messages.page.emptyEnfenTitle)
    expect(wrapper.get('#home-title').text()).toBe(messages.page.emptyEnfenTitle)
    expect(wrapper.find('.status-card').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Sin datos del ONI')
    expect(wrapper.text()).not.toMatch(/NaN|undefined/)
  })
})

describe('NinoWeeklyPanel', () => {
  it('shows a Spanish empty state without rendering an empty chart', () => {
    const weekly = emptyRecords({
      id: 'noaa-cpc-nino-weekly',
      source: enfenFixture.source,
      variable: 'Anomalías semanales',
      unit: '°C',
      data_type: 'observed',
      spatial_resolution: 'Regiones Niño',
      temporal_resolution: 'Semanal',
      ingestion_time: enfenFixture.ingestion_time,
      processing_version: 'test',
      records: enfenFixture.records.map((record) => ({
        start: record.start,
        end: record.end,
        nino_1_2_sst: null,
        nino_1_2_anomaly: null,
        nino_3_4_sst: null,
        nino_3_4_anomaly: null,
      })),
    })
    const { wrapper } = mountChart(NinoWeeklyPanel, weekly)

    expect(wrapper.text()).toContain(messages.panels.weekly.empty)
    expect(wrapper.find('.chart').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/NaN|undefined/)
  })

  it('keeps every record in the chart and opens on the last 104 weeks', async () => {
    const weekly = await loadDataset('noaa-cpc-nino-weekly')
    const { option } = mountChart(NinoWeeklyPanel, weekly)
    const records = weekly.records

    expect(option().series).toHaveLength(2)
    for (const series of option().series) expect(series.data).toHaveLength(records.length)
    expect(option().dataZoom[0].startValue).toBe(records[records.length - 104]!.start)
  })

  it('calls out the latest values with the typographic minus', async () => {
    const weekly = await loadDataset('noaa-cpc-nino-weekly')
    const records = structuredClone(weekly.records)
    records.at(-1)!.nino_1_2_anomaly = -0.54
    const { wrapper, option } = mountChart(NinoWeeklyPanel, { ...weekly, records })

    expect(wrapper.get('.latest-grid').text()).toContain('−0,5 °C')
    expect(option().yAxis.axisLabel.formatter(-0.5)).toBe('−0,5')
    expect(option().tooltip.valueFormatter(-0.5)).toBe('−0,5 °C')
  })
})

describe('format helpers', () => {
  it('formats values with one decimal, a sign and the U+2212 minus', () => {
    expect(formatValue(0.54)).toBe('+0,5')
    expect(formatValue(-0.54)).toBe('−0,5')
    expect(formatValue(0)).toBe('0,0')
  })

  it('writes days and months in standard Spanish', () => {
    expect(formatDay('2026-09-28')).toBe('28 de septiembre de 2026')
    expect(formatMonth('2026-09')).toBe('septiembre de 2026')
  })
})
