import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SeasonChart from '~/components/SeasonChart.vue'
import { formatMonthName, formatSeasonDay } from '~/utils/format'
import {
  type SeasonWeek,
  formatSeason,
  monthsAbove,
  normalCurve,
  pointAt,
  seasonDay,
  seasonOf,
  seasonPoints,
  shapeSeasons,
  warmestNormalMonth,
  weekBefore,
} from '~/utils/season'
import { loadDataset } from '../server/utils/loadDataset'

const week = (start: string, sst: number, normal: number): SeasonWeek => ({
  start,
  end: start,
  sst,
  normal,
})

describe('season axis', () => {
  it('starts a season in July and counts days from 1 July', () => {
    expect(seasonOf('2026-07-01')).toBe(2026)
    expect(seasonOf('2027-06-30')).toBe(2026)
    expect(seasonOf('2026-06-30')).toBe(2025)
    expect(seasonDay('2026-07-01')).toBe(0)
    expect(seasonDay('2026-11-18')).toBe(140)
    expect(seasonDay('2028-06-30')).toBe(364)
    expect(formatSeason(2026)).toBe('2026–27')
  })

  it('names a season day and a month in Spanish', () => {
    expect(formatSeasonDay(0)).toBe('1 jul')
    expect(formatSeasonDay(140)).toBe('18 nov')
    expect(formatMonthName(3)).toBe('marzo')
  })
})

describe('season data', () => {
  it('keeps Niño 1+2 weeks of the latest two seasons and derives the normal', async () => {
    const dataset = await loadDataset('noaa-cpc-nino-weekly')
    const shaped = shapeSeasons([])(dataset)
    const latest = seasonOf(shaped.records.at(-1)!.start)
    const source = dataset.records.find((record) => record.start === shaped.records[0]!.start)!

    expect(new Set(shaped.records.map((record) => seasonOf(record.start)))).toEqual(
      new Set([latest - 1, latest]),
    )
    expect(shaped.records[0]!.normal).toBeCloseTo(
      source.nino_1_2_sst! - source.nino_1_2_anomaly!,
      5,
    )
  })

  it('finds the nearest week, the week a year before and the warmest normal month', () => {
    const weeks = [
      week('2025-11-19', 21.4, 21.9),
      week('2026-03-04', 26.6, 26.6),
      week('2026-03-11', 26.4, 26.4),
      week('2026-09-30', 26.2, 20.0),
      week('2026-11-18', 27.5, 21.8),
    ]
    const curve = normalCurve(weeks)
    const season = seasonPoints(weeks, 2026)

    expect(pointAt(season, 141)?.value).toBe(27.5)
    expect(pointAt(season, 150)).toBeNull()
    expect(weekBefore(weeks, weeks.at(-1)!)?.start).toBe('2025-11-19')
    expect(warmestNormalMonth(curve)).toEqual({ month: 3, value: 26.5 })
    expect(monthsAbove(curve, 26)).toEqual([3])
    expect(monthsAbove(season, 26)).toEqual([9, 11])
  })
})

describe('SeasonChart', () => {
  const normal = [
    { day: 0, value: 20, date: '2026-07-01' },
    { day: 140, value: 21.8, date: '2026-11-18' },
    { day: 250, value: 26.5, date: '2027-03-08' },
  ]
  const lines = [
    {
      id: 'season',
      label: '2026–27',
      tone: 'accent' as const,
      points: [
        { day: 0, value: 21, date: '2026-07-01' },
        { day: 140, value: 27.5, date: '2026-11-18' },
      ],
    },
  ]
  const mountChart = () =>
    mount(SeasonChart, {
      props: {
        normal,
        normalLabel: 'lo normal',
        lines,
        threshold: { value: 26, label: 'desde aquí, lluvia fuerte' },
        gap: { lineId: 'season', label: '+5,7' },
        scrubLabel: 'Temperatura del mar por semana',
        tableCaption: 'Tabla',
      },
    })

  it('reads the latest week to a screen reader and steps a week per arrow key', async () => {
    const wrapper = mountChart()
    const slider = wrapper.get('[role="slider"]')

    expect(slider.attributes('aria-valuenow')).toBe('140')
    expect(slider.attributes('aria-valuetext')).toContain('18 nov')
    expect(slider.attributes('aria-valuetext')).toContain('2026–27, 27,5 °C')

    await slider.trigger('keydown', { key: 'ArrowLeft' })
    expect(slider.attributes('aria-valuenow')).toBe('133')
    expect(wrapper.find('.rule').exists()).toBe(true)

    await slider.trigger('keydown', { key: 'Home' })
    expect(slider.attributes('aria-valuenow')).toBe('0')
    expect(wrapper.findAll('.readout')).toHaveLength(2)

    await slider.trigger('blur')
    expect(wrapper.find('.rule').exists()).toBe(false)
  })

  it('lists every normal week in its table and draws the threshold and the gap', () => {
    const wrapper = mountChart()
    const rows = wrapper.findAll('tbody tr')

    expect(rows).toHaveLength(3)
    expect(rows[1]!.text()).toContain('27,5 °C')
    expect(rows[2]!.text()).toContain('—')
    expect(wrapper.get('[role="slider"]').attributes('aria-describedby')).toBe(
      wrapper.get('table').attributes('id'),
    )
    expect(wrapper.get('.threshold').text()).toContain('desde aquí, lluvia fuerte')
    expect(wrapper.get('.gap').text()).toContain('+5,7')
  })
})
