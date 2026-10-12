<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RotateCcw } from '@lucide/vue'
import { useCompendiumInventoryStore } from '../stores/compendiumInventory'
import {
  useCompendiumInventoryFilters,
  type CompendiumFilterConfig,
} from '../composables/useCompendiumInventoryFilters'
import { useIncrementalReveal } from '../composables/useIncrementalReveal'
import DataGrid from '../components/ui/DataGrid.vue'
import SearchInput from '../components/ui/SearchInput.vue'
import CompendiumEntryCard from '../components/ui/CompendiumEntryCard.vue'
import type {
  CompendiumArmor,
  CompendiumItem,
  CompendiumTab,
  CompendiumWeapon,
} from '../types/compendium'

const TABS: ReadonlyArray<{ key: CompendiumTab; label: string }> = [
  { key: 'weapons', label: 'Armes' },
  { key: 'armors', label: 'Armures' },
  { key: 'items', label: 'Équipements' },
]

const route = useRoute()
const router = useRouter()
const store = useCompendiumInventoryStore()
const { weapons, armors, items, loading, loaded, errors } = storeToRefs(store)

function parseTab(value: unknown): CompendiumTab {
  return TABS.some((tab) => tab.key === value) ? (value as CompendiumTab) : 'weapons'
}

const activeTab = computed(() => parseTab(route.query.tab))

function selectTab(tab: CompendiumTab): void {
  void router.replace({ query: { ...route.query, tab } })
}

const byName = <T extends { name: string }>(a: T, b: T): number => a.name.localeCompare(b.name, 'fr')
const byEncumbrance = <T extends { encumbrance: number }>(a: T, b: T): number =>
  a.encumbrance - b.encumbrance

const weaponConfig: CompendiumFilterConfig<CompendiumWeapon> = {
  searchText: (w) => `${w.name} ${w.description ?? ''} ${w.damageFormula}`,
  encumbrance: (w) => w.encumbrance,
  facets: { Attribut: (w) => w.attributes.map((a) => a.name) },
  sorters: {
    name: byName,
    encumbrance: byEncumbrance,
    damage: (a, b) => a.damageFormula.localeCompare(b.damageFormula, 'fr', { numeric: true }),
  },
}

const armorConfig: CompendiumFilterConfig<CompendiumArmor> = {
  searchText: (a) => `${a.name} ${a.description ?? ''} ${a.category}`,
  encumbrance: (a) => a.encumbrance,
  facets: { Catégorie: (a) => [a.category], Localisation: (a) => a.coveredLocations },
  sorters: { name: byName, encumbrance: byEncumbrance, armor: (a, b) => b.armorPoints - a.armorPoints },
}

const itemConfig: CompendiumFilterConfig<CompendiumItem> = {
  searchText: (i) => `${i.name} ${i.description ?? ''}`,
  encumbrance: (i) => i.encumbrance,
  sorters: { name: byName, encumbrance: byEncumbrance },
}

const weaponFilters = useCompendiumInventoryFilters({ items: weapons, config: weaponConfig })
const armorFilters = useCompendiumInventoryFilters({ items: armors, config: armorConfig })
const itemFilters = useCompendiumInventoryFilters({ items: items, config: itemConfig })

const SORT_LABELS: Record<string, string> = {
  name: 'Nom',
  encumbrance: 'Encombrement',
  damage: 'Dégâts',
  armor: 'Points d\'armure',
}

const filters = computed(() => {
  if (activeTab.value === 'weapons') return weaponFilters
  if (activeTab.value === 'armors') return armorFilters
  return itemFilters
})

const sortKeys = computed(() => {
  if (activeTab.value === 'weapons') return Object.keys(weaponConfig.sorters)
  if (activeTab.value === 'armors') return Object.keys(armorConfig.sorters)
  return Object.keys(itemConfig.sorters)
})

// Only the active tab feeds the reveal so hidden tabs never grow in the background.
const activeList = computed<Array<{ id: string }>>(() => filters.value.filteredItems.value)
const scrollTarget = shallowRef<Window | null>(typeof window === 'undefined' ? null : window)
const { visibleItems } = useIncrementalReveal(activeList, scrollTarget, { pageSize: 18 })

const visibleWeapons = computed(() => visibleItems.value as CompendiumWeapon[])
const visibleArmors = computed(() => visibleItems.value as CompendiumArmor[])
const visibleItemsList = computed(() => visibleItems.value as CompendiumItem[])

const isLoading = computed(
  () => loading.value[activeTab.value] || (!loaded.value[activeTab.value] && !errors.value[activeTab.value])
)
const errorMessage = computed(() => errors.value[activeTab.value])

