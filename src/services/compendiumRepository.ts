import { supabase } from '../db/supabase'
import { slugify } from '../utils/slugify'
import type {
  CompendiumArmor,
  CompendiumArmorRow,
  CompendiumItem,
  CompendiumItemRow,
  CompendiumLink,
  CompendiumSkill,
  CompendiumSkillRow,
  CompendiumTalent,
  CompendiumTalentRow,
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

const SKILL_SELECT =
  'id, name, specialization, is_basic, stat_code, description, skills_talents(talents(id, name, specialization))'
const TALENT_SELECT =
  'id, name, specialization, description, skills_talents(skills(id, name, specialization))'
// PostgREST caps responses at 1000 rows by default.
const PAGE_SIZE = 1000

function compareByName(
  a: { name: string; specialization: string | null },
  b: { name: string; specialization: string | null }
): number {
  return (
    a.name.localeCompare(b.name, 'fr') ||
    (a.specialization ?? '').localeCompare(b.specialization ?? '', 'fr')
  )
}

function mapLink(row: { id: string; name: string; specialization: string | null }): CompendiumLink {
  const specialization = row.specialization?.trim() || null
  return {
    id: row.id,
    slug: slugify(specialization ? `${row.name} ${specialization}` : row.name),
    name: row.name,
    specialization,
  }
}

function mapLinks(
  rows: Array<{ id: string; name: string; specialization: string | null } | null>
): CompendiumLink[] {
  return rows
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map(mapLink)
    .sort(compareByName)
}

function mapSkill(row: CompendiumSkillRow): CompendiumSkill {
  return {
    ...mapLink(row),
    isBasic: row.is_basic,
    statCode: row.stat_code,
    description: row.description ?? null,
    linkedTalents: mapLinks((row.skills_talents ?? []).map((link) => link.talents)),
  }
}

function mapTalent(row: CompendiumTalentRow): CompendiumTalent {
  return {
    ...mapLink(row),
    description: row.description ?? null,
    linkedSkills: mapLinks((row.skills_talents ?? []).map((link) => link.skills)),
  }
}

async function fetchAllRows<Row>(table: 'skills' | 'talents', select: string): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<Row[]>()

    if (error) throw error

    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

export async function fetchCompendiumSkills(): Promise<CompendiumSkill[]> {
  const rows = await fetchAllRows<CompendiumSkillRow>('skills', SKILL_SELECT)
  return rows.map(mapSkill).sort(compareByName)
}

export async function fetchCompendiumTalents(): Promise<CompendiumTalent[]> {
  const rows = await fetchAllRows<CompendiumTalentRow>('talents', TALENT_SELECT)
  return rows.map(mapTalent).sort(compareByName)
}
