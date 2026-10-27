<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useWindowScroll } from '@vueuse/core'
import { ArrowUp, ListFilter, RotateCcw, ArrowDownUp } from '@lucide/vue'
import { useCompendiumSpellsStore } from '../stores/compendiumSpells'
import { useCompendiumSpellFilters } from '../composables/useCompendiumSpellFilters'
import { useIncrementalReveal } from '../composables/useIncrementalReveal'
import DataGrid from '../components/ui/DataGrid.vue'
import SearchInput from '../components/ui/SearchInput.vue'

// green <10, amber 10-20, red 20-30, blue >30: info is the only theme token distinct from success/warning/error in both themes.
function difficultyBadgeClass(difficulty: number): string {
  if (difficulty > 30) return 'badge badge-info'
  if (difficulty > 20) return 'badge badge-error'
  if (difficulty >= 10) return 'badge badge-warning'
  return 'badge badge-success'
}

const store = useCompendiumSpellsStore()
const { spells, loading, loaded, error } = storeToRefs(store)
void store.loadSpells()

const {
  searchQuery,
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
} = useCompendiumSpellFilters({ spells })

const isLoading = computed(() => loading.value || (!loaded.value && !error.value))

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
})

function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Description truncated to 150 chars per card, toggled open on demand.
const DESCRIPTION_LIMIT = 150
const expandedDescriptions = ref(new Set<string>())

