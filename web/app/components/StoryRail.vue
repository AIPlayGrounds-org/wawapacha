<script setup lang="ts">
import { computed } from 'vue'
import { useActiveId } from '~/composables/useActiveId'

const props = defineProps<{
  label: string
  steps: { id: string; short: string }[]
}>()

const active = useActiveId(props.steps.map((step) => step.id))
const activeIndex = computed(() => props.steps.findIndex((step) => step.id === active.value))
</script>

<template>
  <nav class="rail" :aria-label="label">
    <ol>
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :class="{ 'is-active': index === activeIndex, 'is-done': index < activeIndex }"
      >
        <a :href="`#${step.id}`" :aria-current="index === activeIndex ? 'step' : undefined">
          <span class="number">{{ index + 1 }}</span>
          <span class="text">{{ step.short }}</span>
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.rail {
  position: sticky;
  z-index: 5;
  top: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--on-deep-muted) 30%, transparent);
  background: color-mix(in srgb, var(--deep) 94%, transparent);
  backdrop-filter: blur(6px);
}
ol {
  display: flex;
  gap: var(--space-2);
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--gutter);
  list-style: none;
}
li {
  flex: 1 1 0;
  min-width: 0;
}
a {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 48px;
  color: var(--on-deep-muted);
  font-size: var(--text-meta);
  line-height: 1.2;
  text-decoration: none;
  box-shadow: inset 0 -3px 0 transparent;
}
a:hover {
  color: var(--on-deep);
}
.number {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-size: var(--text-label);
  font-variant-numeric: tabular-nums;
}
.text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.is-done a {
  color: var(--on-deep);
}
.is-done .number {
  border-color: var(--on-deep);
  background: var(--on-deep);
  color: var(--deep);
}
.is-active a {
  color: var(--warm-on-deep);
  box-shadow: inset 0 -3px 0 var(--warm-on-deep);
}
.is-active .number {
  border-color: var(--warm-on-deep);
  background: var(--warm-on-deep);
  color: var(--deep);
}
@media (max-width: 860px) {
  li {
    flex: 0 0 auto;
  }
  li .text {
    display: none;
  }
  li.is-active {
    flex: 1 1 0;
  }
  li.is-active .text {
    display: block;
  }
}
</style>
