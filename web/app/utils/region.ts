import type { ChirpsRecord, GridRecord } from '~/types/dataset'
import type { DatasetFor } from '~/types/datasets'
import { seaNear, type SeaCell } from '~/utils/oisstMap'

export type Region = {
  /** The CHIRPS department code. */
  code: string
  name: string
  /** The place on the coast whose nearest sea stands for the region's sea. */
  coast: { name: string; lon: number; lat: number }
}

/**
 * The departments with a Pacific coast, from north to south. Callao is left
 * out: its CHIRPS area is a few cells inside Lima's coast, so it would repeat
 * Lima's sea and add no rain of its own.
 */
export const REGIONS: Region[] = [
  { code: 'PE24', name: 'Tumbes', coast: { name: 'Tumbes', lon: -80.45, lat: -3.57 } },
  { code: 'PE20', name: 'Piura', coast: { name: 'Paita', lon: -81.11, lat: -5.09 } },
  { code: 'PE14', name: 'Lambayeque', coast: { name: 'Chiclayo', lon: -79.84, lat: -6.77 } },
  { code: 'PE13', name: 'La Libertad', coast: { name: 'Trujillo', lon: -79.03, lat: -8.11 } },
  { code: 'PE02', name: 'Áncash', coast: { name: 'Chimbote', lon: -78.6, lat: -9.07 } },
  { code: 'PE15', name: 'Lima', coast: { name: 'Lima', lon: -77.04, lat: -12.05 } },
  { code: 'PE11', name: 'Ica', coast: { name: 'Pisco', lon: -76.2, lat: -13.7 } },
  { code: 'PE04', name: 'Arequipa', coast: { name: 'Camaná', lon: -72.71, lat: -16.62 } },
  { code: 'PE18', name: 'Moquegua', coast: { name: 'Ilo', lon: -71.34, lat: -17.64 } },
  { code: 'PE23', name: 'Tacna', coast: { name: 'Tacna', lon: -70.9, lat: -18.0 } },
]

/** Pentads summed for "this month": six pentads cover about thirty days. */
export const RAIN_PENTADS = 6

/**
 * A month counts as above or below normal when it misses the normal by at least
 * this many millimetres and by at least `RAIN_MARGIN_SHARE` of the normal. So
 * 1 mm against a 3 mm normal is normal (floor), 210 against 200 mm is normal
 * (share), and 12 against 2 mm is above.
 */
export const RAIN_MARGIN_MM = 5
export const RAIN_MARGIN_SHARE = 0.5

const relationOf = (total: number, normal: number): RainRelation => {
  const margin = Math.max(RAIN_MARGIN_MM, normal * RAIN_MARGIN_SHARE)
  const gap = total - normal
  return gap >= margin ? 'above' : gap <= -margin ? 'below' : 'normal'
}

export type RainRelation = 'above' | 'normal' | 'below'

export type RegionRain = {
  start: string
  end: string
  total: number
  normal: number
  relation: RainRelation
}

const coastalCodes = new Set(REGIONS.map((region) => region.code))

/** Keeps the newest `RAIN_PENTADS` pentads of the coastal departments, so the payload stays small. */
export const shapeCoastalRain = (dataset: DatasetFor<'chirps'>): DatasetFor<'chirps'> => {
  const starts = [...new Set(dataset.records.map((record) => record.start))].sort()
  const kept = new Set(starts.slice(-RAIN_PENTADS))
  const [first, ...rest] = dataset.records.filter(
    (record) => coastalCodes.has(record.code) && kept.has(record.start),
  )
  return first ? { ...dataset, records: [first, ...rest] } : dataset
}

const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * The region's rain over the pentads it has, against the normal of the same
 * pentads (rain minus anomaly). Null when a pentad has no value, so a total
 * never silently covers fewer days than it says.
 */
export const regionRain = (records: readonly ChirpsRecord[], code: string): RegionRain | null => {
  const own = records
    .filter((record) => record.code === code)
    .sort((a, b) => a.start.localeCompare(b.start))
  if (own.length < RAIN_PENTADS) return null
  if (own.some((record) => record.precipitation_mm === null || record.anomaly_mm === null)) {
    return null
  }
  const total = round1(own.reduce((sum, record) => sum + record.precipitation_mm!, 0))
  const normal = round1(
    own.reduce((sum, record) => sum + record.precipitation_mm! - record.anomaly_mm!, 0),
  )
  return {
    start: own[0]!.start,
    end: own.at(-1)!.end,
    total,
    normal,
    relation: relationOf(total, normal),
  }
}

/** The anomaly of the sea cell nearest the region's coast point. */
export const regionSea = (record: GridRecord, region: Region): SeaCell | null =>
  seaNear(record, region.coast)
