import { supabase } from '../db/supabase'
import type { SessionSummary } from '../types/domain'
import { listUserSessionIds } from './usersSessionRepository'

interface SessionRow {
  id: string
  name: string
  code: string
  description: string | null
  is_archived: boolean
  mj_id: string
  created_at: string | null
}

export interface PaginatedSessions {
  items: SessionSummary[]
  total: number
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

function mapSession(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    isArchived: row.is_archived,
    mjId: row.mj_id,
    createdAt: row.created_at
  }
}

function mapSessionWriteError(error: unknown): Error {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const maybeStatus = (error as { status?: number }).status

    if (maybeStatus === 403 || message.includes('row-level security') || message.includes('permission denied')) {
      return new Error('Acces refuse (403): verifiez la session auth, l existence du profil et les politiques RLS sessions/users_session.')
    }

    return error
  }

  return new Error('Operation session impossible.')
}

export async function listSessionsForUser(userId: string): Promise<SessionSummary[]> {
  return withRetry(async () => {
    const [ownedResult, membershipSessionIds] = await Promise.all([
      supabase
        .from('sessions')
        .select('id, name, code, description, is_archived, mj_id, created_at')
        .eq('mj_id', userId)
        .order('created_at', { ascending: false }),
      listUserSessionIds(userId)
    ])

    if (ownedResult.error) {
      throw ownedResult.error
    }

    const joinedSessionIds = membershipSessionIds

    let joinedRows: SessionRow[] = []
    if (joinedSessionIds.length > 0) {
      const joinedResult = await supabase
        .from('sessions')
        .select('id, name, code, description, is_archived, mj_id, created_at')
        .in('id', joinedSessionIds)

      if (joinedResult.error) {
        throw joinedResult.error
      }

      joinedRows = (joinedResult.data ?? []) as SessionRow[]
    }

    const merged = new Map<string, SessionSummary>()
    for (const row of (ownedResult.data ?? []) as SessionRow[]) {
      merged.set(row.id, mapSession(row))
    }

    for (const row of joinedRows) {
      merged.set(row.id, mapSession(row))
    }

    return Array.from(merged.values()).sort((a, b) => {
      const left = a.createdAt ?? ''
      const right = b.createdAt ?? ''
      return right.localeCompare(left)
    })
  })
}

export async function listSessionsForUserPaginated(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedSessions> {
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.max(1, Math.min(24, Math.floor(pageSize)))
  const allItems = await listSessionsForUser(userId)
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize

  return {
    items: allItems.slice(from, to),
    total: allItems.length
  }
}

export async function createSession(payload: {
  mjId: string
  name: string
  description: string
  code: string
}): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      mj_id: payload.mjId,
      name: payload.name,
      description: payload.description,
      code: payload.code
    })
    .select('id')
    .single()

  if (error) {
    throw mapSessionWriteError(error)
  }

  const sessionId = data.id as string
  const { error: membershipError } = await supabase
    .from('users_session')
    .upsert({
      session_id: sessionId,
      user_id: payload.mjId,
      active: true
    }, { onConflict: 'session_id,user_id' })

  if (membershipError) {
    const mappedError = mapSessionWriteError(membershipError)
    if (mappedError.message.toLowerCase().includes('acces refuse (403)')) {
      // The session is already created. Some RLS setups deny this redundant MJ membership write.
      return sessionId
    }

    throw mappedError
  }

  return sessionId
}

export async function getSessionById(sessionId: string): Promise<SessionSummary | null> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('id, name, code, description, is_archived, mj_id, created_at')
      .eq('id', sessionId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapSession(data as SessionRow) : null
  })
}
