type IcenRecord = { start: string; icen: number }

export type IcenCategory = 'neutral' | 'weak' | 'moderate' | 'strong' | 'extraordinary'

/**
 * ENFEN's warm-side ICEN categories (claim icen-category-thresholds). The claim
 * does not give the cold-side bounds, so a value below −0.7 has no category.
 */
export const icenCategory = (value: number): IcenCategory | null => {
  if (value > 3.5) return 'extraordinary'
  if (value > 2.1) return 'strong'
  if (value > 1.3) return 'moderate'
  if (value > ICEN_NEUTRAL.high) return 'weak'
  if (value >= ICEN_NEUTRAL.low) return 'neutral'
  return null
}

/** The bounds of ENFEN's neutral category (claim icen-category-thresholds). */
export const ICEN_NEUTRAL = { low: -0.7, high: 0.5 } as const

/** «1997-04» plus 9 months is «1998-01». */
export const addMonths = (start: string, months: number) => {
  const [year, month] = start.split('-').map(Number)
  const index = year! * 12 + month! - 1 + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/**
 * An event's months from `from`, one slot per month, so two events line up by
 * calendar month. A month with no record is null.
 */
export const alignEvent = (records: readonly IcenRecord[], from: string, months: number) => {
  const byMonth = new Map(records.map((record) => [record.start, record.icen]))
  return Array.from({ length: months }, (_, index) => {
    const start = addMonths(from, index)
    return { index, start, icen: byMonth.get(start) ?? null }
  })
}

export const icenPeak = (records: IcenRecord[], start: string, end: string) =>
  records
    .filter((record) => record.start >= start && record.start <= end)
    .reduce<IcenRecord | null>(
      (peak, record) => (peak === null || record.icen > peak.icen ? record : peak),
      null,
    )
