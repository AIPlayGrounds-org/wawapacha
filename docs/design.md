# Design

WawaPacha explains El Niño Costero to someone who lives on the Peruvian coast.
The home page is a short story: it asks five questions in order and answers
each with one chart or one sentence from an official source.
[`story.md`](story.md) holds the reading path. Secondary routes use the same
header and data frame.

## Screen goal

The reader's goal is to understand how hot the sea is, how that is known, how
it compares with past events, and what it means where they live. The next
action is to read the official warning or open the local view of their region.

The home page carries one argument from top to bottom. Each beat shows one
thing. A chart, label or explanation that does not answer the beat's question
belongs on a secondary route. Fewer labels read better than complete ones.

## System

The shared tokens live in [`web/app/app.vue`](../web/app/app.vue). Components
read those tokens; page styles do not add local colour or type scales.

| Rule              | Token or behavior                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type scale        | 12, 14, 16, 20, 24, 32, 48px. Home questions and answers scale with the viewport width.                                                                                                                                    |
| Families          | Source Serif 4 for questions, prose and data labels. Inter Tight for answers, the brand, chart and map values, and buttons.                                                                                                |
| Weights           | Serif: 300 for home questions, 400 for body, 600 for emphasis. Inter Tight: 700 for values, 800 for answers and the brand.                                                                                                 |
| Body and metadata | 16px body; 14px metadata; 12px labels. Home prose is 20px.                                                                                                                                                                 |
| Colour            | One ocean-blue accent on inner pages; the home scenes add terracotta and teal. Tinted neutral roles and data ramps use the shared palette. Warm and cold hues describe data direction, not danger.                         |
| Surfaces          | The paper, sea, sand and raised-surface roles separate evidence groups. Borders carry structure; shadows mark raised status only.                                                                                          |
| Spacing           | The 4px steps from `--space-1` through `--space-24` group content before surface treatment.                                                                                                                                |
| Targets and focus | Interactive targets are at least 44px high. `:focus-visible` uses the accent outline.                                                                                                                                      |
| Motion            | Marks on the timeline fade and grow when their step is read. Reduced motion removes every transition. No content enters from scale zero.                                                                                   |
| Data chrome       | `ChartShell` owns variable, unit, period, type, source and update age: one visible line plus a "Cómo se mide" disclosure. On the home page its `bare` mode keeps a one-line caption, the source link and the stale notice. |

## The home scenes

Each home beat is a full-bleed scene on near-white paper and ink, so the data
carries the colour. The opening, history and rain scenes sit on paper, the sea
scene on a pale sea tint, and the last scene, what to do, on deep teal. With a
dark system theme the paper becomes charcoal and the ink ivory. Every scene
carries the same faint grain. A `.scene` restates the shared tokens for its
ground, so `ChartShell`, `SiteHeader` and the charts need no dark variant. Warm
tones mark water above normal and blue marks water below it.

Two accents split the scenes by temperature: terracotta for what is hot and
official, teal for the sea. The last scene uses amber on teal.

| Element    | Rule                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kicker     | A small IBM Plex Mono label above each question: "01 / 05 · Estado del mar". Metadata and counts use mono; no other text does.                          |
| Beat       | The question in light serif, then the answer as a heavy Inter Tight heading.                                                                            |
| Strip      | A torn strip sits behind the few words the story turns on: the opening answer, the sea answer and the punch line. Terracotta, or teal in the sea scene. |
| Stripes    | Under the opening chart, one stripe per year since 1950 from the mean Niño 3.4 anomaly, cold to warm, with the first and last year below.               |
| Status     | The official status carries a terracotta dot. The communiqué link is underlined in the scene accent.                                                    |
| Map        | A dark sheet of its own. Place names in spaced italic serif. A hand-drawn chalk ring marks the warmest point, with its value beside it.                 |
| Annotation | A chart labels only the marks its beat talks about, on the chart where the value sits. No legend to consult.                                            |
| Scrolly    | One chart stays on screen while its steps scroll past. Each step brings one mark forward and dims the rest.                                             |

## Layout

The site uses one content rail. The history beat pairs its steps with the
timeline. At 860px and below they become one column, and the timeline stays at
the top of the screen while its steps scroll beneath it. Tables keep their accessible
fallback and scroll inside their own region when a long value needs more width.

The shared header marks the current route with `aria-current="page"`. Every page
keeps the skip link, one `main` landmark and one page heading.

## States

Charts show their loading and error placeholders where the chart will land.
Empty data uses a status message with the relevant next source or route. A stale
source keeps its provenance and adds a status notice linking to the source.
Table fallbacks remain available below the chart. The story reads in full
without JavaScript: every step and mark is in the static HTML.
