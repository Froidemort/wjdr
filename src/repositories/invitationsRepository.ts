import { supabase } from '../db/supabase'
import type { Profile } from '../types/domain'

export interface SessionInvitation {
  userId: string
  username: string
  email: string
  invitedAt: string | null
  isRead: boolean
}

interface NotificationRow {
  receiver_user_id: string
  is_read: boolean
  created_at: string | null
  title: string
  message: string
}

interface ProfileRow {
  id: string
  username: string
  email: string
}

const LEGACY_INVITATION_PREFIX = 'INVITATION_SESSION_'

export const invitationTitle = (): string => 'Invitation a une session'

export const invitationMarker = (sessionId: string): string => `[session:${sessionId}]`

function legacyInvitationTitle(sessionId: string): string {
  return `${LEGACY_INVITATION_PREFIX}${sessionId}`
}

function isInvitationForSession(row: NotificationRow, sessionId: string): boolean {
  const marker = invitationMarker(sessionId)
  return (
    row.title === invitationTitle() ||
    row.title === legacyInvitationTitle(sessionId) ||
    row.message.includes(marker)
  )
}

async function assertSessionWritable(sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, is_archived')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Session introuvable.')
  }

  if (data.is_archived) {
    throw new Error('Session archivee: action interdite.')
  }
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  }
}

export async function listSessionInvitations(
  sessionId: string,
  mjId: string
): Promise<SessionInvitation[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('receiver_user_id, is_read, created_at, title, message')
    .eq('sender_user_id', mjId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as NotificationRow[]).filter((row) =>
    isInvitationForSession(row, sessionId)
  )
  const userIds = Array.from(new Set(rows.map((row) => row.receiver_user_id)))
  if (userIds.length === 0) {
    return []
  }

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, email')
    .in('id', userIds)

  if (profilesError) {
    throw profilesError
  }

  const profilesById = new Map<string, Profile>()
  for (const profile of ((profilesData ?? []) as ProfileRow[]).map(mapProfile)) {
    profilesById.set(profile.id, profile)
  }

  return rows
    .map((row) => {
      const profile = profilesById.get(row.receiver_user_id)
      if (!profile) {
        return null
      }

      return {
        userId: row.receiver_user_id,
        username: profile.username,
        email: profile.email,
        invitedAt: row.created_at,
        isRead: row.is_read,
      }
    })
    .filter((entry): entry is SessionInvitation => Boolean(entry))
}

export async function searchInvitableProfilesByNotification(
  sessionId: string,
  query: string,
  mjId: string
): Promise<Profile[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return []
  }

  const [profilesResult, invitationsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, email')
      .or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
      .limit(20),
    supabase
      .from('notifications')
      .select('receiver_user_id, title, message, is_read, created_at')
      .eq('sender_user_id', mjId),
  ])

  if (profilesResult.error) {
    throw profilesResult.error
  }

  if (invitationsResult.error) {
    throw invitationsResult.error
  }

  const invitationRows = ((invitationsResult.data ?? []) as NotificationRow[]).filter((row) =>
    isInvitationForSession(row, sessionId)
  )

  const blockedIds = new Set<string>([
    mjId,
    ...invitationRows.map((row) => row.receiver_user_id as string),
  ])

  return ((profilesResult.data ?? []) as ProfileRow[])
    .map(mapProfile)
    .filter((profile) => !blockedIds.has(profile.id))
}

export async function createSessionInvitations(
  sessionId: string,
  sessionName: string,
  _sessionCode: string,
  mjId: string,
  userIds: string[]
): Promise<void> {
  await assertSessionWritable(sessionId)

  const uniqueUserIds = Array.from(new Set(userIds))
  if (uniqueUserIds.length === 0) {
    return
  }

  const { data: existingData, error: existingError } = await supabase
    .from('notifications')
    .select('receiver_user_id, title, message, is_read, created_at')
    .eq('sender_user_id', mjId)

  if (existingError) {
    throw existingError
  }

  const existingIds = new Set(
    ((existingData ?? []) as NotificationRow[])
      .filter((row) => isInvitationForSession(row, sessionId))
      .map((row) => row.receiver_user_id as string)
  )
  const newIds = uniqueUserIds.filter((id) => !existingIds.has(id))
  if (newIds.length === 0) {
    return
  }

  const message = `Vous etes convie a la table "${sessionName}".\nLe Vieux Monde attend votre venue.\n${invitationMarker(sessionId)}`
  const rows = newIds.map((receiverId) => ({
    sender_user_id: mjId,
    receiver_user_id: receiverId,
    title: invitationTitle(),
    message,
  }))

  const { error } = await supabase.from('notifications').insert(rows)

  if (error) {
    throw error
  }
}
