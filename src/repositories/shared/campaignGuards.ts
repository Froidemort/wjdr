import { supabase } from '../../db/supabase'

export async function assertCampaignWritable(campaignId: string): Promise<void> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, is_archived')
    .eq('id', campaignId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Campagne introuvable.')
  }

  if (data.is_archived) {
    throw new Error('Campagne archivee: action interdite.')
  }
}
