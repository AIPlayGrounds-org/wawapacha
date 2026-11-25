<script setup lang="ts">
import { messages } from '~/messages'

defineProps<{
  /** The document, named in Spanish. */
  label: string
  /** The passage, word for word. */
  quote: string
  href: string
}>()
</script>

<template>
  <figure class="source-card">
    <figcaption>{{ label }}</figcaption>
    <blockquote :cite="href">
      <p>{{ quote }}</p>
    </blockquote>
    <a :href="href" target="_blank" rel="noopener">
      {{ messages.story.sourceCardLink }}<span class="sr-only">{{ messages.page.newTab }}</span>
    </a>
  </figure>
</template>

<style scoped>
.source-card {
  --card-ink: #2b2415;
  --card-paper: #f5ecda;
  max-width: 30rem;
  margin: 0;
  padding: var(--space-4) var(--space-5) var(--space-3);
  transform: rotate(-0.8deg);
  background: var(--card-paper);
  color: var(--card-ink);
  box-shadow: 0 0.75rem 1.5rem rgb(0 0 0 / 35%);
}
.source-card:nth-of-type(even) {
  transform: rotate(0.7deg);
}
figcaption {
  font-size: var(--text-label);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
blockquote {
  margin: var(--space-2) 0 0;
}
blockquote p {
  margin: 0;
  background: linear-gradient(transparent 58%, #f7cf6b 58%);
  display: inline;
  font-size: var(--text-body);
  line-height: 1.55;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: var(--space-1);
  color: var(--card-ink);
  font-size: var(--text-meta);
}
</style>
