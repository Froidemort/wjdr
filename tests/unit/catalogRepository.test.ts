import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { searchCatalog } from '../../src/services/catalogRepository'

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  returns: ReturnType<typeof vi.fn>
}

function createBuilder(
  data: Array<{
    id: string
    name: string
    description?: string | null
    specialization?: string | null
    encumbrance?: number | null
    damage_formula?: string | null
    armor_points?: number | null
  }>
): QueryBuilder {
  const builder: QueryBuilder = {
    select: vi.fn(),
    limit: vi.fn(),
    or: vi.fn(),
    ilike: vi.fn(),
    returns: vi.fn(),
  }

  builder.select.mockReturnValue(builder)
  builder.limit.mockReturnValue(builder)
  builder.or.mockReturnValue(builder)
  builder.ilike.mockReturnValue(builder)
  builder.returns.mockResolvedValue({ data, error: null })

  return builder
}

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
    const builder = createBuilder([
      {
        id: 'w1',
        name: 'Epee',
        description: 'Lame',
        encumbrance: 1,
        damage_formula: 'BF+1',
      },
    ])
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
    const builder = createBuilder([
      { id: 's1', name: 'Athletisme', specialization: 'Escalade', description: null },
    ])
    fromMock.mockReturnValue(builder)

    await searchCatalog('skills', 'ath')

    expect(fromMock).toHaveBeenCalledWith('skills')
    expect(builder.or).toHaveBeenCalledWith('name.ilike.%ath%,specialization.ilike.%ath%')
    expect(builder.ilike).not.toHaveBeenCalled()
  })

  it('maps armor metadata fields for armors', async () => {
    const builder = createBuilder([
      {
        id: 'a1',
        name: 'Armure de cuir',
        description: 'Protection legere',
        encumbrance: 2,
        armor_points: 1,
      },
    ])
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
})
