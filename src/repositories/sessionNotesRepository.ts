import { supabase } from '../db/supabase'
import type { CreateSessionNoteInput, SessionNote, UpdateSessionNoteInput } from '../types/domain'

export type SessionNotesRealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

export interface SessionNotesRealtimeSubscription {
  table: string
  filter?: string
  schema?: string
  event?: SessionNotesRealtimeEvent
}

interface ListSessionNotesOptions {
  visibleOnly?: boolean
}

interface SessionNoteRow {
  id: string
  session_id: string
  author_user_id: string | null
  title: string
  content_text: string | null
  content_character_note: string | null
  content_image_path: string | null
  is_visible: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export function buildSessionNotesChannelName(sessionId: string): string {
  return `session-notes-${sessionId}`
}

export function buildSessionNotesRealtimeSubscriptions(sessionId: string): SessionNotesRealtimeSubscription[] {
  return [{ table: 'session_notes', filter: `session_id=eq.${sessionId}` }]
}

function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as { status?: number; message?: string }
  if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
    return true
  }

  const msg = (maybeError.message ?? '').toLowerCase()
  return msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts || !isTransientError(error)) {
        throw error
      }
    }
  }

  throw lastError
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
    sessionId: row.session_id,
    authorUserId: row.author_user_id,
    title: row.title,
    contentText: row.content_text,
    contentCharacterNote: row.content_character_note,
    contentImagePath: row.content_image_path,
    isVisible: row.is_visible,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapSessionNoteWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const maybeStatus = (error as { status?: number }).status

    if (maybeStatus === 403 || message.includes('row-level security') || message.includes('permission denied')) {
      return new Error('Acces refuse pour les notes de session.')
    }

    return error
  }

  return new Error('Operation note de session impossible.')
}

export async function listSessionNotesForSession(
  sessionId: string,
  options: ListSessionNotesOptions = {}
): Promise<SessionNote[]> {
  return withRetry(async () => {
    let query = supabase
      .from('session_notes')
      .select('id, session_id, author_user_id, title, content_text, content_character_note, content_image_path, is_visible, is_archived, created_at, updated_at')
      .eq('session_id', sessionId)

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
  const contentCharacterNote = normalizeNullableText(payload.contentCharacterNote)
  const contentImagePath = normalizeNullableText(payload.contentImagePath)

  if (!contentText && !contentCharacterNote && !contentImagePath) {
    throw new Error('Ajoutez au moins un contenu de note.')
  }

  const { data, error } = await supabase
    .from('session_notes')
    .insert({
      session_id: payload.sessionId,
      title,
      content_text: contentText,
      content_character_note: contentCharacterNote,
      content_image_path: contentImagePath,
      is_visible: payload.isVisible ?? false
    })
    .select('id')
    .single()

  if (error) {
    throw mapSessionNoteWriteError(error)
  }

  return data.id as string
}

export async function updateSessionNote(noteId: string, patch: UpdateSessionNoteInput): Promise<void> {
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

  if ('contentCharacterNote' in patch) {
    updatePayload.content_character_note = normalizeNullableText(patch.contentCharacterNote)
  }

  if ('contentImagePath' in patch) {
    updatePayload.content_image_path = normalizeNullableText(patch.contentImagePath)
  }

  if (typeof patch.isVisible === 'boolean') {
    updatePayload.is_visible = patch.isVisible
  }

  if (typeof patch.isArchived === 'boolean') {
    updatePayload.is_archived = patch.isArchived
  }

  updatePayload.updated_at = new Date().toISOString()

  if (
    'content_text' in updatePayload ||
    'content_character_note' in updatePayload ||
    'content_image_path' in updatePayload
  ) {
    const contentText = (updatePayload.content_text as string | null | undefined) ?? null
    const contentCharacterNote = (updatePayload.content_character_note as string | null | undefined) ?? null
    const contentImagePath = (updatePayload.content_image_path as string | null | undefined) ?? null

    if (!contentText && !contentCharacterNote && !contentImagePath) {
      throw new Error('Ajoutez au moins un contenu de note.')
    }
  }

  const { error } = await supabase
    .from('session_notes')
    .update(updatePayload)
    .eq('id', noteId)

  if (error) {
    throw mapSessionNoteWriteError(error)
  }
}

export async function toggleSessionNoteVisibility(noteId: string, isVisible: boolean): Promise<void> {
  await updateSessionNote(noteId, { isVisible })
}

export async function toggleSessionNoteArchivedState(noteId: string, isArchived: boolean): Promise<void> {
  await updateSessionNote(noteId, { isArchived })
}

export async function deleteSessionNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('session_notes')
    .delete()
    .eq('id', noteId)

  if (error) {
    throw mapSessionNoteWriteError(error)
  }
}
