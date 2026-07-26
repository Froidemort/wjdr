import { supabase } from '../db/supabase'
import type { CreateSessionNoteInput, SessionNote, UpdateSessionNoteInput } from '../types/domain'
import { withRetry } from './shared/retry'

export type SessionNotesRealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

export interface SessionNotesRealtimeSubscription {
  table: string
  filter?: string
  schema?: string
  event?: SessionNotesRealtimeEvent
}

interface ListSessionNotesOptions {
  visibleOnly?: boolean
  sessionId?: string | null
}

interface SessionNoteRow {
  id: string
  campaign_id: string
  session_id: string | null
  author_user_id: string | null
  title: string
  content_text: string | null
  is_visible: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export function buildSessionNotesChannelName(campaignId: string): string {
  return `session-notes-${campaignId}`
}

export function buildSessionNotesRealtimeSubscriptions(
  campaignId: string
): SessionNotesRealtimeSubscription[] {
  return [{ table: 'session_notes', filter: `campaign_id=eq.${campaignId}` }]
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapSessionNote(row: SessionNoteRow): SessionNote {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    sessionId: row.session_id,
    authorUserId: row.author_user_id,
    title: row.title,
    contentText: row.content_text,
    isVisible: row.is_visible,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapSessionNoteWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const maybeStatus = (error as { status?: number }).status

    if (
      maybeStatus === 403 ||
      message.includes('row-level security') ||
      message.includes('permission denied')
    ) {
      return new Error('Acces refuse pour les notes de session.')
    }

    return error
  }

  return new Error('Operation note de session impossible.')
}

export async function listSessionNotesForCampaign(
  campaignId: string,
  options: ListSessionNotesOptions = {}
): Promise<SessionNote[]> {
  return withRetry(async () => {
    let query = supabase
      .from('session_notes')
      .select(
        'id, campaign_id, session_id, author_user_id, title, content_text, is_visible, is_archived, created_at, updated_at'
      )
      .eq('campaign_id', campaignId)

    if (options.sessionId) {
      query = query.eq('session_id', options.sessionId)
    }

    if (options.visibleOnly) {
      query = query.eq('is_visible', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return ((data ?? []) as SessionNoteRow[]).map(mapSessionNote)
  })
}

export async function createSessionNote(payload: CreateSessionNoteInput): Promise<string> {
  const title = payload.title.trim()
  if (!title) {
    throw new Error('Le titre de la note est requis.')
  }

  const contentText = normalizeNullableText(payload.contentText)

  if (!contentText) {
    throw new Error('Ajoutez un contenu texte a la note.')
  }

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      campaign_id: payload.campaignId,
      session_id: payload.sessionId || null,
      title,
      content_text: contentText,
      is_visible: payload.isVisible ?? false,
    })
    .select('id')
    .single()

  if (error) {
    throw mapSessionNoteWriteError(error)
  }

  return data.id as string
}

export async function updateSessionNote(
  noteId: string,
  patch: UpdateSessionNoteInput
): Promise<void> {
  const updatePayload: Record<string, unknown> = {}

  if (typeof patch.title === 'string') {
    const title = patch.title.trim()
    if (!title) {
      throw new Error('Le titre de la note est requis.')
    }
    updatePayload.title = title
  }

  if ('contentText' in patch) {
    updatePayload.content_text = normalizeNullableText(patch.contentText)
  }

  if ('sessionId' in patch) {
    updatePayload.session_id = patch.sessionId || null
  }

  if (typeof patch.isVisible === 'boolean') {
    updatePayload.is_visible = patch.isVisible
  }

  if (typeof patch.isArchived === 'boolean') {
    updatePayload.is_archived = patch.isArchived
  }

  updatePayload.updated_at = new Date().toISOString()

  if ('content_text' in updatePayload) {
    const contentText = (updatePayload.content_text as string | null | undefined) ?? null

    if (!contentText) {
      throw new Error('Ajoutez un contenu texte a la note.')
    }
  }

  const { error } = await supabase.from('session_notes').update(updatePayload).eq('id', noteId)

  if (error) {
    throw mapSessionNoteWriteError(error)
  }
}

export async function toggleSessionNoteVisibility(
  noteId: string,
  isVisible: boolean
): Promise<void> {
  await updateSessionNote(noteId, { isVisible })
}

export async function toggleSessionNoteArchivedState(
  noteId: string,
  isArchived: boolean
): Promise<void> {
  await updateSessionNote(noteId, { isArchived })
}

export async function deleteSessionNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('session_notes').delete().eq('id', noteId)

  if (error) {
    throw mapSessionNoteWriteError(error)
  }
}
