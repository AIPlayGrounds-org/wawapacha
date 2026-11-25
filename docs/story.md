# WawaPacha story

The home page answers one question: how worried should the coast be about this
Niño. It opens on what the press said, then answers in six short beats. Each
beat opens with the question a reader would ask and answers it in the heading.
One chart or one line of evidence follows. What the press and officials said
sits on paper cards; what the measurements say sits on the scene's ground. The page does not show everything the
project knows. Sources, chart method and limits belong to `/metodologia`,
"Cómo lo sabemos".

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

## Opening: ¿Qué tanto hay que preocuparse?

The page opens on what the reader has already heard. One line recalls the word
television used for each event:
[tv-1983-film-devastador](../evidence/claims.toml),
[tv-latina-1997-devastador](../evidence/claims.toml) and
[tv-tvperu-2017-2400](../evidence/claims.toml). Three paper cards then fall in,
one at a time: the Panamericana headline,
[panamericana-2026-09-16-devastador](../evidence/claims.toml), set large; the
APOYO trajectory, [apoyo-2026-trajectory](../evidence/claims.toml); and the
Tumbes river past its orange threshold,
[infobae-2026-11-17-tumbes](../evidence/claims.toml). The text names the
channel as the author of the headline, not ENFEN: no 2026 ENFEN communiqué says
"devastador". The page heading is the question, and the promise follows: the
page looks at where those numbers come from. The beat has no chart.

## ¿Qué tan caliente está el mar?

The answer is the gap between the latest Niño 1+2 week and its weekly normal,
such as "5,7 °C más que lo normal". The lead gives that week's temperature and
normal, then the same week a year earlier. A second line compares today with
the warmest month of a normal year, so the reader can judge the size of the
gap.

The chart puts each season on a July–June axis: the normal as a thick muted
line, last season as a thin line and this season as the accent line that ends
in its value. A bracket shows the gap. A hand-drawn arrow points to the normal
peak when today is already warmer. The beat hands off to the map: one line,
measured in one place, cannot say how far the heat reaches.

## ¿Dónde está ese calor?

The answer gives the warmest anomaly on the map without naming a place, because
the warmest cell moves. The map shows the anomaly of each cell and rings the
warmest one.

## ¿Por qué no llueve en Lima si está junto al mar?

The answer is that the sea is cold. The lead quotes an IGP physicist:
[igp-woodman-2014-stable](../evidence/claims.toml),
[igp-woodman-2014-threshold](../evidence/claims.toml) and
[igp-woodman-2014-season](../evidence/claims.toml). The season chart returns
with the 26 °C line, and the normal brightens only where it reaches the line.
Its summary names the months a normal year passes 26 °C and the month this
season did. A 1925 press quote,
[elcomercio-1925-alisio](../evidence/claims.toml), sits on its paper card and
shows that the explanation of the time left the sea out. The beat ends on the three conditions and the
punch line: in the summer of 1983 all three came together.

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

## Cómo lo sabemos

`/metodologia` lists the sources the home page shows, with their update dates.
It says how each chart is built, using
[icen-definition](../evidence/claims.toml) for the timeline. It names what each
data type means and what the site does not do.

The site has no other pages. The old routes `/historico`, `/aprende`,
`/territorio` and `/rios` redirect to the home chapter that took their place.
