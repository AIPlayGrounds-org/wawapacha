<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { isClipCard, type PaperCard as Card } from '~/data/claims'
import { messages } from '~/messages'
import type { Threaded } from '~/utils/threads'

const props = defineProps<{
  cards: readonly Threaded<Card>[]
  /** Names the reel for a screen reader. */
  label: string
  /** Holds each card longer, for lines meant to be read rather than heard as a chorus. */
  slow?: boolean
  /** Cuts faster than the rest, for a chorus of the same week. */
  fast?: boolean
  /** A row of small stills that never plays. */
  still?: boolean
}>()

const CUT_MS = 1500
const FAST_CUT_MS = 1000
const SLOW_CUT_MS = 3200
const cut = computed(() => (props.slow ? SLOW_CUT_MS : props.fast ? FAST_CUT_MS : CUT_MS))
const last = computed(() => props.cards.length - 1)

// The server HTML, a reader without JavaScript and a reader who asked for less motion get every
// card in a column. Only after mount does the column become a reel that cuts from card to card.
const reel = ref(false)
const index = ref(0)
const playing = ref(false)
const ended = ref(false)
const held = ref(false)
const root = ref<HTMLElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let view: IntersectionObserver | undefined

const stopTimer = () => {
  clearTimeout(timer)
  timer = undefined
  playing.value = false
}
const schedule = () => {
  clearTimeout(timer)
  playing.value = true
  timer = setTimeout(advance, cut.value)
}
// The last card holds: the reel ends on it instead of looping.
function advance() {
  if (index.value >= last.value) {
    stopTimer()
    ended.value = true
    return
  }
  index.value += 1
  if (index.value === last.value) {
    stopTimer()
    ended.value = true
    return
  }
  schedule()
}
const hold = () => {
  held.value = true
  stopTimer()
}
const show = (next: number) => {
  hold()
  index.value = Math.min(Math.max(next, 0), last.value)
  ended.value = index.value === last.value
}
const toggle = () => {
  if (playing.value) return hold()
  held.value = false
  if (ended.value) {
    ended.value = false
    index.value = 0
  }
  schedule()
}
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'ArrowRight') show(index.value + 1)
  else if (event.key === 'ArrowLeft') show(index.value - 1)
  else return
  event.preventDefault()
}
// A link tabbed into on a hidden card brings that card forward.
const onFocus = (position: number) => {
  if (reel.value && position !== index.value) show(position)
}

onMounted(() => {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (props.still || still || props.cards.length < 2 || !root.value) return
  reel.value = true
  view = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return
      if (!entry.isIntersecting) return stopTimer()
      if (!held.value && !ended.value && !playing.value) schedule()
    },
    { threshold: 0.6 },
  )
  view.observe(root.value)
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  view?.disconnect()
})

const toggleLabel = computed(() =>
  playing.value
    ? messages.newsReel.pause
    : ended.value
      ? messages.newsReel.replay
      : messages.newsReel.play,
)
</script>

<template>
  <div
    ref="root"
    class="news-reel"
    :class="{ 'is-reel': reel, 'is-playing': playing, 'news-reel--still': still }"
    role="group"
    :aria-roledescription="messages.newsReel.roledescription"
    :aria-label="label"
    :style="{ '--cut': `${cut}ms` }"
    @keydown="onKey"
  >
    <ol class="cards">
      <li
        v-for="(card, position) in cards"
        :key="card.href + card.lift"
        :class="{ 'is-current': reel && position === index }"
        @focusin="onFocus(position)"
      >
        <ClipCard v-if="isClipCard(card)" :card="card" :small="still" />
        <PaperCard v-else :card="card" settled />
      </li>
    </ol>
    <div v-if="reel" class="controls">
      <button
        type="button"
        :disabled="index === 0"
        :aria-label="messages.newsReel.previous"
        @click="show(index - 1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button type="button" class="toggle" :aria-label="toggleLabel" @click="toggle">
        <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14M16 5v14" />
        </svg>
        <svg v-else-if="ended" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12a7 7 0 1 0 2-5M5 4v4h4" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path class="fill" d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </button>
      <button
        type="button"
        :disabled="index === last"
        :aria-label="messages.newsReel.next"
        @click="show(index + 1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
      </button>
      <ol class="ticks" aria-hidden="true">
        <li
          v-for="(card, position) in cards"
          :key="card.href + card.lift"
          :class="{ 'is-seen': position < index, 'is-current': position === index }"
        />
      </ol>
      <span class="sr-only" aria-live="polite">{{
        playing ? '' : messages.newsReel.position(index + 1, cards.length)
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.news-reel {
  max-width: 36rem;
}
.cards {
  display: grid;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
  list-style: none;
}
.cards > li {
  display: grid;
  justify-items: start;
}
/* Every card shares one cell, so the reel keeps the height of its tallest card and the page
   under it never moves. A hidden card stays in the accessibility tree: the list is read whole. */
.is-reel .cards > li {
  grid-area: 1 / 1;
  align-content: center;
  opacity: 0;
  pointer-events: none;
}
.is-reel .cards > li.is-current {
  opacity: 1;
  pointer-events: auto;
}
.is-reel .is-current :deep(.stamp) {
  animation: stamp-jump 180ms cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
@keyframes stamp-jump {
  from {
    translate: 0 -0.6rem;
  }
}
.news-reel--still {
  max-width: none;
}
.news-reel--still .cards {
  grid-template-columns: repeat(auto-fill, minmax(10rem, 14rem));
  gap: var(--space-4);
}
.controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
button {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid var(--on-scene-muted);
  border-radius: 50%;
  background: transparent;
  color: var(--on-scene);
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: default;
}
button:not(:disabled):hover {
  background: color-mix(in srgb, var(--on-scene) 10%, transparent);
}
button:focus-visible {
  outline: 2px solid var(--on-scene);
  outline-offset: 2px;
}
svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
svg .fill {
  fill: currentColor;
  stroke: none;
}
.ticks {
  display: flex;
  flex: 1;
  gap: var(--space-1);
  margin: 0 0 0 var(--space-2);
  padding: 0;
  list-style: none;
}
.ticks li {
  flex: 1;
  max-width: 3rem;
  height: 3px;
  background: color-mix(in srgb, var(--on-scene) 25%, transparent);
  background-image: linear-gradient(var(--on-scene), var(--on-scene));
  background-repeat: no-repeat;
  background-size: 0 100%;
}
.ticks li.is-seen,
.ticks li.is-current {
  background-size: 100% 100%;
}
.is-playing .ticks li.is-current {
  animation: tick-fill var(--cut) linear;
}
@keyframes tick-fill {
  from {
    background-size: 0 100%;
  }
}
</style>
