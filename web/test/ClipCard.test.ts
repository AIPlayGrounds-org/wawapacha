import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ClipCard from '~/components/ClipCard.vue'
import { clipCard } from '~/data/claims'

describe('ClipCard', () => {
  it('sets the year, the lift and the chyron, and links the cited second', () => {
    const card = clipCard('tv-1983-film-devastador')
    const wrapper = mount(ClipCard, { props: { card } })

    expect(wrapper.get('.stamp').text()).toBe('1983')
    expect(wrapper.get('.lift').text()).toBe('«devastador»')
    expect(wrapper.get('.outlet').text()).toBe('Documental del Gobierno')
    expect(wrapper.get('.quote').text()).toBe(card.clip.quote)
    expect(wrapper.get('blockquote').attributes('cite')).toBe(card.href)
    expect(wrapper.get('a').attributes('href')).toBe(card.href)
    expect(wrapper.get('a').text()).toContain('Ver en YouTube, 6:52')
  })

  it('adds the day to the chyron only when the source gives one', () => {
    const year = mount(ClipCard, { props: { card: clipCard('tv-1983-film-devastador') } })
    expect(year.get('time').classes()).toContain('sr-only')

    const day = mount(ClipCard, { props: { card: clipCard('tv-america-1998-03-12-historia') } })
    expect(day.get('time').classes()).not.toContain('sr-only')
    expect(day.get('time').text()).toBe('12 de marzo de 1998')
  })

  it('plays no video on the page: the footage stays on YouTube', async () => {
    const wrapper = mount(ClipCard, { props: { card: clipCard('tv-1983-film-devastador') } })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('keeps the transcript line for a screen reader in a row of stills', () => {
    const card = clipCard('tv-1983-film-devastador')
    const wrapper = mount(ClipCard, { props: { card, small: true } })
    expect(wrapper.find('.quote').exists()).toBe(false)
    expect(wrapper.get('blockquote .sr-only:not(time)').text()).toBe(card.clip.quote)
  })
})
