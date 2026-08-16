import { supabase } from '../../db/supabase'
import type { BasicProfileRow } from '../../types/db'
import type { Profile } from '../../types/domain'

export function mapBasicProfile(row: BasicProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  }
}

export async function searchProfilesByTerm(query: string, limit = 20): Promise<BasicProfileRow[]> {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return []
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email')
    .or(`username.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
    .limit(limit)

  if (error) {
    throw error
  }

  return (data ?? []) as BasicProfileRow[]
}
