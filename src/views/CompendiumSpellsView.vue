<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { ArrowUp, ListFilter, RotateCcw, ArrowDownUp } from '@lucide/vue'
import { useCompendiumSpellFilters } from '../composables/useCompendiumSpellFilters'
import { useIncrementalReveal } from '../composables/useIncrementalReveal'
import DataGrid from '../components/ui/DataGrid.vue'
import SearchInput from '../components/ui/SearchInput.vue'

// TODO : Put these types definition in type directory

interface Spell {
    category: string;
    name: string;
    difficulty: number;
    casting_time: string;
    bonus_ingredient: string;
    bonus: number;
    duration?: string;
    range?: string;
    description?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

// green <10, orange 10-20, red 20-30, purple >30
function difficultyBadgeClass(difficulty: number): string {
  if (difficulty > 30) return 'badge bg-purple-500! text-white! border-purple-500!'
  if (difficulty > 20) return 'badge badge-error'
  if (difficulty >= 10) return 'badge badge-warning'
  return 'badge badge-success'
}

// Example data for the compendium of spells, must be replaced by Supabase calls later.
const rawData: Array<Spell> = []
// DataGrid needs a stable identifier, kept separate from the Spell shape.
const data = rawData.map((spell) => ({ ...spell, id: `${slugify(spell.category)}-${slugify(spell.name)}` }))

const {
  searchQuery,
  selectedCategories,
  categories,
  sortBy,
  minDifficulty,
  maxDifficulty,
  difficultyBounds,
  filteredSpells,
  activeFilterCount,
  toggleCategory,
  isCategorySelected,
  resetFilters,
} = useCompendiumSpellFilters({ spells: ref(data) })

// Simulated filtering delay: keeps a loading state to show skeleton cards while
// filters are applied. This is the hook point for a real async fetch once the
// data source moves to Supabase (toggle isFiltering around the request instead).
const isFiltering = ref(false)
const FILTER_LOADING_DELAY = 250
let filterLoadingTimeout: ReturnType<typeof setTimeout> | undefined
watch([searchQuery, selectedCategories, minDifficulty, maxDifficulty, sortBy], () => {
  isFiltering.value = true
  clearTimeout(filterLoadingTimeout)
  filterLoadingTimeout = setTimeout(() => {
    isFiltering.value = false
  }, FILTER_LOADING_DELAY)
})

const scrollTargetRef = ref<HTMLElement | null>(null)
const { visibleItems } = useIncrementalReveal(filteredSpells, scrollTargetRef, { pageSize: 10 })

const categorySearch = ref('')
const filteredCategories = computed(() => {
  const query = categorySearch.value.trim().toLowerCase()
  if (!query) return categories.value
  return categories.value.filter((c) => c.name.toLowerCase().includes(query))
})

// Scroll-to-top button: hidden until scrolled, dimmed/hidden on mobile while actively scrolling.
const { y: scrollY } = useWindowScroll()
const showScrollTop = computed(() => scrollY.value > 400)
const isScrolling = ref(false)
let scrollIdleTimeout: ReturnType<typeof setTimeout> | undefined
watch(scrollY, () => {
  isScrolling.value = true
  clearTimeout(scrollIdleTimeout)
  scrollIdleTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 500)
})
onBeforeUnmount(() => {
  clearTimeout(scrollIdleTimeout)
  clearTimeout(filterLoadingTimeout)
})

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Description truncated to 150 chars per card, toggled open on demand.
const DESCRIPTION_LIMIT = 150
const expandedDescriptions = ref(new Set<string>())

function isDescriptionLong(description?: string): boolean {
  return !!description && description.length > DESCRIPTION_LIMIT
}

function isDescriptionExpanded(id: string): boolean {
  return expandedDescriptions.value.has(id)
}