const searchQuery = computed({
  get: () => filters.value.searchQuery.value,
  set: (value: string) => { filters.value.searchQuery.value = value },
})
const sortBy = computed({
  get: () => filters.value.sortBy.value,
  set: (value: string) => { filters.value.sortBy.value = value },
})
const facetEntries = computed(() => Object.entries(filters.value.facetOptions.value))

const maxEncumbrance = computed({
  get: () => filters.value.maxEncumbrance.value,
  set: (value: number | null) => { filters.value.maxEncumbrance.value = value },
})

function loadActiveTab(force = false): Promise<void> {
  return store.loadTab(activeTab.value, force)
}

watch(activeTab, () => { void loadActiveTab() }, { immediate: true })
</script>

<template>
  <main class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium de l'inventaire</h1>
      <p class="opacity-80 text-sm mt-1">Armes, armures et équipements du Vieux Monde.</p>
    </header>

    <div role="tablist" class="tabs tabs-border px-4 pt-2">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeTab === tab.key }"
        :aria-selected="activeTab === tab.key"
        @click="selectTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <section class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 m-4 flex flex-col gap-4" aria-label="Filtres">
      <SearchInput v-model="searchQuery" placeholder="Rechercher par nom ou description..." />

      <div class="flex flex-wrap items-end gap-4">
        <label class="form-control">
          <span class="label-text text-xs font-semibold uppercase opacity-70">Trier par</span>
          <select v-model="sortBy" class="select select-sm">
            <option v-for="key in sortKeys" :key="key" :value="key">{{ SORT_LABELS[key] }}</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text text-xs font-semibold uppercase opacity-70">Encombrement max</span>
          <input
            v-model.number="maxEncumbrance"
            type="number"
            min="0"
            class="input input-sm w-28"
            :placeholder="String(filters.encumbranceBounds.value.max)"
          />
        </label>

        <button
          v-if="filters.activeFilterCount.value > 0"
          type="button"
          class="btn btn-sm btn-ghost gap-1"
          @click="filters.resetFilters()"
        >
          <RotateCcw class="size-4" aria-hidden="true" />
          Réinitialiser ({{ filters.activeFilterCount.value }})
        </button>
      </div>

      <fieldset v-for="[facet, options] in facetEntries" :key="facet" class="flex flex-col gap-1">
        <legend class="label-text text-xs font-semibold uppercase opacity-70">{{ facet }}</legend>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="option in options"
            :key="option.name"
            type="button"
            class="badge cursor-pointer"
            :class="filters.isFacetValueSelected(facet, option.name) ? 'badge-primary' : 'badge-outline'"
            :aria-pressed="filters.isFacetValueSelected(facet, option.name)"
            @click="filters.toggleFacetValue(facet, option.name)"
          >
            {{ option.name }} ({{ option.count }})
          </button>
        </div>
      </fieldset>
    </section>

    <div class="px-4 pb-8">
      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mb-4">
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn btn-sm" @click="loadActiveTab(true)">Réessayer</button>
      </div>

      <DataGrid
        v-else-if="activeTab === 'weapons'"
        :items="visibleWeapons"
        :loading="isLoading"
        empty-message="Aucune arme ne correspond à ta recherche."
      >
        <template #default="{ items: list }">
          <CompendiumEntryCard
            v-for="weapon in list"
            :key="weapon.id"
            :title="weapon.name"
            :encumbrance="weapon.encumbrance"
            :highlight="{ label: 'Dégâts', value: weapon.damageFormula }"
            :badges="weapon.attributes.map((attribute) => attribute.name)"
            :description="weapon.description"
          />
        </template>
      </DataGrid>

      <DataGrid
        v-else-if="activeTab === 'armors'"
        :items="visibleArmors"
        :loading="isLoading"
        empty-message="Aucune armure ne correspond à ta recherche."
      >
        <template #default="{ items: list }">
          <CompendiumEntryCard
            v-for="armor in list"
            :key="armor.id"
            :title="armor.name"
            :encumbrance="armor.encumbrance"
            :highlight="{ label: 'Points d\'armure', value: String(armor.armorPoints) }"
            :badges="[armor.category, ...armor.coveredLocations]"
            :description="armor.description"
          />
        </template>
      </DataGrid>

      <DataGrid
        v-else
        :items="visibleItemsList"
        :loading="isLoading"
        empty-message="Aucun équipement ne correspond à ta recherche."
      >
        <template #default="{ items: list }">
          <CompendiumEntryCard
            v-for="item in list"
            :key="item.id"
            :title="item.name"
            :encumbrance="item.encumbrance"
            :description="item.description"
          />
        </template>
      </DataGrid>
    </div>
  </main>
</template>
