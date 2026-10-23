import { supabase } from '../db/supabase'
import type { CampaignMarkerRow, MapMarkerRow, MapMarkerTypeRow } from '../types/db'
import type { MapMarker, MarkerDraft, MarkerType, MarkerVisibility } from '../types/map'
import { fetchAllPages } from './shared/pagination'
import { withRetry } from './shared/retry'
import { throwIfError } from './shared/supabase'

const BASE_COLUMNS = 'id, type_id, name, description, lat, lng, external_ref'
const CAMPAIGN_COLUMNS = 'id, campaign_id, type_id, name, description, lat, lng, visibility, created_by, created_at'

export function mapMarkerType(row: MapMarkerTypeRow): MarkerType {
  return { id: row.id, code: row.code, label: row.label, icon: row.icon, color: row.color }
}

export function mapBaseMarker(row: MapMarkerRow): MapMarker {
  return {
    id: row.id,
    source: 'base',
    typeId: row.type_id,
    name: row.name,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    campaignId: null,
    visibility: null,
    createdBy: null,
    createdAt: null,
  }
}

export function mapCampaignMarker(row: CampaignMarkerRow): MapMarker {
  return {
    id: row.id,
    source: 'campaign',
    typeId: row.type_id,
    name: row.name,
    description: row.description,
    lat: row.lat,
    lng: row.lng,
    campaignId: row.campaign_id,
    visibility: row.visibility,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export async function listMarkerTypes(): Promise<MarkerType[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('map_marker_types').select('id, code, label, icon, color').order('label')

    throwIfError(error)

    return ((data ?? []) as MapMarkerTypeRow[]).map(mapMarkerType)
  })
}

/** Reads the whole base layer, paging past the API row limit. */
export async function listBaseMarkers(): Promise<MapMarker[]> {
  const rows = await fetchAllPages<MapMarkerRow>((from, to) =>
    withRetry(async () => {
      const { data, error } = await supabase
        .from('map_markers')
        .select(BASE_COLUMNS)
        .order('id')
        .range(from, to)

      throwIfError(error)

      return { data: (data ?? []) as MapMarkerRow[], error: null }
    })
  )

  return rows.map(mapBaseMarker)
}

export async function listCampaignMarkers(campaignId: string): Promise<MapMarker[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('campaign_markers')
      .select(CAMPAIGN_COLUMNS)
      .eq('campaign_id', campaignId)
      .order('created_at')

    throwIfError(error)

    return ((data ?? []) as CampaignMarkerRow[]).map(mapCampaignMarker)
  })
}

export async function createCampaignMarker(campaignId: string, draft: MarkerDraft): Promise<MapMarker> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  throwIfError(userError)
  if (!userData.user) {
    throw new Error('Connexion requise pour ajouter un marqueur.')
  }

  const { data, error } = await supabase
    .from('campaign_markers')
    .insert({
      campaign_id: campaignId,
      type_id: draft.typeId,
      name: draft.name,
      description: draft.description,
      lat: draft.lat,
      lng: draft.lng,
      visibility: draft.visibility,
      created_by: userData.user.id,
    })
    .select(CAMPAIGN_COLUMNS)
    .single()

  throwIfError(error)

  return mapCampaignMarker(data as CampaignMarkerRow)
}

export interface CampaignMarkerPatch {
  typeId?: string
  name?: string
  description?: string | null
  lat?: number
  lng?: number
  visibility?: MarkerVisibility
}

export async function updateCampaignMarker(id: string, patch: CampaignMarkerPatch): Promise<MapMarker> {
  const update: Partial<Omit<CampaignMarkerRow, 'id' | 'campaign_id' | 'created_by' | 'created_at'>> = {}
  if (patch.typeId !== undefined) update.type_id = patch.typeId
  if (patch.name !== undefined) update.name = patch.name
  if (patch.description !== undefined) update.description = patch.description
  if (patch.lat !== undefined) update.lat = patch.lat
  if (patch.lng !== undefined) update.lng = patch.lng
  if (patch.visibility !== undefined) update.visibility = patch.visibility

  const { data, error } = await supabase.from('campaign_markers').update(update).eq('id', id).select(CAMPAIGN_COLUMNS).single()

  throwIfError(error)

  return mapCampaignMarker(data as CampaignMarkerRow)
}

export async function deleteCampaignMarker(id: string): Promise<void> {
  const { error } = await supabase.from('campaign_markers').delete().eq('id', id)

  throwIfError(error)
}
