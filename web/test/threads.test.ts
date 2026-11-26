import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ClipCard from '~/components/ClipCard.vue'
import DrainColumn from '~/components/DrainColumn.vue'
import ThreadMark from '~/components/ThreadMark.vue'
import { clipCard } from '~/data/claims'
import { CLIPS, DRAIN_COLUMN, REELS, STILLS } from '~/utils/reels'
import { marked, THREADS, type ThreadId } from '~/utils/threads'

const marksOf = (cards: readonly { thread?: ThreadId }[]) =>
  cards.flatMap((card) => (card.thread ? [card.thread] : []))

describe('ThreadMark', () => {
  it('names the thread and tells a screen reader it is a thread', () => {
    const wrapper = mount(ThreadMark, { props: { thread: 'dren' } })
    expect(wrapper.text()).toBe('Hilo: El dren que no llega')
    expect(wrapper.get('.sr-only').text()).toBe('Hilo:')
    expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')
    expect(wrapper.get('path').attributes('d')).toBe(THREADS.dren.glyph)
  })
})

describe('ClipCard thread', () => {
  it('shows the mark only on a marked card', () => {
    const card = clipCard('tv-1983-film-devastador')
    expect(mount(ClipCard, { props: { card } }).find('.thread-mark').exists()).toBe(false)
    const mark = mount(ClipCard, { props: { card: marked(card, 'devastador') } })
    expect(mark.get('.thread-mark').text()).toContain('«Devastador»')
  })
})

describe('reel marks', () => {
  it('opens every thread on the page at least once', () => {
    const all = [...Object.values(REELS).flat(), ...Object.values(CLIPS)]
    expect(new Set(marksOf(all))).toEqual(new Set(Object.keys(THREADS)))
  })

  it('places the marks the script gives each block', () => {
    expect(marksOf(REELS.historia1983)).toEqual(['nadie', 'dren', 'rio'])
    expect(marksOf(REELS.tumbes1997)).toEqual(['dren', 'motobombas'])
    expect(marksOf(REELS.panorama2017)).toEqual(['nadie', 'motobombas', 'techo'])
    expect(marksOf(REELS.drain)).toEqual(['dren'])
  })

  it('keeps the closing stills unmarked', () => {
    expect(marksOf(STILLS)).toEqual([])
  })
})

describe('drain column', () => {
  it('takes one row per drain card, with words lifted from that card', () => {
    expect(DRAIN_COLUMN).toHaveLength(REELS.drain.length)
    for (const row of DRAIN_COLUMN) {
      for (const part of row.words.split(' … ')) expect(row.lift).toContain(part)
    }
  })

  it('stacks its rows under a label that names the years', () => {
    const rows = DRAIN_COLUMN.slice(0, 3)
    const wrapper = mount(DrainColumn, { props: { rows } })
    expect(wrapper.get('ol').attributes('aria-label')).toBe('El dren que no llega, de 1983 a 2017')
    expect(wrapper.findAll('.year').map((year) => year.text())).toEqual(['1983', '1997', '2017'])
    expect(wrapper.get('.words').text()).toBe('«insuficientes»')
  })
})
