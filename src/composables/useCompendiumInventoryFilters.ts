import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { compareByName } from '../utils/compare'

export interface CompendiumFilterConfig<TItem> {
  searchText: (item: TItem) => string
  encumbrance: (item: TItem) => number
  /** Each facet maps an item to the values it can be filtered on. */
  facets?: Record<string, (item: TItem) => string[]>
  sorters: Record<string, (a: TItem, b: TItem) => number>
}

interface UseCompendiumInventoryFiltersOptions<TItem> {
  items: Ref<TItem[]>
  config: CompendiumFilterConfig<TItem>
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function useCompendiumInventoryFilters<TItem>(
  options: UseCompendiumInventoryFiltersOptions<TItem>
) {
  const { items, config } = options
  const facetNames = Object.keys(config.facets ?? {})
  const sorterNames = Object.keys(config.sorters)

  const searchQuery = ref('')
  const sortBy = ref(sorterNames[0] ?? '')
  const selectedFacets = ref<Record<string, Set<string>>>(
    Object.fromEntries(facetNames.map((name) => [name, new Set<string>()]))
  )
  const minEncumbrance = ref<number | null>(null)
  const maxEncumbrance = ref<number | null>(null)

  const encumbranceBounds = computed(() => {
    const values = items.value.map(config.encumbrance)
    return {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    }
  })

  const facetOptions = computed(() => {
    const result: Record<string, Array<{ name: string; count: number }>> = {}
    for (const facet of facetNames) {
      const getter = config.facets?.[facet]
      const counts = new Map<string, number>()
      if (getter) {
        for (const item of items.value) {
          for (const value of new Set(getter(item))) {
            counts.set(value, (counts.get(value) ?? 0) + 1)
          }
        }
      }
      result[facet] = Array.from(counts, ([name, count]) => ({ name, count })).sort(compareByName)
    }
    return result
  })

  function toggleFacetValue(facet: string, value: string): void {
    const next = new Set(selectedFacets.value[facet] ?? [])
    if (next.has(value)) next.delete(value)
    else next.add(value)
    selectedFacets.value = { ...selectedFacets.value, [facet]: next }
  }

  function isFacetValueSelected(facet: string, value: string): boolean {
    return selectedFacets.value[facet]?.has(value) ?? false
  }

  const activeFilterCount = computed(() => {
    let count = 0
    for (const facet of facetNames) count += selectedFacets.value[facet]?.size ?? 0
    if (searchQuery.value.trim()) count += 1
    if (minEncumbrance.value !== null || maxEncumbrance.value !== null) count += 1
    return count
  })

  function resetFilters(): void {
    searchQuery.value = ''
    sortBy.value = sorterNames[0] ?? ''
    selectedFacets.value = Object.fromEntries(facetNames.map((name) => [name, new Set<string>()]))
    minEncumbrance.value = null
    maxEncumbrance.value = null
  }

  const filteredItems = computed(() => {
    const query = normalizeText(searchQuery.value.trim())

    const filtered = items.value.filter((item) => {
      for (const facet of facetNames) {
        const selected = selectedFacets.value[facet]
        if (selected && selected.size > 0) {
          const values = config.facets?.[facet]?.(item) ?? []
          if (!values.some((value) => selected.has(value))) return false
        }
      }

      const weight = config.encumbrance(item)
      if (minEncumbrance.value !== null && weight < minEncumbrance.value) return false
      if (maxEncumbrance.value !== null && weight > maxEncumbrance.value) return false

      return !query || normalizeText(config.searchText(item)).includes(query)
    })

    const sorter = config.sorters[sortBy.value]
    return sorter ? [...filtered].sort(sorter) : filtered
  })

  return {
    searchQuery,
    sortBy,
    minEncumbrance,
    maxEncumbrance,
    encumbranceBounds,
    facetOptions,
    filteredItems,
    activeFilterCount,
    toggleFacetValue,
    isFacetValueSelected,
    resetFilters,
  }
}
