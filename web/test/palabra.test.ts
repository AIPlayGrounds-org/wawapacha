import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PressTimeline from '~/components/PressTimeline.vue'
import { STEPS_2017, STEPS_2026, tollMarks, wordMarks } from '~/utils/palabra'
import type { SeasonWeek } from '~/utils/season'

describe('palabra steps', () => {
  const steps = [...STEPS_2017, ...STEPS_2026]

  it('sets on the chart only a word its card prints', () => {
    for (const step of steps.filter((item) => item.word)) {
      expect(step.card, step.id).toBeDefined()
      expect(step.card!.lift, step.id).toContain(step.word)
    }
  })

  it('sets on the chart only a death count its claim states', () => {
    const tolled = steps.filter((item) => item.toll)
    expect(tolled.map((item) => item.id)).toEqual(['marzo', 'mayo', 'junio'])
    for (const step of tolled) {
      expect(step.texts.join(' '), step.id).toMatch(new RegExp(`\\b${step.toll}\\b`))
    }
  })

  it('runs in date order, so the line only ever grows', () => {
    for (const list of [STEPS_2017, STEPS_2026]) {
      const dates = list.map((step) => step.date)
      expect(dates).toEqual([...dates].sort())
    }
  })
})

const weeks: SeasonWeek[] = [
  { start: '2017-01-04', end: '2017-01-10', sst: 24.1, normal: 23.5 },
  { start: '2017-02-01', end: '2017-02-07', sst: 26.4, normal: 24.6 },
  { start: '2017-03-15', end: '2017-03-21', sst: 28.9, normal: 25.4 },
]
const marks = [
  { id: 'a', date: '2017-02-01', label: 'débil' },
  { id: 'b', date: '2017-02-02', label: 'débil' },
  { id: 'c', date: '2017-03-15', label: 'moderada' },
]
const timeline = (until: string | null) =>
  mount(PressTimeline, {
    props: {
      weeks,
      from: '2017-01-01',
      to: '2017-03-31',
      sstLabel: 'el mar',
      normalLabel: 'lo normal',
      words: marks,
      tolls: [{ id: 't', date: '2017-03-04', label: '26 fallecidos' }],
      ring: '2017-03-16',
      until,
      tableCaption: 'Semanas',
    },
  })

describe('PressTimeline', () => {
  it('hides the words, tolls and ring dated after the step in view', () => {
    const wrapper = timeline('2017-02-15')
    const shown = (selector: string) =>
      wrapper.findAll(selector).map((element) => element.classes().includes('is-shown'))

    expect(shown('.word')).toEqual([true, true, false])
    expect(shown('.toll')).toEqual([false])
    expect(shown('.ring')).toEqual([false])
  })

  it('shows every mark without a step in view', () => {
    const wrapper = timeline(null)

    expect(wrapper.findAll('.is-shown')).toHaveLength(5)
  })

  it('stacks words of near dates on separate rows', () => {
    const wrapper = timeline(null)
    const rows = wrapper.findAll('.word text').map((element) => element.attributes('y'))

    expect(rows[0]).not.toBe(rows[1])
  })

  it('lists every week in the table for screen readers', () => {
    const rows = timeline(null).findAll('tbody tr')

    expect(rows).toHaveLength(3)
    expect(rows[2]!.text()).toContain('28,9')
  })

  it('builds the marks from the steps that carry them', () => {
    expect(wordMarks(STEPS_2017).map((mark) => mark.label)).toEqual([
      '«1%»',
      '«débil»',
      '«débil»',
      '«moderada»',
    ])
    expect(tollMarks(STEPS_2017).map((mark) => mark.label)).toEqual([
      '26 fallecidos',
      '143 fallecidos',
      '159 fallecidos',
    ])
  })
})
