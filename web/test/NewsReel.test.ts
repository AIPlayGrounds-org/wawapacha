import { mount } from '@vue/test-utils'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NewsReel from '~/components/NewsReel.vue'
import { REELS } from '~/utils/reels'

let observed: ((entries: { isIntersecting: boolean }[]) => void) | undefined
let reducedMotion = false

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof observed) {
        observed = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) => ({ matches: reducedMotion, media: query }) as MediaQueryList,
  )
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  reducedMotion = false
  observed = undefined
})

const reel = (props: Record<string, unknown> = {}) =>
  mount(NewsReel, { props: { cards: REELS.historia1983, label: 'Reel', ...props } })

describe('NewsReel', () => {
  it('renders every card in a column, with no controls, for the server HTML', async () => {
    const html = await renderToString(
      createSSRApp(NewsReel, { cards: REELS.historia1983, label: 'Reel' }),
    )
    expect(html.match(/<li/gu)).toHaveLength(REELS.historia1983.length)
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="Reel"')
    expect(html).not.toContain('is-reel')
    expect(html).not.toContain('class="controls"')
  })

  it('cuts from card to card once in view and holds on the last', async () => {
    const wrapper = reel()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('is-reel')
    expect(wrapper.findAll('.cards > li')[0]?.classes()).toContain('is-current')

    observed?.([{ isIntersecting: true }])
    await vi.advanceTimersByTimeAsync(1500)
    expect(wrapper.findAll('.cards > li')[1]?.classes()).toContain('is-current')

    await vi.advanceTimersByTimeAsync(1500 * 4)
    expect(wrapper.findAll('.cards > li')[2]?.classes()).toContain('is-current')
    expect(wrapper.get('.toggle').attributes('aria-label')).toBe('Repetir')
  })

  it('steps with the buttons and the arrow keys, and stops playing', async () => {
    const wrapper = reel()
    await wrapper.vm.$nextTick()
    observed?.([{ isIntersecting: true }])
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.toggle').attributes('aria-label')).toBe('Pausa')

    await wrapper.findAll('.controls button')[2]!.trigger('click')
    expect(wrapper.findAll('.cards > li')[1]?.classes()).toContain('is-current')
    expect(wrapper.get('.toggle').attributes('aria-label')).toBe('Seguir')

    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(wrapper.findAll('.cards > li')[0]?.classes()).toContain('is-current')
    expect(wrapper.get('[aria-live]').text()).toBe('1 de 3')
  })

  it('stays a column for a reader who asked for less motion', async () => {
    reducedMotion = true
    const wrapper = reel()
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('is-reel')
    expect(wrapper.find('.controls').exists()).toBe(false)
  })

  it('never plays a row of stills', async () => {
    const wrapper = reel({ still: true })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.controls').exists()).toBe(false)
  })
})
