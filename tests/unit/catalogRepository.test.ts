import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { createCatalogItem, searchCatalog } from '../../src/services/catalogRepository'

describe('searchCatalog', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns empty array and skips query when search is empty', async () => {
    const result = await searchCatalog('weapons', '   ')

    expect(result).toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('uses ilike on name for weapons/armors/items', async () => {
    const builder = createSupabaseQueryBuilder({ data: [
      {
        id: 'w1',
        name: 'Epee',
        description: 'Lame',
        encumbrance: 1,
        damage_formula: 'BF+1',
      },
    ], error: null })
    fromMock.mockReturnValue(builder)

    const result = await searchCatalog('weapons', 'epee')

    expect(fromMock).toHaveBeenCalledWith('weapons')
    expect(builder.ilike).toHaveBeenCalledWith('name', '%epee%')
    expect(builder.or).not.toHaveBeenCalled()
    expect(result).toEqual([
      {
        id: 'w1',
        name: 'Epee',
        specialization: null,
        description: 'Lame',
        encumbrance: 1,
        damageFormula: 'BF+1',
        armorPoints: null,
      },
    ])
  })

  it('uses OR name/specialization for skills and talents', async () => {
    const builder = createSupabaseQueryBuilder({ data: [
      { id: 's1', name: 'Athletisme', specialization: 'Escalade', description: null },
    ], error: null })
    fromMock.mockReturnValue(builder)

    await searchCatalog('skills', 'ath')

    expect(fromMock).toHaveBeenCalledWith('skills')
    expect(builder.or).toHaveBeenCalledWith('name.ilike.%ath%,specialization.ilike.%ath%')
    expect(builder.ilike).not.toHaveBeenCalled()
  })

  it('maps armor metadata fields for armors', async () => {
    const builder = createSupabaseQueryBuilder({ data: [
      {
        id: 'a1',
        name: 'Armure de cuir',
        description: 'Protection legere',
        encumbrance: 2,
        armor_points: 1,
      },
    ], error: null })
    fromMock.mockReturnValue(builder)

    const result = await searchCatalog('armors', 'cuir')

    expect(fromMock).toHaveBeenCalledWith('armors')
    expect(builder.ilike).toHaveBeenCalledWith('name', '%cuir%')
    expect(result).toEqual([
      {
        id: 'a1',
        name: 'Armure de cuir',
        specialization: null,
        description: 'Protection legere',
        encumbrance: 2,
        damageFormula: null,
        armorPoints: 1,
      },
    ])
  })

  it('returns an empty array when the query has no data', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await expect(searchCatalog('careers', 'soldat')).resolves.toEqual([])
    expect(builder.select).toHaveBeenCalledWith('id, name')
  })

  it('propagates catalog search errors', async () => {
    const error = new Error('Indisponible')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(searchCatalog('items', 'corde')).rejects.toThrow(error)
  })
})

describe('createCatalogItem', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('normalizes the item payload and maps the created item', async () => {
    const builder = createSupabaseQueryBuilder({
      data: { id: 'item-1', name: 'Corde', description: null, encumbrance: 0 },
      error: null,
    })
    fromMock.mockReturnValue(builder)

    await expect(createCatalogItem({ name: ' Corde ', description: '   ', encumbrance: -1.8 })).resolves.toEqual({
      id: 'item-1', name: 'Corde', specialization: null, description: null, encumbrance: 0,
      damageFormula: null, armorPoints: null,
    })
    expect(fromMock).toHaveBeenCalledWith('items')
    expect(builder.insert).toHaveBeenCalledWith({ name: 'Corde', description: null, encumbrance: 0 })
    expect(builder.select).toHaveBeenCalledWith('id, name, description, encumbrance')
  })

  it('propagates item creation errors', async () => {
    const error = new Error('Refuse')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(createCatalogItem({ name: 'Corde', description: null, encumbrance: 1 })).rejects.toThrow(error)
  })
})
