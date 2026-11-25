import type { DatasetFor } from '~/types/datasets'

/** One Niño 1+2 week: the water temperature and the 1991–2020 normal for that week. */
export type SeasonWeek = {
  start: string
  end: string
  sst: number
  normal: number
}

/** A value placed on the season axis: days since 1 July of the season's first year. */
export type SeasonPoint = {
  day: number
  value: number
  /** The week's date, as YYYY-MM-DD. */
  date: string
}

export type SeasonDataset = Omit<DatasetFor<'noaa-cpc-nino-weekly'>, 'records'> & {
  records: SeasonWeek[]
}

/** The axis runs from 1 July to 30 June. A leap day folds onto the last day. */
export const SEASON_DAYS = 365

const DAY_MS = 86_400_000
const WEEKS_PER_YEAR = 52

const utc = (date: string) => Date.parse(`${date}T00:00:00Z`)

/** The year a date's season starts: July 2026 to June 2027 is season 2026. */
export const seasonOf = (date: string) => {
  const [year, month] = date.split('-').map(Number)
  return month! >= 7 ? year! : year! - 1
}

export const seasonDay = (date: string) =>
  Math.min(SEASON_DAYS - 1, Math.round((utc(date) - utc(`${seasonOf(date)}-07-01`)) / DAY_MS))

/** «2026–27». */
export const formatSeason = (season: number) => `${season}–${String(season + 1).slice(2)}`

/**
 * Keeps the Niño 1+2 weeks of the named seasons and of the latest two, so the
 * payload carries only what the season charts draw. The normal is the
 * temperature minus its anomaly, rounded to the source's 0,1 °C.
 */
export const shapeSeasons =
  (seasons: readonly number[]) =>
  (dataset: DatasetFor<'noaa-cpc-nino-weekly'>): SeasonDataset => {
    const { records, ...meta } = dataset
    const weeks = records.flatMap((record) =>
      record.nino_1_2_sst === null || record.nino_1_2_anomaly === null
        ? []
        : [
            {
              start: record.start,
              end: record.end,
              sst: record.nino_1_2_sst,
              normal: Math.round((record.nino_1_2_sst - record.nino_1_2_anomaly) * 10) / 10,
            },
          ],
    )
    const latest = weeks.at(-1) ? seasonOf(weeks.at(-1)!.start) : null
    const kept = new Set(latest === null ? seasons : [...seasons, latest, latest - 1])
    return { ...meta, records: weeks.filter((week) => kept.has(seasonOf(week.start))) }
  }

export const seasonPoints = (weeks: readonly SeasonWeek[], season: number): SeasonPoint[] =>
  weeks
    .filter((week) => seasonOf(week.start) === season)
    .map((week) => ({ day: seasonDay(week.start), value: week.sst, date: week.start }))

/**
 * The weekly normal over the latest 52 weeks, on the season axis. CPC's normal
 * is one climatology, so these weeks stand for every year.
 */
export const normalCurve = (weeks: readonly SeasonWeek[]): SeasonPoint[] =>
  weeks
    .slice(-WEEKS_PER_YEAR)
    .map((week) => ({ day: seasonDay(week.start), value: week.normal, date: week.start }))
    .sort((a, b) => a.day - b.day)

/** The point within half a week of `day`, or null. */
export const pointAt = (points: readonly SeasonPoint[], day: number): SeasonPoint | null => {
  let best: SeasonPoint | null = null
  for (const point of points) {
    if (
      Math.abs(point.day - day) <= 3 &&
      (!best || Math.abs(point.day - day) < Math.abs(best.day - day))
    ) {
      best = point
    }
  }
  return best
}

/** The week 52 weeks before `week`: the same weekday a year earlier. */
export const weekBefore = (weeks: readonly SeasonWeek[], week: SeasonWeek) =>
  weeks.find(
    (other) => Math.abs(utc(week.start) - utc(other.start) - 364 * DAY_MS) <= 3 * DAY_MS,
  ) ?? null

/** The month with the highest mean normal, 1 to 12, and that mean. */
export const warmestNormalMonth = (curve: readonly SeasonPoint[]) => {
  const months = new Map<number, number[]>()
  for (const point of curve) {
    const month = Number(point.date.slice(5, 7))
    months.set(month, [...(months.get(month) ?? []), point.value])
  }
  let warmest: { month: number; value: number } | null = null
  for (const [month, values] of months) {
    const value = values.reduce((sum, item) => sum + item, 0) / values.length
    if (!warmest || value > warmest.value) warmest = { month, value }
  }
  return warmest
}

/** The months, 1 to 12 in season order, with a week above `threshold`. */
export const monthsAbove = (points: readonly SeasonPoint[], threshold: number) => [
  ...new Set(
    points
      .filter((point) => point.value > threshold)
      .map((point) => Number(point.date.slice(5, 7))),
  ),
]

/**
 * Keeps 26 °C as the line where heavy rain becomes likely on the coast
 * (claim `igp-woodman-2014-threshold`). It is a rule of thumb, not a switch.
 */
export const RAIN_THRESHOLD = 26
