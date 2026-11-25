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
})

describe('SeaMap', () => {
  const warmest = { lat: -6.75, lon: -79.75, label: '8,5 °C' }

  it('labels the warmest point and drops the place name under it', () => {
    const wrapper = mount(SeaMap, { props: { record, warmest } })
    const places = wrapper.findAll('.place').map((place) => place.text())

    expect(wrapper.get('.warmest').text()).toBe('8,5 °C')
    expect(places).toContain('Piura')
    expect(places).not.toContain('Chiclayo')
  })

  it('shows every place and no ring without a warmest point', () => {
    const wrapper = mount(SeaMap, { props: { record, warmest: null } })

    expect(wrapper.findAll('.place')).toHaveLength(5)
    expect(wrapper.find('.warmest').exists()).toBe(false)
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
