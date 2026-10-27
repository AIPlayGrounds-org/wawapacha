<script setup lang="ts">
import { messages } from '~/messages'

const route = useRoute()
const items = [
  { to: '/historico', label: messages.historico.historyNav },
  { to: '/territorio', label: messages.page.territoryLink },
  { to: '/rios', label: messages.rios.sectionLabel },
  { to: '/aprende', label: messages.page.learnLink },
  { to: '/metodologia', label: messages.page.methodologyLink },
]
</script>

<template>
  <header class="site-header">
    <NuxtLink class="brand" to="/">{{ messages.page.brand }}</NuxtLink>
    <nav :aria-label="messages.page.mainNav">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-current="route.path === item.to ? 'page' : undefined"
      >
        {{ item.label }}
      </NuxtLink>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-4) var(--gutter);
  border-bottom: 1px solid var(--border);
}
.brand {
  flex: none;
  color: var(--text);
  font-family: var(--font);
  font-size: var(--text-title-sm);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
  text-decoration: none;
}
.brand,
nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2) var(--space-5);
  margin-left: auto;
}
nav a {
  color: var(--muted);
  font-size: var(--text-meta);
  text-decoration: none;
}
nav a:hover,
nav a[aria-current='page'] {
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 0.35em;
}
@media (max-width: 700px) {
  .site-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-5);
  }
  nav {
    flex-basis: 100%;
    justify-content: flex-start;
    margin-left: 0;
  }
}
</style>
