import type { SourceCatalogRecord, SourceDatasetMetadata } from '~/utils/sourceCatalog'

export const sourceCatalogRegistryFixture = [
  {
    id: 'noaa-cpc-oni',
    name: 'ONI',
    provider: 'NOAA CPC',
    variable: 'ONI',
    unit: '°C',
    data_type: 'observed',
    spatial_resolution: 'Niño 3.4',
    temporal_resolution: 'Trimestral móvil',
    provider_url: 'https://example.com/provider-oni',
    data_url: 'https://example.com/data-oni',
    license: 'CC BY 4.0. Attribution text kept in the registry.',
    on_site: true,
  },
  {
    id: 'source-b',
    name: 'Source B',
    provider: 'Provider B',
    variable: 'Variable B',
    unit: 'mm',
    data_type: 'estimated',
    spatial_resolution: 'Grid B',
    temporal_resolution: 'Daily',
    provider_url: 'https://example.com/provider-b',
    data_url: 'https://example.com/data-b',
    on_site: true,
  },
] satisfies SourceCatalogRecord[]

export const sourceCatalogDatasetFixture = [
  { id: 'noaa-cpc-oni', ingestion_time: '2026-09-30T00:00:00+00:00' },
  { id: 'source-b', ingestion_time: '2026-10-01T00:00:00+00:00' },
] satisfies SourceDatasetMetadata[]
