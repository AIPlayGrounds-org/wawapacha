import { parse } from 'smol-toml'

const CLAIM_STATUSES = ['verified', 'held']
const CARD_FIELDS = ['outlet', 'published', 'lift'] as const
const PUBLISHED_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/u

/** What a paper card prints for a press source: its outlet, date and one lifted phrase. */
export type PaperCard = {
  outlet: string
  /** `YYYY-MM-DD`, or `YYYY-MM` for a document dated by month. */
  published: string
  /** A phrase copied from the source's quote, so the card prints only verbatim words. */
  lift: string
  href: string
}

export type ClaimSource = {
  ref: string
  quote: string
  card?: PaperCard
}

export type RegistryClaim = {
  id: string
  claimEs: string
  status: string
  sources: ClaimSource[]
}

type RegistryDocument = {
  claim?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const parseCard = (
  label: string,
  source: Record<string, unknown>,
  ref: string,
  quote: string,
): PaperCard | undefined => {
  const present = CARD_FIELDS.filter((field) => source[field] !== undefined)
  if (present.length === 0) return undefined
  const { outlet, published, lift } = source
  if (
    present.length !== CARD_FIELDS.length ||
    typeof outlet !== 'string' ||
    typeof published !== 'string' ||
    typeof lift !== 'string'
  ) {
    throw new Error(`${label} must define all of ${CARD_FIELDS.join(', ')} as text, or none`)
  }
  if (!PUBLISHED_PATTERN.test(published)) {
    throw new Error(`${label} has published "${published}"; use YYYY-MM-DD or YYYY-MM`)
  }
  if (!quote.includes(lift)) throw new Error(`${label} lifts "${lift}", which is not in its quote`)
  return { outlet, published, lift, href: ref }
}

const parseSources = (id: string, value: unknown): ClaimSource[] => {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`claim ${id} has a source that is not a table`)
  const sources = value.map((source, index) => {
    const label = `source ${index + 1} of claim ${id}`
    if (!isRecord(source) || typeof source.ref !== 'string' || typeof source.quote !== 'string') {
      throw new Error(`${label} must define ref and quote`)
    }
    const card = parseCard(label, source, source.ref, source.quote)
    return card
      ? { ref: source.ref, quote: source.quote, card }
      : { ref: source.ref, quote: source.quote }
  })
  if (sources.filter((source) => source.card).length > 1) {
    throw new Error(`claim ${id} has more than one paper card`)
  }
  return sources
}

export const parseClaims = (registryText: string): RegistryClaim[] => {
  const document = parse(registryText) as RegistryDocument
  if (!Array.isArray(document.claim)) {
    throw new Error('claims registry has no [[claim]] entries')
  }

  const ids = new Set<string>()
  return document.claim.map((value, index) => {
    if (!isRecord(value)) throw new Error(`claim ${index + 1} is not a table`)
    const id = value.id
    const claimEs = value.claim_es
    const status = value.status
    if (typeof id !== 'string' || typeof claimEs !== 'string' || typeof status !== 'string') {
      throw new Error(`claim ${index + 1} must define id, claim_es and status`)
    }
    if (!CLAIM_STATUSES.includes(status)) {
      throw new Error(`claim ${id} has status "${status}"; use ${CLAIM_STATUSES.join(' or ')}`)
    }
    if (ids.has(id)) throw new Error(`duplicate claim id: ${id}`)
    ids.add(id)
    return { id, claimEs, status, sources: parseSources(id, value.source) }
  })
}

/** The paper card of a claim, from the one source that carries card fields. */
export const claimCard = (claim: RegistryClaim): PaperCard | undefined =>
  claim.sources.find((source) => source.card)?.card
