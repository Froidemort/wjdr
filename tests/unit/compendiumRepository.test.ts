import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: { from: fromMock } }))

import * as repository from '../../src/services/compendiumRepository'

describe('compendiumRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('maps weapons with damage formula and sorted attributes', async () => {
    const builder = createSupabaseQueryBuilder({
      data: [
        {
          id: 'w1',
          name: 'Épée',
          description: null,
          encumbrance: 100,
          damage_formula: 'BF+4',
          weapon_attribute_mappings: [
            { weapon_attributes: { name: 'Parade', description: 'p' } },
            { weapon_attributes: { name: 'Équilibrée', description: null } },
            { weapon_attributes: null },
          ],
        },
      ],
      error: null,
    })
    fromMock.mockReturnValue(builder)

    const result = await repository.fetchCompendiumWeapons()

    expect(fromMock).toHaveBeenCalledWith('weapons')
    expect(builder.order).toHaveBeenCalledWith('name', { ascending: true })
    expect(result).toEqual([
      {
        id: 'w1',
        name: 'Épée',
        description: null,
        encumbrance: 100,
        damageFormula: 'BF+4',
        attributes: [
          { name: 'Équilibrée', description: null },
          { name: 'Parade', description: 'p' },
        ],
      },
    ])
  })

  it('maps armors and defaults missing category and locations', async () => {
    fromMock.mockReturnValue(
      createSupabaseQueryBuilder({
        data: [
          { id: 'a1', name: 'Cotte', description: 'd', encumbrance: 5, armor_points: 2, category: 'maille', covered_locations: ['corps'] },
          { id: 'a2', name: 'Casque', description: null, encumbrance: 1, armor_points: 1, category: null, covered_locations: null },
        ],
        error: null,
      })
    )

    const result = await repository.fetchCompendiumArmors()

    expect(fromMock).toHaveBeenCalledWith('armors')
    expect(result[0]).toMatchObject({ armorPoints: 2, category: 'maille', coveredLocations: ['corps'] })
    expect(result[1]).toMatchObject({ category: 'autre', coveredLocations: [] })
  })

  it('maps items', async () => {
    fromMock.mockReturnValue(
      createSupabaseQueryBuilder({
        data: [{ id: 'i1', name: 'Corde', description: null, encumbrance: 3 }],
        error: null,
      })
    )

    expect(await repository.fetchCompendiumItems()).toEqual([
      { id: 'i1', name: 'Corde', description: null, encumbrance: 3 },
    ])
    expect(fromMock).toHaveBeenCalledWith('items')
  })

  it('maps skills with sorted, deduplicated-null talent links', async () => {
    const builder = createSupabaseQueryBuilder({
      data: [
        {
          id: 's2',
          name: 'Soins',
          specialization: null,
          is_basic: false,
          stat_code: 'INT',
          description: null,
          skills_talents: null,
        },
        {
          id: 's1',
          name: 'Athlétisme',
          specialization: ' Course ',
          is_basic: true,
          stat_code: 'AG',
          description: 'd',
          skills_talents: [
            { talents: { id: 't2', name: 'Résistance', specialization: null } },
            { talents: null },
            { talents: { id: 't1', name: 'Ambidextre', specialization: null } },
          ],
        },
      ],
      error: null,
    })
    fromMock.mockReturnValue(builder)

    const result = await repository.fetchCompendiumSkills()

    expect(fromMock).toHaveBeenCalledWith('skills')
    expect(builder.range).toHaveBeenCalledWith(0, 999)
    expect(result.map((skill) => skill.id)).toEqual(['s1', 's2'])
    expect(result[0]).toMatchObject({
      slug: 'athletisme-course',
      specialization: 'Course',
      isBasic: true,
      statCode: 'AG',
      linkedTalents: [
        { id: 't1', slug: 'ambidextre', name: 'Ambidextre', specialization: null },
        { id: 't2', slug: 'resistance', name: 'Résistance', specialization: null },
      ],
    })
    expect(result[1]).toMatchObject({ description: null, linkedTalents: [] })
  })

  it('maps talents with linked skills', async () => {
    fromMock.mockReturnValue(
      createSupabaseQueryBuilder({
        data: [
          {
            id: 't1',
            name: 'Chance',
            specialization: null,
            description: 'x',
            skills_talents: [{ skills: { id: 's1', name: 'Jeu', specialization: 'Dés' } }],
          },
        ],
        error: null,
      })
    )

    const [talent] = await repository.fetchCompendiumTalents()

    expect(fromMock).toHaveBeenCalledWith('talents')
    expect(talent).toEqual({
      id: 't1',
      slug: 'chance',
      name: 'Chance',
      specialization: null,
      description: 'x',
      linkedSkills: [{ id: 's1', slug: 'jeu-des', name: 'Jeu', specialization: 'Dés' }],
    })
  })

  it('paginates until a short page is returned', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `t${index}`,
      name: `Talent ${index}`,
      specialization: null,
      description: null,
      skills_talents: [],
    }))
    const builder = createSupabaseQueryBuilder({ data: fullPage, error: null })
    builder.returns.mockResolvedValueOnce({ data: fullPage, error: null })
    builder.returns.mockResolvedValueOnce({
      data: [{ id: 'last', name: 'Zèle', specialization: null, description: null, skills_talents: [] }],
      error: null,
    })
    fromMock.mockReturnValue(builder)

    const result = await repository.fetchCompendiumTalents()

    expect(result).toHaveLength(1001)
    expect(builder.range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(builder.range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('maps spells, defaults null columns and sorts by name', async () => {
    const builder = createSupabaseQueryBuilder({
      data: [
        {
          id: 2,
          name: 'Zéphyr',
          category: null,
          difficulty: null,
          casting_time: null,
          range: null,
          duration: null,
          bonus_ingredient: null,
          bonus: null,
          description: null,
        },
        {
          id: 1,
          name: ' Boule de feu ',
          category: 'Feu',
          difficulty: 12,
          casting_time: '1 action',
          range: ' 12 m ',
          duration: '  ',
          bonus_ingredient: 'Soufre',
          bonus: 2,
          description: ' Brûle. ',
        },
      ],
      error: null,
    })
    fromMock.mockReturnValue(builder)

    const result = await repository.fetchCompendiumSpells()

    expect(fromMock).toHaveBeenCalledWith('spells')
    expect(builder.range).toHaveBeenCalledWith(0, 999)
    expect(result).toEqual([
      {
        id: '1',
        name: 'Boule de feu',
        category: 'Feu',
        difficulty: 12,
        castingTime: '1 action',
        range: '12 m',
        duration: null,
        bonusIngredient: 'Soufre',
        bonus: 2,
        description: 'Brûle.',
      },
      {
        id: '2',
        name: 'Zéphyr',
        category: 'Autre',
        difficulty: 0,
        castingTime: null,
        range: null,
        duration: null,
        bonusIngredient: null,
        bonus: null,
        description: null,
      },
    ])
  })

  it('paginates spells beyond 1000 rows', async () => {
    const row = (id: number) => ({
      id,
      name: `Sort ${id}`,
      category: 'Feu',
      difficulty: 5,
      casting_time: null,
      range: null,
      duration: null,
      bonus_ingredient: null,
      bonus: null,
      description: null,
    })
    const fullPage = Array.from({ length: 1000 }, (_, index) => row(index))
    const builder = createSupabaseQueryBuilder({ data: fullPage, error: null })
    builder.returns.mockResolvedValueOnce({ data: fullPage, error: null })
    builder.returns.mockResolvedValueOnce({ data: [row(1000)], error: null })
    fromMock.mockReturnValue(builder)

    const result = await repository.fetchCompendiumSpells()

    expect(result).toHaveLength(1001)
    expect(builder.range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('throws supabase errors when fetching spells', async () => {
    const error = new Error('boom')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(repository.fetchCompendiumSpells()).rejects.toBe(error)
  })

  it('throws supabase errors', async () => {
    const error = new Error('boom')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(repository.fetchCompendiumItems()).rejects.toBe(error)
  })

  it('is read-only', () => {
    expect(Object.keys(repository).sort()).toEqual([
      'fetchCompendiumArmors',
      'fetchCompendiumItems',
      'fetchCompendiumSkills',
      'fetchCompendiumSpells',
      'fetchCompendiumTalents',
      'fetchCompendiumWeapons',
    ])
  })
})
