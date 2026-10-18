export type MarkerVisibility = 'mj' | 'players' | 'private'
export type MarkerSource = 'base' | 'campaign'
export type MapRole = 'mj' | 'player'

export interface MarkerType {
  id: string
  code: string
  label: string
  icon: string | null
  color: string | null
}

export interface MapMarker {
  id: string
  source: MarkerSource
  typeId: string
  name: string
  description: string | null
  lat: number
  lng: number
  campaignId: string | null
  visibility: MarkerVisibility | null
  createdBy: string | null
  createdAt: string | null
  /** True while an optimistic write is not yet confirmed by the server. */
  pending?: boolean
}

export interface MarkerDraft {
  typeId: string
  name: string
  description: string | null
  lat: number
  lng: number
  visibility: MarkerVisibility
}

export interface MapFlyTarget {
  lat: number
  lng: number
  zoom?: number
  /** Changes on every request so the same target can be flown to twice. */
  nonce: number
}
