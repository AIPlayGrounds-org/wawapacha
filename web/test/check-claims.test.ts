import { describe, expect, it } from 'vitest'
import { parseClaims } from '../scripts/claim-registry'
import { checkSiteClaims } from '../scripts/check-claims'
import { generatedValues, renderClaims } from '../scripts/generate-claims'

const escapedQuote = String.fromCharCode(92)
const registry = `
[[claim]]
id = "verified-id"
claim_es = "Una afirmación verificada con ${escapedQuote}"comillas${escapedQuote}"."
status = "verified"

[[claim]]
id = "held-id"
claim_es = "Afirmación retenida"
status = "held"

[[claim]]
id = "multiline-id"
claim_es = """
Una afirmación
en varias líneas.
"""
status = "verified"
`

const site = (source: string, registryText = registry, story = '') =>
  checkSiteClaims({
    registry: registryText,
    appSources: [{ fileName: 'messages.ts', source }],
    story,
  })

describe('claim check', () => {
  it('runs the real site check entry point', async () => {
    expect((await checkSiteClaims()).errors).toEqual([])
  })

  it('rejects an unknown claim id', async () => {
    const result = await site("import { claim } from './claims'; claim('missing-id')")
    expect(result.errors).toEqual(['claim id is unknown: missing-id'])
  })

  it('rejects a held claim id', async () => {
    const result = await site("import { claim } from './claims'; claim('held-id')")
    expect(result.errors).toEqual(['claim id is not verified: held-id'])
  })

  it('does not bundle a held claim', () => {
    expect(renderClaims(registry)).not.toContain('held-id')
  })

  it('rejects a status that is neither verified nor held', () => {
    const typo = registry.replace('status = "held"', 'status = "verifed"')
    expect(() => parseClaims(typo)).toThrow('claim held-id has status "verifed"')
  })

  it('rejects a duplicate claim id, whatever its status', () => {
    const duplicate = `${registry}\n[[claim]]\nid = "held-id"\nclaim_es = "Otra"\nstatus = "held"\n`
    expect(() => parseClaims(duplicate)).toThrow('duplicate claim id: held-id')
  })

  it('rejects an unknown claim id in a Vue template', async () => {
    const result = await checkSiteClaims({
      registry,
      appSources: [
        { fileName: 'component.vue', source: "<template>{{ claim('missing-id') }}</template>" },
      ],
      story: '',
    })
    expect(result.errors).toEqual(['claim id is unknown: missing-id'])
  })

  it('accepts a verified claim id', async () => {
    const result = await site("import { claim } from './claims'; claim('verified-id')")
    expect(result).toEqual({ claimIds: ['verified-id'], errors: [] })
  })

  it('rejects a generated module that is stale after the registry changes', async () => {
    const generated = renderClaims(registry)
    const editedRegistry = registry.replace(
      'Una afirmación verificada',
      'Una afirmación actualizada',
    )
    const result = await site('', editedRegistry, '')
    const staleResult = await checkSiteClaims({
      registry: editedRegistry,
      appSources: [{ fileName: 'messages.ts', source: '' }],
      story: '',
      generatedClaims: generated,
    })

    expect(result.errors).toEqual([])
    expect(staleResult.errors).toEqual(['generated claims differ from registry'])
  })

  it('parses escaped quotes and multi-line claim_es values', async () => {
    expect(parseClaims(registry)).toEqual([
      {
        id: 'verified-id',
        claimEs: 'Una afirmación verificada con "comillas".',
        status: 'verified',
        sources: [],
      },
      { id: 'held-id', claimEs: 'Afirmación retenida', status: 'held', sources: [] },
      {
        id: 'multiline-id',
        claimEs: 'Una afirmación\nen varias líneas.\n',
        status: 'verified',
        sources: [],
      },
    ])
    const result = await site("import { claim } from './claims'; claim('multiline-id')")
    expect(result.errors).toEqual([])
  })

  describe('paper cards', () => {
    const cardRegistry = (card: string, extraSource = '') => `
[[claim]]
id = "press-id"
claim_es = "Un diario lo tituló."
status = "verified"

[[claim.source]]
ref = "https://example.org/nota"
quote = "el mar sigue una trayectoria muy similar"
${card}
${extraSource}
`
    const fullCard = 'outlet = "Diario"\npublished = "2026-07"\nlift = "trayectoria muy similar"'

    it('reads a card from its source and links it to the source', () => {
      expect(parseClaims(cardRegistry(fullCard))[0]?.sources[0]?.card).toEqual({
        outlet: 'Diario',
        published: '2026-07',
        lift: 'trayectoria muy similar',
        href: 'https://example.org/nota',
      })
    })

    it('rejects a lift that is not in the quote', () => {
      expect(() => parseClaims(cardRegistry(fullCard.replace('muy similar', 'idéntica')))).toThrow(
        'lifts "trayectoria idéntica", which is not in its quote',
      )
    })

    it('rejects a card with only some of its fields', () => {
      expect(() => parseClaims(cardRegistry('outlet = "Diario"'))).toThrow(
        'must define all of outlet, published, lift as text, or none',
      )
    })

    it('rejects a published value that is not a day or a month', () => {
      expect(() => parseClaims(cardRegistry(fullCard.replace('2026-07', 'julio 2026')))).toThrow(
        'use YYYY-MM-DD or YYYY-MM',
      )
    })

    it('keeps one card per source, in source order', () => {
      const second = `[[claim.source]]\nref = "https://example.org/otra"\nquote = "una segunda nota"\noutlet = "Otro"\npublished = "2026-08-01"\nlift = "segunda nota"`
      const { claimCards } = generatedValues(cardRegistry(fullCard, second))
      expect(claimCards['press-id']?.map((card) => card.outlet)).toEqual(['Diario', 'Otro'])
    })

    it('counts paperCard() and paperCards() as claim uses', async () => {
      const result = await site(
        "import { paperCard, paperCards } from './claims'; paperCard('press-id'); paperCards('press-id')",
        cardRegistry(fullCard),
      )
      expect(result).toEqual({ claimIds: ['press-id'], errors: [] })
    })

    it('rejects a generated module whose second card is stale', async () => {
      const second = `[[claim.source]]\nref = "https://example.org/otra"\nquote = "una segunda nota"\noutlet = "Otro"\npublished = "2026-08-01"\nlift = "segunda nota"`
      const generated = renderClaims(cardRegistry(fullCard, second))
      const result = await checkSiteClaims({
        registry: cardRegistry(fullCard, second.replace('"Otro"', '"Tercero"')),
        appSources: [{ fileName: 'messages.ts', source: '' }],
        story: '',
        generatedClaims: generated,
      })
      expect(result.errors).toEqual(['generated claims differ from registry'])
    })

    it('rejects a generated module whose cards are stale', async () => {
      const generated = renderClaims(cardRegistry(fullCard))
      const result = await checkSiteClaims({
        registry: cardRegistry(fullCard.replace('Diario', 'Otro diario')),
        appSources: [{ fileName: 'messages.ts', source: '' }],
        story: '',
        generatedClaims: generated,
      })
      expect(result.errors).toEqual(['generated claims differ from registry'])
    })
  })

  it('checks claim ids linked from story.md', async () => {
    const result = await site(
      '',
      registry,
      '[verified-id](../evidence/claims.toml)\n[missing-id](../evidence/claims.toml)',
    )
    expect(result.errors).toEqual(['claim id is unknown: missing-id'])
  })
})