function isDescriptionLong(description: string | null): boolean {
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

function displayedDescription(spell: { id: string; description: string | null }): string {
  const description = spell.description ?? ''
  if (!isDescriptionLong(description) || isDescriptionExpanded(spell.id)) return description
  return `${description.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
}
</script>

<template>
  <div ref="scrollTargetRef" class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium des sorts</h1>
      <p class="opacity-80 text-sm mt-1">Liste des sorts et prières du Vieux Monde. Explore les secrets des vents de magie !</p>
    </header>

    <section class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 m-4 flex flex-col gap-4" aria-label="Filtres">
      <SearchInput v-model="searchQuery" placeholder="Rechercher un sort par nom ou effet..." class="w-full" />

      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wide opacity-70">Catégorie</span>
          <div class="dropdown">
            <div tabindex="0" role="button" class="btn sm:btn-sm gap-2">
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
                class="input sm:input-sm input-bordered w-full mb-1"
              />
              <ul class="max-h-72 overflow-y-auto">
                <li v-for="category in filteredCategories" :key="category.name">
                  <label class="label cursor-pointer flex gap-2 justify-between min-h-11">
                    <span class="label-text truncate" :title="category.name">{{ category.name }}</span>
                    <span class="flex items-center gap-2 shrink-0">
                      <span class="opacity-70 text-xs">{{ category.count }}</span>
                      <input
                        type="checkbox"
                        class="checkbox sm:checkbox-sm"
                        :checked="isCategorySelected(category.name)"
                        @change="toggleCategory(category.name)"
                      />
                    </span>
                  </label>
                </li>
                <li v-if="filteredCategories.length === 0" class="text-xs opacity-70 p-2">Aucune catégorie trouvée.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="divider divider-horizontal hidden sm:flex m-0"></div>

        <div class="flex flex-col gap-1">
          <span class="label-text text-xs font-semibold uppercase tracking-wide opacity-70">Difficulté</span>
          <div class="join">
            <label class="join-item input sm:input-sm flex items-center gap-1">
              <span class="opacity-70 text-xs">Min</span>
              <input
                v-model.number="minDifficulty"
                type="number"
                inputmode="numeric"
                aria-label="Difficulté minimum"
                class="w-14"
                :min="difficultyBounds.min"
                :max="maxDifficulty"
              />
            </label>
            <label class="join-item input sm:input-sm flex items-center gap-1">
              <span class="opacity-70 text-xs">Max</span>
              <input
                v-model.number="maxDifficulty"
                type="number"
                inputmode="numeric"
                aria-label="Difficulté maximum"
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
          <label class="input sm:input-sm flex items-center gap-2">
            <ArrowDownUp class="size-4 opacity-70" />
            <select v-model="sortBy" class="w-40" aria-label="Trier les sorts">
              <option value="name">Nom</option>
              <option value="difficulty-asc">Difficulté croissante</option>
              <option value="difficulty-desc">Difficulté décroissante</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="categories.some((c) => isCategorySelected(c.name))" class="flex flex-wrap items-center gap-2">
        <span class="text-xs opacity-70">Filtres actifs :</span>
        <span
          v-for="category in categories.filter((c) => isCategorySelected(c.name))"
          :key="category.name"
          class="badge badge-outline gap-1 h-auto py-1"
        >
          {{ category.name }}
          <button
            type="button"
            class="btn btn-ghost btn-circle btn-xs"
            :aria-label="`Retirer le filtre ${category.name}`"
            @click="toggleCategory(category.name)"
          >
            <X class="size-3" aria-hidden="true" />
          </button>
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-2">
        <p class="text-sm opacity-70" aria-live="polite">{{ filteredSpells.length }} sort(s) trouvé(s)</p>
        <button v-if="activeFilterCount > 0" type="button" class="btn btn-sm btn-ghost gap-1" @click="resetFilters">
          <RotateCcw class="size-4" aria-hidden="true" />
          Réinitialiser ({{ activeFilterCount }})
        </button>
      </div>
    </section>

    <div class="px-4 pb-8">
      <div v-if="error" role="alert" class="alert alert-error alert-soft mb-4">
        <span>{{ error }}</span>
        <button type="button" class="btn btn-sm" @click="store.loadSpells(true)">Réessayer</button>
      </div>

      <DataGrid
        v-else
        :items="visibleItems"
        :loading="isLoading"
        empty-message="Aucun sort ne correspond à ces filtres."
        grid-class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 items-start"
      >
        <template #default="{ items }">
          <div v-for="spell in items" :key="spell.id" class="card card-border bg-base-200 text-base-content">
            <div class="card-body gap-2 p-5">
              <h2 class="card-title">{{ spell.name }}</h2>
              <span class="badge badge-neutral badge-sm whitespace-normal h-auto py-1 self-start">{{ spell.category }}</span>
              <p class="flex items-center gap-2 text-sm">
                Difficulté : <span :class="difficultyBadgeClass(spell.difficulty)" :title="`Difficulté ${spell.difficulty}`">{{ spell.difficulty }}</span>
              </p>
              <div v-if="spell.description" class="text-sm opacity-80">
                <p>{{ displayedDescription(spell) }}</p>
                <button
                  v-if="isDescriptionLong(spell.description)"
                  type="button"
                  class="btn btn-ghost btn-xs mt-1 -ml-2 text-primary"
                  :aria-expanded="isDescriptionExpanded(spell.id)"
                  @click="toggleDescription(spell.id)"
                >
                  {{ isDescriptionExpanded(spell.id) ? 'Voir moins' : 'Voir plus' }}
                </button>
              </div>
              <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90 mt-1">
                <span v-if="spell.castingTime">Temps : {{ spell.castingTime }}</span>
                <span v-if="spell.range">Portée : {{ spell.range }}</span>
                <span v-if="spell.duration">Durée : {{ spell.duration }}</span>
              </div>
              <p v-if="spell.bonusIngredient" class="text-xs opacity-70">Ingrédient bonus : {{ spell.bonusIngredient }}<template v-if="spell.bonus !== null"> (+{{ spell.bonus }})</template></p>
            </div>
          </div>
        </template>
      </DataGrid>
    </div>

    <button
      v-if="showScrollTop"
      type="button"
      aria-label="Revenir en haut, au niveau des filtres"
      class="btn btn-circle btn-primary shadow-lg fixed right-4 bottom-[calc(var(--grim-dock-height,0px)+1rem)] z-50 transition-opacity duration-300"
      :class="isScrolling
        ? 'opacity-0 pointer-events-none'
        : 'opacity-70 hover:opacity-100 active:opacity-100 focus-visible:opacity-100'"
      @click="scrollToTop"
    >
      <ArrowUp class="size-5" />
    </button>
  </div>
</template>
