import { supabase } from '../db/supabase'
import type { CampaignRow } from '../types/db'
import type { CampaignSummary } from '../types/domain'
import { withRetry } from './shared/retry'

export interface PaginatedCampaigns {
  items: CampaignSummary[]
  total: number
}

function mapCampaign(row: CampaignRow): CampaignSummary {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    isArchived: row.is_archived,
    mjId: row.mj_id,
    createdAt: row.created_at,
  }
}

function mapCampaignWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const maybeStatus = (error as { status?: number }).status

    if (
      maybeStatus === 403 ||
      message.includes('row-level security') ||
      message.includes('permission denied')
    ) {
      return new Error(
        'Acces refuse (403): verifiez la session auth, l existence du profil et les politiques RLS campaigns/users_campaigns.'
      )
    }

    return error
  }

  return new Error('Operation campagne impossible.')
}

export async function listCampaignsForUser(userId: string): Promise<CampaignSummary[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, code, description, is_archived, mj_id, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return ((data ?? []) as CampaignRow[]).map(mapCampaign).sort((a, b) => {
      const left = a.createdAt ?? ''
      const right = b.createdAt ?? ''
      return right.localeCompare(left)
    })
  })
}

export async function listCampaignsForUserPaginated(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedCampaigns> {
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.max(1, Math.min(24, Math.floor(pageSize)))
  const allItems = await listCampaignsForUser(userId)
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize

  return {
    items: allItems.slice(from, to),
    total: allItems.length,
  }
}

export async function createCampaign(payload: {
  mjId: string
  name: string
  description: string
  code: string
}): Promise<string> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      mj_id: payload.mjId,
      name: payload.name,
      description: payload.description,
      code: payload.code,
    })
    .select('id')
    .single()

  if (error) {
    throw mapCampaignWriteError(error)
  }

  const campaignId = data.id as string
  const { error: membershipError } = await supabase.from('users_campaigns').upsert(
    {
      campaign_id: campaignId,
      user_id: payload.mjId,
      active: true,
    },
    { onConflict: 'campaign_id,user_id' }
  )

  if (membershipError) {
    const mappedError = mapCampaignWriteError(membershipError)
    if (mappedError.message.toLowerCase().includes('acces refuse (403)')) {
      // The campaign is already created. Some RLS setups deny this redundant MJ membership write.
      return campaignId
    }

    throw mappedError
  }

  return campaignId
}

export async function getCampaignById(campaignId: string): Promise<CampaignSummary | null> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, code, description, is_archived, mj_id, created_at')
      .eq('id', campaignId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapCampaign(data as CampaignRow) : null
  })
}

export async function updateCampaignArchivedState(
  campaignId: string,
  isArchived: boolean
): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({ is_archived: isArchived })
    .eq('id', campaignId)

  if (error) {
    throw mapCampaignWriteError(error)
  }
}
