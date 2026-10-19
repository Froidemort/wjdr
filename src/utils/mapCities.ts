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

export function visibleCities(cities: readonly City[], zoom: number): City[] {
  return cities.filter((city) => cityMinZoom(city) <= zoom)
}
