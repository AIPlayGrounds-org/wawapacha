<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { messages } from '~/messages'

const light = ref(false)

// Without a saved choice the home is dark and the inner pages follow the system theme.
const props = defineProps<{ home?: boolean }>()
onMounted(() => {
  const saved = document.documentElement.dataset.theme
  light.value = saved
    ? saved === 'light'
    : !props.home && !window.matchMedia('(prefers-color-scheme: dark)').matches
})

const toggle = () => {
  light.value = !light.value
  const root = document.documentElement
  root.dataset.theme = light.value ? 'light' : 'dark'
  try {
    localStorage.setItem('wawapacha-theme', light.value ? 'light' : 'dark')
  } catch {
    // Private mode: the choice lasts until the page closes.
  }
}
</script>

<template>
  <!-- The icon shows where the button goes: a sun in the dark theme, a moon in the light one. -->
  <button
    type="button"
    class="theme-toggle"
    :aria-label="light ? messages.page.themeToDark : messages.page.themeToLight"
    @click="toggle"
  >
    <svg v-if="!light" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"
      />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.2A8 8 0 0 1 9.8 4 8 8 0 1 0 20 14.2Z" />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.theme-toggle:hover {
  color: var(--text);
}
svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.75;
}
</style>
