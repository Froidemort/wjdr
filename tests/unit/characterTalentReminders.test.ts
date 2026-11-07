import { describe, expect, it } from 'vitest'
import type { CharacterSkill, CharacterTalent } from '../../src/types/domain'
import { characterTalentReminders } from '../../src/utils/characterTalentReminders'

const talent: CharacterTalent = {
  talentId: 'audition', name: 'Acuité auditive', specialization: null,
  description: 'Perception des sons +20%',
}
const skill: CharacterSkill = {
  skillId: 'perception', name: 'Perception', statCode: 'Int', specialization: null,
  description: null, masteryLevel: 1, isBasic: true, linkedTalents: [talent],
}

describe('characterTalentReminders', () => {
  it('groups owned talents by characteristic without changing their descriptions', () => {
    const reminders = characterTalentReminders([skill], [talent])
    expect(reminders.get('INT')).toEqual([{ talent, skills: ['Perception'] }])
    expect(reminders.has('F')).toBe(false)
  })

  it('deduplicates talents and includes all linked skills and specializations', () => {
    const second = { ...skill, skillId: 'autre', name: 'Orientation', specialization: 'urbaine', statCode: 'INT' }
    const reminders = characterTalentReminders([skill, skill, second], [talent])
    expect(reminders.get('INT')).toEqual([{ talent, skills: ['Perception', 'Orientation (urbaine)'] }])
  })

  it('omits unowned talents and updates when skills or talents are removed', () => {
    expect(characterTalentReminders([skill], []).size).toBe(0)
    expect(characterTalentReminders([], [talent]).size).toBe(0)
    expect(characterTalentReminders([{ ...skill, linkedTalents: [] }], [talent]).size).toBe(0)
  })

  it('keeps the same talent under each related characteristic', () => {
    const second = { ...skill, skillId: 'soc', statCode: 'Soc' }
    const reminders = characterTalentReminders([skill, second], [talent])
    expect([...reminders.keys()]).toEqual(['INT', 'SOC'])
  })
})
