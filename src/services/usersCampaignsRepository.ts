import { supabase } from '../db/supabase'
import type { Profile } from '../types/domain'
import { assertCampaignWritable } from './shared/campaignGuards'
import { mapBasicProfile, searchProfilesByTerm } from './shared/profileSearch'

export async function listUserCampaignIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('users_campaigns')
    .select('campaign_id')
    .eq('user_id', userId)
    .eq('active', true)

  if (error) {
    throw error
  }

  return Array.from(new Set((data ?? []).map((row) => row.campaign_id as string)))
}

export async function isUserInCampaign(campaignId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users_campaigns')
    .select('campaign_id')
    .eq('campaign_id', campaignId)
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data)
}

export async function addUsersToCampaign(campaignId: string, userIds: string[]): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds))
  if (uniqueIds.length === 0) {
    return
  }

  await assertCampaignWritable(campaignId)

  const rows = uniqueIds.map((userId) => ({
    campaign_id: campaignId,
    user_id: userId,
    active: true,
  }))

  const { error } = await supabase
    .from('users_campaigns')
    .upsert(rows, { onConflict: 'campaign_id,user_id' })

  if (error) {
    throw error
  }
}

export async function searchInvitableProfilesByMembership(
  campaignId: string,
  query: string,
  mjId: string
): Promise<Profile[]> {
  const profiles = await searchProfilesByTerm(query)
  if (profiles.length === 0) {
    return []
  }

  const { data: membersData, error: membersError } = await supabase
    .from('users_campaigns')
    .select('user_id')
    .eq('campaign_id', campaignId)
    .eq('active', true)

  if (membersError) {
    throw membersError
  }

  const blockedIds = new Set<string>([
    mjId,
    ...(membersData ?? []).map((row) => row.user_id as string),
  ])

  return profiles.map(mapBasicProfile).filter((profile) => !blockedIds.has(profile.id))
}

export async function joinCampaignByCode(
  userId: string,
  code: string
): Promise<{ campaignId: string } | null> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) {
    return null
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, is_archived')
    .eq('code', normalized)
    .maybeSingle()

  if (campaignError) {
    throw campaignError
  }

  if (!campaign || campaign.is_archived) {
    return null
  }

  await addUsersToCampaign(campaign.id as string, [userId])
  return { campaignId: campaign.id as string }
}

export async function canAccessCampaign(campaignId: string, userId: string): Promise<boolean> {
  const [membershipResult, mjResult] = await Promise.all([
    supabase
      .from('users_campaigns')
      .select('campaign_id')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle(),
    supabase.from('campaigns').select('id').eq('id', campaignId).eq('mj_id', userId).maybeSingle(),
  ])

  if (membershipResult.error) {
    throw membershipResult.error
  }

  if (mjResult.error) {
    throw mjResult.error
  }

  return Boolean(membershipResult.data || mjResult.data)
}
