import { clipCard, clipCards, paperCard, type ClipCard } from '~/data/claims'
import { marked, type Threaded } from '~/utils/threads'

/**
 * The page's newscast reels, in the order the script cuts them. A claim with more than one clip
 * card is indexed in registry order: tv-latina-1997-drenes is [drains, pumps], tv-tvperu-2017-2400
 * is [drainage, «el más brutal»] and tv-elcomercio-2023-lima-drenaje is [drainage, «nunca
 * aprendemos»].
 *
 * A card is marked with its thread the first time that thread appears in its block, as the script
 * places the marks.
 */
export const REELS = {
  /** Block 0 opens on it: one word, «devastador», from 1983 to 2026. The headline holds. */
  apertura: [
    marked(clipCard('tv-1983-film-devastador'), 'devastador'),
    clipCard('tv-latina-1997-devastador'),
    clipCard('tv-america-1998-03-12-historia'),
    clipCards('tv-tvperu-2017-2400')[1]!,
    paperCard('panamericana-2026-09-16-devastador'),
  ],
  historia1983: [
    marked(clipCard('tv-1983-film-pronostico'), 'nadie'),
    marked(clipCard('tv-1983-film-alcantarillado'), 'dren'),
    marked(clipCard('tv-1984-belaunde-muros'), 'rio'),
  ],
  tumbes1997: [
    clipCard('tv-ap-1997-fujimori-drenaje'),
    marked(clipCards('tv-latina-1997-drenes')[0]!, 'dren'),
    marked(clipCards('tv-latina-1997-drenes')[1]!, 'motobombas'),
  ],
  /** The 1984 walls flash once between the two Piura openers, the only card from another year. */
  piura1998: [
    marked(clipCard('tv-america-1998-03-12-historia'), 'rio'),
    clipCard('tv-1984-belaunde-muros'),
    clipCard('tv-america-1998-03-16-bolognesi'),
  ],
  panorama2017: [
    marked(clipCard('tv-panorama-2017-inesperadamente'), 'nadie'),
    marked(clipCard('tv-panorama-2017-huarmey'), 'motobombas'),
    clipCard('tv-panorama-2017-motobombas'),
    marked(clipCard('tv-panorama-2017-techos'), 'techo'),
  ],
  /** «Nadie lo esperaba», turned around: this time the word came early. */
  alerta2026: [
    marked(clipCard('tv-tvperu-2026-02-16-inminente'), 'nadie'),
    clipCard('tv-rpp-2026-02-24-alerta'),
  ],
  /** The longest reel: the same sentence about the same drains, decade after decade. */
  drain: [
    marked(clipCard('tv-1983-film-alcantarillado'), 'dren'),
    clipCards('tv-latina-1997-drenes')[0]!,
    clipCards('tv-tvperu-2017-2400')[0]!,
    paperCard('elcomercio-2023-04-14-chilcal'),
    clipCards('tv-elcomercio-2023-lima-drenaje')[0]!,
    clipCard('tv-bdp-2026-sin-drenaje'),
  ],
  machines: [
    marked(clipCards('tv-latina-1997-drenes')[1]!, 'motobombas'),
    clipCard('tv-panorama-2017-huarmey'),
    clipCard('tv-rpp-2023-yaku-maquinaria'),
    clipCard('tv-rpp-2026-clamado'),
  ],
  lessons: [
    marked(clipCard('tv-1985-belaunde-leccion'), 'otraVez'),
    clipCard('tv-panorama-2017-ley-naturaleza'),
  ],
} satisfies Record<string, readonly Threaded[]>

/** Single clips the page sets alone, outside a reel. */
export const CLIPS = {
  techos1998: marked(clipCard('tv-america-1998-lima-techos'), 'techo'),
  terceraVez2017: marked(clipCard('tv-latina-2017-tercera-vez'), 'otraVez'),
  drenaje2017: marked(clipCards('tv-tvperu-2017-2400')[0]!, 'dren'),
  preparado2026: clipCard('tv-elcomercio-2026-11-21-preparado'),
  nuncaAprendemos: marked(clipCards('tv-elcomercio-2023-lima-drenaje')[1]!, 'otraVez'),
} satisfies Record<string, Threaded<ClipCard>>

/** The cold open again, at the end of the page, as a row of stills: its clips without the headline. */
export const STILLS: readonly ClipCard[] = REELS.apertura
  .filter((card): card is Threaded<ClipCard> => card.clip !== undefined)
  .map(({ thread: _thread, ...card }) => card)

/**
 * The drain words lifted from each card of the drain reel, in reel order. Each part between
 * ` … ` is verbatim in its card's lift.
 */
const DRAIN_WORDS = [
  'insuficientes',
  'los drenes no funcionaron',
  'no poseemos … drenaje adecuado',
  'pide a gritos un dren pluvial',
  'sin drenaje para la lluvia',
  'sin drenaje',
]

/** The drain marks collected since 1983, stacked as one column after the drain reel. */
export const DRAIN_COLUMN = REELS.drain.map((card, position) => ({
  year: card.published.slice(0, 4),
  words: DRAIN_WORDS[position]!,
  lift: card.lift,
}))
