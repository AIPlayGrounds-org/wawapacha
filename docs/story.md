# WawaPacha story

The home page answers one question: how hot is the sea off Peru, and what does
that mean for the coast. It asks five smaller questions in order. Each chapter
opens with the question a reader would ask and answers it in the heading. The
chart below the heading is the evidence. Registry links identify the entries
that support each chapter.

## How a chapter is built

A chapter has four parts, in this order:

1. The question, in the reader's words.
2. The answer, as a sentence built from the data at build time.
3. One chart or document that shows the answer.
4. A doubt a reader would raise, answered with a quoted source.

A term is defined where the story first needs it, never before. "Anomalía"
appears after the reader has seen two temperatures and their difference. The
ICEN is defined after the reader has seen the box of sea it measures.

A source card shows the passage of the official document that supports the
sentence beside it. The passage is the `quote` of the claim's `source` entry in
the registry, read at build time, so the card and the registry cannot differ.

Answers fall back to a neutral sentence when their dataset is empty. Copy taken
from an ENFEN communiqué is keyed to that communiqué's number and year in
`web/app/messages.ts`. A newer communiqué without a summary shows a fallback
sentence that points to the official link. The site never presents an older
communiqué's forecast as the current one.

## First screen: the answer

The headline asks how hot the sea off Peru is and answers with the rank of the
latest ICEN since 1950. One line below names the index and gives its value. A
timeline of the whole series sits under it, with the latest month marked. The
status card shows the official ENFEN state. A rail lists the five questions and
follows the reader down the page.

## 1 · ¿Qué tan caliente está el mar?

The answer gives the temperature of the water and the normal temperature for
that week. Their difference introduces the anomaly. The map shows the anomaly
of each cell, marks the warmest one and draws the Niño 1+2 region:
[nino-1-2-box](../evidence/claims.toml).

## 2 · ¿Cómo lo saben?

Three steps explain the official measure: the index
([icen-plain-definition](../evidence/claims.toml)), its extraordinary category
([icen-extraordinary-threshold](../evidence/claims.toml)) and the rule that
declares an event
([coastal-event-plain-criterion](../evidence/claims.toml)), with the ENFEN
passage on a source card. A chart of the last 24 months shows why the weekly
value moves before the monthly index. The doubt is whether a recent value can
change: [icen-revises-plain](../evidence/claims.toml).

## 3 · ¿Es como 1983?

One timeline of the ICEN since 1950 stays on screen while four steps scroll
past it: the latest month, 1982-83, 1997-98 and 2017. Each step brings its mark
forward. The comparison of the two great events uses
[impact-8283-9798-caf-comparison](../evidence/claims.toml). The 2017 step shows
that a low index came with heavy damage:
[impact-2017-plain](../evidence/claims.toml) and
[impact-2017-people](../evidence/claims.toml), with the ENFEN passage on a
source card. The chapter ends on the sentence the reader should keep: the index
measures the sea, not the damage.

## 4 · ¿Va a llover donde vivo?

The lead and the forecast points quote the current communiqué. For N°20-2026
the lead is [enfen-co20-coast-extraordinaria-feb2027](../evidence/claims.toml)
and the points are [enfen-co20-nov-jan-rain](../evidence/claims.toml),
[enfen-co20-summer2027-rain](../evidence/claims.toml),
[enfen-co20-rivers](../evidence/claims.toml),
[enfen-co20-air-temperature-records](../evidence/claims.toml) and
[enfen-co20-waves-dec-jan](../evidence/claims.toml). The doubt is how sure the
forecast is: [forecast-uncertainty-plain](../evidence/claims.toml), with the
ENFEN passage on a source card.

A light sheet then shows what happened before. The precedent says where the
heaviest rain fell in 2017 and 2023:
[senamhi-69-2026-nino-costero-composite-coasts](../evidence/claims.toml), with
its limits in
[senamhi-69-2026-nino-costero-composite-limits](../evidence/claims.toml). The
station chart uses
[senamhi-hydrometeorological-stations](../evidence/claims.toml).

## 5 · ¿Qué hago con esto?

The lead quotes the current communiqué's recommendation; for N°20-2026 that is
[enfen-co20-recommendation](../evidence/claims.toml). Links go to ENFEN
communiqués and SENAMHI warnings, then to `/territorio`, `/rios` and
`/historico`. The local views use
[chirps-rainfall-estimates](../evidence/claims.toml),
[era5-historical-reanalysis](../evidence/claims.toml),
[era5-latency-and-limitations](../evidence/claims.toml),
[glofas-river-discharge-forecast](../evidence/claims.toml),
[glofas-ensemble-percentiles](../evidence/claims.toml),
[glofas-river-point-limits](../evidence/claims.toml) and
[historical-coastal-chronology](../evidence/claims.toml).

A recap repeats the five questions with their answers in one line each. The
page ends with each dataset, its institution and product link, and a link to
`/metodologia`.

## Other routes

`/aprende` holds the ONI explorer, using
[enso-is-ocean-atmosphere-pattern](../evidence/claims.toml),
[oni-definition-and-threshold](../evidence/claims.toml) and
[global-and-coastal-can-differ](../evidence/claims.toml). `/historico` shows
the sea chronology, the coastal index and station observations in that order.
The coastal event rule is [coastal-event-criterion](../evidence/claims.toml) and
the index is [icen-definition](../evidence/claims.toml).

The site makes no claim about how El Niño Costero rainfall differs between the
north and south coasts beyond the SENAMHI composite above.
