# Design

WawaPacha explains El Niño Costero to someone who lives on the Peruvian coast.
The home page is a short story: it asks its questions in order and answers
each with one chart or one sentence from an official source.
[`story.md`](story.md) holds the reading path. `/metodologia`, "Cómo lo sabemos",
uses the same header.

## Screen goal

The reader's goal is to understand how hot the sea is, how that is known, how
it compares with past events, and what it means where they live. The next
action is to read the official warning or open the local view of their region.

The home page carries one argument from top to bottom. Each beat shows one
thing. A chart, label or explanation that does not answer the beat's question
belongs on `/metodologia` or nowhere. Fewer labels read better than complete ones.

## System

The shared tokens live in [`web/app/app.vue`](../web/app/app.vue). Components
read those tokens; page styles do not add local colour or type scales.

| Rule              | Token or behavior                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type scale        | 12, 14, 16, 20, 24, 32, 48px. Home questions and answers scale with the viewport width.                                                                                                                                    |
| Families          | Source Serif 4 for questions, prose and data labels. Inter Tight for answers, the brand, chart and map values, and buttons.                                                                                                |
| Weights           | Serif: 300 for home questions, 400 for body, 600 for emphasis. Inter Tight: 700 for values, 800 for answers and the brand.                                                                                                 |
| Body and metadata | 16px body; 14px metadata; 12px labels. Home prose is 20px.                                                                                                                                                                 |
| Colour            | One ocean-blue accent. Tinted neutral roles and the warm and cold data hues use the shared palette. Warm and cold hues describe data direction, not danger.                                                                                 |
| Surfaces          | The paper, sea, sand and raised-surface roles separate evidence groups. Borders carry structure; shadows mark raised status only.                                                                                          |
| Spacing           | The 4px steps from `--space-1` through `--space-24` group content before surface treatment.                                                                                                                                |
| Targets and focus | Interactive targets are at least 44px high. `:focus-visible` uses the accent outline.                                                                                                                                      |
| Motion            | Marks on the timeline fade and grow when their step is read. A season line below the fold draws itself once it scrolls into view, and its notes fade in after it. A paper card below the fold drops into place, a beat after the card before it. A reel cuts between its cards in view and holds on the last; the year stamp jumps on each cut. The rows of a drain column below the fold slide in from the left, one after another. Reduced motion removes every transition and shows a reel as a column. No content enters from scale zero. |
| Data chrome       | `ChartShell` owns variable, unit, period, type, source and update age: one visible line plus a "Cómo se mide" disclosure. On the home page its `bare` mode keeps a one-line caption, the source link and the stale notice. |

## The home scenes

Each home beat is a full-bleed scene on its own ground: green for the opening,
the beat on why Lima stays dry, the rain beat and the closing, blue for the sea
and the regions, ink for history, readiness and the footer, brick red
for what to do. Every scene carries the same grain and a soft highlight, so the
page reads as one printed piece. A `.scene` restates the shared tokens for its
ground, so `ChartShell`, `SiteHeader` and the charts need no dark variant. Warm
tones mark water above normal and blue marks water below it.

| Element    | Rule                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| Beat       | The question in light serif, then the answer as a heavy Inter Tight heading. No kicker, count or rail.                     |
| Strip      | A torn red strip sits behind the few words the story turns on: the opening answer, the punch line and the official status. |
| Map        | Two maps on one scale: today and the same day a year earlier, side by side on a desktop and stacked on a phone. Land is one flat tone with the coastline as a thin line. Country names sit on land in spaced capitals and the ocean's name on the sea in spaced italic. Only Tumbes, Piura and Lima are named, in spaced italic serif. A chalk ring marks today's warmest point with its value; the year-earlier map rings the same point in dashed, muted chalk. A small globe in the corner of today's map pins the region. One legend sits under both, with "lo normal" on its normal step. |
| Annotation | A chart labels only the marks its beat talks about, on the chart where the value sits. No legend to consult.               |
| Scrolly    | One chart stays on screen while its steps scroll past. Each step brings one mark forward and dims the rest.                |
| Press line | The sea's weekly line is drawn up to the step in view. The words printed that day sit above it in serif italic with their « », death counts below it in the accent. Near labels stack in rows; a label that would pass the edge ends at its date. The chart's figure wraps its steps, so the caption follows them on a phone. |
| Unit grid  | One dot or square per unit, 40 to a row, with the unit said once above the grid. Each row leads with its count in Inter Tight and a serif label. The accent fills the count; a second count of the same thing is muted; units out of a total are empty outlines. |
| Scale bars | Flat accent bars on one scale from zero, each with its serif label and its value in Inter Tight. A level to read them against is a dotted line through every track, with its value and a short label ending at the line. Several levels stack their labels, highest first, one per row. |
| Region     | A native select picks one region; each panel heads its sea, river and rain rows in Inter Tight over a plain sentence or a scale-bar chart. |
| Overlay    | Two events on one month axis inside a scrolly step: the step's event in the accent, drawn on scroll; the past event muted. Each peak is labelled with its event and value in Inter Tight; a pin is a ring with a serif italic note. The neutral band sits behind both lines. |
| Hand mark  | An arrow drawn as a loose curve, with a serif italic note, ties two points the sentence compares.                          |
| Paper card | What the press printed, on newsprint in every scene and theme: outlet and date on top, one verbatim phrase set in bold serif, a link to the source. Laid down a little askew. Measurements never sit on a card. A source in another language shows our translation large, tagged as ours, with the verbatim original small under it in its own `lang`. |
| Clip card  | What television said, on a dark screen in every scene and theme: the year stamped top left, the lifted words in bold serif, a red tag with the outlet over a light chyron with the transcript line in capitals, and a link to the cited second. The date joins the tag only when the source gives a day or a month. No video plays on the page: the footage is not ours, so the link opens it on YouTube. A still is small, with no chyron line. |
| Reel       | Cards of one beat in one frame that keeps the tallest card's height. Below it: back, play or pause or replay, and next as round 44px buttons, and one tick per card that fills while the card is on. Arrow keys step. A slow reel holds lines meant to be read; a fast one is a chorus of one week. A row of stills never plays. |
| Score row  | Three square marks, one per condition, each with its label and its state in words. Filled is the accent, half fills the left half, pending is a dashed box, unknown holds a "?". The frame shows the boxes without states. |
| Thread mark | A thread's line glyph in the accent and its name in serif italic, set above a clip card's frame. |
| Drain column | One row per drain card: the drain glyph, the year in Inter Tight and the lifted words in serif italic, stacked as a list named for its years. |
| Hand-off   | The sentence that ends a beat or a step, set alone after a wide gap in the question's light serif. |
| Checklist  | One line per part of a system: a check or a dash, the part, and "funciona" or "falta" in bold. |

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
