import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ThemeToggle from '~/components/ThemeToggle.vue'

describe('theme toggle', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme
    localStorage.clear()
  })

  it('starts dark, switches to light and remembers the choice', async () => {
    const wrapper = mount(ThemeToggle, { props: { home: true } })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Cambiar a tema claro')

    await button.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('wawapacha-theme')).toBe('light')
    expect(button.attributes('aria-label')).toBe('Cambiar a tema oscuro')

    await button.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('wawapacha-theme')).toBe('dark')
  })

  it('follows the system theme on the inner pages until a choice is saved', async () => {
    const wrapper = mount(ThemeToggle)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button').attributes('aria-label')).toBe('Cambiar a tema oscuro')
  })

  it('reads a light theme already applied before the first paint', async () => {
    document.documentElement.dataset.theme = 'light'
    const wrapper = mount(ThemeToggle)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button').attributes('aria-label')).toBe('Cambiar a tema oscuro')
  })
})
