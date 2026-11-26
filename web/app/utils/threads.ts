import type { PaperCard } from '~/data/claims'

/**
 * The seven threads that come back in every event. Each is drawn as one glyph on a 24-unit grid,
 * stroked in the card's ink, so a reader learns to spot it when it returns.
 */
export const THREADS = {
  nadie: {
    glyph: 'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9.2v3.4M12 15h.01',
  },
  rio: {
    glyph:
      'M2 9c2.5-2.5 5 2.5 7.5 0s5-2.5 7.5 0 3.5 1.5 5 0M2 15c2.5-2.5 5 2.5 7.5 0s5-2.5 7.5 0 3.5 1.5 5 0',
  },
  dren: { glyph: 'M4 6h16v12H4zM8 6v12M12 6v12M16 6v12' },
  motobombas: {
    glyph:
      'M12 3c-3.5 4.5-6 7.6-6 11a6 6 0 0 0 12 0c0-3.4-2.5-6.5-6-11zM12 18v-6M9.5 14.5 12 12l2.5 2.5',
  },
  techo: { glyph: 'M3 12.5 12 5l9 7.5M6 10.5V19h12v-8.5' },
  devastador: { glyph: 'M13.5 2 5 13.5h6L10 22l9-12.5h-6z' },
  otraVez: { glyph: 'M20 12a8 8 0 1 1-2.35-5.65M20 4v5h-5' },
} as const

export type ThreadId = keyof typeof THREADS

/** A card the page marks as a thread's first appearance in its block. */
export type Threaded<T extends PaperCard = PaperCard> = T & { readonly thread?: ThreadId }

export const marked = <T extends PaperCard>(card: T, thread: ThreadId): Threaded<T> => ({
  ...card,
  thread,
})
