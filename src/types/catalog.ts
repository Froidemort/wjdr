export type CatalogTableName = 'careers' | 'skills' | 'talents' | 'weapons' | 'armors' | 'items'

export interface CatalogItem {
  id: string
  name: string
  specialization?: string | null
  description: string | null
  encumbrance?: number | null
  damageFormula?: string | null
  armorPoints?: number | null
}

export interface CatalogRow {
  id: string
  name: string
  specialization?: string | null
  description?: string | null
  encumbrance?: number | null
  damage_formula?: string | null
  armor_points?: number | null
}

export interface CreateCatalogItemInput {
  name: string
  description: string | null
  encumbrance: number
}
