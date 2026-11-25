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
  if (value > 0.5) return 'weak'
  if (value >= -0.7) return 'neutral'
  return null
}

/** 1 for the highest month in the series; ties share the better rank. */
export const icenRank = (records: IcenRecord[], value: number) =>
  records.filter((record) => record.icen > value).length + 1

export const icenPeak = (records: IcenRecord[], start: string, end: string) =>
  records
    .filter((record) => record.start >= start && record.start <= end)
    .reduce<IcenRecord | null>(
      (peak, record) => (peak === null || record.icen > peak.icen ? record : peak),
      null,
    )
