export type CompendiumTab = 'weapons' | 'armors' | 'items'

interface CompendiumWeaponAttribute {
  name: string
  description: string | null
}

export interface CompendiumWeapon {
  id: string
  name: string
  description: string | null
  encumbrance: number
  damageFormula: string
  attributes: CompendiumWeaponAttribute[]
}

export interface CompendiumArmor {
  id: string
  name: string
  description: string | null
  encumbrance: number
  armorPoints: number
  category: string
  coveredLocations: string[]
}

export interface CompendiumItem {
  id: string
  name: string
  description: string | null
  encumbrance: number
}

export interface CompendiumWeaponRow {
  id: string
  name: string
  description: string | null
  encumbrance: number
  damage_formula: string
  weapon_attribute_mappings?: Array<{
    weapon_attributes: { name: string; description: string | null } | null
  }> | null
}

export interface CompendiumArmorRow {
  id: string
  name: string
  description: string | null
  encumbrance: number
  armor_points: number
  category: string | null
  covered_locations: string[] | null
}

export interface CompendiumItemRow {
  id: string
  name: string
  description: string | null
  encumbrance: number
}
