<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RotateCcw } from '@lucide/vue'
import { useCompendiumSkillsTalentsStore } from '../stores/compendiumSkillsTalents'
import { useCompendiumSkillFilters, type SkillTypeFilter } from '../composables/useCompendiumSkillFilters'
import { useIncrementalReveal } from '../composables/useIncrementalReveal'
import { formatNamedWithSpecialization } from '../utils/characterSheet'
import DataGrid from '../components/ui/DataGrid.vue'
import SearchInput from '../components/ui/SearchInput.vue'
import CompendiumEntryDialog from '../components/ui/CompendiumEntryDialog.vue'

const CHARACTERISTIC_LABELS: Record<string, string> = {
  CC: 'Capacité de Combat',
  CT: 'Capacité de Tir',
  F: 'Force',
  E: 'Endurance',
  AG: 'Agilité',
  INT: 'Intelligence',
  FM: 'Force Mentale',
  SOC: 'Sociabilité',
  A: 'Attaques',
  M: 'Mouvement',
  MAG: 'Magie',
}

const TYPE_OPTIONS: ReadonlyArray<{ key: SkillTypeFilter; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'basic', label: 'De base' },
  { key: 'advanced', label: 'Avancées' },
]

const route = useRoute()
const router = useRouter()
const store = useCompendiumSkillsTalentsStore()
const { skills, loading, loaded, errors } = storeToRefs(store)

const {
  searchQuery,
  typeFilter,
  characteristics,
  filteredSkills,
  activeFilterCount,
  toggleCharacteristic,
  isCharacteristicSelected,
  resetFilters,
} = useCompendiumSkillFilters({ skills })

const scrollTarget = shallowRef<Window | null>(typeof window === 'undefined' ? null : window)
const { visibleItems } = useIncrementalReveal(filteredSkills, scrollTarget, { pageSize: 18 })

const isLoading = computed(() => loading.value.skills || (!loaded.value.skills && !errors.value.skills))
const errorMessage = computed(() => errors.value.skills)

function characteristicLabel(code: string): string {
  return CHARACTERISTIC_LABELS[code] ?? code
}

const selectedSlug = computed(() => (typeof route.query.entry === 'string' ? route.query.entry : null))
const selectedSkill = computed(() => skills.value.find((skill) => skill.slug === selectedSlug.value) ?? null)

function openEntry(slug: string): void {
  void router.push({ query: { ...route.query, entry: slug } })
}

function closeEntry(): void {
  if (route.query.entry === undefined) return
  const { entry: _entry, ...rest } = route.query
  void router.replace({ query: rest })
}

const dialogBadges = computed(() =>
  selectedSkill.value
    ? [selectedSkill.value.isBasic ? 'De base' : 'Avancée', characteristicLabel(selectedSkill.value.statCode)]
    : []
)
const dialogRelated = computed(() =>
  (selectedSkill.value?.linkedTalents ?? []).map((talent) => ({
    id: talent.id,
    label: formatNamedWithSpecialization(talent.name, talent.specialization),
    to: { path: '/compendium/talents', query: { entry: talent.slug } },
  }))
)

void store.loadSkills()
</script>

<template>
  <main class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium des compétences</h1>
      <p class="opacity-80 text-sm mt-1">Compétences de base et avancées du Vieux Monde.</p>
    </header>

    <section class="border border-base-300 bg-base-200 rounded-box shadow-md p-4 m-4 flex flex-col gap-4" aria-label="Filtres">
      <SearchInput v-model="searchQuery" placeholder="Rechercher par nom, spécialisation ou description..." />

      <fieldset class="flex flex-col gap-1">
        <legend class="label-text text-xs font-semibold uppercase opacity-70">Type</legend>
        <div class="join">
          <button
            v-for="option in TYPE_OPTIONS"
            :key="option.key"
            type="button"
            class="btn btn-sm join-item"
            :class="{ 'btn-primary': typeFilter === option.key }"
            :aria-pressed="typeFilter === option.key"
            @click="typeFilter = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </fieldset>

      <fieldset v-if="characteristics.length" class="flex flex-col gap-1">
        <legend class="label-text text-xs font-semibold uppercase opacity-70">Caractéristique</legend>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="characteristic in characteristics"
            :key="characteristic.code"
            type="button"
            class="badge cursor-pointer"
            :class="isCharacteristicSelected(characteristic.code) ? 'badge-primary' : 'badge-outline'"
            :aria-pressed="isCharacteristicSelected(characteristic.code)"
            :title="characteristicLabel(characteristic.code)"
            @click="toggleCharacteristic(characteristic.code)"
          >
            {{ characteristic.code }} ({{ characteristic.count }})
          </button>
        </div>
      </fieldset>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 pt-2">
        <p class="text-sm opacity-70" aria-live="polite">{{ filteredSkills.length }} compétence(s) trouvée(s)</p>
        <button v-if="activeFilterCount > 0" type="button" class="btn btn-sm btn-ghost gap-1" @click="resetFilters">
          <RotateCcw class="size-4" aria-hidden="true" />
          Réinitialiser ({{ activeFilterCount }})
        </button>
      </div>
    </section>

    <div class="px-4 pb-8">
      <div v-if="errorMessage" role="alert" class="alert alert-error alert-soft mb-4">
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn btn-sm" @click="store.loadSkills(true)">Réessayer</button>
      </div>

      <DataGrid
        v-else
        :items="visibleItems"
        :loading="isLoading"
        empty-message="Aucune compétence ne correspond à ta recherche."
      >
        <template #default="{ items: list }">
          <button
            v-for="skill in list"
            :key="skill.id"
            type="button"
            class="card card-border bg-base-200 shadow-sm text-left w-full transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            @click="openEntry(skill.slug)"
          >
            <span class="card-body gap-2 p-4">
              <span class="card-title text-lg">{{ formatNamedWithSpecialization(skill.name, skill.specialization) }}</span>
              <span class="flex flex-wrap gap-1">
                <span class="badge badge-sm" :class="skill.isBasic ? 'badge-success' : 'badge-warning'">
                  {{ skill.isBasic ? 'De base' : 'Avancée' }}
                </span>
                <span class="badge badge-sm badge-outline" :title="characteristicLabel(skill.statCode)">{{ skill.statCode }}</span>
              </span>
              <span v-if="skill.description" class="text-sm opacity-80 line-clamp-3">{{ skill.description }}</span>
            </span>
          </button>
        </template>
      </DataGrid>
    </div>

    <CompendiumEntryDialog
      :open="selectedSkill !== null"
      :title="selectedSkill ? formatNamedWithSpecialization(selectedSkill.name, selectedSkill.specialization) : ''"
      :badges="dialogBadges"
      :description="selectedSkill?.description ?? null"
      related-label="Talents liés"
      :related="dialogRelated"
      @close="closeEntry"
    />
  </main>
</template>
