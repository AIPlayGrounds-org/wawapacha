import { describe, expect, it } from 'vitest'
import { claim } from '~/data/claims'
import { messages } from '~/messages'
import type { ChirpsRecord, GridRecord } from '~/types/dataset'
import type { DatasetFor } from '~/types/datasets'
import { REGIONS, RAIN_PENTADS, regionRain, regionSea, shapeCoastalRain } from '~/utils/region'

const STARTS = ['2026-08-26', '2026-09-01', '2026-09-06', '2026-09-11', '2026-09-16', '2026-09-21']
const END = '2026-09-25'

/** Six pentads of one region, each with the same rain and normal. */
const pentads = (code: string, rain: number | null, normal: number): ChirpsRecord[] =>
  STARTS.map((start, index) => ({
    region: code,
    code,
    start,
    end: index === STARTS.length - 1 ? END : start,
    precipitation_mm: rain,
    anomaly_mm: rain === null ? null : rain - normal,
  }))

describe('regionRain', () => {
  it('sums the pentads and their normal over the whole span', () => {
    const rain = regionRain(pentads('PE24', 2, 0.5), 'PE24')

    expect(rain).toEqual({
      start: STARTS[0],
      end: END,
      total: 12,
      normal: 3,
      relation: 'above',
    })
  })

  it('calls a small gap normal in a dry month and in a wet one', () => {
    expect(regionRain(pentads('PE20', 0.2, 0.5), 'PE20')?.relation).toBe('normal')
    expect(regionRain(pentads('PE20', 35, 33), 'PE20')?.relation).toBe('normal')
  })

  it('calls a month well under its normal below', () => {
    expect(regionRain(pentads('PE13', 1, 4), 'PE13')?.relation).toBe('below')
  })

  it('gives nothing when a pentad is missing or has no value', () => {
    expect(regionRain(pentads('PE24', 2, 1).slice(1), 'PE24')).toBeNull()
    expect(regionRain(pentads('PE24', null, 1), 'PE24')).toBeNull()
    expect(regionRain(pentads('PE24', 2, 1), 'PE20')).toBeNull()
  })
})

describe('shapeCoastalRain', () => {
  it('keeps the newest pentads of the coastal regions only', () => {
    const older = { ...pentads('PE24', 1, 1)[0]!, start: '2026-08-21', end: '2026-08-25' }
    const inland = pentads('PE05', 1, 1)
    const dataset = {
      records: [older, ...pentads('PE24', 1, 1), ...inland],
    } as unknown as DatasetFor<'chirps'>

    const shaped = shapeCoastalRain(dataset)

    expect(shaped.records).toHaveLength(RAIN_PENTADS)
    expect(shaped.records.every((record) => record.code === 'PE24')).toBe(true)
  })
})

describe('regionSea', () => {
  it('reads the sea cell nearest the region coast point', () => {
    const record = {
      start: '2026-11-24',
      end: '2026-11-24',
      lat: [-6, -4],
      lon: [-82, -81],
      anomaly: [
        [1, null],
        [2, 3],
      ],
    } as unknown as GridRecord

    expect(regionSea(record, REGIONS[0]!)?.value).toBe(3)
  })
})

describe('rivers by communiqué', () => {
  it('names only rivers the communiqué claim names', () => {
    const source = claim('enfen-co20-rivers')
    for (const region of REGIONS) {
      const line = messages.story.region.rivers(20, 2026, region.code)
      if (!line) continue
      const rivers = [
        ...line.matchAll(
          /(?:el|La) (Tumbes|Chira|Piura|Leche|Jequetepeque|Chillón|Rímac|Lurín|Pisco|Ica)/gu,
        ),
      ]
      expect(rivers.length).toBeGreaterThan(0)
      for (const [river] of rivers) expect(source).toContain(river)
    }
  })

  it('calls only the Tumbes and the Piura muy superiores, as the claim does', () => {
    const strong = REGIONS.filter((region) =>
      messages.story.region.rivers(20, 2026, region.code)?.includes('muy superiores'),
    ).map((region) => region.code)

    expect(strong).toEqual(['PE24', 'PE20'])
  })
})
