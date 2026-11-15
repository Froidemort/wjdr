import { describe, expect, it } from 'vitest'
import type { CharacterSkill, CharacterTalent } from '../../src/types/domain'
import { characterTalentReminders, linkedTalentDetails } from '../../src/utils/characterTalentReminders'

const audition: CharacterTalent = {
  talentId: 'audition',
  name: 'Acuité auditive',
  specialization: null,
  description: 'Perception des sons +20%',
}

const orientation: CharacterTalent = {
  talentId: 'orientation',
  name: 'Sens de l’orientation',
  specialization: 'urbaine',
  description: null,
}

const perceptionSkill: CharacterSkill = {
  skillId: 'perception',
  name: 'Perception',
  statCode: 'Int',
  specialization: null,
  description: null,
  masteryLevel: 1,
  isBasic: true,
  linkedTalents: [audition],
}

describe('characterTalentReminders', () => {
  it('groups owned talents by normalized characteristic code', () => {
    const reminders = characterTalentReminders([perceptionSkill], [audition])
    expect(reminders).toEqual({ INT: [{ id: 'audition', name: 'Acuité auditive' }] })
  })

  it('deduplicates the same talent across multiple linking skills', () => {
    const otherSkill: CharacterSkill = {
      ...perceptionSkill,
      skillId: 'ouie',
      name: 'Ouïe fine',
    }
    const reminders = characterTalentReminders([perceptionSkill, otherSkill], [audition])
    expect(reminders.INT).toHaveLength(1)
  })

  it('formats the talent name with its specialization', () => {
    const skill: CharacterSkill = {
      ...perceptionSkill,
      skillId: 'orientation-skill',
      linkedTalents: [orientation],
    }
    const reminders = characterTalentReminders([skill], [orientation])
    expect(reminders.INT).toEqual([{ id: 'orientation', name: 'Sens de l’orientation (urbaine)' }])
  })

  it('ignores unowned talents', () => {
    expect(characterTalentReminders([perceptionSkill], [])).toEqual({})
  })

  it('updates when the linking skill is removed', () => {
    expect(characterTalentReminders([], [audition])).toEqual({})
  })

  it('ignores skills without linked talents', () => {
    const skillWithoutLink: CharacterSkill = { ...perceptionSkill, linkedTalents: [] }
    expect(characterTalentReminders([skillWithoutLink], [audition])).toEqual({})
  })

  it('merges stat codes that differ only by case or surrounding whitespace', () => {
    const skillLower: CharacterSkill = { ...perceptionSkill, skillId: 'lower', statCode: 'int' }
    const skillPadded: CharacterSkill = { ...perceptionSkill, skillId: 'padded', statCode: ' INT ' }
    const skillUpper: CharacterSkill = { ...perceptionSkill, skillId: 'upper', statCode: 'INT' }
    const reminders = characterTalentReminders([skillLower, skillPadded, skillUpper], [audition])
    expect(Object.keys(reminders)).toEqual(['INT'])
    expect(reminders.INT).toEqual([{ id: 'audition', name: 'Acuité auditive' }])
  })

  it('lists the same talent under each stat key when linked from skills on different stats', () => {
    const intSkill: CharacterSkill = { ...perceptionSkill, skillId: 'int-skill', statCode: 'Int' }
    const agiSkill: CharacterSkill = { ...perceptionSkill, skillId: 'agi-skill', statCode: 'Agi' }
    const reminders = characterTalentReminders([intSkill, agiSkill], [audition])
    expect(reminders.INT).toEqual([{ id: 'audition', name: 'Acuité auditive' }])
    expect(reminders.AGI).toEqual([{ id: 'audition', name: 'Acuité auditive' }])
  })

  it('sorts talent names alphabetically within a characteristic', () => {
    const skill: CharacterSkill = {
      ...perceptionSkill,
      linkedTalents: [audition, orientation],
    }
    const reminders = characterTalentReminders([skill], [audition, orientation])
    expect(reminders.INT.map((ref) => ref.name)).toEqual(['Acuité auditive', 'Sens de l’orientation (urbaine)'])
  })
})

describe('linkedTalentDetails', () => {
  it('attaches the talent description to each reference', () => {
    const details = linkedTalentDetails([{ id: 'audition', name: 'Acuité auditive' }], [audition])
    expect(details).toEqual([{ id: 'audition', name: 'Acuité auditive', description: 'Perception des sons +20%' }])
  })

  it('falls back to null when the talent is missing', () => {
    const details = linkedTalentDetails([{ id: 'unknown', name: 'Inconnu' }], [audition])
    expect(details).toEqual([{ id: 'unknown', name: 'Inconnu', description: null }])
  })
})
