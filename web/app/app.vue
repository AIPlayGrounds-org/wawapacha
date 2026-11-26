<script setup lang="ts">
import { messages } from '~/messages'
import '@fontsource-variable/source-serif-4/opsz.css'
import '@fontsource-variable/source-serif-4/opsz-italic.css'
import '@fontsource-variable/inter-tight/wght.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
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
  --font-display: 'Inter Tight Variable', 'Helvetica Neue', Arial, sans-serif;
  /* Home scenes: near-white paper and ink, so the data carries the colour. Terracotta marks what is
     hot and official, teal marks the sea, and the last scene is deep teal with an amber accent. */
  --font-mono: 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace;
  --scene-a: #f4f2ec;
  --scene-b: #ebe8e0;
  --scene-sea: #e4efed;
  --scene-deep: #0f5f63;
  --on-scene: #16150f;
  --on-scene-muted: #55534b;
  --on-deep-scene: #f4f2ec;
  --on-deep-scene-muted: #c3dad8;
  --scene-accent: #b4472a;
  --scene-cold: #0f5f63;
  --on-strip: #ffffff;
  --data-warm: #b75f29;
  --data-cold: #4b8ac2;
  /* A paper card is newsprint on every ground and in both themes: it is what the press printed. */
  --clipping: #efe9da;
  --on-clipping: #1e1c19;
  --on-clipping-muted: #5a5449;
  --clipping-rule: #c9bfa8;
  --shadow-clipping: 0 1px 0 rgb(0 0 0 / 0.08), 0 0.75rem 1.75rem rgb(0 0 0 / 0.35);
  /* A clip card is a television frame on every ground and in both themes: it is what TV aired. */
  --screen: #0b0e0f;
  --on-screen: #f4f2ea;
  --on-screen-muted: #b5b9b3;
  --chyron: #f4f2ea;
  --on-chyron: #141414;
  --chyron-tag: #b3442d;
  --on-chyron-tag: #ffffff;
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  --strip-hot: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpolygon fill='%23b4472a' points='0 0 6 2.2 12 1.6 18 0.2 24 4.3 30 2 36 2.6 42 2.3 48 2.4 54 1.4 60 1.1 66 3.6 72 0.7 78 1.9 84 2.9 90 4.1 96 1.9 102 0.4 108 1.1 114 3.7 120 3 126 2.8 132 2.4 138 1.2 144 1.5 150 4 156 0.1 162 1 168 2.9 174 3.6 180 0.1 186 1.9 192 4.4 198 2.6 204 0.5 210 3.1 216 4.8 222 1.6 228 4.5 234 0.1 240 3.6 246 4 252 4.7 258 1.4 264 0.8 270 4 276 4.7 282 3.7 288 5 294 4 300 2.2 306 1.3 312 3.1 318 0.1 324 4.8 330 4.2 336 1.8 342 4.4 348 0 354 3.3 360 4.8 366 2.7 372 3.4 378 2.5 384 4.3 390 2.2 396 4.6 397 14 399.5 27 400 40 394 37.1 388 39.1 382 37.5 376 36.1 370 35.2 364 35.3 358 39.1 352 35.5 346 36.8 340 37.8 334 36.9 328 37.4 322 35.5 316 36.9 310 35.9 304 37.9 298 37.8 292 39.6 286 35.5 280 39.9 274 40 268 38.9 262 37.8 256 36.8 250 39.3 244 38.2 238 37.5 232 36.5 226 37.7 220 36.3 214 39.8 208 37.8 202 39.6 196 35.7 190 35.8 184 39.8 178 38.5 172 36.4 166 39.1 160 36.8 154 39.4 148 37.4 142 37.5 136 36.2 130 35.5 124 39 118 39.4 112 36.3 106 38.8 100 36.7 94 39.3 88 37.2 82 35 76 35.1 70 35.2 64 37.8 58 36.5 52 39 46 36.6 40 38.2 34 39.9 28 37.5 22 38.8 16 35.9 10 38.3 4 37.5 2.5 24 0.5 11'/%3E%3C/svg%3E");
  --strip-cold: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpolygon fill='%230f5f63' points='0 0 6 2.2 12 1.6 18 0.2 24 4.3 30 2 36 2.6 42 2.3 48 2.4 54 1.4 60 1.1 66 3.6 72 0.7 78 1.9 84 2.9 90 4.1 96 1.9 102 0.4 108 1.1 114 3.7 120 3 126 2.8 132 2.4 138 1.2 144 1.5 150 4 156 0.1 162 1 168 2.9 174 3.6 180 0.1 186 1.9 192 4.4 198 2.6 204 0.5 210 3.1 216 4.8 222 1.6 228 4.5 234 0.1 240 3.6 246 4 252 4.7 258 1.4 264 0.8 270 4 276 4.7 282 3.7 288 5 294 4 300 2.2 306 1.3 312 3.1 318 0.1 324 4.8 330 4.2 336 1.8 342 4.4 348 0 354 3.3 360 4.8 366 2.7 372 3.4 378 2.5 384 4.3 390 2.2 396 4.6 397 14 399.5 27 400 40 394 37.1 388 39.1 382 37.5 376 36.1 370 35.2 364 35.3 358 39.1 352 35.5 346 36.8 340 37.8 334 36.9 328 37.4 322 35.5 316 36.9 310 35.9 304 37.9 298 37.8 292 39.6 286 35.5 280 39.9 274 40 268 38.9 262 37.8 256 36.8 250 39.3 244 38.2 238 37.5 232 36.5 226 37.7 220 36.3 214 39.8 208 37.8 202 39.6 196 35.7 190 35.8 184 39.8 178 38.5 172 36.4 166 39.1 160 36.8 154 39.4 148 37.4 142 37.5 136 36.2 130 35.5 124 39 118 39.4 112 36.3 106 38.8 100 36.7 94 39.3 88 37.2 82 35 76 35.1 70 35.2 64 37.8 58 36.5 52 39 46 36.6 40 38.2 34 39.9 28 37.5 22 38.8 16 35.9 10 38.3 4 37.5 2.5 24 0.5 11'/%3E%3C/svg%3E");
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
    --notice-bg: #3d3217;
    --notice-text: #f4dca5;
    --scene-a: #0f0f0e;
    --scene-b: #171716;
    --scene-sea: #12201f;
    --scene-deep: #0d4a4d;
    --on-scene: #f2f0ea;
    --on-scene-muted: #b7b5ad;
    --on-deep-scene: #f2f0ea;
    --on-deep-scene-muted: #b9d3d0;
    --scene-accent: #f09050;
    --scene-cold: #5fb8b5;
    --on-strip: #0f0f0e;
    --data-warm: #d9894f;
    --data-cold: #6190d0;
    --strip-hot: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpolygon fill='%23f09050' points='0 0 6 2.2 12 1.6 18 0.2 24 4.3 30 2 36 2.6 42 2.3 48 2.4 54 1.4 60 1.1 66 3.6 72 0.7 78 1.9 84 2.9 90 4.1 96 1.9 102 0.4 108 1.1 114 3.7 120 3 126 2.8 132 2.4 138 1.2 144 1.5 150 4 156 0.1 162 1 168 2.9 174 3.6 180 0.1 186 1.9 192 4.4 198 2.6 204 0.5 210 3.1 216 4.8 222 1.6 228 4.5 234 0.1 240 3.6 246 4 252 4.7 258 1.4 264 0.8 270 4 276 4.7 282 3.7 288 5 294 4 300 2.2 306 1.3 312 3.1 318 0.1 324 4.8 330 4.2 336 1.8 342 4.4 348 0 354 3.3 360 4.8 366 2.7 372 3.4 378 2.5 384 4.3 390 2.2 396 4.6 397 14 399.5 27 400 40 394 37.1 388 39.1 382 37.5 376 36.1 370 35.2 364 35.3 358 39.1 352 35.5 346 36.8 340 37.8 334 36.9 328 37.4 322 35.5 316 36.9 310 35.9 304 37.9 298 37.8 292 39.6 286 35.5 280 39.9 274 40 268 38.9 262 37.8 256 36.8 250 39.3 244 38.2 238 37.5 232 36.5 226 37.7 220 36.3 214 39.8 208 37.8 202 39.6 196 35.7 190 35.8 184 39.8 178 38.5 172 36.4 166 39.1 160 36.8 154 39.4 148 37.4 142 37.5 136 36.2 130 35.5 124 39 118 39.4 112 36.3 106 38.8 100 36.7 94 39.3 88 37.2 82 35 76 35.1 70 35.2 64 37.8 58 36.5 52 39 46 36.6 40 38.2 34 39.9 28 37.5 22 38.8 16 35.9 10 38.3 4 37.5 2.5 24 0.5 11'/%3E%3C/svg%3E");
    --strip-cold: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpolygon fill='%235fb8b5' points='0 0 6 2.2 12 1.6 18 0.2 24 4.3 30 2 36 2.6 42 2.3 48 2.4 54 1.4 60 1.1 66 3.6 72 0.7 78 1.9 84 2.9 90 4.1 96 1.9 102 0.4 108 1.1 114 3.7 120 3 126 2.8 132 2.4 138 1.2 144 1.5 150 4 156 0.1 162 1 168 2.9 174 3.6 180 0.1 186 1.9 192 4.4 198 2.6 204 0.5 210 3.1 216 4.8 222 1.6 228 4.5 234 0.1 240 3.6 246 4 252 4.7 258 1.4 264 0.8 270 4 276 4.7 282 3.7 288 5 294 4 300 2.2 306 1.3 312 3.1 318 0.1 324 4.8 330 4.2 336 1.8 342 4.4 348 0 354 3.3 360 4.8 366 2.7 372 3.4 378 2.5 384 4.3 390 2.2 396 4.6 397 14 399.5 27 400 40 394 37.1 388 39.1 382 37.5 376 36.1 370 35.2 364 35.3 358 39.1 352 35.5 346 36.8 340 37.8 334 36.9 328 37.4 322 35.5 316 36.9 310 35.9 304 37.9 298 37.8 292 39.6 286 35.5 280 39.9 274 40 268 38.9 262 37.8 256 36.8 250 39.3 244 38.2 238 37.5 232 36.5 226 37.7 220 36.3 214 39.8 208 37.8 202 39.6 196 35.7 190 35.8 184 39.8 178 38.5 172 36.4 166 39.1 160 36.8 154 39.4 148 37.4 142 37.5 136 36.2 130 35.5 124 39 118 39.4 112 36.3 106 38.8 100 36.7 94 39.3 88 37.2 82 35 76 35.1 70 35.2 64 37.8 58 36.5 52 39 46 36.6 40 38.2 34 39.9 28 37.5 22 38.8 16 35.9 10 38.3 4 37.5 2.5 24 0.5 11'/%3E%3C/svg%3E");
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
