<script setup lang="ts">
import { messages } from '~/messages'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
</script>

<template>
  <div>
    <a class="skip-link" href="#main-content">{{ messages.page.skipLink }}</a>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --paper: #f3f9f8;
  --surface: #e8f2f0;
  --surface-raised: #fbfaf4;
  --text: #20353a;
  --muted: #49636a;
  --faint: #71838a;
  --border: #c9dcda;
  --land: #e2d1ad;
  --band: #e0efec;
  --sea: #e0efec;
  --sea-edge: #93bdb8;
  --sand: #f5ecda;
  --deep: #113f47;
  --on-deep: #edf7f5;
  --on-deep-muted: #aacac5;
  --warm-on-deep: #ffad78;
  --neutral-data: #9aa9aa;
  --warm: #bc551d;
  --warm-text: #8f3d13;
  --warm-tint: #fae7db;
  --cold: #356ba6;
  --cold-text: #2f5e92;
  --accent: #13676b;
  --link: var(--accent);
  --focus: var(--accent);
  --chart-grid: #dce8e6;
  --ramp-1: #24528e;
  --ramp-2: #326eae;
  --ramp-3: #4b8ac2;
  --ramp-4: #4f83b5;
  --ramp-5: #687777;
  --ramp-6: #c9793d;
  --ramp-7: #b75f29;
  --ramp-8: #984418;
  --ramp-9: #6c2e0b;
  --notice-bg: #f8edc8;
  --notice-text: #5a430d;
  --bg: var(--paper);
  --content-width: 80rem;
  --reading-width: 42rem;
  --gutter: clamp(1rem, 3vw, 2.5rem);
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --shadow-card:
    0 0 0 1px color-mix(in oklch, var(--text) 5%, transparent),
    0 0.375rem 0.75rem color-mix(in oklch, var(--deep) 12%, transparent);
  --text-label: 0.75rem;
  --text-meta: 0.875rem;
  --text-body: 1rem;
  --text-lead: 1.25rem;
  --text-title-sm: 1.5rem;
  --text-title: 2rem;
  --text-display: 3rem;
  --font: 'Source Serif 4 Variable', Georgia, serif;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #13272b;
    --surface: #1b3438;
    --surface-raised: #244047;
    --text: #e7f1ef;
    --muted: #b1c7c5;
    --faint: #8ca5a2;
    --border: #3d5a5d;
    --land: #4b402c;
    --band: #1a3739;
    --sea: #153236;
    --sea-edge: #397075;
    --sand: #312a1c;
    --deep: #09272f;
    --on-deep: #e3f0ee;
    --on-deep-muted: #9fbfbc;
    --warm-on-deep: #ffab75;
    --accent: #8bd4d0;
    --neutral-data: #809796;
    --warm: #f09555;
    --warm-text: #f8a46c;
    --warm-tint: #4a2a1b;
    --cold: #83b8f0;
    --cold-text: #95c7fa;
    --chart-grid: #294348;
    --ramp-1: #7db8ff;
    --ramp-2: #6ea3ea;
    --ramp-3: #6190d0;
    --ramp-4: #5683bd;
    --ramp-5: #777777;
    --ramp-6: #b9835f;
    --ramp-7: #d9894f;
    --ramp-8: #f09050;
    --ramp-9: #ffa468;
    --notice-bg: #3d3217;
    --notice-text: #f4dca5;
  }
}
html {
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  background: var(--paper);
  color: var(--text);
  font-family: var(--font);
  font-size: var(--text-body);
  font-optical-sizing: auto;
  line-height: 1.5;
}
a {
  color: var(--link);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  text-decoration-color: color-mix(in srgb, currentColor 45%, transparent);
}
a:hover {
  text-decoration-color: currentColor;
  text-decoration-thickness: 2px;
}
strong,
th,
dt {
  font-weight: 600;
}
button,
select,
summary {
  font: inherit;
}
button {
  color: inherit;
}
button:active {
  transform: translateY(1px);
}
main p,
main li,
main dd {
  text-wrap: pretty;
}
main h1,
main h2,
main h3 {
  text-wrap: balance;
  font-weight: 600;
}
:where(.chart, .map, .chart-region) {
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}
canvas {
  max-width: 100%;
}
::selection {
  background: color-mix(in srgb, var(--text) 16%, transparent);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
:where(button, select, summary) {
  min-height: 44px;
}
:where(.links a, .alerts a, .source-links a, .site-footer a, .detail-link, .skip-link, li > a) {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding-inline: 4px;
  margin-inline: -4px;
}
summary {
  align-items: center;
}
.skip-link {
  position: fixed;
  z-index: 10;
  top: 8px;
  left: 8px;
  padding: 8px 12px;
  transform: translateY(-150%);
  background: var(--text);
  color: var(--paper);
  text-decoration: none;
}
.skip-link:focus-visible {
  transform: translateY(0);
}
:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
