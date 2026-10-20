<script setup lang="ts">
import { Info, Plus, Trash2, Weight } from '@lucide/vue'
import { useNetwork } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { CharacterItem } from '../../types/domain'
import {
  ITEM_QUALITY_STATE_OPTIONS,
  qualityBadgeClass,
} from '../../utils/inventoryQuality'
import SearchInput from '../ui/SearchInput.vue'
import StateCycleBadge from '../ui/StateCycleBadge.vue'
import CharacterSection from './CharacterSection.vue'

type QualityFilter = 'all' | 'médiocre' | 'normal' | 'bonne' | 'exceptionelle'

const props = defineProps<{
  items: CharacterItem[]
  editable: boolean
  busyKey: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  add: []
  delete: [linkId: string]
  'quality-change': [item: CharacterItem, value: string | boolean | null]
  'quantity-change': [item: CharacterItem, delta: number]
  'show-description': [title: string, description: string | null]
}>()

const { isOnline } = useNetwork()

const qualityFilter = ref<QualityFilter>('all')
const query = ref('')
const filters = [
  { id: 'all', label: 'Toutes' },
  { id: 'normal', label: 'Normal' },
  { id: 'bonne', label: 'Bonne' },
] as const

const stats = computed(() => ({
  total: props.items.length,
  mediocre: props.items.filter((item) => item.quality === 'médiocre').length,
  normal: props.items.filter((item) => item.quality === 'normal').length,
  good: props.items.filter((item) => item.quality === 'bonne').length,
  exceptional: props.items.filter((item) => item.quality === 'exceptionelle').length,
}))
const filtered = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  return props.items.filter((item) => {
    const qualityMatch =
      qualityFilter.value === 'all' || item.quality.trim().toLowerCase() === qualityFilter.value
    const queryMatch =
      normalizedQuery.length === 0 ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      (item.description ?? '').toLowerCase().includes(normalizedQuery)

    return qualityMatch && queryMatch
  })
})
</script>

<template>
  <CharacterSection title="Équipements" collapsed>
    <div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm">
      <span>{{ successMessage }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-outline">Total: {{ stats.total }}</span>
      <span class="badge badge-outline">Médiocre: {{ stats.mediocre }}</span>
      <span class="badge badge-outline">Normal: {{ stats.normal }}</span>
      <span class="badge badge-outline">Bonne: {{ stats.good }}</span>
      <span class="badge badge-outline">Exceptionelle: {{ stats.exceptional }}</span>
    </div>
    <div class="grid gap-2">
      <div class="join join-vertical sm:join-horizontal">
        <button
          v-for="option in filters"
          :key="option.id"
          class="btn btn-xs min-h-11 ui-critical-action join-item"
          :class="qualityFilter === option.id ? 'btn-active' : ''"
          @click="qualityFilter = option.id"
        >
          {{ option.label }}
        </button>
      </div>
      <SearchInput v-model="query" placeholder="Filtrer les équipements" aria-label="Filtrer les équipements" />
    </div>
    <div v-if="editable" class="flex justify-start">
      <button
        class="btn btn-sm btn-square min-h-11 min-w-11"
        aria-label="Ajouter des équipements"
        :disabled="!isOnline"
        :title="isOnline ? undefined : 'Indisponible hors ligne'"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="items.length === 0" class="text-sm opacity-70">Aucun équipement.</p>
    <p v-else-if="filtered.length === 0" class="text-sm opacity-70">Aucun équipement pour ce filtre.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <article
        v-for="item in filtered"
        :key="item.id"
        v-memo="[item.quantity, item.quality, editable]"
        class="card border border-base-300 bg-base-100 transition-colors hover:border-primary"
      >
        <div class="card-body gap-2 p-3">
          <div class="flex items-start justify-between gap-2">
            <h4 class="min-w-0 flex-1 break-words font-semibold leading-tight">{{ item.name }}</h4>
            <div class="flex items-center gap-1">
              <button
                v-if="item.description"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
                aria-label="Afficher la description de l'équipement"
                @click="emit('show-description', item.name, item.description)"
              >
                <Info class="h-4 w-4" />
              </button>
              <button
                v-if="editable"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11 text-error"
                aria-label="Retirer l'équipement de l'inventaire"
                :disabled="Boolean(busyKey)"
                :aria-busy="busyKey === `item-${item.id}` ? 'true' : 'false'"
                @click="emit('delete', item.id)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div class="flex flex-wrap gap-1">
            <StateCycleBadge
              v-if="editable"
              :value="item.quality"
              :options="ITEM_QUALITY_STATE_OPTIONS"
              @change="emit('quality-change', item, $event)"
            />
            <span v-else class="badge badge-sm" :class="qualityBadgeClass(item.quality)">{{ item.quality || 'normal' }}</span>
            <span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ item.encumbrance }}</span>
            <div v-if="editable" class="join items-stretch">
              <button
                class="btn btn-sm join-item h-11 min-h-11 min-w-11 px-3 text-base font-semibold leading-none"
                :disabled="item.quantity <= 1 || Boolean(busyKey)"
                :aria-busy="busyKey === `item-qty-${item.id}` ? 'true' : 'false'"
                aria-label="Réduire la quantité"
                @click="emit('quantity-change', item, -1)"
              >
                -
              </button>
              <span class="join-item inline-flex h-11 min-h-11 min-w-12 items-center justify-center border-none bg-secondary px-3 text-sm font-bold tracking-wide text-secondary-content">
                x{{ item.quantity }}
              </span>
              <button
                class="btn btn-sm join-item h-11 min-h-11 min-w-11 px-3 text-base font-semibold leading-none"
                :disabled="Boolean(busyKey)"
                :aria-busy="busyKey === `item-qty-${item.id}` ? 'true' : 'false'"
                aria-label="Augmenter la quantité"
                @click="emit('quantity-change', item, 1)"
              >
                +
              </button>
            </div>
            <span v-else class="badge badge-sm badge-secondary font-bold tracking-wide text-secondary-content">x{{ item.quantity }}</span>
          </div>
        </div>
      </article>
    </div>
  </CharacterSection>
</template>
