import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { useReferenceDataStore } from '../../src/stores/referenceData'

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
}

function createBuilder(data: unknown[]): QueryBuilder {
  const builder: QueryBuilder = {
    select: vi.fn(),
    order: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
  }

  builder.select.mockImplementation(() => builder)
  builder.order.mockResolvedValue({ data, error: null })
  builder.eq.mockResolvedValue({ data, error: null })
  builder.in.mockResolvedValue({ data, error: null })

  return builder
}

describe('referenceDataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fromMock.mockReset()
  })

  it('hydrates the cold catalog once and searches cached careers', async () => {
    const careersBuilder = createBuilder([
      { id: 'career-1', name: 'Aubergiste' },
      { id: 'career-2', name: 'Agitateur' },
    ])
    const skillsBuilder = createBuilder([
      { id: 'skill-1', name: 'Athlétisme', specialization: 'Escalade', description: '...' },
    ])
    const talentsBuilder = createBuilder([
      { id: 'talent-1', name: 'Courage', specialization: null, description: '...' },
    ])
    const weaponsBuilder = createBuilder([
      { id: 'weapon-1', name: 'Épée', description: 'Lame', encumbrance: 1, damage_formula: 'BF+1' },
    ])
    const armorsBuilder = createBuilder([
      { id: 'armor-1', name: 'Armure de cuir', description: 'Légère', encumbrance: 2, armor_points: 1 },
    ])
    const pathsBuilder = createBuilder([
      { from_career_id: 'career-1', to_career_id: 'career-2' },
    ])

    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'careers':
          return careersBuilder
        case 'skills':
          return skillsBuilder
        case 'talents':
          return talentsBuilder
        case 'weapons':
          return weaponsBuilder
        case 'armors':
          return armorsBuilder
        case 'career_paths':
          return pathsBuilder
        default:
          throw new Error(`Unexpected table: ${table}`)
      }
    })

    const store = useReferenceDataStore()

    await store.init()
    expect(store.isReady).toBe(true)
    expect(await store.search('careers', 'aub')).toEqual([
      {
        id: 'career-1',
        name: 'Aubergiste',
        description: null,
        specialization: null,
        encumbrance: null,
        damageFormula: null,
        armorPoints: null,
      },
    ])
  })

  it('resolves career paths from the cached map', async () => {
    const careersBuilder = createBuilder([
      { id: 'career-1', name: 'Aubergiste' },
      { id: 'career-2', name: 'Agitateur' },
    ])
    const pathsBuilder = createBuilder([
      { from_career_id: 'career-1', to_career_id: 'career-2' },
    ])

    fromMock.mockImplementation((table: string) => {
      switch (table) {
        case 'careers':
          return careersBuilder
        case 'career_paths':
          return pathsBuilder
        default:
          return createBuilder([])
      }
    })

    const store = useReferenceDataStore()

    await store.init()

    expect(await store.getCareerPathsByFromCareerId('career-1')).toEqual([
      {
        id: 'career-2',
        name: 'Agitateur',
        description: null,
        specialization: null,
        encumbrance: null,
        damageFormula: null,
        armorPoints: null,
      },
    ])
  })
})
