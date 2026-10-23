import { supabase } from '../../db/supabase'
import { throwIfError } from './supabase'

export async function assertCampaignWritable(campaignId: string): Promise<void> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, is_archived')
    .eq('id', campaignId)
    .maybeSingle()

  throwIfError(error)

  if (!data) {
    throw new Error('Campagne introuvable.')
  }

  if (data.is_archived) {
    throw new Error('Campagne archivée : action interdite.')
  }
}
