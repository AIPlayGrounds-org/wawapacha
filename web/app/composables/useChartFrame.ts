import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * The chart's measured width, and whether its line is drawn. The line starts
 * drawn, so the server HTML, a reader without JavaScript and a reader who asked
 * for less motion all see the whole chart. Only a chart still below the fold
 * waits to draw until it scrolls into view.
 */
export const useChartFrame = (root: Ref<HTMLElement | null>, initialWidth = 1000) => {
  const width = ref(initialWidth)
  const drawn = ref(true)
  let resize: ResizeObserver | undefined
  let reveal: IntersectionObserver | undefined

  onMounted(() => {
    const element = root.value
    if (!element) return
    width.value = element.clientWidth || width.value
    resize = new ResizeObserver(([entry]) => {
      if (entry) width.value = entry.contentRect.width
    })
    resize.observe(element)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || element.getBoundingClientRect().top < window.innerHeight) return
    drawn.value = false
    reveal = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        drawn.value = true
        reveal?.disconnect()
      },
      { rootMargin: '0px 0px -25% 0px' },
    )
    reveal.observe(element)
  })
  onBeforeUnmount(() => {
    resize?.disconnect()
    reveal?.disconnect()
  })

  return { width, drawn }
}
