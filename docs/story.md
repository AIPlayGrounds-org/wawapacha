# WawaPacha story

The home page answers one question: how worried should the coast be about this
Niño. It opens on what the press said, then answers in short beats. Each
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

## The score

Three conditions frame the story: the sea passes 26 °C, it does so in summer,
and it meets a country that is not ready. A row of three marks, `ScoreRow`,
scores them wherever the page judges an event:

- The frame, in the beat on why Lima stays dry, with no state.
- Each history step. 1982-83 and 2017 fill all three. 1997-98 fills the sea and
  the summer and half the third, because the country mobilised,
  [glantz-2000-peru-mobilised](../evidence/claims.toml).
- Today, built from the data. The sea mark fills above 26 °C. The summer mark
  waits, dashed, until a week from December to March passes 26 °C, and turns
  empty in April if none did. The third mark is "?" in history, where the
  page says the readiness beat answers it, and half there and in the closing.
- Each region, against its own rows: the sea anomaly above 2 °C, the river
  above its lowest official threshold, and the rain above normal. A region with
  no threshold to cite gets "?" and says why.

Each mark is also said in words, so the row reads without its drawing.

## Threads and hand-offs

Seven threads run through the page, so the beats read as one story and not as
chapters: «Nadie lo esperaba», the river against the wall, the drain that never
comes, «Envíen motobombas», on the roof, «Devastador» and «Otra vez». A thread
is marked on a clip card, as its glyph and name, the first time it appears in a
beat. `marked()` in `web/app/utils/reels.ts` attaches each mark; paper cards
and the closing stills carry none.

The drain thread also collects. After TV Perú's 2017 card the 1983, 1997 and
2017 drain words stack into a column. After the drain reel in the readiness beat
the full column runs from 1983 to 2026. Each row is the year of a drain card and
words lifted verbatim from that card's lift.

A beat ends on a hand-off: one sentence, set alone, that opens the next
question. The opening, the sea, the rain beat and the first two history steps
end in the question's light serif. The beats that end on a punch line keep it
as their hand-off. The 2017 step needs none, because today's step follows it.
The region beat and what to do end the page and hand off to nothing.

## Opening: ¿Qué tanto hay que preocuparse?

The page opens on what the reader has already heard: a newscast reel cuts
through the word television used for each event, «devastador» in 1983,
[tv-1983-film-devastador](../evidence/claims.toml), and 1997,
[tv-latina-1997-devastador](../evidence/claims.toml), the river's highest level
in 1998, [tv-america-1998-03-12-historia](../evidence/claims.toml), and «el más
brutal» in 2017, [tv-tvperu-2017-2400](../evidence/claims.toml). It holds on the
Panamericana headline,
[panamericana-2026-09-16-devastador](../evidence/claims.toml). Two paper cards
then fall in: the APOYO trajectory,
[apoyo-2026-trajectory](../evidence/claims.toml), and the Tumbes river past its
orange threshold, [infobae-2026-11-17-tumbes](../evidence/claims.toml). The text names the
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

The answer says how far along the coast the heat reaches. It reads the sea
cell nearest each of nine coast points, from Ecuador to Ilo, and takes the run
from the first point above +2 °C to the first point below it, so a cold
stretch ends the run. It names the southernmost place of the run that the map
labels, or "el sur del Perú" when the run reaches Ilo. With one point it says
"solo frente a" that place; with none, that the coast stays under +2 °C.

The lead gives the warmest anomaly without naming a place, because the warmest
cell moves. Then it gives the same cell on the same day a year earlier: above,
below, or normal when it rounds to zero. The two maps show both days. The beat
hands off to rain: a warm sea does no harm by itself.

## ¿Por qué no llueve en Lima si está junto al mar?

