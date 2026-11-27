<script setup lang="ts">
import { ref } from 'vue'
import { useReveal } from '~/composables/useReveal'
import type { PaperCard } from '~/data/claims'
import { messages } from '~/messages'
import { formatPublished } from '~/utils/format'
import { clippings } from '~/data/press'

const props = defineProps<{
  card: PaperCard
  /** Sets the lifted phrase as the beat's headline. */
  featured?: boolean
  /**
   * Our Spanish for a lift in another language. It takes the large type, and the verbatim lift
   * sits under it, small, tagged as the original.
   */
  translation?: string
  /** The BCP 47 tag of a translated lift. */
  lang?: string
  /** Skips the drop: a reel cuts to the card instead. */
  settled?: boolean
}>()

const date = formatPublished(props.card.published)
// The passage as it was printed, with the lift marked; a translated card keeps its type.
const clipping = props.translation ? undefined : clippings[`${props.card.href}#${props.card.lift}`]

const root = ref<HTMLElement | null>(null)
const placed = useReveal(root, props.settled)
</script>

<template>
  <figure
    ref="root"
    class="paper-card"
    :class="{ 'is-placed': placed, 'paper-card--featured': featured }"
  >
    <figcaption>
      <span class="outlet">{{ card.outlet }}</span>
      <time :datetime="card.published">{{ date }}</time>
    </figcaption>
    <template v-if="translation">
      <p class="translation">«{{ translation }}»</p>
      <p class="original-tag">{{ messages.paperCard.translated }}</p>
      <blockquote class="original" :cite="card.href" :lang="lang">
        <p>“{{ card.lift }}”</p>
      </blockquote>
    </template>
    <blockquote v-else :cite="card.href" :class="{ 'has-clipping': clipping }">
      <p :class="{ 'sr-only': clipping }">«{{ card.lift }}»</p>
      <img
        v-if="clipping"
        class="clipping"
        :src="clipping.src"
        :width="clipping.width"
        :height="clipping.height"
        :style="{ maxWidth: `${Math.round(clipping.width / (featured ? 1.6 : 2))}px` }"
        alt=""
        loading="lazy"
        decoding="async"
      />
    </blockquote>
    <a :href="card.href" target="_blank" rel="noopener"
      >{{ messages.paperCard.read(card.outlet)
      }}<span class="sr-only">{{ messages.page.newTab }}</span></a
    >
  </figure>
</template>

<style scoped>
.paper-card {
  margin: 0;
  max-width: 26rem;
  padding: var(--space-5) var(--space-6) var(--space-6);
  border-radius: var(--radius-sm);
  background: var(--clipping);
  box-shadow: var(--shadow-clipping);
  color: var(--on-clipping);
  transform: rotate(var(--tilt, 0deg));
  opacity: 0;
  translate: 0 -2.5rem;
  transition:
    opacity 240ms ease-out var(--drop-delay, 0ms),
    translate 420ms cubic-bezier(0.2, 0.9, 0.3, 1.15) var(--drop-delay, 0ms);
}
.paper-card.is-placed {
  opacity: 1;
  translate: 0 0;
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-1) var(--space-4);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--clipping-rule);
  color: var(--on-clipping-muted);
  font-family: var(--font-display);
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.outlet {
  color: var(--on-clipping);
}
blockquote {
  margin: var(--space-4) 0 0;
}
blockquote p {
  margin: 0;
  font-family: var(--font);
  font-size: var(--text-title-sm);
  font-weight: 700;
  line-height: 1.15;
  text-wrap: balance;
}
.paper-card--featured {
  max-width: 40rem;
}
/* The real passage, torn from its page, with the lifted words under a highlighter. */
.clipping {
  display: block;
  width: 100%;
  height: auto;
  background: #fff;
  clip-path: polygon(
    0 6%,
    5% 0,
    11% 4%,
    18% 1%,
    26% 5%,
    34% 0,
    43% 4%,
    52% 1%,
    61% 5%,
    70% 0,
    79% 4%,
    88% 1%,
    95% 5%,
    100% 2%,
    99% 50%,
    100% 95%,
    94% 100%,
    86% 96%,
    77% 100%,
    68% 95%,
    59% 100%,
    50% 96%,
    41% 100%,
    32% 95%,
    23% 100%,
    14% 96%,
    6% 100%,
    0 95%,
    1% 50%
  );
}
.translation {
  margin: var(--space-4) 0 0;
  font-family: var(--font);
  font-size: var(--text-title-sm);
  font-weight: 700;
  line-height: 1.15;
  text-wrap: balance;
}
.original-tag {
  margin: var(--space-3) 0 0;
  font-size: var(--text-label);
  font-style: italic;
}
blockquote.original {
  margin-top: var(--space-1);
}
blockquote.original p {
  font-size: var(--text-meta);
  font-weight: 400;
  line-height: 1.4;
}
.paper-card--featured blockquote p {
  font-size: clamp(2rem, 1.2rem + 3.4vw, 3.75rem);
  line-height: 1.02;
  letter-spacing: -0.01em;
}
a {
  display: inline-block;
  margin-top: var(--space-4);
  color: var(--on-clipping);
  font-family: var(--font-display);
  font-size: var(--text-meta);
  font-weight: 600;
  text-underline-offset: 0.2em;
}
a:focus-visible {
  outline: 2px solid var(--on-clipping);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .paper-card {
    transition: none;
  }
}
</style>
