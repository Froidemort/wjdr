import { supabase } from '../db/supabase'
import { isValidUUID, isValidSessionCode, validateInput } from '../utils/validation'

export interface NotificationItem {
  id: string
  senderUserId: string | null
  receiverUserId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface JoinRequestItem {
  notificationId: string
  requesterId: string
  username: string
  email: string
  createdAt: string
}

interface NotificationRow {
  id: string
  sender_user_id: string | null
  receiver_user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

interface JoinRequestRow {
  id: string
  sender_user_id: string | null
  receiver_user_id: string
  message: string
  is_read: boolean
  created_at: string
}

interface ProfileRow {
  id: string
  username: string
  email: string
}

export interface PaginatedNotifications {
  items: NotificationItem[]
  total: number
}

const JOIN_REQUEST_TITLE = 'Demande de rejoindre une session'
const JOIN_REQUEST_ACCEPTED_TITLE = 'Demande de session acceptee'
const JOIN_REQUEST_REJECTED_TITLE = 'Demande de session refusee'
const INVITATION_TITLE = 'Invitation a une session'
const LEGACY_INVITATION_PREFIX = 'INVITATION_SESSION_'

function joinRequestSessionMarker(sessionId: string): string {
  return `[join-request-session:${sessionId}]`
}

function isJoinRequestForSession(message: string, sessionId: string): boolean {
  return message.includes(joinRequestSessionMarker(sessionId))
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
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('temporarily unavailable')
  )
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

function mapNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    senderUserId: row.sender_user_id,
    receiverUserId: row.receiver_user_id,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}

export function getNotificationDisplayTitle(rawTitle: string): string {
  if (rawTitle.startsWith(LEGACY_INVITATION_PREFIX) || rawTitle === INVITATION_TITLE) {
    return 'Convocation a la table'
  }

  if (rawTitle === JOIN_REQUEST_TITLE) {
    return 'Demande d audience'
  }

  if (rawTitle === JOIN_REQUEST_ACCEPTED_TITLE) {
    return 'Demande acceptee'
  }

  if (rawTitle === JOIN_REQUEST_REJECTED_TITLE) {
    return 'Demande refusee'
  }

  return rawTitle
}

export function getNotificationDisplayMessage(rawMessage: string): string {
  const cleaned = rawMessage
    .replace(/\[session:[^\]]+\]/gi, '')
    .replace(/\[join-request-session:[^\]]+\]/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\/sessions\/[0-9a-f-]{36}/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()

  return cleaned || 'Un nouvel evenement requiert votre attention.'
}

export function extractNotificationSessionId(
  notification: Pick<NotificationItem, 'title' | 'message'>
): string | null {
  const fromLegacyTitle = notification.title.match(/^INVITATION_SESSION_([0-9a-f-]{36})$/i)
  if (fromLegacyTitle?.[1]) {
    return fromLegacyTitle[1]
  }

  const fromMarker = notification.message.match(/\[session:([0-9a-f-]{36})\]/i)
  if (fromMarker?.[1]) {
    return fromMarker[1]
  }

  const fromJoinMarker = notification.message.match(/\[join-request-session:([0-9a-f-]{36})\]/i)
  if (fromJoinMarker?.[1]) {
    return fromJoinMarker[1]
  }

  const fromPath = notification.message.match(/\/sessions\/([0-9a-f-]{36})/i)
  return fromPath?.[1] ?? null
}

function mapJoinRequestProfile(row: ProfileRow): ProfileRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  }
}

export async function listNotificationsForUser(userId: string): Promise<NotificationItem[]> {
  const result = await listNotificationsForUserPaginated(userId, 1, 50)
  return result.items
}

export async function listNotificationsForUserPaginated(
  userId: string,
  page: number,
  pageSize: number
): Promise<PaginatedNotifications> {
  const safePage = Math.max(1, Math.floor(page))
  const safePageSize = Math.max(1, Math.min(50, Math.floor(pageSize)))
  const from = (safePage - 1) * safePageSize
  const to = from + safePageSize - 1

  return withRetry(async () => {
    const { data, count, error } = await supabase
      .from('notifications')
      .select('id, sender_user_id, receiver_user_id, title, message, is_read, created_at', {
        count: 'exact',
      })
      .eq('receiver_user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    return {
      items: ((data ?? []) as NotificationRow[]).map(mapNotification),
      total: count ?? 0,
    }
  })
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    throw error
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('receiver_user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw error
  }
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_user_id', userId)
    .eq('is_read', false)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

  if (error) {
    throw error
  }
}

