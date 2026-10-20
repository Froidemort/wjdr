import { describe, expect, it } from 'vitest'

import type { City } from '../../src/types/cities'
import { cityMinZoom, cityTypeOf, cityTypesOf, filterCitiesByType, visibleCities } from '../../src/utils/mapCities'

function city(overrides: Partial<City> = {}): City {
  return {
    id: 1,
    name: 'Altdorf',
    lat: 0,
    lng: 0,
    type: null,
    population: null,
    region: null,
    country: null,
    subregion: null,
    url: null,
    pending: false,
    hidden: false,
    source: null,
    ...overrides,
  }
}

describe('cityMinZoom', () => {
  it.each([
    [{ population: 50000, type: 'Village' }, 2],
    [{ population: 120000, type: null }, 2],
    [{ population: 100, type: 'Cité' }, 3],
    [{ population: 10000, type: 'Bourg' }, 3],
    [{ population: 500, type: 'Ville' }, 4],
    [{ population: null, type: 'Forteresse' }, 4],
    [{ population: null, type: 'Mine' }, 4],
    [{ population: 500, type: 'Village' }, 5],
    [{ population: null, type: null }, 5],
  ])('%j appears from zoom %i', (input, expected) => {
    expect(cityMinZoom(input)).toBe(expected)
  })
})

describe('visibleCities', () => {
  const cities = [city({ id: 1, population: 60000 }), city({ id: 2, type: 'Ville' }), city({ id: 3 })]

  it('keeps only cities whose minimum zoom is reached', () => {
    expect(visibleCities(cities, 2).map((c) => c.id)).toEqual([1])
    expect(visibleCities(cities, 4).map((c) => c.id)).toEqual([1, 2])
    expect(visibleCities(cities, 7).map((c) => c.id)).toEqual([1, 2, 3])
  })

  it('returns nothing below the lowest threshold', () => {
    expect(visibleCities(cities, 1)).toEqual([])
  })
})

describe('cityTypeOf', () => {
  it('falls back to "Autre" for a null type', () => {
    expect(cityTypeOf({ type: null })).toBe('Autre')
  })

  it('returns the city type as-is otherwise', () => {
    expect(cityTypeOf({ type: 'Ville' })).toBe('Ville')
  })
})

describe('cityTypesOf', () => {
  it('lists each distinct type once, in a stable order', () => {
    const types = cityTypesOf([{ type: 'Village' }, { type: 'Cité' }, { type: 'Village' }, { type: null }])
    expect(types).toEqual(['Cité', 'Village', 'Autre'])
  })

  it('returns an empty list for no cities', () => {
    expect(cityTypesOf([])).toEqual([])
  })
})

describe('filterCitiesByType', () => {
  const cities = [city({ id: 1, type: 'Cité' }), city({ id: 2, type: 'Village' }), city({ id: 3, type: null })]

  it('keeps every city when nothing is hidden', () => {
    expect(filterCitiesByType(cities, [])).toEqual(cities)
  })

  it('excludes cities whose type is hidden', () => {
    expect(filterCitiesByType(cities, ['Village']).map((c) => c.id)).toEqual([1, 3])
  })

  it('matches a null type against the "Autre" bucket', () => {
    expect(filterCitiesByType(cities, ['Autre']).map((c) => c.id)).toEqual([1, 2])
  })
})
