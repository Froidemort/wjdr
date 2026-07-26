import { supabase } from '../db/supabase'
import type { SessionRow } from '../types/db'
import type { SessionSummary, CreateSessionInput } from '../types/domain'

function mapSession(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    date: row.date,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSessionWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const maybeStatus = (error as { status?: number }).status

    if (
      maybeStatus === 403 ||
      message.includes('row-level security') ||
      message.includes('permission denied')
    ) {
      return new Error('Acces refuse (403): vous n\'etes pas le MJ de cette campagne.')
    }

    return error
  }

  return new Error('Operation session impossible.')
}

export async function listSessionsForCampaign(campaignId: string): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, campaign_id, date, name, description, created_at, updated_at')
    .eq('campaign_id', campaignId)
    .order('date', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapSession(row as SessionRow))
}

export async function createSession(payload: CreateSessionInput): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      campaign_id: payload.campaignId,
      date: payload.date,
      name: payload.name || null,
      description: payload.description || null,
    })
    .select('id')
    .single()

  if (error) {
    throw mapSessionWriteError(error)
  }

  return data.id as string
}

export async function updateSession(
  sessionId: string,
  payload: Partial<CreateSessionInput>
): Promise<void> {
  const updateData: Record<string, unknown> = {}
  
  if (payload.date !== undefined) updateData.date = payload.date
  if (payload.name !== undefined) updateData.name = payload.name || null
  if (payload.description !== undefined) updateData.description = payload.description || null

  const { error } = await supabase
    .from('sessions')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    throw mapSessionWriteError(error)
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    throw mapSessionWriteError(error)
  }
}

export async function getSessionById(sessionId: string): Promise<SessionSummary | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, campaign_id, date, name, description, created_at, updated_at')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapSession(data as SessionRow) : null
}
