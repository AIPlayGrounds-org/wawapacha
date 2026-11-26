import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ScoreRow from '~/components/ScoreRow.vue'
import { messages } from '~/messages'
import { regionMarks, seaMark, summerMark } from '~/utils/score'

const point = (date: string, value: number) => ({ day: 0, date, value })

describe('score', () => {
  it('fills the sea mark only above 26 °C', () => {
    expect(seaMark(27.5)).toBe('filled')
    expect(seaMark(26)).toBe('empty')
    expect(seaMark(null)).toBe('unknown')
  })

  it('fills the summer mark from a summer week above 26 °C and waits until April', () => {
    expect(summerMark([point('2027-01-06', 26.4)], '2027-01-06')).toBe('filled')
    expect(summerMark([point('2026-09-23', 27.5)], '2026-09-23')).toBe('pending')
    expect(summerMark([point('2027-03-31', 25.9)], '2027-03-31')).toBe('pending')
    expect(summerMark([point('2027-04-07', 25)], '2027-04-07')).toBe('empty')
    expect(summerMark([], null)).toBe('unknown')
  })

  it('scores a region against the reach anomaly, its river and its rain', () => {
    expect(regionMarks(2.5, true, 'above')).toEqual(['filled', 'filled', 'filled'])
    expect(regionMarks(1.5, false, 'normal')).toEqual(['empty', 'empty', 'empty'])
    expect(regionMarks(null, null, null)).toEqual(['unknown', 'unknown', 'unknown'])
  })
})

describe('ScoreRow', () => {
  const labels = messages.story.score.conditions

  it('shows the frame without state words when it has no states', () => {
    const wrapper = mount(ScoreRow, { props: { title: 'Las tres condiciones', labels } })

    expect(wrapper.findAll('li')).toHaveLength(3)
    expect(wrapper.findAll('.fill')).toHaveLength(0)
    expect(wrapper.find('.state').exists()).toBe(false)
  })

  it('draws each state and says it in words, or the note that replaces it', () => {
    const wrapper = mount(ScoreRow, {
      props: {
        title: 'Hoy',
        labels,
        states: ['filled', 'half', 'unknown'],
        notes: [null, null, 'más abajo'],
      },
    })
    const items = wrapper.findAll('li')

    expect(items.map((item) => item.classes())).toEqual([
      ['mark--filled'],
      ['mark--half'],
      ['mark--unknown'],
    ])
    expect(items[1]!.get('.fill').attributes('width')).toBe('11')
    expect(items[2]!.get('text').text()).toBe('?')
    expect(items[0]!.get('.state').text()).toBe('· sí')
    expect(items[1]!.get('.state').text()).toBe('· a medias')
    expect(items[2]!.get('.state').text()).toBe('· más abajo')
  })
})
