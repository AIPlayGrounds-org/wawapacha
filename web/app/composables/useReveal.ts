import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Whether an element has been revealed. It starts true, so the server HTML, a reader without
 * JavaScript and a reader who asked for less motion all see the element in place. Only an element
 * still below the fold at mount waits, and it is revealed once it scrolls into view.
 */
export function useReveal(root: Ref<HTMLElement | null>, skip = false) {
  const placed = ref(true)
  let reveal: IntersectionObserver | undefined
  onMounted(() => {
    const element = root.value
    if (!element || skip) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (element.getBoundingClientRect().top < window.innerHeight) return
    placed.value = false
    reveal = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        placed.value = true
        reveal?.disconnect()
      },
      { rootMargin: '0px 0px -15% 0px' },
    )
    reveal.observe(element)
  })
  onBeforeUnmount(() => reveal?.disconnect())
  return placed
}