The answer is that the sea is cold. The lead quotes an IGP physicist:
[igp-woodman-2014-stable](../evidence/claims.toml),
[igp-woodman-2014-threshold](../evidence/claims.toml) and
[igp-woodman-2014-season](../evidence/claims.toml). The season chart returns
with the 26 °C line, and the normal brightens only where it reaches the line.
Its summary names the months a normal year passes 26 °C and the month this
season did. A 1925 press quote,
[elcomercio-1925-alisio](../evidence/claims.toml), sits on its paper card and
shows that the explanation of the time left the sea out. The beat ends on the
three conditions, their unscored marks, and the punch line: in the summer of
1983 all three came together.

## ¿Es como 1983, 1998 o 2017?

The timeline stays on screen while four steps scroll past it: 1982-83, 1997-98,
2017 and the latest month. Each step brings its mark forward and says what the
index does not: what happened on land. Each step ends on its score.

The 1982-83 step draws the rain of 1983 in Piura beside a normal year on one
scale, 2 400 mm against 60,
[igp-woodman-2014-piura-1983](../evidence/claims.toml). It then asks how many
died and answers with two counts, one dot per person: 512 by the government in
July 1983, [elperuano-2023-1983-cronica](../evidence/claims.toml), and 380 by a
preliminary PAHO table, [impact-1983-paho-deaths](../evidence/claims.toml),
drawn muted. The two counts stay side by side; the page does not pick one.

The 1997-98 step opens in July 1997: the sea was already 4 °C above normal,
[igp-woodman-1997-4c](../evidence/claims.toml), and the IGP wrote that it was
«lejos» of 1983, [igp-woodman-1997-lejos](../evidence/claims.toml), on a paper
card. Below it, 1997-98 is drawn over 1982-83 month by month, with a pin on July
1997, so the reader sees how soon the forecast was overtaken. The step then
says how high 1983 went and compares the damage of the two great events,
[impact-8283-9798-caf-comparison](../evidence/claims.toml), and draws the Piura
river's peak flow in each, 3 200 and 4 424 m³/s,
[uni-sanchez-piura-1983](../evidence/claims.toml) and
[uni-sanchez-piura-1998](../evidence/claims.toml), against the 2 300 m³/s at
which the bridges closed,
[tv-america-1998-03-16-2300](../evidence/claims.toml). A UN agencies' report
says the country mobilised before the peak,
[glantz-2000-peru-mobilised](../evidence/claims.toml), so the third condition
was met only by half. The 2017 step draws
2016-17 over 1982-83 the same way and says the share: 2017's peak was under a
third of 1983's. The page says "menos de un tercio" only while the data makes it
true. It then shows that the low index came with heavy damage:
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

## ¿Se arregló lo que se rompió en 2017?

This beat answers the third condition. The answer is that more than one work in
four was not finished. Rebuilt works do not always hold: a Caretas card,
[caretas-1998-13-puentes](../evidence/claims.toml), and a grid of 68 squares
show that 13 bridges lost in 1998 were built after 1983. A second grid of 100
squares shows the 73 % of the Reconstrucción con Cambios works finished when it
closed in 2023, [elbuho-2024-reconstruction](../evidence/claims.toml).

APOYO's review of the Piura river's early warning comes next as a checklist:
the radar works; the sirens, the activation thresholds and the evacuation plans
are missing, [apoyo-2026-sat](../evidence/claims.toml). APOYO's readiness
finding, [apoyo-2026-readiness](../evidence/claims.toml), sets today's third
mark at half. The drain thread ties off on two cards: Piura's 40-year wait for
a storm drain, [elcomercio-2023-04-14-chilcal](../evidence/claims.toml), beside
its drainage works near zero in 2026,
[apoyo-2026-piura-works](../evidence/claims.toml). The
punch line hands off to the region beat: a Niño reaches a river, a street, a
roof, not the country in general.

## ¿Y en mi región?

The answer names the coastal regions where the last month's rain passed its
normal. A picker narrows the beat to one region; without JavaScript every
region shows. Each region has three rows:

- The sea: the latest OISST anomaly at the sea cell nearest a point on its
  coast.
