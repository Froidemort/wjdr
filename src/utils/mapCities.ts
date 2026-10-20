import type { City } from '../types/cities'

const MID_TYPES = new Set(['Ville', 'Forteresse', 'Mine'])

/** Lowest zoom at which a city is shown: big settlements first, small ones from z5. */
export function cityMinZoom(city: Pick<City, 'type' | 'population'>): number {
  const population = city.population ?? 0
  if (population >= 50000) return 2
  if (city.type === 'Cité' || population >= 10000) return 3
  if (city.type !== null && MID_TYPES.has(city.type)) return 4
  return 5
}

const OTHER_CITY_TYPE = 'Autre'
const CITY_TYPE_ORDER = ['Cité', 'Ville', 'Forteresse', 'Bourg', 'Village', 'Mine', OTHER_CITY_TYPE]

export function cityTypeOf(city: Pick<City, 'type'>): string {
  return city.type ?? OTHER_CITY_TYPE
}

/** Distinct city types present in `cities`, in a stable display order. */
export function cityTypesOf(cities: readonly Pick<City, 'type'>[]): string[] {
  const present = new Set(cities.map(cityTypeOf))
  const rank = (type: string): number => {
    const index = CITY_TYPE_ORDER.indexOf(type)
    return index === -1 ? CITY_TYPE_ORDER.length : index
  }
  return [...present].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, 'fr'))
}

export function filterCitiesByType<T extends Pick<City, 'type'>>(cities: readonly T[], hiddenTypes: readonly string[]): T[] {
  if (hiddenTypes.length === 0) return [...cities]
  const hidden = new Set(hiddenTypes)
  return cities.filter((city) => !hidden.has(cityTypeOf(city)))
}

export function visibleCities(cities: readonly City[], zoom: number): City[] {
  return cities.filter((city) => cityMinZoom(city) <= zoom)
}
