import { supabase } from '../db/supabase'
import type { CharacterArmor, CharacterItem, CharacterSkill, CharacterTalent, CharacterWeapon } from '../types/domain'

interface SkillLinkRow {
  skill_id: string
  mastery_level: 1 | 2 | 3
  skills?: {
    id: string
    name: string
    stat_code: string
    specialization: string | null
    description: string | null
    is_basic: boolean
  } | Array<{
    id: string
    name: string
    stat_code: string
    specialization: string | null
    description: string | null
    is_basic: boolean
  }> | null
}

interface TalentLinkRow {
  talent_id: string
  talents?: {
    id: string
    name: string
    specialization: string | null
    description: string | null
  } | Array<{
    id: string
    name: string
    specialization: string | null
    description: string | null
  }> | null
}

interface WeaponLinkRow {
  id: string
  weapon_id: string
  equiped: 'droite' | 'gauche' | 'd&g' | null
  weapons?: {
    id: string
    name: string
    description: string | null
    quality: string | null
    encumbrance: number
    damage_formula: string
  } | Array<{
    id: string
    name: string
    description: string | null
    quality: string | null
    encumbrance: number
    damage_formula: string
  }> | null
}

interface ArmorLinkRow {
  id: string
  armor_id: string
  is_equipped: boolean
  armors?: {
    id: string
    name: string
    description: string | null
    covered_locations?: string[] | null
    quality: string | null
    encumbrance: number
    armor_points: number
  } | Array<{
    id: string
    name: string
    description: string | null
    covered_locations?: string[] | null
    quality: string | null
    encumbrance: number
    armor_points: number
  }> | null
}

interface ItemLinkRow {
  id: string
  item_id: string
  quantity: number
  items?: {
    id: string
    name: string
    description: string | null
    quality: string | null
    encumbrance: number
  } | Array<{
    id: string
    name: string
    description: string | null
    quality: string | null
    encumbrance: number
  }> | null
}

function unwrapRelated<T>(value: T | T[] | null | undefined): T | undefined {
  if (!value) {
    return undefined
  }

  return Array.isArray(value) ? value[0] : value
}

export async function listCharacterSkills(characterId: string): Promise<CharacterSkill[]> {
  const { data, error } = await supabase
    .from('character_skills')
    .select('skill_id, mastery_level, skills!inner(id, name, stat_code, specialization, description, is_basic)')
    .eq('character_id', characterId)
    .order('name', { ascending: true, referencedTable: 'skills' })

  if (error) {
    throw error
  }

  return ((data ?? []) as SkillLinkRow[]).map((row) => {
    const skill = unwrapRelated(row.skills)
    return {
    skillId: row.skill_id,
    name: skill?.name ?? 'Compétence inconnue',
    statCode: skill?.stat_code ?? 'INT',
    specialization: skill?.specialization ?? null,
    description: skill?.description ?? null,
    masteryLevel: row.mastery_level,
    isBasic: Boolean(skill?.is_basic)
    }
  })
}

export async function addCharacterSkills(characterId: string, skillIds: string[]): Promise<void> {
  const uniqueSkillIds = Array.from(new Set(skillIds.filter(Boolean)))
  if (uniqueSkillIds.length === 0) {
    return
  }

  const rows = uniqueSkillIds.map((skillId) => ({
    character_id: characterId,
    skill_id: skillId,
    mastery_level: 1
  }))

  const { error } = await supabase
    .from('character_skills')
    .upsert(rows, { onConflict: 'character_id,skill_id', ignoreDuplicates: true })

  if (error) {
    throw error
  }
}

export async function updateCharacterSkillMastery(characterId: string, skillId: string, masteryLevel: 1 | 2 | 3): Promise<void> {
  const { error } = await supabase
    .from('character_skills')
    .update({ mastery_level: masteryLevel })
    .eq('character_id', characterId)
    .eq('skill_id', skillId)

  if (error) {
    throw error
  }
}

export async function removeCharacterSkill(characterId: string, skillId: string): Promise<void> {
  const { error } = await supabase
    .from('character_skills')
    .delete()
    .eq('character_id', characterId)
    .eq('skill_id', skillId)

  if (error) {
    throw error
  }
}

export async function listCharacterTalents(characterId: string): Promise<CharacterTalent[]> {
  const { data, error } = await supabase
    .from('character_talents')
    .select('talent_id, talents!inner(id, name, specialization, description)')
    .eq('character_id', characterId)
    .order('name', { ascending: true, referencedTable: 'talents' })

  if (error) {
    throw error
  }

  return ((data ?? []) as TalentLinkRow[]).map((row) => {
    const talent = unwrapRelated(row.talents)
    return {
    talentId: row.talent_id,
    name: talent?.name ?? 'Talent inconnu',
    specialization: talent?.specialization ?? null,
    description: talent?.description ?? null
    }
  })
}

export async function addCharacterTalents(characterId: string, talentIds: string[]): Promise<void> {
  const uniqueTalentIds = Array.from(new Set(talentIds.filter(Boolean)))
  if (uniqueTalentIds.length === 0) {
    return
  }

  const rows = uniqueTalentIds.map((talentId) => ({
    character_id: characterId,
    talent_id: talentId
  }))

  const { error } = await supabase
    .from('character_talents')
    .upsert(rows, { onConflict: 'character_id,talent_id', ignoreDuplicates: true })

  if (error) {
    throw error
  }
}

