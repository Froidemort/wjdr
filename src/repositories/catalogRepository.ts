import { supabase } from '../db/supabase'
import type { CatalogItem } from '../types/domain'

interface CatalogRow {
  id: string
  name: string
  specialization?: string | null
  description?: string | null
}

function mapCatalogItem(row: CatalogRow): CatalogItem {
  return {
    id: row.id,
    name: row.name,
    specialization: row.specialization ?? null,
    description: row.description ?? null
  }
}

const CATALOG_SELECT_BY_TABLE: Record<'careers' | 'skills' | 'talents' | 'weapons' | 'armors' | 'items', string> = {
  careers: 'id, name',
  skills: 'id, name, specialization, description',
  talents: 'id, name, specialization, description',
  weapons: 'id, name, description',
  armors: 'id, name, description',
  items: 'id, name, description'
}

export async function searchCatalog(table: 'careers' | 'skills' | 'talents' | 'weapons' | 'armors' | 'items', query: string): Promise<CatalogItem[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return []
  }

  let request = supabase
    .from(table)
    .select(CATALOG_SELECT_BY_TABLE[table])
    .limit(20)

  if (table === 'skills' || table === 'talents') {
    request = request.or(`name.ilike.%${trimmed}%,specialization.ilike.%${trimmed}%`)
  } else {
    request = request.or(`name.ilike.%${trimmed}%`)
  }

  const { data, error } = await request.returns<CatalogRow[]>()

  if (error) {
    throw error
  }

  return ((data ?? []) as CatalogRow[]).map(mapCatalogItem)
}
