import { supabase } from '../db/supabase'
import type { Profile } from '../types/domain'

interface ProfileRow {
  id: string
  username: string
  email: string
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  }
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

export async function listUserSessionIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users_session')
    .select('session_id')
    .eq('user_id', userId)
    .eq('active', true)

  if (error) {
    throw error
  }

  return Array.from(new Set((data ?? []).map((row) => row.session_id as string)))
}

export async function isUserInSession(sessionId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users_session')
    .select('session_id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

export async function addUsersToSession(sessionId: string, userIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds))
  if (uniqueIds.length === 0) {
    return
  }

  await assertSessionWritable(sessionId)

  const rows = uniqueIds.map((userId) => ({
    session_id: sessionId,
    user_id: userId,
    active: true,
  }))

  const { error } = await supabase
    .from('users_session')
    .upsert(rows, { onConflict: 'session_id,user_id' })

  if (error) {
    throw error
  }
}

export async function searchInvitableProfilesByMembership(
  sessionId: string,
  query: string,
  mjId: string
): Promise<Profile[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return []
  }

  const [profilesResult, membersResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, email')
      .or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
      .limit(20),
    supabase.from('users_session').select('user_id').eq('session_id', sessionId).eq('active', true),
  ])

  if (profilesResult.error) {
    throw profilesResult.error
  }

  if (membersResult.error) {
    throw membersResult.error
  }

  const blockedIds = new Set<string>([
    mjId,
    ...(membersResult.data ?? []).map((row) => row.user_id as string),
  ])

  return ((profilesResult.data ?? []) as ProfileRow[])
    .map(mapProfile)
    .filter((profile) => !blockedIds.has(profile.id))
}

export async function joinSessionByCode(
  userId: string,
  code: string
): Promise<{ sessionId: string } | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, is_archived')
    .eq('code', normalized)
    .maybeSingle()

  if (sessionError) {
    throw sessionError
  }

  if (!session || session.is_archived) {
    return null
  }

  await addUsersToSession(session.id as string, [userId])
  return { sessionId: session.id as string }
}

export async function canAccessSession(sessionId: string, userId: string): Promise<boolean> {
  const [membershipResult, mjResult] = await Promise.all([
    supabase
      .from('users_session')
      .select('session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle(),
    supabase.from('sessions').select('id').eq('id', sessionId).eq('mj_id', userId).maybeSingle(),
  ])

  if (membershipResult.error) {
    throw membershipResult.error
  }

  if (mjResult.error) {
    throw mjResult.error
  }

  return Boolean(membershipResult.data || mjResult.data)
}
