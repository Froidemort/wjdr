import type { MapMarker, MarkerType } from '../../types/map'

export const markerTypes: MarkerType[] = [
  { id: 't-city', code: 'city', label: 'Ville', icon: 'Castle', color: '#b45309' },
  { id: 't-note', code: 'note', label: 'Note', icon: 'StickyNote', color: null },
]

export const campaignMarker: MapMarker = {
  id: 'm-1',
  source: 'campaign',
  typeId: 't-note',
  name: 'Cache du contrebandier',
  description: 'Sous le vieux pont.',
  lat: 48.1234,
  lng: 11.5678,
  campaignId: 'c-1',
  visibility: 'players',
  createdBy: 'u-1',
  createdAt: '2026-09-01T00:00:00.000Z',
}

export const baseMarker: MapMarker = {
  ...campaignMarker,
  id: 'b-1',
  source: 'base',
  typeId: 't-city',
  name: 'Altdorf',
  description: null,
  campaignId: null,
  visibility: null,
  createdBy: null,
  createdAt: null,
}
