<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { messages } from '~/messages'

const light = ref(false)

onMounted(() => {
  light.value = document.documentElement.dataset.theme === 'light'
})

const toggle = () => {
  light.value = !light.value
  const root = document.documentElement
  if (light.value) root.dataset.theme = 'light'
  else delete root.dataset.theme
  try {
    localStorage.setItem('wawapacha-theme', light.value ? 'light' : 'dark')
  } catch {
    // Private mode: the choice lasts until the page closes.
  }
}
</script>

<template>
  <button type="button" class="theme-toggle" :aria-pressed="light" @click="toggle">
    {{ messages.page.themeLight }}
  </button>
</template>

<style scoped>
.theme-toggle {
  padding: 0 var(--space-4);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}
.theme-toggle[aria-pressed='true'] {
  border-color: var(--text);
  background: var(--text);
  color: var(--ground);
}
.theme-toggle:hover {
  border-color: var(--text);
  color: var(--text);
}
.theme-toggle[aria-pressed='true']:hover {
  color: var(--ground);
}
</style>