export async function requestJoinSession(sessionId: string, requesterId: string): Promise<void> {
  // Validate inputs before RPC call
  validateInput(sessionId, isValidUUID, 'Session ID invalide.')
  validateInput(requesterId, isValidUUID, 'Requester ID invalide.')

  const { data: ownerId, error: ownerError } = await supabase.rpc('get_session_owner_for_request', {
    target_session_id: sessionId,
  })

  if (ownerError) {
    throw ownerError
  }

  const mjId = String(ownerId ?? '')
  if (!mjId) {
    throw new Error('Session introuvable ou archivee.')
  }

  if (mjId === requesterId) {
    throw new Error('Vous etes deja MJ de cette session.')
  }

  const marker = joinRequestSessionMarker(sessionId)
  const { data: existingRows, error: existingError } = await supabase
    .from('notifications')
    .select('id, is_read')
    .eq('title', JOIN_REQUEST_TITLE)
    .eq('sender_user_id', requesterId)
    .eq('receiver_user_id', mjId)
    .ilike('message', `%${marker}%`)

  if (existingError) {
    throw existingError
  }

  const hasPendingRequest = (existingRows ?? []).some(
    (row) => !(row as { is_read: boolean }).is_read
  )
  if (hasPendingRequest) {
    return
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('username, email')
    .eq('id', requesterId)
    .maybeSingle()

  const username = (profileData as { username?: string } | null)?.username ?? 'Inconnu'

  const { error } = await supabase.from('notifications').insert({
    sender_user_id: requesterId,
    receiver_user_id: mjId,
    title: JOIN_REQUEST_TITLE,
    message: `L aventurier ${username} demande audience pour rejoindre votre table.\n${marker}`,
  })

  if (error) {
    throw error
  }
}

export async function requestJoinByCode(userId: string, code: string): Promise<void> {
  // Validate inputs
  validateInput(userId, isValidUUID, 'User ID invalide.')
  validateInput(
    code.trim().toUpperCase(),
    isValidSessionCode,
    'Code session invalide (format: 6 caracteres alphanumeriques).'
  )

  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    throw new Error('Code invalide.')
  }

  const { data: sessionId, error } = await supabase.rpc('get_session_id_by_code', {
    target_code: normalized,
  })

  if (error) {
    throw error
  }

  if (!sessionId) {
    throw new Error('Session introuvable ou archivée.')
  }

  await requestJoinSession(String(sessionId), userId)
}

export async function listPendingJoinRequestsForSession(
  sessionId: string,
  mjId: string
): Promise<JoinRequestItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, sender_user_id, receiver_user_id, message, is_read, created_at')
    .eq('receiver_user_id', mjId)
    .eq('title', JOIN_REQUEST_TITLE)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as JoinRequestRow[])
    .filter((row) => Boolean(row.sender_user_id))
    .filter((row) => isJoinRequestForSession(row.message, sessionId))

  const requesterIds = Array.from(new Set(rows.map((row) => row.sender_user_id as string)))
  if (requesterIds.length === 0) {
    return []
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, email')
    .in('id', requesterIds)

  if (profilesError) {
    throw profilesError
  }

  const profilesById = new Map<string, ProfileRow>()
  for (const profile of ((profilesData ?? []) as ProfileRow[]).map(mapJoinRequestProfile)) {
    profilesById.set(profile.id, profile)
  }

  return rows
    .map((row) => {
      const requesterId = row.sender_user_id as string
      const profile = profilesById.get(requesterId)
      if (!profile) {
        return null
      }

      return {
        notificationId: row.id,
        requesterId,
        username: profile.username,
        email: profile.email,
        createdAt: row.created_at,
      }
    })
    .filter((row): row is JoinRequestItem => Boolean(row))
}

export async function notifyJoinRequestAccepted(
  sessionId: string,
  requesterId: string,
  mjId: string
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    sender_user_id: mjId,
    receiver_user_id: requesterId,
    title: JOIN_REQUEST_ACCEPTED_TITLE,
    message: `Le Maître du Jeu accepte votre entree a la table.\n[session:${sessionId}]`,
  })

  if (error) {
    throw error
  }
}

export async function notifyJoinRequestRejected(
  _sessionId: string,
  requesterId: string,
  mjId: string
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    sender_user_id: mjId,
    receiver_user_id: requesterId,
    title: JOIN_REQUEST_REJECTED_TITLE,
    message: `Le Maître du Jeu n a pas retenu votre demande pour cette table.`,
  })

  if (error) {
    throw error
  }
}
