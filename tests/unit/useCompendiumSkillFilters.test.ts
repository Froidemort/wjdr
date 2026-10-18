import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useCompendiumSkillFilters } from '../../src/composables/useCompendiumSkillFilters'

const makeSkills = () => [
  { name: 'Athlétisme', specialization: null, description: 'Courir et sauter', isBasic: true, statCode: 'AG' },
  { name: 'Métier', specialization: 'Forgeron', description: null, isBasic: false, statCode: 'F' },
  { name: 'Commérage', specialization: null, description: 'Rumeurs de taverne', isBasic: true, statCode: 'SOC' },
  { name: 'Esquive', specialization: null, description: null, isBasic: true, statCode: 'AG' },
]

describe('useCompendiumSkillFilters', () => {
  it('searches name, specialization and description ignoring accents and case', () => {
    const filters = useCompendiumSkillFilters({ skills: ref(makeSkills()) })

    filters.searchQuery.value = 'ATHLETISME'
    expect(filters.filteredSkills.value.map((s) => s.name)).toEqual(['Athlétisme'])

    filters.searchQuery.value = 'forgeron'
    expect(filters.filteredSkills.value.map((s) => s.name)).toEqual(['Métier'])

    filters.searchQuery.value = 'taverne'
    expect(filters.filteredSkills.value.map((s) => s.name)).toEqual(['Commérage'])
  })

  it('filters basic and advanced skills', () => {
    const filters = useCompendiumSkillFilters({ skills: ref(makeSkills()) })

    filters.typeFilter.value = 'advanced'
    expect(filters.filteredSkills.value.map((s) => s.name)).toEqual(['Métier'])

    filters.typeFilter.value = 'basic'
    expect(filters.filteredSkills.value).toHaveLength(3)
  })

  it('filters by characteristic and orders options by sheet order with counts', () => {
    const filters = useCompendiumSkillFilters({ skills: ref(makeSkills()) })

    expect(filters.characteristics.value).toEqual([
      { code: 'F', count: 1 },
      { code: 'AG', count: 2 },
      { code: 'SOC', count: 1 },
    ])

    filters.toggleCharacteristic('AG')
    expect(filters.isCharacteristicSelected('AG')).toBe(true)
    expect(filters.filteredSkills.value.map((s) => s.name)).toEqual(['Athlétisme', 'Esquive'])

    filters.toggleCharacteristic('AG')
    expect(filters.filteredSkills.value).toHaveLength(4)
  })

  it('counts active filters and resets them', () => {
    const filters = useCompendiumSkillFilters({ skills: ref(makeSkills()) })

    filters.searchQuery.value = 'x'
    filters.typeFilter.value = 'basic'
    filters.toggleCharacteristic('F')
    expect(filters.activeFilterCount.value).toBe(3)

    filters.resetFilters()
    expect(filters.activeFilterCount.value).toBe(0)
    expect(filters.typeFilter.value).toBe('all')
  })
})
