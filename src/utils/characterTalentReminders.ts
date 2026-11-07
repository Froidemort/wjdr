import type { CharacterSkill, CharacterTalent } from '../types/domain'
import { formatNamedWithSpecialization, normalizeStatCode } from './characterSheet'

export interface TalentReminder {
  talent: CharacterTalent
  skills: string[]
}

export function characterTalentReminders(
  skills: readonly CharacterSkill[],
  talents: readonly CharacterTalent[]
): Map<string, TalentReminder[]> {
  const owned = new Map(talents.map((talent) => [talent.talentId, talent]))
  const grouped = new Map<string, Map<string, TalentReminder>>()

  for (const skill of skills) {
    const stat = normalizeStatCode(skill.statCode)
    const skillName = formatNamedWithSpecialization(skill.name, skill.specialization)
    for (const linked of skill.linkedTalents ?? []) {
      const talent = owned.get(linked.talentId)
      if (!talent) continue
      const byTalent = grouped.get(stat) ?? new Map<string, TalentReminder>()
      const reminder = byTalent.get(talent.talentId) ?? { talent, skills: [] }
      if (!reminder.skills.includes(skillName)) reminder.skills.push(skillName)
      byTalent.set(talent.talentId, reminder)
      grouped.set(stat, byTalent)
    }
  }

  return new Map(
    [...grouped].map(([stat, reminders]) => [
      stat,
      [...reminders.values()].sort((a, b) => a.talent.name.localeCompare(b.talent.name, 'fr')),
    ])
  )
}
