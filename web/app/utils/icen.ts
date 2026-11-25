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

/**
 * The episodes with a month above `value`, as year labels. Consecutive years
 * join into one episode: 1997 and 1998 read "1997–98".
 */
export const icenEpisodesAbove = (records: IcenRecord[], value: number) => {
  const years = [
    ...new Set(records.filter((r) => r.icen > value).map((r) => Number(r.start.slice(0, 4)))),
  ].sort((a, b) => a - b)
  const episodes: [number, number][] = []
  for (const year of years) {
    const last = episodes.at(-1)
    if (last && year === last[1] + 1) last[1] = year
    else episodes.push([year, year])
  }
  return episodes.map(([first, last]) =>
    first === last ? `${first}` : `${first}–${String(last).slice(-2)}`,
  )
}

export const icenPeak = (records: IcenRecord[], start: string, end: string) =>
  records
    .filter((record) => record.start >= start && record.start <= end)
    .reduce<IcenRecord | null>(
      (peak, record) => (peak === null || record.icen > peak.icen ? record : peak),
      null,
    )
