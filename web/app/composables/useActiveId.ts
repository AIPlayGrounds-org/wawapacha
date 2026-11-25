import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * The id of the element that crosses the middle band of the viewport, or null
 * before any does. Without JavaScript it stays null, and callers show their
 * resting state.
 */
export const useActiveId = (ids: readonly string[], rootMargin = '-45% 0px -45% 0px') => {
  const active: Ref<string | null> = ref(null)
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) active.value = entry.target.id
        }
      },
      { rootMargin },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
  })
  onBeforeUnmount(() => observer?.disconnect())

  return active
}
