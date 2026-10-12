import { supabase } from '../db/supabase'
import type {
  CompendiumArmor,
  CompendiumArmorRow,
  CompendiumItem,
  CompendiumItemRow,
  CompendiumWeapon,
  CompendiumWeaponRow,
} from '../types/compendium'

const WEAPON_SELECT =
  'id, name, description, encumbrance, damage_formula, weapon_attribute_mappings(weapon_attributes(name, description))'
const ARMOR_SELECT = 'id, name, description, encumbrance, armor_points, category, covered_locations'
const ITEM_SELECT = 'id, name, description, encumbrance'

function mapWeapon(row: CompendiumWeaponRow): CompendiumWeapon {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    encumbrance: row.encumbrance,
    damageFormula: row.damage_formula,
    attributes: (row.weapon_attribute_mappings ?? [])
      .map((mapping) => mapping.weapon_attributes)
      .filter((attribute): attribute is NonNullable<typeof attribute> => attribute !== null)
      .map((attribute) => ({ name: attribute.name, description: attribute.description ?? null }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
  }
}

function mapArmor(row: CompendiumArmorRow): CompendiumArmor {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    encumbrance: row.encumbrance,
    armorPoints: row.armor_points,
    category: row.category ?? 'autre',
    coveredLocations: row.covered_locations ?? [],
  }
}

function mapItem(row: CompendiumItemRow): CompendiumItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    encumbrance: row.encumbrance,
  }
}

export async function fetchCompendiumWeapons(): Promise<CompendiumWeapon[]> {
  const { data, error } = await supabase
    .from('weapons')
    .select(WEAPON_SELECT)
    .order('name', { ascending: true })
    .returns<CompendiumWeaponRow[]>()

  if (error) throw error

  return (data ?? []).map(mapWeapon)
}

export async function fetchCompendiumArmors(): Promise<CompendiumArmor[]> {
  const { data, error } = await supabase
    .from('armors')
    .select(ARMOR_SELECT)
    .order('name', { ascending: true })
    .returns<CompendiumArmorRow[]>()

  if (error) throw error

  return (data ?? []).map(mapArmor)
}

export async function fetchCompendiumItems(): Promise<CompendiumItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_SELECT)
    .order('name', { ascending: true })
    .returns<CompendiumItemRow[]>()

  if (error) throw error

  return (data ?? []).map(mapItem)
}
