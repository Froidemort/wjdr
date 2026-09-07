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

  it('normalizes catalog fields, supports specialized search, and exposes characteristics placeholder', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'weapons') {
        return createBuilder([{ id: 'weapon-1', name: 'Arc', encumbrance: '2', damageFormula: 'BF+3' }])
      }
      if (table === 'skills') {
        return createBuilder([{ id: 'skill-1', name: 'Conduite', specialization: 'Chariot' }])
      }
      return createBuilder([])
    })
    const store = useReferenceDataStore()

    await store.init()

    expect(store.weapons[0]).toMatchObject({ encumbrance: 2, damageFormula: 'BF+3' })
    expect(await store.search('skills', 'chariot')).toHaveLength(1)
    expect(await store.search('skills', '   ')).toEqual([])
    expect(await store.getCareerCharacteristicsByCareerId('career-1')).toEqual([
      expect.objectContaining({ id: '', name: '' }),
    ])
  })

  it.each([
    ['weapons', { id: 7, name: 8, encumbrance: '  ', damage_formula: 12 }, { id: '7', name: '8', encumbrance: null, damageFormula: null }],
    ['armors', { id: 'armor-1', name: 'Armure', encumbrance: '2.5', armor_points: 'invalid' }, { encumbrance: 2.5, armorPoints: Number.NaN }],
    ['skills', { id: 'skill-1', name: 'Langue', specialization: 1, description: false }, { specialization: null, description: null }],
  ] as const)('coerces %s catalog rows and discards incomplete entries', async (table, row, expected) => {
    fromMock.mockImplementation((requestedTable: string) =>
      createBuilder(requestedTable === table ? [row, { id: '', name: 'Ignore' }, { id: 'ignore', name: '' }] : [])
    )
    const store = useReferenceDataStore()

    await store.init()

    const catalog = table === 'weapons' ? store.weapons : table === 'armors' ? store.armors : store.skills
    expect(catalog).toHaveLength(1)
    expect(catalog[0]).toMatchObject(expected)
  })

  it.each(['skills', 'talents', 'weapons', 'armors', 'career_paths'] as const)(
    'retains a %s catalog query failure',
    async (failedTable) => {
      const failedBuilder = createBuilder([])
      failedBuilder.order.mockResolvedValue({ data: null, error: new Error(`${failedTable} indisponible`) })
      fromMock.mockImplementation((table: string) => table === failedTable ? failedBuilder : createBuilder([]))
      const store = useReferenceDataStore()

      await expect(store.init()).rejects.toThrow(`${failedTable} indisponible`)

      expect(store.error).toBe(`${failedTable} indisponible`)
      expect(store.loading).toBe(false)
    }
  )

  it('reloads missing career paths, excludes invalid targets, and sorts the result', async () => {
    const careersBuilder = createBuilder([
      { id: 'career-a', name: 'Zelote' },
      { id: 'career-b', name: 'Apothicaire' },
    ])
    const pathsBuilder = createBuilder([])
    pathsBuilder.select.mockImplementation(() => pathsBuilder)
    pathsBuilder.order
      .mockResolvedValueOnce({
        data: [
          { from_career_id: 'career-1', to_career_id: 'career-a' },
          { from_career_id: 'career-1', to_career_id: 'career-b' },
          { from_career_id: '', to_career_id: 'career-a' },
          { from_career_id: 'career-1', to_career_id: 'missing' },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          { from_career_id: 'career-1', to_career_id: 'career-a' },
          { from_career_id: 'career-1', to_career_id: 'career-b' },
        ],
        error: null,
      })
    fromMock.mockImplementation((table: string) => {
      if (table === 'careers') return careersBuilder
      if (table === 'career_paths') return pathsBuilder
      return createBuilder([])
    })
    const store = useReferenceDataStore()

    await store.init()
    expect(await store.getCareerPathsByFromCareerId('unknown')).toEqual([])
    expect(await store.getCareerPathsByFromCareerId('career-1')).toMatchObject([
      { id: 'career-b', name: 'Apothicaire' },
      { id: 'career-a', name: 'Zelote' },
    ])
  })

  it('retains an initialization failure in the store error state', async () => {
    const careersBuilder = createBuilder([])
    careersBuilder.order.mockResolvedValue({ data: null, error: new Error('Indisponible') })
    fromMock.mockReturnValue(careersBuilder)
    const store = useReferenceDataStore()

    await expect(store.init()).rejects.toThrow('Indisponible')

    expect(store.error).toBe('Indisponible')
    expect(store.loading).toBe(false)
  })
})
