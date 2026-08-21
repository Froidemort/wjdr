import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { listCharacterLinksBundle, listCharacterWeapons } from '../../src/services/characterLinksRepository'

describe('characterLinksRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('keeps only talents linked to the character skills in the bundle', async () => {
    const skillsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    const talentsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    const skillTalentBuilder = {
      select: vi.fn(),
      in: vi.fn(),
    }

    const weaponsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    const armorsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    const itemsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    skillsBuilder.select.mockReturnValue(skillsBuilder)
    skillsBuilder.eq.mockReturnValue(skillsBuilder)
    skillsBuilder.order.mockResolvedValue({
      data: [
        {
          skill_id: 'skill-1',
          mastery_level: 2,
          skills: {
            id: 'skill-1',
            name: 'Athlétisme',
            stat_code: 'F',
            specialization: null,
            description: null,
            is_basic: false,
          },
        },
        {
          skill_id: 'skill-2',
          mastery_level: 1,
          skills: {
            id: 'skill-2',
            name: 'Connaissances des pièges',
            stat_code: 'INT',
            specialization: null,
            description: null,
            is_basic: false,
          },
        },
      ],
      error: null,
    })

    talentsBuilder.select.mockReturnValue(talentsBuilder)
    talentsBuilder.eq.mockReturnValue(talentsBuilder)
    talentsBuilder.order.mockResolvedValue({
      data: [
        {
          talent_id: 'talent-1',
          talents: {
            id: 'talent-1',
            name: 'Acrobate',
            specialization: null,
            description: null,
          },
        },
        {
          talent_id: 'talent-2',
          talents: {
            id: 'talent-2',
            name: 'Pistage',
            specialization: null,
            description: null,
          },
        },
        {
          talent_id: 'talent-3',
          talents: {
            id: 'talent-3',
            name: 'Coup de poing',
            specialization: null,
            description: null,
          },
        },
      ],
      error: null,
    })

    skillTalentBuilder.select.mockReturnValue(skillTalentBuilder)
    skillTalentBuilder.in.mockResolvedValue({
      data: [
        { skill_id: 'skill-1', talent_id: 'talent-1' },
        { skill_id: 'skill-1', talent_id: 'talent-3' },
        { skill_id: 'skill-2', talent_id: 'talent-2' },
      ],
      error: null,
    })

    weaponsBuilder.select.mockReturnValue(weaponsBuilder)
    weaponsBuilder.eq.mockReturnValue(weaponsBuilder)
    weaponsBuilder.order.mockResolvedValue({ data: [], error: null })

    armorsBuilder.select.mockReturnValue(armorsBuilder)
    armorsBuilder.eq.mockReturnValue(armorsBuilder)
    armorsBuilder.order.mockResolvedValue({ data: [], error: null })

    itemsBuilder.select.mockReturnValue(itemsBuilder)
    itemsBuilder.eq.mockReturnValue(itemsBuilder)
    itemsBuilder.order.mockResolvedValue({ data: [], error: null })

    fromMock.mockImplementation((table: string) => {
      if (table === 'character_skills') {
        return skillsBuilder
      }
      if (table === 'character_talents') {
        return talentsBuilder
      }
      if (table === 'skills_talents') {
        return skillTalentBuilder
      }
      if (table === 'character_weapons') {
        return weaponsBuilder
      }
      if (table === 'character_armors') {
        return armorsBuilder
      }
      if (table === 'character_items') {
        return itemsBuilder
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const result = await listCharacterLinksBundle('character-1')

    expect(result.skills.map((skill) => skill.skillId)).toEqual(['skill-1', 'skill-2'])
    expect(result.skills[0].linkedTalents?.map((talent) => talent.talentId)).toEqual([
      'talent-1',
      'talent-3',
    ])
    expect(result.skills[1].linkedTalents?.map((talent) => talent.talentId)).toEqual(['talent-2'])
  })

  it('maps and sorts weapon attributes from weapon mappings', async () => {
    const weaponsBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }

    weaponsBuilder.select.mockReturnValue(weaponsBuilder)
    weaponsBuilder.eq.mockReturnValue(weaponsBuilder)
    weaponsBuilder.order.mockResolvedValue({
      data: [
        {
          id: 'link-1',
          weapon_id: 'weapon-1',
          quality: 'normal',
          equiped: null,
          weapons: {
            id: 'weapon-1',
            name: 'Épée longue',
            description: null,
            encumbrance: 2,
            damage_formula: '+5',
            weapon_attribute_mappings: [
              {
                attribute_id: 'attr-2',
                weapon_attributes: {
                  id: 'attr-2',
                  name: 'Rapide',
                  description: null,
                },
              },
              {
                attribute_id: 'attr-1',
                weapon_attributes: {
                  id: 'attr-1',
                  name: 'Défensive',
                  description: null,
                },
              },
              {
                attribute_id: 'attr-1',
                weapon_attributes: {
                  id: 'attr-1',
                  name: 'Défensive',
                  description: null,
                },
              },
            ],
          },
        },
        {
          id: 'link-2',
          weapon_id: 'weapon-2',
          quality: 'bonne',
          equiped: 'droite',
          weapons: {
            id: 'weapon-2',
            name: 'Arc court',
            description: null,
            encumbrance: 1,
            damage_formula: '+3',
            weapon_attribute_mappings: null,
          },
        },
      ],
      error: null,
    })

    fromMock.mockImplementation((table: string) => {
      if (table === 'character_weapons') {
        return weaponsBuilder
      }

      throw new Error(`Unexpected table ${table}`)
    })

    const result = await listCharacterWeapons('character-1')

    expect(result).toHaveLength(2)
    expect(result[0].attributes.map((attribute) => attribute.name)).toEqual(['Défensive', 'Rapide'])
    expect(result[1].attributes).toEqual([])
  })
})
