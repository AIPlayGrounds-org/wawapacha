import { describe, expect, it } from 'vitest'
import type { GridRecord } from '~/types/dataset'
import {
  aYearBefore,
  coastalReach,
  recordAYearBefore,
  valueAt,
  warmestCell,
} from '~/utils/oisstMap'

const LATS = Array.from({ length: 17 }, (_, index) => -18 + index)

/**
 * One column of sea at 82° W from 18° S to 2° S, so each coast point's nearest
 * sea cell is the one at its rounded latitude.
 */
const strip = (anomaly: (lat: number) => number | null, start = '2026-11-24') =>
  ({
    start,
    end: start,
    lat: LATS,
    lon: [-82],
    anomaly: LATS.map((lat) => [anomaly(lat)]),
  }) as unknown as GridRecord

describe('coastalReach', () => {
  it('runs to the south end when every point is warm', () => {
    const reach = coastalReach(strip(() => 3))

    expect(reach?.from.name).toBe('Ecuador')
    expect(reach?.to.name).toBe('Lima')
    expect(reach?.toEnd).toBe(true)
  })

  it('stops at the first cold point and names the last labelled place before it', () => {
    const reach = coastalReach(strip((lat) => (lat >= -9 || lat <= -14 ? 3 : 1)))

    expect(reach?.from.name).toBe('Ecuador')
    expect(reach?.to.name).toBe('Piura')
    expect(reach?.toEnd).toBe(false)
  })

  it('starts at the northernmost warm point', () => {
    const reach = coastalReach(strip((lat) => (lat === -5 ? 2.5 : 0)))

    expect(reach?.from.name).toBe('Piura')
    expect(reach?.to.name).toBe('Piura')
  })

  it('is null when no point passes the threshold', () => {
    expect(coastalReach(strip(() => 2))).toBeNull()
  })
})

describe('sea cells', () => {
  const record = strip((lat) => (lat === -4 ? 6 : lat === -3 ? null : 1))

  it('finds the warmest sea cell', () => {
    expect(warmestCell(record)).toEqual({ lat: -4, lon: -82, value: 6 })
    expect(warmestCell(strip(() => null))).toBeNull()
  })

  it('reads the value at a cell centre, and null on land or off the grid', () => {
    expect(valueAt(record, -4, -82)).toBe(6)
    expect(valueAt(record, -3, -82)).toBeNull()
    expect(valueAt(record, -4, -80)).toBeNull()
  })
})

describe('a year before', () => {
  it('moves the year back and 29 February to 28 February', () => {
    expect(aYearBefore('2026-11-24')).toBe('2025-11-24')
    expect(aYearBefore('2028-02-29')).toBe('2027-02-28')
  })

  it('finds the record of the same day a year before the latest one', () => {
    const latest = strip(() => 1, '2026-11-24')
    const before = strip(() => 0, '2025-11-24')

    expect(recordAYearBefore([latest, before])).toBe(before)
    expect(recordAYearBefore([latest])).toBeNull()
  })
})
