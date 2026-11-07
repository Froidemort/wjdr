import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { CareerGraphMode } from '../composables/useCareerGraph'
import type { SkillTypeFilter } from '../composables/useCompendiumSkillFilters'
import type { SpellSortOrder } from '../composables/useCompendiumSpellFilters'

export interface InventoryFilterState {
  searchQuery: string
  sortBy: string
  selectedFacets: Record<string, Set<string>>
  minEncumbrance: number | null
  maxEncumbrance: number | null
}

export interface SpellFilterState {
  searchQuery: string
  selectedCategories: Set<string>
  sortBy: SpellSortOrder
  minDifficulty: number
  maxDifficulty: number
  initialized: boolean
  lastBounds: { min: number; max: number } | null
}

export interface SkillFilterState {
  searchQuery: string
  typeFilter: SkillTypeFilter
  selectedCharacteristics: Set<string>
}

export interface TalentFilterState {
  searchQuery: string
  onlySpecialized: boolean
}

function inventoryState(facets: string[]): InventoryFilterState {
  return {
    searchQuery: '',
    sortBy: 'name',
    selectedFacets: Object.fromEntries(facets.map((facet) => [facet, new Set<string>()])),
    minEncumbrance: null,
    maxEncumbrance: null,
  }
}

export const useCompendiumFilterStateStore = defineStore('compendiumFilterState', () => {
  const inventory = reactive({
    weapons: inventoryState(['Attribut']),
    armors: inventoryState(['Catégorie', 'Localisation']),
    items: inventoryState([]),
  })
  const spells = reactive<SpellFilterState>({
    searchQuery: '',
    selectedCategories: new Set<string>(),
    sortBy: 'name',
    minDifficulty: 0,
    maxDifficulty: 0,
    initialized: false,
    lastBounds: null,
  })
  const skills = reactive<SkillFilterState>({
    searchQuery: '',
    typeFilter: 'all',
    selectedCharacteristics: new Set<string>(),
  })
  const talents = reactive<TalentFilterState>({ searchQuery: '', onlySpecialized: false })
  const careers = reactive<{ mode: CareerGraphMode; start: string; end: string }>({
    mode: 'chemin',
    start: '',
    end: '',
  })

  function applySpellCategories(categories: string[], bounds: { min: number; max: number }): void {
    spells.searchQuery = ''
    spells.sortBy = 'name'
    spells.selectedCategories = new Set(categories)
    spells.minDifficulty = bounds.min
    spells.maxDifficulty = bounds.max
    spells.initialized = true
    spells.lastBounds = { ...bounds }
  }

  return { inventory, spells, skills, talents, careers, applySpellCategories }
})
