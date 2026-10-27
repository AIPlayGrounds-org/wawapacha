# Design

WawaPacha is a field brief for the Peruvian coast. The home page answers the
official state first, then gives the evidence, historical scale, outlook and
local routes needed to interpret it. Secondary routes use the same header,
reading rail and data frame.

## Screen goal

The user's goal is to understand the current coastal state and what evidence
supports it. The next action is to inspect the signal, forecast or local view
that answers their question.

The home page has one primary message: the current ENFEN status. The map,
charts and local links support that message. Historical context, methodology
and education remain available through navigation and are not presented as
competing calls to action.

## System

The shared tokens live in [`web/app/app.vue`](../web/app/app.vue). Components
read those tokens; page styles do not add local colour or type scales.

| Rule              | Token or behavior                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Type scale        | 12, 14, 16, 20, 24, 32, 48px; each screen uses at most five sizes.                                                                         |
| Families          | Source Serif 4 is the only product family. It serves reading copy, headings and metadata.                                                  |
| Weights           | 400 for body text and 600 for emphasis.                                                                                                    |
| Body and metadata | 16px body; 14px metadata; 12px labels.                                                                                                     |
| Headings          | 24px section titles; 32px page titles on narrow screens; 48px page titles on wide screens.                                                 |
| Colour            | One ocean-blue accent. Tinted neutral roles and data ramps use the shared palette. Warm and cold hues describe data direction, not danger. |
| Surfaces          | The paper, sea, sand and raised-surface roles separate evidence groups. Borders carry structure; shadows mark raised status only.          |
| Spacing           | The 4px steps from `--space-1` through `--space-24` group content before surface treatment.                                                |
| Targets and focus | Interactive targets are at least 44px high. `:focus-visible` uses the accent outline.                                                      |
| Motion            | Only local-link hover uses transform. It is gated for fine pointers and removed for reduced motion. No content enters from scale zero.     |
| Data chrome       | `ChartShell` owns variable, unit, period, type, source and update age for every chart.                                                     |

## Layout

The site uses one content rail. The home page uses paired columns only where a
map, status or forecast benefits from a side note. At 900px and below, those
columns become one column. Tables keep their accessible fallback and scroll
inside their own region when a long value needs more width.

The shared header marks the current route with `aria-current="page"`. Every
page keeps the skip link, one `main` landmark and one page heading.

## States

Charts show their loading and error placeholders where the chart will land.
Empty data uses a status message with the relevant next source or route. A
stale source keeps its provenance and adds a status notice linking to the
source. Table fallbacks remain available below the chart.

## Review answers

1. The home goal is the current ENFEN state.
2. The next decision needs status, date, evidence and an onward route.
3. The system carries source dates, units and update age into each chart.
4. Loading, stale and empty states are visible beside their content.
5. Signal, measure, scale, precedent, outlook and local routes are grouped.
6. Navigation, charts, tables and disclosure follow familiar patterns.
7. Dataset shaping and chart provenance absorb data complexity.
8. The first viewport gives the state before supporting evidence.
9. The status is the only large filled emphasis on the home page.
10. The common path is status to evidence to local view.
11. Static payloads show loading and error positions without a blank chart.
12. The first read and stale-source states are explicit.
13. Unrelated sections are not promoted to the home page's first decision.
