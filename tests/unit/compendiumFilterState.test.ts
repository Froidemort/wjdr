import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCompendiumInventoryFilters } from '../../src/composables/useCompendiumInventoryFilters'
import { useCompendiumSkillFilters } from '../../src/composables/useCompendiumSkillFilters'
import { useCompendiumSpellFilters } from '../../src/composables/useCompendiumSpellFilters'
import { useCompendiumTalentFilters } from '../../src/composables/useCompendiumTalentFilters'
import { useCompendiumFilterStateStore } from '../../src/stores/compendiumFilterState'

describe('compendium filter state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps independent inventory filters and resets only the active tab', () => {
    const state = useCompendiumFilterStateStore()
    const items = ref([{ name: 'Épée', weight: 5, attribute: 'Parade' }])
    const config = {
      searchText: (item: { name: string }) => item.name,
      encumbrance: (item: { weight: number }) => item.weight,
      facets: { Attribut: (item: { attribute: string }) => [item.attribute] },
      sorters: { name: () => 0 },
    }
    const weapons = useCompendiumInventoryFilters({ items, config, state: state.inventory.weapons })
    weapons.searchQuery.value = 'épée'
    weapons.toggleFacetValue('Attribut', 'Parade')
    state.inventory.armors.searchQuery = 'maille'

    const restored = useCompendiumInventoryFilters({ items, config, state: state.inventory.weapons })
    expect(restored.searchQuery.value).toBe('épée')
    expect(restored.isFacetValueSelected('Attribut', 'Parade')).toBe(true)
    restored.resetFilters()
    expect(state.inventory.weapons.searchQuery).toBe('')
    expect(state.inventory.armors.searchQuery).toBe('maille')
  })

  it('restores skill and talent selections independently', () => {
    const state = useCompendiumFilterStateStore()
    const skills = ref([{ name: 'Perception', specialization: null, description: null, isBasic: true, statCode: 'Int' }])
    const talents = ref([{ name: 'Acuité auditive', specialization: null, description: null }])
    const skillFilters = useCompendiumSkillFilters({ skills, state: state.skills })
    const talentFilters = useCompendiumTalentFilters({ talents, state: state.talents })
    skillFilters.searchQuery.value = 'perception'
    skillFilters.toggleCharacteristic('Int')
    talentFilters.searchQuery.value = 'acuité'
    talentFilters.onlySpecialized.value = true

    const restoredSkills = useCompendiumSkillFilters({ skills, state: state.skills })
    const restoredTalents = useCompendiumTalentFilters({ talents, state: state.talents })
    expect(restoredSkills.searchQuery.value).toBe('perception')
    expect(restoredSkills.isCharacteristicSelected('Int')).toBe(true)
    expect(restoredTalents.searchQuery.value).toBe('acuité')
    expect(restoredTalents.onlySpecialized.value).toBe(true)
    restoredSkills.resetFilters()
    expect(restoredTalents.searchQuery.value).toBe('acuité')
  })

  it('restores a narrowed spell range after asynchronous reload', async () => {
    const state = useCompendiumFilterStateStore()
    const data = [
      { name: 'Feu', category: 'Feu', difficulty: 5 },
      { name: 'Ciel', category: 'Ciel', difficulty: 35 },
    ]
    const spells = ref(data)
    const scope = effectScope()
    const first = scope.run(() => useCompendiumSpellFilters({ spells, state: state.spells }))
    if (!first) throw new Error('Unable to create spell filter scope')
    first.minDifficulty.value = 10
    first.maxDifficulty.value = 30
    first.toggleCategory('Feu')
    scope.stop()

    spells.value = []
    const restored = useCompendiumSpellFilters({ spells, state: state.spells })
    spells.value = data
    await nextTick()
    expect(restored.minDifficulty.value).toBe(10)
    expect(restored.maxDifficulty.value).toBe(30)
    expect(restored.isCategorySelected('Feu')).toBe(true)
  })

  it('preserves a spell range while an existing dataset is temporarily empty', async () => {
    const state = useCompendiumFilterStateStore()
    const data = [
      { name: 'Feu', category: 'Feu', difficulty: 5 },
      { name: 'Ciel', category: 'Ciel', difficulty: 35 },
    ]
    const spells = ref(data)
    const filters = useCompendiumSpellFilters({ spells, state: state.spells })
    filters.minDifficulty.value = 10
    filters.maxDifficulty.value = 30
    spells.value = []
    await nextTick()
    spells.value = data
    await nextTick()
    expect(filters.minDifficulty.value).toBe(10)
    expect(filters.maxDifficulty.value).toBe(30)
  })

  it('resets to the full spell range when reset during a temporary empty dataset', async () => {
    const state = useCompendiumFilterStateStore()
    const data = [
      { name: 'Feu', category: 'Feu', difficulty: 5 },
      { name: 'Ciel', category: 'Ciel', difficulty: 35 },
    ]
    const spells = ref(data)
    const filters = useCompendiumSpellFilters({ spells, state: state.spells })
    filters.minDifficulty.value = 10
    filters.maxDifficulty.value = 30
    spells.value = []
    await nextTick()
    filters.resetFilters()
    spells.value = data
    await nextTick()
    expect([filters.minDifficulty.value, filters.maxDifficulty.value]).toEqual([5, 35])
    expect(filters.filteredSpells.value).toHaveLength(2)
  })

  it('updates a restored full range when the dataset changes while the view is absent', () => {
    const state = useCompendiumFilterStateStore()
    const spells = ref([
      { name: 'Feu', category: 'Feu', difficulty: 5 },
      { name: 'Ciel', category: 'Ciel', difficulty: 35 },
    ])
    const scope = effectScope()
    scope.run(() => useCompendiumSpellFilters({ spells, state: state.spells }))
    scope.stop()
    spells.value = [{ name: 'Feu', category: 'Feu', difficulty: 5 }]

    const restored = useCompendiumSpellFilters({ spells, state: state.spells })
    expect(restored.minDifficulty.value).toBe(5)
    expect(restored.maxDifficulty.value).toBe(5)
    expect(restored.filteredSpells.value).toHaveLength(1)
  })

  it('clamps a restored range to new bounds when no values overlap', () => {
    const state = useCompendiumFilterStateStore()
    const spells = ref([
      { name: 'Feu', category: 'Feu', difficulty: 5 },
      { name: 'Ciel', category: 'Ciel', difficulty: 35 },
    ])
    const scope = effectScope()
    const first = scope.run(() => useCompendiumSpellFilters({ spells, state: state.spells }))
    if (!first) throw new Error('Unable to create spell filter scope')
    first.minDifficulty.value = 10
    first.maxDifficulty.value = 20
    scope.stop()
    spells.value = [{ name: 'Ciel', category: 'Ciel', difficulty: 50 }]

    const restored = useCompendiumSpellFilters({ spells, state: state.spells })
    expect([restored.minDifficulty.value, restored.maxDifficulty.value]).toEqual([50, 50])
  })

  it('applies shortcut categories without retaining other spell filters', () => {
    const state = useCompendiumFilterStateStore()
    state.spells.searchQuery = 'feu'
    state.spells.sortBy = 'difficulty-desc'
    state.spells.minDifficulty = 12
    state.spells.maxDifficulty = 20
    state.applySpellCategories(['Ciel', 'Feu'], { min: 5, max: 35 })
    expect(state.spells.searchQuery).toBe('')
    expect(state.spells.sortBy).toBe('name')
    expect([...state.spells.selectedCategories]).toEqual(['Ciel', 'Feu'])
    expect([state.spells.minDifficulty, state.spells.maxDifficulty]).toEqual([5, 35])
  })

  it('keeps career selections in the session store', () => {
    const state = useCompendiumFilterStateStore()
    state.careers.mode = 'vers'
    state.careers.end = 'career-id'
    expect(useCompendiumFilterStateStore().careers).toMatchObject({ mode: 'vers', end: 'career-id' })
  })
})
