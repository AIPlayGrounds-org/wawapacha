<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import type { ClipCard } from '~/data/claims'
import { messages } from '~/messages'
import { formatClipTime, formatPublished } from '~/utils/format'

const props = defineProps<{
  card: ClipCard
  /** A smaller frame for a row of stills: the year and the lift, no chyron. */
  small?: boolean
}>()
const emit = defineEmits<{ play: [] }>()

const year = props.card.published.slice(0, 4)
const date = formatPublished(props.card.published)
// The year stamp already says the year; the chyron adds the day only when the source gives one.
const chyronDate = props.card.published.length > 4 ? date : null
const time = formatClipTime(props.card.clip.start)
const embed = `https://www.youtube-nocookie.com/embed/${props.card.clip.video}?start=${props.card.clip.start}&autoplay=1&rel=0`

// Nothing loads from YouTube until the reader asks: the server HTML and a reader without
// JavaScript get the link only, so the play button appears after mount.
const interactive = ref(false)
const playing = ref(false)
const player = ref<HTMLIFrameElement | null>(null)
onMounted(() => {
  interactive.value = true
})
const play = async () => {
  playing.value = true
  emit('play')
  await nextTick()
  player.value?.focus()
}
</script>

<template>
  <figure class="clip-card" :class="{ 'clip-card--small': small }">
    <div class="frame">
      <iframe
        v-if="playing"
        ref="player"
        :src="embed"
        :title="messages.clipCard.player(card.outlet, date)"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
      />
      <template v-else>
        <span class="stamp">{{ year }}</span>
        <p class="lift" aria-hidden="true">«{{ card.lift }}»</p>
        <blockquote class="chyron" :cite="card.href">
          <p class="tag">
            <span class="outlet">{{ card.outlet }}</span>
            <time v-if="chyronDate" :datetime="card.published">{{ chyronDate }}</time>
            <time v-else class="sr-only" :datetime="card.published">{{ date }}</time>
          </p>
          <p v-if="!small" class="quote">{{ card.clip.quote }}</p>
          <p v-else class="sr-only">{{ card.clip.quote }}</p>
        </blockquote>
        <button
          v-if="interactive"
          type="button"
          class="play"
          :aria-label="messages.clipCard.play(card.outlet, date)"
          @click="play"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
        </button>
      </template>
    </div>
    <figcaption>
      <a :href="card.href" target="_blank" rel="noopener"
        >{{ messages.clipCard.watch(time)
        }}<span class="sr-only">{{ messages.page.newTab }}</span></a
      >
    </figcaption>
  </figure>
</template>

<style scoped>
.clip-card {
  margin: 0;
  width: 100%;
  max-width: 36rem;
}
.frame {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--radius-sm);
  background:
    var(--grain), radial-gradient(120% 90% at 50% 40%, rgb(255 255 255 / 0.07), transparent 70%),
    var(--screen);
  background-blend-mode: soft-light, normal, normal;
  box-shadow: var(--shadow-clipping);
  color: var(--on-screen);
}
iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.stamp {
  justify-self: start;
  margin: var(--space-4) 0 0 var(--space-4);
  color: var(--on-screen-muted);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.lift {
  align-self: center;
  margin: 0;
  padding: 0 var(--space-6);
  font-family: var(--font);
  font-size: clamp(1.75rem, 1rem + 3.6vw, 3.25rem);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.chyron {
  margin: 0 var(--space-3) var(--space-3);
  font-family: var(--font-display);
}
.tag {
  display: flex;
  width: fit-content;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-1) var(--space-2);
  background: var(--chyron-tag);
  color: var(--on-chyron-tag);
  font-size: var(--text-label);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.quote {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--chyron);
  color: var(--on-chyron);
  font-size: var(--text-meta);
  font-weight: 700;
  line-height: 1.25;
  text-transform: uppercase;
  text-wrap: balance;
}
.play {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid var(--on-screen-muted);
  border-radius: 50%;
  background: rgb(0 0 0 / 0.35);
  color: var(--on-screen);
  cursor: pointer;
}
.play svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}
.play:hover {
  background: rgb(0 0 0 / 0.6);
}
.play:focus-visible,
a:focus-visible {
  outline: 2px solid var(--on-scene);
  outline-offset: 2px;
}
figcaption {
  margin-top: var(--space-2);
}
a {
  display: inline-block;
  padding-block: var(--space-2);
  color: var(--on-scene);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 600;
  text-underline-offset: 0.2em;
}
.clip-card--small {
  max-width: 14rem;
}
.clip-card--small .stamp {
  margin: var(--space-2) 0 0 var(--space-2);
  font-size: var(--text-label);
}
.clip-card--small .lift {
  padding: 0 var(--space-3);
  font-size: var(--text-lead);
}
.clip-card--small .chyron {
  margin: 0 var(--space-2) var(--space-2);
}
.clip-card--small .play {
  display: none;
}
</style>
