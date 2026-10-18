import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useCompendiumTalentFilters } from '../../src/composables/useCompendiumTalentFilters'

const makeTalents = () => [
  { name: 'Chance', specialization: null, description: 'Relancer un dé' },
  { name: 'Sens aiguisés', specialization: 'Ouïe', description: null },
  { name: 'Résistance accrue', specialization: null, description: null },
]

describe('useCompendiumTalentFilters', () => {
  it('searches name, specialization and description ignoring accents', () => {
    const filters = useCompendiumTalentFilters({ talents: ref(makeTalents()) })

    filters.searchQuery.value = 'resistance'
    expect(filters.filteredTalents.value.map((t) => t.name)).toEqual(['Résistance accrue'])

    filters.searchQuery.value = 'ouie'
    expect(filters.filteredTalents.value.map((t) => t.name)).toEqual(['Sens aiguisés'])

    filters.searchQuery.value = 'relancer'
    expect(filters.filteredTalents.value.map((t) => t.name)).toEqual(['Chance'])
  })

  it('keeps only specialized talents when requested', () => {
    const filters = useCompendiumTalentFilters({ talents: ref(makeTalents()) })

    filters.onlySpecialized.value = true

    expect(filters.filteredTalents.value.map((t) => t.name)).toEqual(['Sens aiguisés'])
  })

  it('counts active filters and resets them', () => {
    const filters = useCompendiumTalentFilters({ talents: ref(makeTalents()) })

    filters.searchQuery.value = 'a'
    filters.onlySpecialized.value = true
    expect(filters.activeFilterCount.value).toBe(2)

    filters.resetFilters()
    expect(filters.activeFilterCount.value).toBe(0)
    expect(filters.filteredTalents.value).toHaveLength(3)
  })
})
