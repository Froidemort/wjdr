import { describe, expect, it } from 'vitest'

import { MAP_MAX_LAT } from '../../src/config/map'
import { buildTileUrl, formatLatLng, isValidLatLng, normalizeLatLng } from '../../src/utils/mapCoordinates'

describe('isValidLatLng', () => {
  it('accepts in-range values', () => {
    expect(isValidLatLng(45, 90)).toBe(true)
    expect(isValidLatLng(MAP_MAX_LAT, 180)).toBe(true)
  })

  it('rejects out-of-range latitude', () => {
    expect(isValidLatLng(MAP_MAX_LAT + 0.1, 0)).toBe(false)
  })

  it('rejects out-of-range longitude', () => {
    expect(isValidLatLng(0, 180.1)).toBe(false)
  })

  it('rejects non-finite values', () => {
    expect(isValidLatLng(Number.NaN, 0)).toBe(false)
    expect(isValidLatLng(0, Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe('normalizeLatLng', () => {
  it('clamps to the Mercator range', () => {
    expect(normalizeLatLng(100, 200)).toEqual({ lat: MAP_MAX_LAT, lng: 180 })
    expect(normalizeLatLng(-100, -200)).toEqual({ lat: -MAP_MAX_LAT, lng: -180 })
  })

  it('rounds to 6 decimals', () => {
    expect(normalizeLatLng(12.12345678, 1.98765432)).toEqual({ lat: 12.123457, lng: 1.987654 })
  })
})

describe('formatLatLng', () => {
  it('formats with 4 decimals', () => {
    expect(formatLatLng(1.5, -2.123456)).toBe('1.5000, -2.1235')
  })
})

describe('buildTileUrl', () => {
  it('fills the z/x/y placeholders', () => {
    expect(buildTileUrl('https://t/{z}/{x}/{y}.png', 3, 4, 5)).toBe('https://t/3/4/5.png')
  })
})
