import type { CharacterSkill, CharacterTalent } from '../types/domain'
import { formatNamedWithSpecialization, normalizeStatCode } from './characterSheet'

export interface LinkedTalentRef {
  id: string
  name: string
}

export interface LinkedTalentDetail extends LinkedTalentRef {
  description: string | null
}

// Owned talents linked to a skill, grouped by normalized characteristic code, deduplicated by talent id.
// Unowned talents are ignored, so removing a talent or a skill updates the result.
export function characterTalentReminders(
  skills: readonly CharacterSkill[],
  talents: readonly CharacterTalent[]
): Record<string, LinkedTalentRef[]> {
  const owned = new Map(talents.map((talent) => [talent.talentId, talent]))
  const result: Record<string, LinkedTalentRef[]> = {}

  for (const skill of skills) {
    const stat = normalizeStatCode(skill.statCode)
    for (const linked of skill.linkedTalents ?? []) {
      const talent = owned.get(linked.talentId)
      if (!talent) continue
      const refs = result[stat] ?? []
      if (refs.some((ref) => ref.id === talent.talentId)) continue
      refs.push({ id: talent.talentId, name: formatNamedWithSpecialization(talent.name, talent.specialization) })
      result[stat] = refs
    }
  }

  for (const refs of Object.values(result)) {
    refs.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
  return result
}

export function linkedTalentDetails(
  refs: readonly LinkedTalentRef[],
  talents: readonly CharacterTalent[]
): LinkedTalentDetail[] {
  const byId = new Map(talents.map((talent) => [talent.talentId, talent]))
  return refs.map((ref) => ({ ...ref, description: byId.get(ref.id)?.description ?? null }))
}