export async function removeCharacterTalent(characterId: string, talentId: string): Promise<void> {
  const { error } = await supabase
    .from('character_talents')
    .delete()
    .eq('character_id', characterId)
    .eq('talent_id', talentId)

  if (error) {
    throw error
  }
}

export async function listCharacterWeapons(characterId: string): Promise<CharacterWeapon[]> {
  const { data, error } = await supabase
    .from('character_weapons')
    .select('id, weapon_id, equiped, weapons!inner(id, name, description, quality, encumbrance, damage_formula)')
    .eq('character_id', characterId)
    .order('name', { ascending: true, referencedTable: 'weapons' })

  if (error) {
    throw error
  }

  return ((data ?? []) as WeaponLinkRow[]).map((row) => {
    const weapon = unwrapRelated(row.weapons)
    return {
      id: row.id,
      weaponId: row.weapon_id,
      name: weapon?.name ?? 'Arme inconnue',
      description: weapon?.description ?? null,
      equipped: row.equiped,
      quality: weapon?.quality ?? null,
      encumbrance: weapon?.encumbrance ?? 0,
      damageFormula: weapon?.damage_formula ?? null
    }
  })
}

export async function addCharacterWeapons(characterId: string, weaponIds: string[]): Promise<void> {
  const filteredWeaponIds = weaponIds.filter(Boolean)
  if (filteredWeaponIds.length === 0) {
    return
  }

  const rows = filteredWeaponIds.map((weaponId) => ({
    character_id: characterId,
    weapon_id: weaponId
  }))

  const { error } = await supabase
    .from('character_weapons')
    .insert(rows)

  if (error) {
    throw error
  }
}

export async function removeCharacterWeapon(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('character_weapons')
    .delete()
    .eq('id', linkId)

  if (error) {
    throw error
  }
}

export async function updateCharacterWeaponEquipped(linkId: string, equipped: 'droite' | 'gauche' | 'd&g' | null): Promise<void> {
  const { error } = await supabase
    .from('character_weapons')
    .update({ equiped: equipped })
    .eq('id', linkId)

  if (error) {
    throw error
  }
}

export async function listCharacterArmors(characterId: string): Promise<CharacterArmor[]> {
  const { data, error } = await supabase
    .from('character_armors')
    .select('id, armor_id, is_equipped, armors!inner(id, name, description, covered_locations, quality, encumbrance, armor_points)')
    .eq('character_id', characterId)
    .order('name', { ascending: true, referencedTable: 'armors' })

  if (error) {
    throw error
  }

  return ((data ?? []) as ArmorLinkRow[]).map((row) => {
    const armor = unwrapRelated(row.armors)
    return {
      id: row.id,
      armorId: row.armor_id,
      name: armor?.name ?? 'Armure inconnue',
      description: armor?.description ?? null,
      isEquipped: row.is_equipped,
      coveredLocations: armor?.covered_locations ?? null,
      quality: armor?.quality ?? null,
      encumbrance: armor?.encumbrance ?? 0,
      armorPoints: armor?.armor_points ?? 0
    }
  })
}

export async function addCharacterArmors(characterId: string, armorIds: string[]): Promise<void> {
  const filteredArmorIds = armorIds.filter(Boolean)
  if (filteredArmorIds.length === 0) {
    return
  }

  const rows = filteredArmorIds.map((armorId) => ({
    character_id: characterId,
    armor_id: armorId,
    is_equipped: false
  }))

  const { error } = await supabase
    .from('character_armors')
    .insert(rows)

  if (error) {
    throw error
  }
}

export async function removeCharacterArmor(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('character_armors')
    .delete()
    .eq('id', linkId)

  if (error) {
    throw error
  }
}

export async function updateCharacterArmorEquipped(linkId: string, isEquipped: boolean): Promise<void> {
  const { error } = await supabase
    .from('character_armors')
    .update({ is_equipped: isEquipped })
    .eq('id', linkId)

  if (error) {
    throw error
  }
}

export async function listCharacterItems(characterId: string): Promise<CharacterItem[]> {
  const { data, error } = await supabase
    .from('character_items')
    .select('id, item_id, quantity, items!inner(id, name, description, quality, encumbrance)')
    .eq('character_id', characterId)
    .order('name', { ascending: true, referencedTable: 'items' })

  if (error) {
    throw error
  }

  return ((data ?? []) as ItemLinkRow[]).map((row) => {
    const item = unwrapRelated(row.items)
    return {
      id: row.id,
      itemId: row.item_id,
      name: item?.name ?? 'Équipement inconnu',
      description: item?.description ?? null,
      quality: item?.quality ?? null,
      encumbrance: item?.encumbrance ?? 0,
      quantity: row.quantity ?? 1
    }
  })
}

export async function addCharacterItems(characterId: string, itemIds: string[]): Promise<void> {
  const filteredItemIds = itemIds.filter(Boolean)
  if (filteredItemIds.length === 0) {
    return
  }

  const rows = filteredItemIds.map((itemId) => ({
    character_id: characterId,
    item_id: itemId,
    quantity: 1
  }))

  const { error } = await supabase
    .from('character_items')
    .insert(rows)

  if (error) {
    throw error
  }
}

export async function removeCharacterItem(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('character_items')
    .delete()
    .eq('id', linkId)

  if (error) {
    throw error
  }
}