- The rivers: what the current communiqué says of them, worded from
  [enfen-co20-rivers](../evidence/claims.toml) for N°20-2026. Tumbes also draws
  its two cited flows against its three official thresholds, from
  [infobae-2026-11-17-tumbes](../evidence/claims.toml) and
  [andina-2026-02-19-tumbes-rojo](../evidence/claims.toml). Other regions say
  that no official threshold can be cited.
- The rain: the last six CHIRPS pentads summed for the whole department, against
  the same pentads' 1991–2020 normal. It counts as above or below normal at a gap
  of 5 mm and half the normal, so a dry month's few millimetres do not read as a
  change.

Callao is left out: its CHIRPS area would repeat Lima's sea and add no rain of
its own. Modelled GloFAS flows stay off the beat: they have no threshold to cite.
Each panel ends on the region's score.

## ¿Qué aprendimos?

The closing sets two lessons people drew after a Niño side by side: Belaúnde's
in 1985, [tv-1985-belaunde-leccion](../evidence/claims.toml), and a neighbour's
in 2017, [tv-panorama-2017-ley-naturaleza](../evidence/claims.toml). One says
the country endured; the other, that nothing can be done. Neither speaks of what
is done before. The UN agencies' lesson for Peru,
[glantz-2000-peru-lesson](../evidence/claims.toml), follows on a card in our
Spanish, with the English original under it. The beat restates today's score
and ends on the last line: what returns can be expected. The opening's clips
come back under it as a row of stills that does not play.

## Television

Television says the same thing each time, so the page lets it repeat. A clip
card is a dark frame with the year, the lifted words, a chyron with the outlet
and the transcript line, and a link to the cited second on YouTube. A reel cuts
through several cards and holds on the last. `web/app/utils/reels.ts` holds
every reel and lone clip in page order:

- 1982–83: the forecast, the sewers that failed and Belaúnde's walls,
  [tv-1983-film-pronostico](../evidence/claims.toml),
  [tv-1983-film-alcantarillado](../evidence/claims.toml) and
  [tv-1984-belaunde-muros](../evidence/claims.toml).
- 1997–98: Tumbes and the drains in 1997,
  [tv-ap-1997-fujimori-drenaje](../evidence/claims.toml) and
  [tv-latina-1997-drenes](../evidence/claims.toml); Lima's roofs alone,
  [tv-america-1998-lima-techos](../evidence/claims.toml); then Piura's river and
  bridge, with the 1984 walls flashing once between them,
  [tv-america-1998-03-16-bolognesi](../evidence/claims.toml).
- 2017: a fast Panorama reel of the same week,
  [tv-panorama-2017-inesperadamente](../evidence/claims.toml),
  [tv-panorama-2017-huarmey](../evidence/claims.toml),
  [tv-panorama-2017-motobombas](../evidence/claims.toml) and
  [tv-panorama-2017-techos](../evidence/claims.toml); the third time in Latina,
  [tv-latina-2017-tercera-vez](../evidence/claims.toml); and TV Perú on the
  missing drainage.
- Today: whether the country is ready,
  [tv-elcomercio-2026-11-21-preparado](../evidence/claims.toml).
- ¿Estamos listos?: the longest reel, the same drains from 1983 to 2026, with
  Piura's 40-year wait for a storm drain,
  [elcomercio-2023-04-14-chilcal](../evidence/claims.toml), Lima,
  [tv-elcomercio-2023-lima-drenaje](../evidence/claims.toml), and 2026,
  [tv-bdp-2026-sin-drenaje](../evidence/claims.toml); then the machines that
  arrive late, [tv-rpp-2023-yaku-maquinaria](../evidence/claims.toml) and
  [tv-rpp-2026-clamado](../evidence/claims.toml).
- ¿Qué aprendimos?: the two lessons, in a slow reel.

A reel starts when it scrolls into view, stops when it leaves, and stops for
good when the reader steps or pauses. Without JavaScript, or with reduced
motion, every card shows in a column. No video plays on the page: the footage
rights are not ours, so each card links to its second on YouTube.

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