function toggleDescription(id: string): void {
  const next = new Set(expandedDescriptions.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedDescriptions.value = next
}

function displayedDescription(spell: { id: string; description?: string }): string {
  const description = spell.description ?? ''
  if (!isDescriptionLong(description) || isDescriptionExpanded(spell.id)) return description
  return `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
}
</script>


<template>
  <section ref="scrollTargetRef" class="bg-base-100">
    <div class="bg-base-300 text-base-content p-6">
      <h2 class="text-2xl font-bold">Compendium des sorts</h2>
      <p class="opacity-80 text-sm mt-1">Liste des sorts et prières du Vieux Monde. Explore les secrets des vents de magie !</p>
    </div>

    <div class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 m-4 flex flex-col gap-4">
      <SearchInput v-model="searchQuery" placeholder="Rechercher un sort par nom ou effet..." class="w-full" />

      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wide opacity-70">Catégorie</span>
          <div class="dropdown">
            <div tabindex="0" role="button" class="btn btn-sm gap-2">
              <ListFilter class="size-4" />
              Collèges ou Divinités
              <span v-if="categories.some((c) => isCategorySelected(c.name))" class="badge badge-sm badge-primary">
                {{ categories.filter((c) => isCategorySelected(c.name)).length }}
              </span>
            </div>
            <div tabindex="0" class="dropdown-content z-1 menu p-2 shadow-lg bg-base-100 rounded-box w-64 flex-nowrap gap-1 border border-base-300">
              <input
                v-model="categorySearch"
                type="search"
                placeholder="Chercher une catégorie..."
                class="input input-sm input-bordered w-full mb-1"
              />
              <ul class="max-h-72 overflow-y-auto">
                <li v-for="category in filteredCategories" :key="category.name">
                  <label class="label cursor-pointer flex gap-2 justify-between">
                    <span class="label-text truncate">{{ category.name }}</span>
                    <span class="flex items-center gap-2 shrink-0">
                      <span class="opacity-60 text-xs">{{ category.count }}</span>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="isCategorySelected(category.name)"
                        @change="toggleCategory(category.name)"
                      />
                    </span>
                  </label>
                </li>
                <li v-if="filteredCategories.length === 0" class="text-xs opacity-60 p-2">Aucune catégorie trouvée.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="divider divider-horizontal hidden sm:flex m-0"></div>

        <div class="flex flex-col gap-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wide opacity-70">Difficulté</span>
          <div class="join">
            <label class="join-item input input-sm flex items-center gap-1">
              <span class="opacity-60 text-xs">Min</span>
              <input
                v-model.number="minDifficulty"
                type="number"
                class="w-14"
                :min="difficultyBounds.min"
                :max="maxDifficulty"
              />
            </label>
            <label class="join-item input input-sm flex items-center gap-1">
              <span class="opacity-60 text-xs">Max</span>
              <input
                v-model.number="maxDifficulty"
                type="number"
                class="w-14"
                :min="minDifficulty"
                :max="difficultyBounds.max"
              />
            </label>
          </div>
        </div>

        <div class="divider divider-horizontal hidden sm:flex m-0"></div>

        <div class="flex flex-col gap-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wide opacity-70">Tri</span>
          <label class="input input-sm flex items-center gap-2">
            <ArrowDownUp class="size-4 opacity-60" />
            <select v-model="sortBy" class="w-40">
              <option value="name">Nom</option>
              <option value="difficulty-asc">Difficulté croissante</option>
              <option value="difficulty-desc">Difficulté décroissante</option>
            </select>
          </label>
        </div>

        <button class="btn btn-outline btn-sm gap-2 ml-auto" :disabled="activeFilterCount === 0" @click="resetFilters">
          <RotateCcw class="size-4" />
          Réinitialiser
        </button>
      </div>

      <div v-if="categories.some((c) => isCategorySelected(c.name))" class="flex flex-wrap items-center gap-2">
        <span class="text-xs opacity-60">Filtres actifs :</span>
        <span
          v-for="category in categories.filter((c) => isCategorySelected(c.name))"
          :key="category.name"
          class="badge badge-outline gap-1"
        >
          {{ category.name }}
          <button type="button" aria-label="Retirer ce filtre" @click="toggleCategory(category.name)">×</button>
        </span>
      </div>

      <p class="text-sm opacity-70 border-t border-base-300 pt-2" aria-live="polite">
        {{ filteredSpells.length }} sort(s) trouvé(s)
      </p>
    </div>

    <div class="p-4">
      <div v-if="isFiltering" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="n in 6" :key="n" class="card card-border bg-base-200 p-5 gap-3">
          <div class="skeleton h-5 w-2/3"></div>
          <div class="skeleton h-4 w-1/3"></div>
          <div class="skeleton h-4 w-1/4"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-5/6"></div>
        </div>
      </div>

      <DataGrid
        v-else
        :items="visibleItems"
        empty-message="Aucun sort ne correspond à ces filtres."
        grid-class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-start"
      >
        <template #default="{ items }">
          <div v-for="spell in items" :key="spell.id" class="card card-border bg-base-200 text-base-content hover:shadow-lg hover:border-primary/40 transition-shadow">
            <div class="card-body gap-2 p-5">
              <h3 class="card-title">{{ spell.name }}</h3>
              <span class="badge badge-neutral badge-sm whitespace-normal h-auto py-1 self-start">{{ spell.category }}</span>
              <p class="flex items-center gap-2 text-sm">
                Difficulté : <span :class="difficultyBadgeClass(spell.difficulty)">{{ spell.difficulty }}</span>
              </p>
              <p v-if="spell.description" class="text-sm opacity-80">
                {{ displayedDescription(spell) }}
                <button
                  v-if="isDescriptionLong(spell.description)"
                  type="button"
                  class="link link-primary text-xs ml-1 whitespace-nowrap"
                  @click="toggleDescription(spell.id)"
                >
                  {{ isDescriptionExpanded(spell.id) ? 'Voir moins' : 'Voir plus' }}
                </button>
              </p>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90 mt-1">
                <span v-if="spell.casting_time">Temps : {{ spell.casting_time }}</span>
                <span v-if="spell.range">Portée : {{ spell.range }}</span>
                <span v-if="spell.duration">Durée : {{ spell.duration }}</span>
              </div>
              <p v-if="spell.bonus_ingredient" class="text-xs opacity-60">Ingrédient bonus : {{ spell.bonus_ingredient }} (+{{spell.bonus}})</p>
            </div>
          </div>
        </template>
      </DataGrid>
    </div>

    <button
      v-if="showScrollTop"
      type="button"
      aria-label="Revenir en haut, au niveau des filtres"
      class="btn btn-circle btn-primary shadow-lg fixed right-4 bottom-4 z-50 transition-opacity duration-300"
      :class="isScrolling
        ? 'opacity-0 pointer-events-none'
        : 'opacity-30 hover:opacity-100 active:opacity-100 focus-visible:opacity-100'"
      @click="scrollToTop"
    >
      <ArrowUp class="size-5" />
    </button>
  </section>
</template>

<style lang="css" scoped></style>
