import { clipCard, clipCards, paperCard, type ClipCard, type PaperCard } from '~/data/claims'

/**
 * The page's newscast reels, in the order the script cuts them. A claim with more than one clip
 * card is indexed in registry order: tv-latina-1997-drenes is [drains, pumps], tv-tvperu-2017-2400
 * is [drainage, «el más brutal»] and tv-elcomercio-2023-lima-drenaje is [drainage, «nunca
 * aprendemos»].
 */
export const REELS = {
  /** Block 0 opens on it: one word, «devastador», from 1983 to 2026. The headline holds. */
  apertura: [
    clipCard('tv-1983-film-devastador'),
    clipCard('tv-latina-1997-devastador'),
    clipCard('tv-america-1998-03-12-historia'),
    clipCards('tv-tvperu-2017-2400')[1]!,
    paperCard('panamericana-2026-09-16-devastador'),
  ],
  historia1983: [
    clipCard('tv-1983-film-pronostico'),
    clipCard('tv-1983-film-alcantarillado'),
    clipCard('tv-1984-belaunde-muros'),
  ],
  tumbes1997: [
    clipCard('tv-ap-1997-fujimori-drenaje'),
    clipCards('tv-latina-1997-drenes')[0]!,
    clipCards('tv-latina-1997-drenes')[1]!,
  ],
  /** The 1984 walls flash once between the two Piura openers, the only card from another year. */
  piura1998: [
    clipCard('tv-america-1998-03-12-historia'),
    clipCard('tv-1984-belaunde-muros'),
    clipCard('tv-america-1998-03-16-bolognesi'),
  ],
  panorama2017: [
    clipCard('tv-panorama-2017-inesperadamente'),
    clipCard('tv-panorama-2017-huarmey'),
    clipCard('tv-panorama-2017-motobombas'),
    clipCard('tv-panorama-2017-techos'),
  ],
  alerta2026: [clipCard('tv-tvperu-2026-02-16-inminente'), clipCard('tv-rpp-2026-02-24-alerta')],
  /** The longest reel: the same sentence about the same drains, decade after decade. */
  drain: [
    clipCard('tv-1983-film-alcantarillado'),
    clipCards('tv-latina-1997-drenes')[0]!,
    clipCards('tv-tvperu-2017-2400')[0]!,
    paperCard('elcomercio-2023-04-14-chilcal'),
    clipCards('tv-elcomercio-2023-lima-drenaje')[0]!,
    clipCard('tv-bdp-2026-sin-drenaje'),
  ],
  machines: [
    clipCards('tv-latina-1997-drenes')[1]!,
    clipCard('tv-panorama-2017-huarmey'),
    clipCard('tv-rpp-2023-yaku-maquinaria'),
    clipCard('tv-rpp-2026-clamado'),
  ],
  lessons: [clipCard('tv-1985-belaunde-leccion'), clipCard('tv-panorama-2017-ley-naturaleza')],
} satisfies Record<string, readonly PaperCard[]>

/** Single clips the page sets alone, outside a reel. */
export const CLIPS = {
  techos1998: clipCard('tv-america-1998-lima-techos'),
  terceraVez2017: clipCard('tv-latina-2017-tercera-vez'),
  drenaje2017: clipCards('tv-tvperu-2017-2400')[0]!,
  preparado2026: clipCard('tv-elcomercio-2026-11-21-preparado'),
  nuncaAprendemos: clipCards('tv-elcomercio-2023-lima-drenaje')[1]!,
} satisfies Record<string, ClipCard>

/** The cold open again, at the end of the page, as a row of stills: its clips without the headline. */
export const STILLS: readonly ClipCard[] = REELS.apertura.filter(
  (card): card is ClipCard => card.clip !== undefined,
)
