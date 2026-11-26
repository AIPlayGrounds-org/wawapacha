import type { GridRecord } from '~/types/dataset'

/** Lower edge of each warm step, in °C above normal. A value below the first one is a cold step. */
export const SEA_STEPS = [-0.5, 0.5, 1, 2, 3, 4, 5, 6, 7] as const

/** Step index of an anomaly: 0 is colder than normal, 1 is near normal, the last is the warmest. */
export const seaStep = (value: number) => SEA_STEPS.filter((edge) => value >= edge).length

export type SeaGrid = {
  columns: number
  rows: number
  west: number
  east: number
  south: number
  north: number
  /** One SVG path per step, in cell units with the north row at y = 0. */
  paths: { step: number; d: string }[]
  /** The cell edges between sea and land, in the same units. */
  coast: string
}

const isSea = (record: GridRecord, row: number, column: number) => {
  const value = record.anomaly[row]?.[column]
  return value !== null && value !== undefined
}

/**
 * The coastline traced along the grid, so it follows the cells exactly. An edge
 * is drawn where a sea cell meets a land cell; the frame's border is not a coast.
 */
const traceCoast = (record: GridRecord) => {
  const rows = record.lat.length
  const columns = record.lon.length
  const land = (row: number, column: number) =>
    row >= 0 && row < rows && column >= 0 && column < columns && !isSea(record, row, column)
  const edges: string[] = []
  for (let row = 0; row < rows; row += 1) {
    const y = rows - 1 - row
    for (let column = 0; column < columns; column += 1) {
      if (!isSea(record, row, column)) continue
      if (land(row + 1, column)) edges.push(`M${column} ${y}h1`)
      if (land(row - 1, column)) edges.push(`M${column} ${y + 1}h1`)
      if (land(row, column - 1)) edges.push(`M${column} ${y}v1`)
      if (land(row, column + 1)) edges.push(`M${column + 1} ${y}v1`)
    }
  }
  return edges.join('')
}

/**
 * Merges each row's neighbouring cells of one step into a single rectangle, so
 * the map is a handful of paths and not one element per cell. Land cells hold
 * no value and stay empty.
 */
export const buildSeaGrid = (record: GridRecord): SeaGrid => {
  const rows = record.lat.length
  const columns = record.lon.length
  const cell = rows > 1 ? Math.abs(record.lat[1]! - record.lat[0]) : 1
  const segments = new Map<number, string[]>()

  record.lat.forEach((_, row) => {
    const y = rows - 1 - row
    let start = 0
    while (start < columns) {
      const value = record.anomaly[row]?.[start]
      if (value === null || value === undefined) {
        start += 1
        continue
      }
      const step = seaStep(value)
      let end = start + 1
      while (end < columns) {
        const next = record.anomaly[row]?.[end]
        if (next === null || next === undefined || seaStep(next) !== step) break
        end += 1
      }
      segments.set(step, [
        ...(segments.get(step) ?? []),
        `M${start} ${y}h${end - start}v1h${start - end}z`,
      ])
      start = end
    }
  })

  return {
    columns,
    rows,
    west: record.lon[0] - cell / 2,
    east: record.lon.at(-1)! + cell / 2,
    south: record.lat[0] - cell / 2,
    north: record.lat.at(-1)! + cell / 2,
    paths: [...segments.entries()]
      .sort(([a], [b]) => a - b)
      .map(([step, parts]) => ({ step, d: parts.join('') })),
    coast: traceCoast(record),
  }
}

/** Position of a point inside the grid, as percentages from its top-left corner. */
export const seaPosition = (grid: SeaGrid, lon: number, lat: number) => ({
  left: `${((lon - grid.west) / (grid.east - grid.west)) * 100}%`,
  top: `${((grid.north - lat) / (grid.north - grid.south)) * 100}%`,
})
