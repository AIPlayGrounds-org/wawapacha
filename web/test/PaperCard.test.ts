import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PaperCard from '~/components/PaperCard.vue'
import { paperCard } from '~/data/claims'

describe('PaperCard', () => {
  it('prints the outlet, the day, the lifted phrase and a link to the source', () => {
    const card = paperCard('panamericana-2026-09-16-devastador')
    const wrapper = mount(PaperCard, { props: { card, featured: true } })

    expect(wrapper.get('.outlet').text()).toBe('Panamericana')
    expect(wrapper.get('time').attributes('datetime')).toBe('2026-09-16')
    expect(wrapper.get('time').text()).toBe('16 de septiembre de 2026')
    expect(wrapper.get('blockquote').attributes('cite')).toBe(card.href)
    expect(wrapper.get('blockquote').text()).toBe('«más devastador que el de 1997»')
    expect(wrapper.get('a').attributes('href')).toBe(card.href)
    expect(wrapper.get('a').text()).toContain('Leer en Panamericana')
    expect(wrapper.classes()).toContain('paper-card--featured')
  })

  it('dates a document published by month with its month', () => {
    const wrapper = mount(PaperCard, { props: { card: paperCard('apoyo-2026-trajectory') } })
    expect(wrapper.get('time').text()).toBe('julio de 2026')
  })

  it('sets our translation large and keeps the verbatim original under it, tagged', () => {
    const card = paperCard('glantz-2000-peru-lesson')
    const wrapper = mount(PaperCard, {
      props: { card, translation: 'Un hecho recurrente', lang: 'en' },
    })

    expect(wrapper.get('.translation').text()).toBe('«Un hecho recurrente»')
    expect(wrapper.get('.original-tag').text()).toBe('Traducción nuestra. El original, en inglés:')
    expect(wrapper.get('blockquote').attributes('lang')).toBe('en')
    expect(wrapper.get('blockquote').text()).toBe(`“${card.lift}”`)
  })

  it('starts in place, so the server HTML shows the card', () => {
    const wrapper = mount(PaperCard, { props: { card: paperCard('elcomercio-1925-alisio') } })
    expect(wrapper.classes()).toContain('is-placed')
  })
})
