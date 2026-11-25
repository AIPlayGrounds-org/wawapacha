# WawaPacha story

The home page answers one question: how hot is the sea off Peru, and what does
that mean for the coast. It tells that answer in five short beats. Each beat
opens with the question a reader would ask and answers it in the heading. One
chart or one line of evidence follows. The page does not show everything the
project knows: definitions belong to `/aprende`, method to `/metodologia`, and
local and archive views to their own routes.

## How a beat is built

A beat has three parts, in this order:

1. The question, in the reader's words.
2. The answer, as a sentence built from the data at build time.
3. One chart, or one sentence with its official source.

Answers fall back to a neutral sentence when their dataset is empty. Copy taken
from an ENFEN communiqué is keyed to that communiqué's number and year in
`web/app/messages.ts`. A newer communiqué without a summary shows a fallback
sentence that points to the official link. The site never presents an older
communiqué's forecast as the current one.

## First screen: ¿Qué tan caliente está el mar?

The answer compares the latest ICEN with every month since 1950 and names the
episodes that went higher, such as "salvo en 1983 y 1997–98". One line gives
the month and its value. The timeline of the whole series sits below, with only
the latest month marked and its level drawn across the series.

## ¿Dónde está ese calor?

The answer gives the warmest anomaly on the map without naming a place, because
the warmest cell moves. One line gives the latest weekly sea temperature of the
north coast and its normal. The map shows the anomaly of each cell and rings
the warmest one.

## ¿Es como 1983, 1998 o 2017?

The timeline stays on screen while four steps scroll past it: 1982-83, 1997-98,
2017 and the latest month. Each step brings its mark forward. The comparison of
the two great events uses
[impact-8283-9798-caf-comparison](../evidence/claims.toml). The 2017 step shows
that a low index came with heavy damage:
[impact-2017-people](../evidence/claims.toml). The beat ends on the sentence
the reader should keep: the index measures the sea, not the damage.

## ¿Va a llover donde vivo?

The answer is the title of the current communiqué's forecast. The lead quotes
it; for N°20-2026 that is
[enfen-co20-coast-extraordinaria-feb2027](../evidence/claims.toml). One line
names the official status and links the communiqué. A stale communiqué adds
when the next one was due.

## ¿Qué hago ahora?

The lead quotes the current communiqué's recommendation; for N°20-2026 that is
[enfen-co20-recommendation](../evidence/claims.toml). One line says that no
chart on the page gives local rainfall. Two links go to ENFEN communiqués and
SENAMHI warnings.

## Other routes

`/aprende` holds the ONI explorer, using
[enso-is-ocean-atmosphere-pattern](../evidence/claims.toml),
[oni-definition-and-threshold](../evidence/claims.toml) and
[global-and-coastal-can-differ](../evidence/claims.toml). `/historico` shows
the sea chronology, the coastal index and station observations in that order.
The coastal event rule is [coastal-event-criterion](../evidence/claims.toml) and
the index is [icen-definition](../evidence/claims.toml). `/territorio` and
`/rios` hold the local views.
