import type { GridRecord } from '~/types/dataset'
import type { DatasetFor } from '~/types/datasets'

/** Peruvian Pacific coast, in °N and °E. The page draws only this window, close to square. */
export const OISST_VIEW = { west: -90, east: -70, south: -20, north: 2 } as const

/** Anomaly, in °C, above which the sea off a coast point counts as reached by the heat. */
export const REACH_ANOMALY = 2

export type CoastPoint = { name: string; lon: number; lat: number; labelled: boolean }

/**
 * Coast points from north to south. The reach of the heat is read at each of
 * them, so a cold stretch between two warm places breaks it. Only the labelled
 * ones are drawn on the map. Salinas stands for Ecuador: it is the point of its
 * coast that reaches furthest into the sea the map draws.
 */
export const COAST_POINTS: CoastPoint[] = [
  { name: 'Ecuador', lon: -80.98, lat: -2.21, labelled: false },
  { name: 'Tumbes', lon: -80.45, lat: -3.57, labelled: true },
  { name: 'Piura', lon: -80.63, lat: -5.19, labelled: true },
  { name: 'Chiclayo', lon: -79.84, lat: -6.77, labelled: false },
  { name: 'Trujillo', lon: -79.03, lat: -8.11, labelled: false },
  { name: 'Chimbote', lon: -78.6, lat: -9.07, labelled: false },
  { name: 'Lima', lon: -77.04, lat: -12.05, labelled: true },
  { name: 'Pisco', lon: -76.2, lat: -13.7, labelled: false },
  { name: 'Ilo', lon: -71.34, lat: -17.64, labelled: false },
]

export type SeaCell = { lat: number; lon: number; value: number }

const within = (value: number, low: number, high: number) => value >= low && value <= high

/** Keeps the rows and columns inside `OISST_VIEW`. */
export const cropGridRecord = (record: GridRecord): GridRecord => {
  const rows = record.lat.flatMap((lat, index) =>
    within(lat, OISST_VIEW.south, OISST_VIEW.north) ? [index] : [],
  )
  const columns = record.lon.flatMap((lon, index) =>
    within(lon, OISST_VIEW.west, OISST_VIEW.east) ? [index] : [],
  )
  return {
    ...record,
    lat: rows.map((row) => record.lat[row]!) as GridRecord['lat'],
    lon: columns.map((column) => record.lon[column]!) as GridRecord['lon'],
    anomaly: rows.map((row) =>
      columns.map((column) => record.anomaly[row]![column]!),
    ) as GridRecord['anomaly'],
  }
}

/** Crops every record so the page payload carries only the cells it draws. */
export const cropOisst = (dataset: DatasetFor<'noaa-oisst'>): DatasetFor<'noaa-oisst'> => {
  const [first, ...rest] = dataset.records
  return { ...dataset, records: [cropGridRecord(first), ...rest.map(cropGridRecord)] }
}

const seaCells = (record: GridRecord): SeaCell[] =>
  record.lat.flatMap((lat, row) =>
    record.lon.flatMap((lon, column) => {
      const value = record.anomaly[row]?.[column]
      return value === null || value === undefined ? [] : [{ lat, lon, value }]
    }),
  )

export const warmestCell = (record: GridRecord): SeaCell | null =>
  seaCells(record).reduce<SeaCell | null>(
    (current, cell) => (current === null || cell.value > current.value ? cell : current),
    null,
  )

/** The anomaly of the cell centred on a point, or null when it is land or off the grid. */
export const valueAt = (record: GridRecord, lat: number, lon: number) => {
  const row = record.lat.indexOf(lat)
  const column = record.lon.indexOf(lon)
  return row < 0 || column < 0 ? null : (record.anomaly[row]?.[column] ?? null)
}

/** The sea cell closest to a point on land. */
const nearestSea = (cells: SeaCell[], point: { lon: number; lat: number }) =>
  cells.reduce<SeaCell | null>((current, cell) => {
    if (current === null) return cell
    const distance = Math.hypot(cell.lon - point.lon, cell.lat - point.lat)
    return distance < Math.hypot(current.lon - point.lon, current.lat - point.lat) ? cell : current
  }, null)

/** The sea cell of a record closest to a point on land. */
export const seaNear = (record: GridRecord, point: { lon: number; lat: number }) =>
  nearestSea(seaCells(record), point)

export type Reach = { from: CoastPoint; to: CoastPoint; toEnd: boolean }

/**
 * The run of coast points, from the northernmost one reached, whose nearest
 * sea is warmer than `REACH_ANOMALY`. `to` is the southernmost labelled point
 * of the run, so the text names a place the map shows; `toEnd` says the run
 * reaches the last point.
 */
export const coastalReach = (record: GridRecord): Reach | null => {
  const cells = seaCells(record)
  const reached = COAST_POINTS.map(
    (point) => (nearestSea(cells, point)?.value ?? -Infinity) > REACH_ANOMALY,
  )
  const start = reached.indexOf(true)
  if (start < 0) return null
  const gap = reached.indexOf(false, start)
  const run = COAST_POINTS.slice(start, gap < 0 ? undefined : gap)
  const named = run.filter((point) => point.labelled)
  return {
    from: run[0]!,
    to: named.at(-1) ?? run.at(-1)!,
    toEnd: gap < 0,
  }
}

/** «2025-11-24» from «2026-11-24». 29 February goes back to 28 February, as the pipeline does. */
export const aYearBefore = (day: string) => {
  const year = String(Number(day.slice(0, 4)) - 1).padStart(4, '0')
  return day.slice(5) === '02-29' ? `${year}-02-28` : `${year}${day.slice(4)}`
}

/** The record of the same day a year before the latest one, if the dataset holds it. */
export const recordAYearBefore = (records: readonly GridRecord[]) => {
  const latest = records[0]
  if (!latest) return null
  const day = aYearBefore(latest.start)
  return records.find((record) => record.start === day) ?? null
}
