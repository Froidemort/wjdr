import type { City } from '../types/cities'
import type { MapMarker, MapSearchResult } from '../types/map'
import { normalizeSearchText } from './searchText'

/** Accent/case-insensitive name search over markers and cities; hidden cities are skipped, prefix matches rank first. */
export function searchPlaces(markers: readonly MapMarker[], cities: readonly City[], query: string, limit = 20): MapSearchResult[] {
  const needle = normalizeSearchText(query.trim())
  if (!needle) return []

  const prefix: MapSearchResult[] = []
  const contains: MapSearchResult[] = []
  const push = (result: MapSearchResult): void => {
    const name = normalizeSearchText(result.name)
    if (name.startsWith(needle)) prefix.push(result)
    else if (name.includes(needle)) contains.push(result)
  }

  for (const marker of markers) {
    push({ kind: 'marker', key: `marker-${marker.id}`, name: marker.name, id: marker.id })
  }
  for (const city of cities) {
    if (!city.hidden) push({ kind: 'city', key: `city-${city.id}`, name: city.name, id: city.id })
  }

  const byName = (a: MapSearchResult, b: MapSearchResult) => a.name.localeCompare(b.name, 'fr')
  return [...prefix.sort(byName), ...contains.sort(byName)].slice(0, limit)
}
