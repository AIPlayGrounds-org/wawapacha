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
2017 and the latest month. Each step brings its mark forward and says what the
index does not: what happened on land.

The 1982-83 step draws the rain of 1983 in Piura beside a normal year on one
scale, 2 400 mm against 60,
[igp-woodman-2014-piura-1983](../evidence/claims.toml). It then asks how many
died and answers with two counts, one dot per person: 512 by the government in
July 1983, [elperuano-2023-1983-cronica](../evidence/claims.toml), and 380 by a
preliminary PAHO table, [impact-1983-paho-deaths](../evidence/claims.toml),
drawn muted. The two counts stay side by side; the page does not pick one.

The 1997-98 step compares the damage of the two great events,
[impact-8283-9798-caf-comparison](../evidence/claims.toml), and draws the Piura
river's peak flow in each, 3 200 and 4 424 m³/s,
[uni-sanchez-piura-1983](../evidence/claims.toml) and
[uni-sanchez-piura-1998](../evidence/claims.toml), against the 2 300 m³/s at
which the bridges closed,
[tv-america-1998-03-16-2300](../evidence/claims.toml). The 2017 step shows
that a low index came with heavy damage:
[impact-2017-people](../evidence/claims.toml). The beat ends on the sentence
the reader should keep: the index measures the sea, not the damage.

## Si los Niños se pronostican, ¿por qué siempre nos sorprenden?

The answer is "La palabra y el agua". The weekly Niño 1+2 temperature of 2017
stays on screen while its steps scroll past, and the line is drawn only up to
the step in view. Each step sets on the chart the word a card printed that day,
above the line, or a death count at its cut date, below it:

1. January: ENFEN gives a coastal Niño a 1%,
   [enfen-co01-2017-probabilities](../evidence/claims.toml).
2. February: ENFEN says "débil",
   [enfen-co03-2017-debil](../evidence/claims.toml).
3. March: El Comercio still prints "débil" with 26 dead,
   [elcomercio-2017-03-04-debil](../evidence/claims.toml).
4. Mid-March: ENFEN says "moderada" the week the sea peaks, and a chalk ring
   circles that week, [enfen-co06-2017-moderada](../evidence/claims.toml).
5. May and June: the dead reach 143 and 159,
   [impact-2017-paho-sinpad-may](../evidence/claims.toml) and
   [impact-2017-people](../evidence/claims.toml).

Each step leads with the sea and its normal that week. The beat then says that
débil and moderada measure the sea, not the damage, and lands the punch line:
the word came after the water. The ranking,
[impact-2017-plain](../evidence/claims.toml), and the reason not to believe,
[bausate-2017-2015-prevention](../evidence/claims.toml) and
[ramirez-2017-credibility](../evidence/claims.toml), follow.

A turn line opens 2026: the word did not wait for the water. A second chart
runs January to September 2026. ENFEN's words climb from débil to fuerte and
extraordinaria, from one claim with three cards,
[enfen-2026-coast-magnitude-wording](../evidence/claims.toml). Between them,
television and Andina raise the alarm in February,
[tv-tvperu-2026-02-16-inminente](../evidence/claims.toml),
[andina-2026-02-19-tumbes-rojo](../evidence/claims.toml) and
[tv-rpp-2026-02-24-alerta](../evidence/claims.toml). The last step pairs the
Panamericana headline,
[panamericana-2026-09-16-devastador](../evidence/claims.toml), with what ENFEN
wrote the same fortnight,
[enfen-it17-ai-model-e-index](../evidence/claims.toml), while the sea line
falls. The beat hands off to the rain beat: ENFEN has one word, and the press
chooses the one that reaches the house.

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
