import { describe, expect, it } from 'vitest'

import type { City } from '../../src/types/cities'
import type { MapMarker } from '../../src/types/map'
import { searchPlaces } from '../../src/utils/mapSearch'

function marker(id: string, name: string): MapMarker {
  return { id, source: 'base', typeId: 't', name, description: null, lat: 0, lng: 0, campaignId: null, visibility: null, createdBy: null, createdAt: null }
}

function city(id: number, name: string, hidden = false): City {
  return { id, name, lat: 0, lng: 0, type: null, population: null, region: null, country: null, subregion: null, url: null, pending: false, hidden, source: null }
}

describe('searchPlaces', () => {
  const markers = [marker('m1', 'Auberge de Marienburg'), marker('m2', 'Étang noir')]
  const cities = [city(1, 'Marienburg'), city(2, 'Altdorf'), city(3, 'Marais caché', true)]

  it('returns nothing for a blank query', () => {
    expect(searchPlaces(markers, cities, '  ')).toEqual([])
  })

  it('merges markers and cities, prefix matches first', () => {
    expect(searchPlaces(markers, cities, 'marien').map((r) => r.key)).toEqual(['city-1', 'marker-m1'])
  })

  it('ignores case and accents', () => {
    expect(searchPlaces(markers, cities, 'ETANG').map((r) => r.key)).toEqual(['marker-m2'])
  })

  it('skips hidden cities', () => {
    expect(searchPlaces([], cities, 'mara')).toEqual([])
  })

  it('caps the result count', () => {
    expect(searchPlaces(markers, cities, 'a', 2)).toHaveLength(2)
  })
})
