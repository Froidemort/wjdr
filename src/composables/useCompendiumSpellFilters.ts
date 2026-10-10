import { computed, ref } from 'vue'
import type { Ref } from 'vue'

export type SpellSortOrder = 'name' | 'difficulty-asc' | 'difficulty-desc'

interface FilterableSpell {
  name: string
  description?: string
  category: string
  difficulty: number
}

interface UseCompendiumSpellFiltersOptions<TSpell extends FilterableSpell> {
  spells: Ref<TSpell[]>
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
  const searchQuery = ref('')
  const selectedCategories = ref(new Set<string>())
  const sortBy = ref<SpellSortOrder>('name')

  const difficultyBounds = computed(() => {
    const difficulties = options.spells.value.map((spell) => spell.difficulty)
    return {
      min: difficulties.length ? Math.min(...difficulties) : 0,
      max: difficulties.length ? Math.max(...difficulties) : 0,
    }
  })

  const minDifficulty = ref(0)
  const maxDifficulty = ref(0)

  // Keep the range bounds in sync once the dataset difficulty span is known.
  function resetDifficultyRange(): void {
    minDifficulty.value = difficultyBounds.value.min
    maxDifficulty.value = difficultyBounds.value.max
  }
  resetDifficultyRange()

  const categories = computed(() => {
    const counts = new Map<string, number>()
    for (const spell of options.spells.value) {
      counts.set(spell.category, (counts.get(spell.category) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
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
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
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
