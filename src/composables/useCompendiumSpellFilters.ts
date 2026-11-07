import { computed, reactive, toRefs, watch } from 'vue'
import type { Ref } from 'vue'
import type { SpellFilterState } from '../stores/compendiumFilterState'
import { compareByName } from '../utils/compare'

export type SpellSortOrder = 'name' | 'difficulty-asc' | 'difficulty-desc'

interface FilterableSpell {
  name: string
  description?: string | null
  category: string
  difficulty: number
}

interface UseCompendiumSpellFiltersOptions<TSpell extends FilterableSpell> {
  spells: Ref<TSpell[]>
  state?: SpellFilterState
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function useCompendiumSpellFilters<TSpell extends FilterableSpell>(
  options: UseCompendiumSpellFiltersOptions<TSpell>
) {
  const state = options.state ?? reactive<SpellFilterState>({
    searchQuery: '',
    selectedCategories: new Set<string>(),
    sortBy: 'name',
    minDifficulty: 0,
    maxDifficulty: 0,
    initialized: false,
    lastBounds: null,
  })
  const { searchQuery, selectedCategories, sortBy, minDifficulty, maxDifficulty } = toRefs(state)

  const difficultyBounds = computed(() => {
    const difficulties = options.spells.value.map((spell) => spell.difficulty)
    return {
      min: difficulties.length ? Math.min(...difficulties) : 0,
      max: difficulties.length ? Math.max(...difficulties) : 0,
    }
  })

  // Keep the range bounds in sync once the dataset difficulty span is known.
  function resetDifficultyRange(): void {
    minDifficulty.value = difficultyBounds.value.min
    maxDifficulty.value = difficultyBounds.value.max
  }
  function syncDifficultyRange(next: { min: number; max: number }, previousBounds: { min: number; max: number }): void {
    if (minDifficulty.value === previousBounds.min && maxDifficulty.value === previousBounds.max) {
      resetDifficultyRange()
    } else {
      minDifficulty.value = Math.min(Math.max(minDifficulty.value, next.min), next.max)
      maxDifficulty.value = Math.min(Math.max(maxDifficulty.value, next.min), next.max)
      if (minDifficulty.value > maxDifficulty.value) minDifficulty.value = maxDifficulty.value
    }
    state.lastBounds = next
  }

  if (!state.initialized) {
    resetDifficultyRange()
    state.initialized = true
    if (options.spells.value.length > 0) state.lastBounds = difficultyBounds.value
  } else if (options.spells.value.length > 0) {
    syncDifficultyRange(difficultyBounds.value, state.lastBounds ?? { min: 0, max: 0 })
  }

  // An empty loading state must not overwrite a previously selected range.
  watch(difficultyBounds, (next, previous) => {
    if (options.spells.value.length === 0) return
    syncDifficultyRange(next, state.lastBounds ?? previous)
  })

  const categories = computed(() => {
    const counts = new Map<string, number>()
    for (const spell of options.spells.value) {
      counts.set(spell.category, (counts.get(spell.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort(compareByName)
  })

  function toggleCategory(category: string): void {
    const next = new Set(selectedCategories.value)
    if (next.has(category)) {
      next.delete(category)
    } else {
      next.add(category)
    }
    selectedCategories.value = next
  }

  function isCategorySelected(category: string): boolean {
    return selectedCategories.value.has(category)
  }

  const activeFilterCount = computed(() => {
    let count = selectedCategories.value.size
    if (searchQuery.value.trim()) count += 1
    if (
      minDifficulty.value !== difficultyBounds.value.min ||
      maxDifficulty.value !== difficultyBounds.value.max
    ) {
      count += 1
    }
    return count
  })

  function resetFilters(): void {
    searchQuery.value = ''
    selectedCategories.value = new Set()
    sortBy.value = 'name'
    resetDifficultyRange()
    state.lastBounds = options.spells.value.length > 0 ? difficultyBounds.value : null
  }

  const filteredSpells = computed(() => {
    const query = normalize(searchQuery.value.trim())

    const filtered = options.spells.value.filter((spell) => {
      if (selectedCategories.value.size > 0 && !selectedCategories.value.has(spell.category)) {
        return false
      }

      if (spell.difficulty < minDifficulty.value || spell.difficulty > maxDifficulty.value) {
        return false
      }

      if (!query) {
        return true
      }

      const haystack = normalize(`${spell.name} ${spell.description ?? ''}`)
      return haystack.includes(query)
    })

    const sorted = [...filtered]
    switch (sortBy.value) {
      case 'difficulty-asc':
        sorted.sort((a, b) => a.difficulty - b.difficulty)
        break
      case 'difficulty-desc':
        sorted.sort((a, b) => b.difficulty - a.difficulty)
        break
      default:
        sorted.sort(compareByName)
    }

    return sorted
  })

  return {
    searchQuery,
    selectedCategories,
    sortBy,
    minDifficulty,
    maxDifficulty,
    difficultyBounds,
    categories,
    filteredSpells,
    activeFilterCount,
    toggleCategory,
    isCategorySelected,
    resetFilters,
  }
}
