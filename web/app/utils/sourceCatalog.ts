import type { Dataset } from '~/types/dataset'
import { messages } from '~/messages'

export type SourceCatalogRecord = {
  id: string
  name: string
  provider: string
  variable: string
  unit: string
  data_type: Dataset['data_type']
  spatial_resolution: string
  temporal_resolution: string
  reference_period?: string
  license?: string
  provider_url: string
  data_url: string
  on_site: boolean
}

export type SourceDatasetMetadata = Pick<Dataset, 'id' | 'ingestion_time'>

export type SourceCatalogEntry = {
  id: string
  name: string
  provider: string
  variable: string
  unit: string
  spatialResolution: string
  temporalResolution: string
  referencePeriod: string | null
  license: string | null
  dataType: Dataset['data_type']
  lastUpdate: string
  providerUrl: string
  dataUrl: string
}

export type SourceCatalogDocument = {
  sources: SourceCatalogRecord[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const requiredString = (entry: Record<string, unknown>, key: string, source: number): string => {
  const value = entry[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`[sourceCatalog] sources[${source}].${key} must be a non-empty string`)
  }
  return value
}

const optionalString = (
  entry: Record<string, unknown>,
  key: string,
  source: number,
): string | undefined => {
  const value = entry[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new Error(`[sourceCatalog] sources[${source}].${key} must be a string`)
  }
  return value
}

const requiredBoolean = (entry: Record<string, unknown>, key: string, source: number): boolean => {
  const value = entry[key]
  if (typeof value !== 'boolean') {
    throw new Error(`[sourceCatalog] sources[${source}].${key} must be true or false`)
  }
  return value
}

const isDataType = (dataType: string): dataType is Dataset['data_type'] =>
  Object.hasOwn(messages.dataType, dataType)

export const validateSourceCatalog = (value: unknown): SourceCatalogDocument => {
  if (!isRecord(value) || !Array.isArray(value.sources) || value.sources.length === 0) {
    throw new Error('[sourceCatalog] generated catalogue must contain a sources array')
  }

  return {
    sources: value.sources.map((raw, index) => {
      if (!isRecord(raw)) {
        throw new Error(`[sourceCatalog] sources[${index}] must be an object`)
      }
      const dataType = requiredString(raw, 'data_type', index)
      if (!isDataType(dataType)) {
        throw new Error(`[sourceCatalog] sources[${index}].data_type is invalid`)
      }

      const source: SourceCatalogRecord = {
        id: requiredString(raw, 'id', index),
        name: requiredString(raw, 'name', index),
        provider: requiredString(raw, 'provider', index),
        variable: requiredString(raw, 'variable', index),
        unit: requiredString(raw, 'unit', index),
        data_type: dataType,
        spatial_resolution: requiredString(raw, 'spatial_resolution', index),
        temporal_resolution: requiredString(raw, 'temporal_resolution', index),
        provider_url: requiredString(raw, 'provider_url', index),
        data_url: requiredString(raw, 'data_url', index),
        on_site: requiredBoolean(raw, 'on_site', index),
      }
      const referencePeriod = optionalString(raw, 'reference_period', index)
      const license = optionalString(raw, 'license', index)
      if (referencePeriod !== undefined) source.reference_period = referencePeriod
      if (license !== undefined) source.license = license
      return source
    }),
  }
}

export const buildSourceCatalog = (
  registry: SourceCatalogRecord[],
  datasets: SourceDatasetMetadata[],
): SourceCatalogEntry[] => {
  const datasetsById = new Map(datasets.map((dataset) => [dataset.id, dataset]))

  return registry.map((entry) => {
    const dataset = datasetsById.get(entry.id)
    if (!dataset) {
      throw new Error(`[sourceCatalog] data/${entry.id}.json is not available through loadDataset`)
    }
    return {
      id: entry.id,
      name: entry.name,
      provider: entry.provider,
      variable: entry.variable,
      unit: entry.unit,
      spatialResolution: entry.spatial_resolution,
      temporalResolution: entry.temporal_resolution,
      referencePeriod: entry.reference_period ?? null,
      license: entry.license ?? null,
      dataType: entry.data_type,
      lastUpdate: dataset.ingestion_time,
      providerUrl: entry.provider_url,
      dataUrl: entry.data_url,
    }
  })
}
