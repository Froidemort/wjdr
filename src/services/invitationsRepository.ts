import { supabase } from '../db/supabase'
import type { Profile } from '../types/domain'
import { assertCampaignWritable } from './shared/campaignGuards'
import { mapBasicProfile, searchProfilesByTerm } from './shared/profileSearch'

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
  receiver?: Array<{
    username: string
    email: string
  }> | null
}

const LEGACY_INVITATION_PREFIX = 'INVITATION_SESSION_'

export const invitationTitle = (): string => 'Invitation a une session'

export const invitationMarker = (campaignId: string): string => `[session:${campaignId}]`

function legacyInvitationTitle(campaignId: string): string {
  return `${LEGACY_INVITATION_PREFIX}${campaignId}`
}

function isInvitationForCampaign(row: NotificationRow, campaignId: string): boolean {
  const marker = invitationMarker(campaignId)
  return (
    row.title === invitationTitle() ||
    row.title === legacyInvitationTitle(campaignId) ||
    row.message.includes(marker)
  )
}

export async function listCampaignInvitations(
  campaignId: string,
  mjId: string
): Promise<SessionInvitation[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'receiver_user_id, is_read, created_at, title, message, receiver:profiles!notifications_receiver_user_id_fkey(username, email)'
    )
    .eq('sender_user_id', mjId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as NotificationRow[]).filter((row) =>
    isInvitationForCampaign(row, campaignId)
  )

  return rows
    .map((row) => {
      const profile = row.receiver?.[0]
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
  campaignId: string,
  query: string,
  mjId: string
): Promise<Profile[]> {
  const profiles = await searchProfilesByTerm(query)
  if (profiles.length === 0) {
    return []
  }

  const { data: invitationsData, error: invitationsError } = await supabase
    .from('notifications')
    .select('receiver_user_id, title, message, is_read, created_at')
    .eq('sender_user_id', mjId)

  if (invitationsError) {
    throw invitationsError
  }

  const invitationRows = ((invitationsData ?? []) as NotificationRow[]).filter((row) =>
    isInvitationForCampaign(row, campaignId)
  )

  const blockedIds = new Set<string>([
    mjId,
    ...invitationRows.map((row) => row.receiver_user_id as string),
  ])

  return profiles.map(mapBasicProfile).filter((profile) => !blockedIds.has(profile.id))
}

export async function createCampaignInvitations(
  campaignId: string,
  campaignName: string,
  _campaignCode: string,
  mjId: string,
  userIds: string[]
): Promise<void> {
  await assertCampaignWritable(campaignId)

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
      .filter((row) => isInvitationForCampaign(row, campaignId))
      .map((row) => row.receiver_user_id as string)
  )
  const newIds = uniqueUserIds.filter((id) => !existingIds.has(id))
  if (newIds.length === 0) {
    return
  }

  const message = `Vous etes convie a la table "${campaignName}".\nLe Vieux Monde attend votre venue.\n${invitationMarker(campaignId)}`
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

export const listSessionInvitations = listCampaignInvitations
export const createSessionInvitations = createCampaignInvitations
