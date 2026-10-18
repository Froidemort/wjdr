<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RotateCcw } from '@lucide/vue'
import { useCompendiumSkillsTalentsStore } from '../stores/compendiumSkillsTalents'
import { useCompendiumTalentFilters } from '../composables/useCompendiumTalentFilters'
import { useIncrementalReveal } from '../composables/useIncrementalReveal'
import { formatNamedWithSpecialization } from '../utils/characterSheet'
import DataGrid from '../components/ui/DataGrid.vue'
import SearchInput from '../components/ui/SearchInput.vue'
import CompendiumEntryDialog from '../components/ui/CompendiumEntryDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useCompendiumSkillsTalentsStore()
const { talents, loading, loaded, errors } = storeToRefs(store)

const { searchQuery, onlySpecialized, filteredTalents, activeFilterCount, resetFilters } =
  useCompendiumTalentFilters({ talents })

const scrollTarget = shallowRef<Window | null>(typeof window === 'undefined' ? null : window)
const { visibleItems } = useIncrementalReveal(filteredTalents, scrollTarget, { pageSize: 18 })

const isLoading = computed(() => loading.value.talents || (!loaded.value.talents && !errors.value.talents))
const errorMessage = computed(() => errors.value.talents)

const selectedSlug = computed(() => (typeof route.query.entry === 'string' ? route.query.entry : null))
const selectedTalent = computed(() => talents.value.find((talent) => talent.slug === selectedSlug.value) ?? null)

function openEntry(slug: string): void {
  void router.push({ query: { ...route.query, entry: slug } })
}

function closeEntry(): void {
  if (route.query.entry === undefined) return
  const { entry: _entry, ...rest } = route.query
  void router.replace({ query: rest })
}

const dialogBadges = computed(() =>
  selectedTalent.value?.specialization ? [selectedTalent.value.specialization] : []
)
const dialogRelated = computed(() =>
  (selectedTalent.value?.linkedSkills ?? []).map((skill) => ({
    id: skill.id,
    label: formatNamedWithSpecialization(skill.name, skill.specialization),
    to: { path: '/compendium/skills', query: { entry: skill.slug } },
  }))
)

void store.loadTalents()
</script>

<template>
  <main class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium des talents</h1>
      <p class="opacity-80 text-sm mt-1">Talents et aptitudes spéciales du Vieux Monde.</p>
    </header>

    <section class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 m-4 flex flex-col gap-4" aria-label="Filtres">
      <SearchInput v-model="searchQuery" placeholder="Rechercher par nom, spécialisation ou description..." />

      <label class="label cursor-pointer justify-start gap-2">
        <input v-model="onlySpecialized" type="checkbox" class="checkbox checkbox-sm" />
        <span class="label-text">Avec spécialisation uniquement</span>
      </label>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-2">
        <p class="text-sm opacity-70" aria-live="polite">{{ filteredTalents.length }} talent(s) trouvé(s)</p>
        <button v-if="activeFilterCount > 0" type="button" class="btn btn-sm btn-ghost gap-1" @click="resetFilters">
          <RotateCcw class="size-4" aria-hidden="true" />
          Réinitialiser ({{ activeFilterCount }})
        </button>
      </div>
    </section>

    <div class="px-4 pb-8">
      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mb-4">
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn btn-sm" @click="store.loadTalents(true)">Réessayer</button>
      </div>

      <DataGrid
        v-else
        :items="visibleItems"
        :loading="isLoading"
        empty-message="Aucun talent ne correspond à ta recherche."
      >
        <template #default="{ items: list }">
          <button
            v-for="talent in list"
            :key="talent.id"
            type="button"
            class="card card-border bg-base-200 shadow-sm text-left w-full transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            @click="openEntry(talent.slug)"
          >
            <span class="card-body gap-2 p-4">
              <span class="card-title text-lg">{{ formatNamedWithSpecialization(talent.name, talent.specialization) }}</span>
              <span v-if="talent.description" class="text-sm opacity-80 line-clamp-3">{{ talent.description }}</span>
            </span>
          </button>
        </template>
      </DataGrid>
    </div>

    <CompendiumEntryDialog
      :open="selectedTalent !== null"
      :title="selectedTalent ? formatNamedWithSpecialization(selectedTalent.name, selectedTalent.specialization) : ''"
      :badges="dialogBadges"
      :description="selectedTalent?.description ?? null"
      related-label="Compétences liées"
      :related="dialogRelated"
      @close="closeEntry"
    />
  </main>
</template>
