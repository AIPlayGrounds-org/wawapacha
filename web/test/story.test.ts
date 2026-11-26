import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IcenTimeline from '~/components/IcenTimeline.vue'
import SeaMap from '~/components/SeaMap.vue'
import type { GridRecord } from '~/types/dataset'
import { buildSeaGrid, seaPosition, seaStep } from '~/utils/seaGrid'

// Two rows from south to north. The east cell of the north row is land.
const record = {
  start: '2026-11-12',
  end: '2026-11-18',
  lat: [-10, -8],
  lon: [-84, -82, -80],
  anomaly: [
    [5.2, 5.4, 7.5],
    [-1, 0, null],
  ],
} as unknown as GridRecord

describe('seaGrid', () => {
  it('puts an anomaly on the step of the highest edge it reaches', () => {
    expect(seaStep(-1)).toBe(0)
    expect(seaStep(0)).toBe(1)
    expect(seaStep(0.5)).toBe(2)
    expect(seaStep(8.5)).toBe(9)
  })

  it('merges neighbours of one step in a row and leaves land empty', () => {
    const grid = buildSeaGrid(record)

    expect(grid.paths).toEqual([
      { step: 0, d: 'M0 0h1v1h-1z' },
      { step: 1, d: 'M1 0h1v1h-1z' },
      { step: 7, d: 'M0 1h2v1h-2z' },
      { step: 9, d: 'M2 1h1v1h-1z' },
    ])
  })

  it('extends the bounds half a cell past the outer cell centres', () => {
    const grid = buildSeaGrid(record)

    expect([grid.west, grid.east, grid.south, grid.north]).toEqual([-85, -79, -11, -7])
    expect(seaPosition(grid, -82, -7)).toEqual({ left: '50%', top: '0%' })
  })

  it('traces the coast where sea meets land, not along the frame', () => {
    expect(buildSeaGrid(record).coast).toBe('M2 1h1M2 0v1')
  })
})

describe('SeaMap', () => {
  const ring = { lat: -5.25, lon: -80.75, label: '+8,1 °C' }
  const panels = [
    { title: 'hoy', record, ring, locator: true },
    { title: 'hace un año', record, ring: { ...ring, label: '+0,0 °C', muted: true } },
  ]

  it('draws both days with one legend, and keeps names off the ring', () => {
    const wrapper = mount(SeaMap, { props: { panels } })
    const [today, before] = wrapper.findAll('.sea-panel')
    const places = today!.findAll('.place').map((place) => place.text())

    expect(wrapper.findAll('.legend')).toHaveLength(1)
    expect(today!.get('.ring-label').text()).toBe('+8,1 °C')
    expect(before!.get('.ring').classes()).toContain('ring--muted')
    expect(places).toEqual(['Tumbes', 'Lima'])
    expect(today!.find('.locator').exists()).toBe(true)
    expect(before!.find('.locator').exists()).toBe(false)
  })

  it('names only the three labelled places without a ring', () => {
    const wrapper = mount(SeaMap, { props: { panels: [{ title: 'hoy', record, ring: null }] } })

    expect(wrapper.findAll('.place').map((place) => place.text())).toEqual([
      'Tumbes',
      'Piura',
      'Lima',
    ])
  })

  it('spans the legend from the coldest step drawn and marks the normal one', () => {
    const wrapper = mount(SeaMap, { props: { panels } })
    const steps = wrapper.findAll('.legend li')

    expect(steps).toHaveLength(10)
    expect(steps[1]!.text()).toBe('lo normal')
    expect(steps[3]!.text()).toBe('+1')
  })
})

describe('IcenTimeline', () => {
  const records = [
    { start: '1983-05', icen: 3.9 },
    { start: '1983-06', icen: 4.32 },
    { start: '1983-07', icen: -1.2 },
  ]
  const marks = [
    { id: 'peak', start: '1983-06', value: 4.32, label: '1982–83' },
    { id: 'absent', start: '1990-01', value: 1, label: 'fuera de la serie' },
  ]

  it('draws only the marks whose month is in the series', () => {
    const wrapper = mount(IcenTimeline, { props: { records, marks, level: null, focus: null } })

    expect(wrapper.findAll('.mark')).toHaveLength(1)
    expect(wrapper.find('.level').exists()).toBe(false)
  })

  it('brings the focused mark forward and dims the others', () => {
    const both = [...marks, { id: 'last', start: '1983-07', value: -1.2, label: 'último' }]
    const wrapper = mount(IcenTimeline, {
      props: { records, marks: both, level: 4.32, focus: 'last' },
    })

    expect(wrapper.findAll('.mark--dim')).toHaveLength(1)
    expect(wrapper.get('.mark--focus').text()).toBe('último')
    expect(wrapper.find('.level').exists()).toBe(true)
  })
})
