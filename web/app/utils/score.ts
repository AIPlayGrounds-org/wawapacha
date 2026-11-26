import { REACH_ANOMALY } from '~/utils/oisstMap'
import { RAIN_THRESHOLD, type SeasonPoint } from '~/utils/season'

/** How one of the frame's three conditions stands: met, met in part, not met, not yet or unknown. */
export type MarkState = 'filled' | 'half' | 'empty' | 'pending' | 'unknown'

const month = (date: string) => Number(date.slice(5, 7))
const inSummer = (date: string) => month(date) === 12 || month(date) <= 3

/** Condition 1: the water itself is warmer than the rain threshold. */
export const seaMark = (sst: number | null): MarkState =>
  sst === null ? 'unknown' : sst > RAIN_THRESHOLD ? 'filled' : 'empty'

/**
 * Condition 2: a week from December to March passes the threshold. Until April the summer can
 * still come, so the mark waits; from April to June that summer is over.
 */
export const summerMark = (season: readonly SeasonPoint[], latest: string | null): MarkState => {
  if (season.some((point) => inSummer(point.date) && point.value > RAIN_THRESHOLD)) return 'filled'
  if (latest === null) return 'unknown'
  return month(latest) >= 4 && month(latest) <= 6 ? 'empty' : 'pending'
}

/**
 * A region's three rows: its sea against the map's reach anomaly, its river against its lowest
 * official threshold, and its rain against its normal. A null input has no source to read.
 */
export const regionMarks = (
  seaAnomaly: number | null,
  riverOver: boolean | null,
  rain: 'above' | 'normal' | 'below' | null,
): MarkState[] => [
  seaAnomaly === null ? 'unknown' : seaAnomaly > REACH_ANOMALY ? 'filled' : 'empty',
  riverOver === null ? 'unknown' : riverOver ? 'filled' : 'empty',
  rain === null ? 'unknown' : rain === 'above' ? 'filled' : 'empty',
]
