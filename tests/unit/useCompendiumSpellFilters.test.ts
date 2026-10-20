import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useCompendiumSpellFilters } from '../../src/composables/useCompendiumSpellFilters'

interface TestSpell {
  name: string
  description?: string | null
  category: string
  difficulty: number
}

function makeSpells(): TestSpell[] {
  return [
    { name: 'Boule de feu', description: 'Projectile ardent', category: 'Feu', difficulty: 5 },
    { name: 'Éclair', description: 'Foudre crepitante', category: 'Ciel', difficulty: 12 },
    { name: 'Armure de fer', description: 'Protection metallique', category: 'Metal', difficulty: 25 },
    { name: 'Dissipation', description: 'Annule un sort', category: 'Metal', difficulty: 35 },
  ]
}

describe('useCompendiumSpellFilters', () => {
  it('exposes categories sorted by name with occurrence counts', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    expect(filters.categories.value).toEqual([
      { name: 'Ciel', count: 1 },
      { name: 'Feu', count: 1 },
      { name: 'Metal', count: 2 },
    ])
  })

  it('initializes the difficulty range to the dataset bounds', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    expect(filters.difficultyBounds.value).toEqual({ min: 5, max: 35 })
    expect(filters.minDifficulty.value).toBe(5)
    expect(filters.maxDifficulty.value).toBe(35)
  })

  it('filters by search query, accent and case insensitive, on name and description', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    filters.searchQuery.value = 'eclair'
    expect(filters.filteredSpells.value.map((s) => s.name)).toEqual(['Éclair'])

    filters.searchQuery.value = 'METALLIQUE'
    expect(filters.filteredSpells.value.map((s) => s.name)).toEqual(['Armure de fer'])
  })

  it('toggles category selection and filters accordingly', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    expect(filters.isCategorySelected('Metal')).toBe(false)
    filters.toggleCategory('Metal')
    expect(filters.isCategorySelected('Metal')).toBe(true)
    expect(filters.filteredSpells.value.map((s) => s.name).sort()).toEqual(['Armure de fer', 'Dissipation'])

    filters.toggleCategory('Metal')
    expect(filters.isCategorySelected('Metal')).toBe(false)
  })

  it('filters by the min/max difficulty range', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    filters.minDifficulty.value = 10
    filters.maxDifficulty.value = 30
    expect(filters.filteredSpells.value.map((s) => s.name)).toEqual(['Armure de fer', 'Éclair'])
  })

  it('sorts by name, difficulty ascending and difficulty descending', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    filters.sortBy.value = 'name'
    expect(filters.filteredSpells.value.map((s) => s.name)).toEqual([
      'Armure de fer', 'Boule de feu', 'Dissipation', 'Éclair',
    ])

    filters.sortBy.value = 'difficulty-asc'
    expect(filters.filteredSpells.value.map((s) => s.difficulty)).toEqual([5, 12, 25, 35])

    filters.sortBy.value = 'difficulty-desc'
    expect(filters.filteredSpells.value.map((s) => s.difficulty)).toEqual([35, 25, 12, 5])
  })

  it('counts active filters and resets them all', () => {
    const filters = useCompendiumSpellFilters({ spells: ref(makeSpells()) })

    expect(filters.activeFilterCount.value).toBe(0)

    filters.searchQuery.value = 'feu'
    filters.toggleCategory('Metal')
    filters.minDifficulty.value = 10
    filters.sortBy.value = 'difficulty-asc'
    expect(filters.activeFilterCount.value).toBe(3)

    filters.resetFilters()
    expect(filters.searchQuery.value).toBe('')
    expect(filters.selectedCategories.value.size).toBe(0)
    expect(filters.sortBy.value).toBe('name')
    expect(filters.minDifficulty.value).toBe(5)
    expect(filters.maxDifficulty.value).toBe(35)
    expect(filters.activeFilterCount.value).toBe(0)
  })

  it('handles an empty spell list without throwing', () => {
    const filters = useCompendiumSpellFilters({ spells: ref([]) })

    expect(filters.categories.value).toEqual([])
    expect(filters.difficultyBounds.value).toEqual({ min: 0, max: 0 })
    expect(filters.filteredSpells.value).toEqual([])
  })

  it('syncs the difficulty range once data arrives after setup', async () => {
    const spells = ref<TestSpell[]>([])
    const filters = useCompendiumSpellFilters({ spells })

    spells.value = makeSpells()
    await nextTick()

    expect(filters.minDifficulty.value).toBe(5)
    expect(filters.maxDifficulty.value).toBe(35)
    expect(filters.filteredSpells.value).toHaveLength(4)
  })

  it('keeps a user-narrowed range when bounds widen', async () => {
    const spells = ref<TestSpell[]>(makeSpells())
    const filters = useCompendiumSpellFilters({ spells })

    filters.minDifficulty.value = 10
    filters.maxDifficulty.value = 30
    spells.value = [...makeSpells(), { name: 'Mineur', category: 'Feu', difficulty: 1 }]
    await nextTick()

    expect(filters.minDifficulty.value).toBe(10)
    expect(filters.maxDifficulty.value).toBe(30)
  })

  it('clamps a narrowed range to shrunken bounds and pulls min down to max', async () => {
    const spells = ref<TestSpell[]>(makeSpells())
    const filters = useCompendiumSpellFilters({ spells })

    filters.minDifficulty.value = 30
    filters.maxDifficulty.value = 35
    spells.value = makeSpells().filter((spell) => spell.difficulty <= 12)
    await nextTick()

    expect(filters.maxDifficulty.value).toBe(12)
    expect(filters.minDifficulty.value).toBe(12)
  })

  it('accepts spells with a null description', () => {
    const filters = useCompendiumSpellFilters({
      spells: ref<TestSpell[]>([{ name: 'Nul', description: null, category: 'Feu', difficulty: 3 }]),
    })

    filters.searchQuery.value = 'nul'
    expect(filters.filteredSpells.value).toHaveLength(1)
    filters.searchQuery.value = 'absent'
    expect(filters.filteredSpells.value).toHaveLength(0)
  })
})
