import type { MapMarker, MapRole, MarkerVisibility } from '../types/map'
import { compareByName } from './compare'
import { normalizeSearchText } from './searchText'

export interface MarkerFilters {
  showCampaign: boolean
  /** Master switch of the base layer (points d'intérêt). */
  showPois: boolean
  hiddenTypeIds: readonly string[]
  query: string
}

/** Merges base and campaign markers; a campaign marker replaces a base one with the same id. */
export function mergeMarkers(base: readonly MapMarker[], campaign: readonly MapMarker[]): MapMarker[] {
  const byId = new Map<string, MapMarker>()
  for (const marker of base) byId.set(marker.id, marker)
  for (const marker of campaign) byId.set(marker.id, marker)
  return [...byId.values()]
}

export function filterMarkers(markers: readonly MapMarker[], filters: Omit<MarkerFilters, 'query'>): MapMarker[] {
  const hidden = new Set(filters.hiddenTypeIds)
  return markers.filter((marker) => {
    if (marker.source === 'campaign') return filters.showCampaign
    return filters.showPois && !hidden.has(marker.typeId)
  })
}

/** Name search ignoring case and accents; prefix matches rank first. */
export function searchMarkers(markers: readonly MapMarker[], query: string, limit = 20): MapMarker[] {
  const needle = normalizeSearchText(query.trim())
  if (!needle) return []

  const prefix: MapMarker[] = []
  const contains: MapMarker[] = []
  for (const marker of markers) {
    const name = normalizeSearchText(marker.name)
    if (name.startsWith(needle)) prefix.push(marker)
    else if (name.includes(needle)) contains.push(marker)
  }

  return [...prefix.sort(compareByName), ...contains.sort(compareByName)].slice(0, limit)
}

export function canEditMarker(marker: MapMarker, userId: string | null, role: MapRole | null): boolean {
  if (marker.source !== 'campaign' || !userId) return false
  if (marker.createdBy === userId) return true
  return role === 'mj' && marker.visibility !== 'private'
}

export function allowedVisibilities(role: MapRole | null): MarkerVisibility[] {
  if (role === 'mj') return ['private', 'mj', 'players']
  if (role === 'player') return ['private']
  return []
}
