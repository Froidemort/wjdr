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

  it('throws supabase errors', async () => {
    const error = new Error('boom')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(repository.fetchCompendiumItems()).rejects.toBe(error)
  })

  it('is read-only', () => {
    expect(Object.keys(repository).sort()).toEqual([
      'fetchCompendiumArmors',
      'fetchCompendiumItems',
      'fetchCompendiumWeapons',
    ])
  })
})
