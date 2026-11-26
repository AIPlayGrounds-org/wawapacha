import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ScaleBars from '~/components/ScaleBars.vue'
import UnitGrid from '~/components/UnitGrid.vue'
import { messages } from '~/messages'
import { formatCount, runs } from '~/utils/units'

const historia = messages.story.historia
// The claims group digits with a plain space; the page uses a no-break one.
const asClaimed = (value: number) => formatCount(value).replace(/ /gu, ' ')

describe('formatCount', () => {
  it('groups thousands with a no-break space, as Spanish print does for four digits too', () => {
    expect(formatCount(60)).toBe('60')
    expect(formatCount(512)).toBe('512')
    expect(formatCount(2400)).toBe('2 400')
    expect(formatCount(4424)).toBe('4 424')
    expect(formatCount(1234567)).toBe('1 234 567')
  })
})

describe('runs', () => {
  it('covers nothing for an empty range', () => {
    expect(runs(5, 5, 10)).toEqual([])
  })

  it('covers a range inside one row with one rect', () => {
    expect(runs(2, 7, 10)).toEqual([{ x: 2, y: 0, width: 5, height: 1 }])
  })

  it('splits a range into a head row, the full rows and a tail row', () => {
    expect(runs(7, 35, 10)).toEqual([
      { x: 7, y: 0, width: 3, height: 1 },
      { x: 0, y: 1, width: 10, height: 2 },
      { x: 0, y: 3, width: 5, height: 1 },
    ])
  })

  it('leaves out the head and tail when the range starts and ends on a row edge', () => {
    expect(runs(10, 30, 10)).toEqual([{ x: 0, y: 1, width: 10, height: 2 }])
  })

  it('covers each unit once', () => {
    const area = runs(13, 512, 40).reduce((sum, run) => sum + run.width * run.height, 0)
    expect(area).toBe(512 - 13)
  })
})

describe('history units', () => {
  it('draws only numbers its claims state', () => {
    const rain = historia.rain1983.texts.join(' ')
    for (const bar of historia.rain1983.bars) expect(rain).toContain(asClaimed(bar.value))
    for (const row of historia.dead1983.rows) expect(row.text).toContain(asClaimed(row.count))
    const river = historia.river.texts.join(' ')
    for (const bar of historia.river.bars) expect(river).toContain(asClaimed(bar.value))
    expect(river).toContain(asClaimed(historia.river.line.value))
  })
})

describe('UnitGrid', () => {
  it('labels each row with its count and fills one unit per person', () => {
    const wrapper = mount(UnitGrid, {
      props: { shape: 'dot', rows: historia.dead1983.rows, unit: historia.dead1983.unit },
    })
    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.get('.label strong').text()).toBe('512')
    expect(rows[1]!.classes()).toContain('is-muted')
    const area = rows[0]!
      .findAll('rect[fill^="url"]')
      .reduce(
        (sum, rect) => sum + Number(rect.attributes('width')) * Number(rect.attributes('height')),
        0,
      )
    expect(area / 100).toBe(512)
  })

  it('counts the empty units of a row out of a total', () => {
    const wrapper = mount(UnitGrid, {
      props: {
        shape: 'square',
        unit: 'Cada cuadro, una obra.',
        rows: [{ id: 'obras', count: 73, total: 100, label: 'sin terminar', rest: 'terminadas' }],
      },
    })
    expect(wrapper.get('.label--rest').text()).toBe('27 terminadas')
  })
})

describe('ScaleBars', () => {
  it('sizes every bar on one scale and marks the line', () => {
    const wrapper = mount(ScaleBars, {
      props: { bars: historia.river.bars, unit: historia.river.unit, lines: [historia.river.line] },
    })
    const fills = wrapper.findAll('.fill').map((fill) => fill.attributes('style'))
    expect(fills).toEqual(['width: 72.33%;', 'width: 100.00%;'])
    expect(wrapper.get('.line-label').classes()).toContain('is-end')
    expect(wrapper.get('.line-label').classes()).not.toContain('is-row')
    expect(wrapper.get('.bar strong').text()).toBe('3 200 m³/s')
  })

  it('stacks several levels highest first and draws each through every track', () => {
    const wrapper = mount(ScaleBars, {
      props: {
        bars: [{ id: 'peak', label: 'pico', value: 1000 }],
        unit: 'u',
        lines: [
          { value: 200, label: 'bajo' },
          { value: 800, label: 'alto' },
        ],
        format: (value: number) => `#${value}`,
      },
    })
    const labels = wrapper.findAll('.line-label')
    expect(labels.map((label) => label.get('span').text())).toEqual(['alto', 'bajo'])
    expect(labels[0]!.get('strong').text()).toContain('#800')
    expect(labels.map((label) => label.classes('is-end'))).toEqual([true, false])
    expect(labels.every((label) => label.classes('is-row'))).toBe(true)
    expect(wrapper.findAll('.level').map((level) => level.attributes('style'))).toEqual([
      'left: 80.00%;',
      'left: 20.00%;',
    ])
  })
})
