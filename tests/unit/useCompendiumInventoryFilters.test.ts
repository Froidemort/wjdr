import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import {
  useCompendiumInventoryFilters,
  type CompendiumFilterConfig,
} from '../../src/composables/useCompendiumInventoryFilters'

interface Entry {
  name: string
  weight: number
  tags: string[]
}

const config: CompendiumFilterConfig<Entry> = {
  searchText: (e) => e.name,
  encumbrance: (e) => e.weight,
  facets: { Tag: (e) => e.tags },
  sorters: {
    name: (a, b) => a.name.localeCompare(b.name, 'fr'),
    weight: (a, b) => b.weight - a.weight,
  },
}

const data: Entry[] = [
  { name: 'Épée', weight: 100, tags: ['lame'] },
  { name: 'Arc', weight: 50, tags: ['distance'] },
  { name: 'Hache', weight: 150, tags: ['lame', 'lourde'] },
]

function setup() {
  return useCompendiumInventoryFilters({ items: ref(data), config })
}

describe('useCompendiumInventoryFilters', () => {
  it('sorts by the first sorter by default', () => {
    expect(setup().filteredItems.value.map((e) => e.name)).toEqual(['Arc', 'Épée', 'Hache'])
  })

  it('searches without accents or case', () => {
    const filters = setup()
    filters.searchQuery.value = 'EPEE'

    expect(filters.filteredItems.value.map((e) => e.name)).toEqual(['Épée'])
  })

  it('filters by facet value and counts options', () => {
    const filters = setup()
    expect(filters.facetOptions.value.Tag).toEqual([
      { name: 'distance', count: 1 },
      { name: 'lame', count: 2 },
      { name: 'lourde', count: 1 },
    ])

    filters.toggleFacetValue('Tag', 'lame')
    expect(filters.filteredItems.value).toHaveLength(2)
    expect(filters.isFacetValueSelected('Tag', 'lame')).toBe(true)

    filters.toggleFacetValue('Tag', 'lame')
    expect(filters.filteredItems.value).toHaveLength(3)
  })

  it('bounds encumbrance', () => {
    const filters = setup()
    filters.maxEncumbrance.value = 100

    expect(filters.filteredItems.value.map((e) => e.name)).toEqual(['Arc', 'Épée'])
    expect(filters.encumbranceBounds.value).toEqual({ min: 50, max: 150 })
  })

  it('applies the selected sorter and resets', () => {
    const filters = setup()
    filters.sortBy.value = 'weight'
    filters.searchQuery.value = 'a'
    filters.toggleFacetValue('Tag', 'lame')
    expect(filters.activeFilterCount.value).toBe(2)
    expect(filters.filteredItems.value.map((e) => e.name)).toEqual(['Hache'])

    filters.resetFilters()

    expect(filters.activeFilterCount.value).toBe(0)
    expect(filters.sortBy.value).toBe('name')
    expect(filters.filteredItems.value).toHaveLength(3)
  })
})
