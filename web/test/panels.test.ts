import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '~/pages/index.vue'
import { useDataset } from '~/composables/useDataset'
import { messages } from '~/messages'
import { formatDay, formatDegrees, formatMonth, formatValue } from '~/utils/format'
import { icenEpisodesAbove } from '~/utils/icen'
import { loadDataset } from '../server/utils/loadDataset'
import { enfenFixture } from './fixtures/panels'

vi.mock('~/composables/useDataset', () => ({ useDataset: vi.fn() }))
vi.mock('~/composables/useSiteSeo', () => ({ useSiteSeo: vi.fn() }))

const passthrough = { template: '<div><slot /></div>' }

const emptyRecords = <T extends { records: unknown[] }>(dataset: T) =>
  ({
    ...dataset,
    records: [],
  }) as unknown as T

const mountHome = async (enfen = enfenFixture) => {
  const ids = ['noaa-oisst', 'noaa-cpc-nino-weekly', 'enfen-icen'] as const
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
          ChartShell: { props: ['dataset', 'summary', 'bare'], template: '<div><slot /></div>' },
          SiteHeader: passthrough,
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

describe('home page', () => {
  it('uses the verified lead only for its matching communiqué', () => {
    expect(messages.page.homeLead(17, 2026)).toContain('magnitud extraordinaria')
    expect(messages.page.homeLead(20, 2026)).toContain('febrero de 2027')
    expect(messages.page.homeLead(17, 2027)).toContain('comunicado 17-2027')
    expect(messages.page.homeLead(17, 2027)).toContain('aún no resume su pronóstico')
  })

  it('keys the forecast title and the action to their communiqué', () => {
    expect(messages.page.forecastTitle(17, 2027)).toBe('ENFEN publicó el comunicado 17-2027')
    expect(messages.page.actionLead(20, 2026)).not.toBeNull()
    expect(messages.page.actionLead(17, 2027)).toBeNull()
  })

  it('answers the opening question from the rank of the latest ICEN', () => {
    const records = [
      { start: '1983-06', icen: 4.32 },
      { start: '1997-11', icen: 4.08 },
      { start: '1998-01', icen: 3.9 },
      { start: '2017-03', icen: 1.31 },
    ]

    expect(icenEpisodesAbove(records, 3.38)).toEqual(['1983', '1997–98'])
    expect(messages.story.hero.answer([], '1950')).toBe('Más que nunca desde 1950.')
    expect(messages.story.hero.answer(['1983', '1997–98'], '1950')).toBe(
      'Más que nunca desde 1950, salvo en 1983 y 1997–⁠98.',
    )
    expect(messages.story.hero.answer(['1', '2', '3', '4'], '1950')).toContain('4 episodios')
  })

  it('opens every chapter with its question and an answer from the data', async () => {
    const wrapper = await mountHome()
    const icen = await loadDataset('enfen-icen')
    const latest = icen.records.at(-1)!

    expect(wrapper.get('#home-title .ask').text()).toBe(messages.story.hero.question)
    expect(wrapper.get('.hero .lead').text()).toContain(formatMonth(latest.start))
    const chapters = ['calor', 'historia', 'lluvia', 'hacer'] as const
    for (const id of chapters) {
      expect(wrapper.get(`#${id}-title .ask`).text()).toBe(messages.story[id].question)
      expect(wrapper.get(`#${id}-title .answer`).text()).not.toBe('')
    }
    expect(wrapper.get('#calor-title .answer').text()).not.toBe(messages.story.calor.empty)
    expect(wrapper.get('#lluvia-title .answer').text()).toBe(messages.page.forecastTitle(17, 2026))
    expect(wrapper.text()).not.toMatch(/NaN|undefined/)
  })

  it('marks only today on the opening chart and every peak on the history chart', async () => {
    const wrapper = await mountHome()
    const labels = (selector: string) =>
      wrapper
        .get(selector)
        .findAll('.mark-label')
        .map((label) => label.text())

    expect(labels('.hero')).toHaveLength(1)
    const history = labels('.scrolly-chart')
    expect(history).toHaveLength(4)
    expect(history[0]).toContain('1982–83')
    expect(history[3]).toContain(messages.story.timeline.today)
    const steps = wrapper.findAll('.scrolly-step .step-lead').map((step) => step.text())
    expect(steps[0]).toContain('junio de 1983')
    expect(steps[1]).toContain('noviembre de 1997')
    expect(steps[2]).toContain('marzo de 2017')
  })

  it('names the official status and links the communiqué in force', async () => {
    const wrapper = await mountHome()
    const source = wrapper.get('#lluvia .source')

    expect(source.get('.status').text()).toBe('Alerta de El Niño Costero.')
    expect(source.text()).toContain('28 de septiembre de 2026')
    expect(source.get('a').attributes('href')).toBe('https://example.com/comunicado-17-2026')
    expect(wrapper.find('#lluvia [role="status"]').exists()).toBe(false)
  })

  it('says when the next communiqué is overdue', async () => {
    const wrapper = await mountHome({
      ...enfenFixture,
      records: [{ ...enfenFixture.records[0]!, stale: true }],
    })

    expect(wrapper.get('#lluvia [role="status"]').text()).toBe(
      'Próximo comunicado · 15 de octubre de 2026',
    )
  })

  it('uses an ENFEN empty state without dereferencing a missing communique', async () => {
    const wrapper = await mountHome(emptyRecords(enfenFixture))

    expect(wrapper.get('#lluvia-title .answer').text()).toBe(messages.page.forecastEmptyTitle)
    expect(wrapper.find('#lluvia .source').exists()).toBe(false)
    expect(wrapper.text()).not.toMatch(/NaN|undefined/)
  })
})

describe('format helpers', () => {
  it('formats values with one decimal, a sign and the U+2212 minus', () => {
    expect(formatValue(0.54)).toBe('+0,5')
    expect(formatValue(-0.54)).toBe('−0,5')
    expect(formatValue(0)).toBe('0,0')
  })

  it('formats degrees without a plus sign', () => {
    expect(formatDegrees(27.5)).toBe('27,5')
    expect(formatDegrees(-0.54)).toBe('−0,5')
  })

  it('writes days and months in standard Spanish', () => {
    expect(formatDay('2026-09-28')).toBe('28 de septiembre de 2026')
    expect(formatMonth('2026-09')).toBe('septiembre de 2026')
  })
})
