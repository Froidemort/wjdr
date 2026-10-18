import { describe, expect, it } from 'vitest'
import type {
  CharacterArmor,
  CharacterItem,
  CharacterSkill,
  CharacterStatValue,
  CharacterTalent,
  CharacterWeapon,
} from '../../src/types/domain'
import {
  buildCharacterTableHighlights,
  computeMaxEncumbrance,
  computeTotalEncumbrance,
  formatMoney,
  formatNamedWithSpecialization,
  getStatTotal,
  sortStatsByCharacteristicOrder,
} from '../../src/utils/characterSheet'

function stat(statCode: string, baseValue: number, currentAdvanced = 0): CharacterStatValue {
  return { statCode, baseValue, currentAdvanced, totalAdvanced: 0, isSecondary: false }
}

function weapon(overrides: Partial<CharacterWeapon>): CharacterWeapon {
  return {
    id: 'w', weaponId: 'w', name: 'Épée', description: null, equipped: null,
    quality: 'normal', encumbrance: 1, damageFormula: null, attributes: [], ...overrides,
  }
}

function armor(overrides: Partial<CharacterArmor>): CharacterArmor {
  return {
    id: 'a', armorId: 'a', name: 'Cotte', description: null, isEquipped: false,
    quality: 'normal', encumbrance: 2, armorPoints: 1, ...overrides,
  }
}

function item(overrides: Partial<CharacterItem>): CharacterItem {
  return {
    id: 'i', itemId: 'i', name: 'Corde', description: null, quality: 'normal',
    encumbrance: 1, quantity: 1, ...overrides,
  }
}

function skill(overrides: Partial<CharacterSkill>): CharacterSkill {
  return {
    skillId: 's', name: 'Athlétisme', statCode: 'AG', specialization: null,
    description: null, masteryLevel: 1, isBasic: true, ...overrides,
  }
}

function talent(overrides: Partial<CharacterTalent>): CharacterTalent {
  return { talentId: 't', name: 'Acrobate', specialization: null, description: null, ...overrides }
}

describe('characterSheet', () => {
  it('sorts characteristics in sheet order and unknown codes last', () => {
    const sorted = sortStatsByCharacteristicOrder([stat('zz', 1), stat('E', 1), stat('cc', 1), stat('B', 1)])
    expect(sorted.map((entry) => entry.statCode)).toEqual(['cc', 'E', 'B', 'zz'])
  })

  it('computes stat totals ignoring case and defaulting to 0', () => {
    expect(getStatTotal([stat('f', 30, 5)], 'F')).toBe(35)
    expect(getStatTotal([], 'F')).toBe(0)
  })

  it('derives max encumbrance from Force and race', () => {
    const stats = [stat('F', 30)]
    expect(computeMaxEncumbrance('humain', stats)).toBe(300)
    expect(computeMaxEncumbrance('nain', stats)).toBe(600)
  })

  it('sums encumbrance with item quantities', () => {
    expect(
      computeTotalEncumbrance({
        weapons: [weapon({ encumbrance: 3 })],
        armors: [armor({ encumbrance: 4 })],
        items: [item({ encumbrance: 2, quantity: 3 }), item({ encumbrance: 1, quantity: 0 })],
      })
    ).toBe(3 + 4 + 6 + 1)
  })

  it('builds table highlights: main stats, equipped gear, ranked skills, capped lists', () => {
    const skills = Array.from({ length: 8 }, (_, index) =>
      skill({ skillId: `s${index}`, name: `Skill ${index}`, masteryLevel: index === 7 ? 3 : 1 })
    )
    const talents = Array.from({ length: 7 }, (_, index) => talent({ talentId: `t${index}`, name: `Talent ${index}` }))

    const highlights = buildCharacterTableHighlights({
      race: 'humain',
      stats: [stat('F', 30), stat('MAG', 1), stat('CC', 40), stat('B', 12)],
      links: {
        skills,
        talents,
        weapons: [weapon({ id: 'eq', equipped: 'droite' }), weapon({ id: 'bag', equipped: null })],
        armors: [armor({ id: 'on', isEquipped: true }), armor({ id: 'off', isEquipped: false })],
        items: [item({ encumbrance: 5 })],
      },
    })

    expect(highlights.mainStats).toEqual([
      { statCode: 'CC', value: 40 },
      { statCode: 'F', value: 30 },
    ])
    expect(highlights.equippedWeapons.map((entry) => entry.id)).toEqual(['eq'])
    expect(highlights.equippedArmors.map((entry) => entry.id)).toEqual(['on'])
    expect(highlights.skills).toHaveLength(6)
    expect(highlights.skills[0].skillId).toBe('s7')
    expect(highlights.hiddenSkillCount).toBe(2)
    expect(highlights.talents).toHaveLength(6)
    expect(highlights.hiddenTalentCount).toBe(1)
    expect(highlights.totalEncumbrance).toBe(1 + 1 + 2 + 2 + 5)
    expect(highlights.maxEncumbrance).toBe(300)
  })

  it('formats names and money', () => {
    expect(formatNamedWithSpecialization('Savoir', ' Empire ')).toBe('Savoir (Empire)')
    expect(formatNamedWithSpecialization('Savoir', null)).toBe('Savoir')
    expect(formatMoney(1, 2, 3)).toBe('1 CO · 2 PA · 3 S')
  })
})
