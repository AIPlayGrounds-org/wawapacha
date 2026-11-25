import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IcenOverlay, { type OverlaySeries } from '~/components/IcenOverlay.vue'
import IcenTimeline from '~/components/IcenTimeline.vue'
import { ICEN_NEUTRAL, addMonths, alignEvent, icenCategory } from '~/utils/icen'

describe('addMonths', () => {
  it('crosses a year boundary', () => {
    expect(addMonths('1997-04', 9)).toBe('1998-01')
    expect(addMonths('1982-12', 1)).toBe('1983-01')
  })

  it('returns the same month for zero', () => {
    expect(addMonths('2016-04', 0)).toBe('2016-04')
  })
})

describe('alignEvent', () => {
  const records = [
    { start: '1997-04', icen: 0.2 },
    { start: '1997-05', icen: 0.9 },
    { start: '1997-07', icen: 1.8 },
  ]

  it('gives one slot per month and null for a month with no record', () => {
    expect(alignEvent(records, '1997-04', 4)).toEqual([
      { index: 0, start: '1997-04', icen: 0.2 },
      { index: 1, start: '1997-05', icen: 0.9 },
      { index: 2, start: '1997-06', icen: null },
      { index: 3, start: '1997-07', icen: 1.8 },
    ])
  })
})

describe('icenCategory', () => {
  it('reads the neutral band from its bounds, inclusive on the cold side', () => {
    expect(icenCategory(ICEN_NEUTRAL.high)).toBe('neutral')
    expect(icenCategory(ICEN_NEUTRAL.low)).toBe('neutral')
    expect(icenCategory(0.51)).toBe('weak')
    expect(icenCategory(-0.71)).toBeNull()
  })
})

const records = [
  ...['1982-04', '1982-05', '1982-06'].map((start, i) => ({ start, icen: i })),
  ...['1997-04', '1997-05', '1997-06'].map((start, i) => ({ start, icen: i + 0.5 })),
]
const series: OverlaySeries[] = [
  { id: 'a', label: '1982–83', from: '1982-04', peak: '1982-06', tone: 'past' },
  { id: 'b', label: '1997–98', from: '1997-04', peak: '1997-06', tone: 'accent' },
]
const mountOverlay = () =>
  mount(IcenOverlay, {
    props: {
      records,
      series,
      months: 3,
      pin: { seriesId: 'b', start: '1997-05', label: '«lejos»' },
      bandLabel: 'normal',
      scrubLabel: 'Recorrer',
      tableCaption: 'Tabla',
    },
  })

describe('IcenOverlay', () => {
  it('labels each peak at its own month, the pin and the neutral band', () => {
    const text = mountOverlay().text()
    expect(text).toContain('1982–83')
    expect(text).toContain('1997–98')
    expect(text).toContain('«lejos»')
    expect(text).toContain('normal')
    expect(text).toContain('+2,00')
    expect(text).toContain('+2,50')
  })

  it('steps the slider one month per arrow key and reads both series', async () => {
    const wrapper = mountOverlay()
    const slider = wrapper.get('[role="slider"]')
    expect(slider.attributes('aria-valuenow')).toBe('2')
    await slider.trigger('keydown', { key: 'Home' })
    expect(slider.attributes('aria-valuenow')).toBe('0')
    await slider.trigger('keydown', { key: 'ArrowRight' })
    expect(slider.attributes('aria-valuenow')).toBe('1')
    const valueText = slider.attributes('aria-valuetext')!
    expect(valueText).toContain('1982–83')
    expect(valueText).toContain('1997–98')
    expect(valueText).toContain('+1,50 °C')
    await slider.trigger('keydown', { key: 'ArrowLeft' })
    await slider.trigger('keydown', { key: 'ArrowLeft' })
    expect(slider.attributes('aria-valuenow')).toBe('0')
  })

  it('points the slider to a table with one column per series and one row per month', () => {
    const wrapper = mountOverlay()
    const table = wrapper.get(`#${wrapper.get('[role="slider"]').attributes('aria-describedby')}`)
    expect(table.findAll('th').map((th) => th.text())).toEqual(['1982–83', '1997–98'])
    expect(table.findAll('tbody tr')).toHaveLength(3)
  })
})

describe('IcenTimeline', () => {
  it('draws the neutral band and names it', () => {
    const wrapper = mount(IcenTimeline, {
      props: { records, marks: [], level: null, focus: null, bandLabel: 'normal' },
    })
    expect(wrapper.find('rect.band').exists()).toBe(true)
    expect(wrapper.get('.band-label').text()).toBe('normal')
  })
})
