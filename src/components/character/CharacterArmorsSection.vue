<script setup lang="ts">
import { Plus, Shield, Trash2, Weight } from '@lucide/vue'
import { useNetwork } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { CharacterArmor } from '../../types/domain'
import {
  ITEM_QUALITY_STATE_OPTIONS,
  qualityBadgeClass,
} from '../../utils/inventoryQuality'
import StateCycleBadge from '../ui/StateCycleBadge.vue'
import CharacterSection from './CharacterSection.vue'

const props = defineProps<{
  armors: CharacterArmor[]
  editable: boolean
  busyKey: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  add: []
  delete: [linkId: string]
  'quality-change': [armor: CharacterArmor, value: string | boolean | null]
}>()

const { isOnline } = useNetwork()

const filter = ref<'all' | 'equipped' | 'inventory'>('all')
const filters = [
  { id: 'all', label: 'Toutes' },
  { id: 'equipped', label: 'Équipées' },
  { id: 'inventory', label: 'Inventaire' },
] as const

const stats = computed(() => ({
  total: props.armors.length,
  equipped: props.armors.filter((armor) => armor.isEquipped).length,
}))
const filtered = computed(() => {
  if (filter.value === 'all') {
    return props.armors
  }

  return props.armors.filter((armor) =>
    filter.value === 'equipped' ? armor.isEquipped : !armor.isEquipped
  )
})
</script>

<template>
  <CharacterSection title="Armures" collapsed>
    <div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm">
      <span>{{ successMessage }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-outline">Total: {{ stats.total }}</span>
      <span class="badge badge-outline">Équipées: {{ stats.equipped }}</span>
      <span class="badge badge-outline">Inventaire: {{ stats.total - stats.equipped }}</span>
    </div>
    <div class="join join-vertical sm:join-horizontal">
      <button
        v-for="option in filters"
        :key="option.id"
        class="btn btn-xs min-h-11 ui-critical-action join-item"
        :class="filter === option.id ? 'btn-active' : ''"
        @click="filter = option.id"
      >
        {{ option.label }}
      </button>
    </div>
    <div v-if="editable" class="flex justify-start">
      <button
        class="btn btn-sm btn-square min-h-11 min-w-11"
        aria-label="Ajouter des armures"
        :disabled="!isOnline"
        :title="isOnline ? undefined : 'Indisponible hors ligne'"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="armors.length === 0" class="text-sm opacity-70">Aucune armure.</p>
    <p v-else-if="filtered.length === 0" class="text-sm opacity-70">Aucune armure pour ce filtre.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <article
        v-for="armor in filtered"
        :key="armor.id"
        v-memo="[armor.isEquipped, armor.quality, editable]"
        class="card border border-base-300 bg-base-100 transition-colors hover:border-primary"
      >
        <div class="card-body gap-2 p-3">
          <div class="flex items-start justify-between gap-2">
            <h4 class="min-w-0 flex-1 break-words font-semibold leading-tight">{{ armor.name }}</h4>
            <button
              v-if="editable"
              class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
              :disabled="Boolean(busyKey)"
              :aria-busy="busyKey === `armor-${armor.id}` ? 'true' : 'false'"
              :aria-label="`Supprimer ${armor.name}`"
              @click="emit('delete', armor.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <p v-if="armor.description" class="text-sm opacity-70">{{ armor.description }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-sm" :class="armor.isEquipped ? 'badge-success' : 'badge-outline'">
              {{ armor.isEquipped ? 'Équipée' : 'Inventaire' }}
            </span>
            <StateCycleBadge
              v-if="editable"
              :value="armor.quality"
              :options="ITEM_QUALITY_STATE_OPTIONS"
              @change="emit('quality-change', armor, $event)"
            />
            <span v-else class="badge badge-sm" :class="qualityBadgeClass(armor.quality)">{{ armor.quality || 'normal' }}</span>
            <span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ armor.encumbrance }}</span>
            <span class="badge badge-sm badge-outline gap-1"><Shield class="h-3 w-3" /> {{ armor.armorPoints }}</span>
            <span v-if="armor.coveredLocations?.length" class="w-full break-words text-xs opacity-75">
              {{ armor.coveredLocations.join(', ') }}
            </span>
          </div>
        </div>
      </article>
    </div>
  </CharacterSection>
</template>
