import sourceCatalogJson from '~/data/source-catalog.json'
import { describe, expect, it } from 'vitest'
import { loadDataset } from '../server/utils/loadDataset'
import {
  sourceCatalogDatasetFixture,
  sourceCatalogRegistryFixture,
} from './fixtures/source-catalog'
import { buildSourceCatalog, validateSourceCatalog } from '~/utils/sourceCatalog'

describe('buildSourceCatalog', () => {
  it('keeps registry order and joins each source to its dataset update', () => {
    const catalog = buildSourceCatalog(sourceCatalogRegistryFixture, sourceCatalogDatasetFixture)

    expect(catalog.map((source) => source.id)).toEqual(['noaa-cpc-oni', 'source-b'])
    expect(catalog[0]).toMatchObject({
      providerUrl: 'https://example.com/provider-oni',
      dataUrl: 'https://example.com/data-oni',
      license: 'CC BY 4.0. Attribution text kept in the registry.',
      lastUpdate: '2026-09-30T00:00:00+00:00',
    })
    expect(catalog[1]).toMatchObject({
      referencePeriod: null,
      license: null,
      lastUpdate: '2026-10-01T00:00:00+00:00',
    })
  })

  it('rejects a source with no dataset', () => {
    expect(() => buildSourceCatalog(sourceCatalogRegistryFixture, [])).toThrow(
      'data/noaa-cpc-oni.json',
    )
  })
})

describe('validateSourceCatalog', () => {
  it.each([
    ['data_type', { data_type: 'bogus' }],
    ['name', { name: '' }],
    ['provider_url', { provider_url: undefined }],
    ['on_site', { on_site: 'yes' }],
  ])('rejects an invalid %s field', (field, change) => {
    const source = { ...sourceCatalogRegistryFixture[0]!, ...change } as unknown as Record<
      string,
      unknown
    >

    expect(() => validateSourceCatalog({ sources: [source] })).toThrow(field)
  })

  it('rejects an empty catalogue', () => {
    expect(() => validateSourceCatalog({ sources: [] })).toThrow('sources array')
  })
})

describe('generated source catalog', () => {
  it('flags only the sources the site shows', () => {
    const document = validateSourceCatalog(sourceCatalogJson)
    const shown = document.sources.filter((source) => source.on_site)

    expect(shown.map((source) => source.id).sort()).toEqual([
      'enfen-communique',
      'enfen-icen',
      'noaa-cpc-nino-weekly',
      'noaa-oisst',
    ])
  })

  it('takes the last update from the validated dataset loader', async () => {
    const document = validateSourceCatalog(sourceCatalogJson)
    const enfen = await loadDataset('enfen-communique')
    const source = document.sources.find((entry) => entry.id === enfen.id)!
    const catalog = buildSourceCatalog([source], [enfen])

    expect(catalog[0]?.lastUpdate).toBe(enfen.ingestion_time)
  })
})
