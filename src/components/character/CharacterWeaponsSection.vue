<script setup lang="ts">
import { Plus, Sword, Trash2, Weight } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { CharacterWeapon } from '../../types/domain'
import {
  ITEM_QUALITY_STATE_OPTIONS,
  qualityBadgeClass,
} from '../../utils/inventoryQuality'
import StateCycleBadge from '../ui/StateCycleBadge.vue'
import CharacterSection from './CharacterSection.vue'

const props = defineProps<{
  weapons: CharacterWeapon[]
  editable: boolean
  busyKey: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  add: []
  delete: [linkId: string]
  'quality-change': [weapon: CharacterWeapon, value: string | boolean | null]
}>()

const HAND_LABELS: Record<string, string> = {
  'd&g': 'Équipée',
  droite: 'Droite',
  gauche: 'Gauche',
}

const filter = ref<'all' | 'equipped' | 'inventory'>('all')
const filters = [
  { id: 'all', label: 'Toutes' },
  { id: 'equipped', label: 'Equipees' },
  { id: 'inventory', label: 'Inventaire' },
] as const

const stats = computed(() => ({
  total: props.weapons.length,
  equipped: props.weapons.filter((weapon) => weapon.equipped !== null).length,
}))
const filtered = computed(() => {
  if (filter.value === 'all') {
    return props.weapons
  }

  return props.weapons.filter((weapon) =>
    filter.value === 'equipped' ? weapon.equipped !== null : weapon.equipped === null
  )
})

function attributesKey(weapon: CharacterWeapon): string {
  return weapon.attributes.length === 0 ? 'none' : weapon.attributes.map((a) => a.id).join('|')
}
</script>

<template>
  <CharacterSection title="Armes">
    <div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm">
      <span>{{ successMessage }}</span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="badge badge-outline">Total: {{ stats.total }}</span>
      <span class="badge badge-outline">Equipees: {{ stats.equipped }}</span>
      <span class="badge badge-outline">Inventaire: {{ stats.total - stats.equipped }}</span>
    </div>
    <div class="join join-vertical sm:join-horizontal">
      <button
        v-for="option in filters"
        :key="option.id"
        class="btn btn-xs ui-critical-action join-item"
        :class="filter === option.id ? 'btn-active' : ''"
        @click="filter = option.id"
      >
        {{ option.label }}
      </button>
    </div>
    <div v-if="editable" class="flex justify-start">
      <button
        class="btn btn-sm btn-square min-h-11 min-w-11"
        aria-label="Ajouter des armes"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="weapons.length === 0" class="text-sm opacity-70">Aucune arme.</p>
    <p v-else-if="filtered.length === 0" class="text-sm opacity-70">Aucune arme pour ce filtre.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <article
        v-for="weapon in filtered"
        :key="weapon.id"
        v-memo="[weapon.equipped, weapon.quality, attributesKey(weapon), editable]"
        class="card border border-base-300 bg-base-100 transition-colors hover:border-primary"
      >
        <div class="card-body gap-2 p-3">
          <div class="flex items-start justify-between gap-2">
            <h4 class="min-w-0 flex-1 break-words font-semibold leading-tight">{{ weapon.name }}</h4>
            <button
              v-if="editable"
              class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
              :disabled="Boolean(busyKey)"
              :aria-busy="busyKey === `weapon-${weapon.id}` ? 'true' : 'false'"
              :aria-label="`Supprimer ${weapon.name}`"
              @click="emit('delete', weapon.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
          <p v-if="weapon.description" class="text-sm opacity-70">{{ weapon.description }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-sm" :class="weapon.equipped ? 'badge-secondary' : 'badge-outline'">
              {{ weapon.equipped ? HAND_LABELS[weapon.equipped] : 'Inventaire' }}
            </span>
            <StateCycleBadge
              v-if="editable"
              :value="weapon.quality"
              :options="ITEM_QUALITY_STATE_OPTIONS"
              @change="emit('quality-change', weapon, $event)"
            />
            <span v-else class="badge badge-sm" :class="qualityBadgeClass(weapon.quality)">{{ weapon.quality || 'normal' }}</span>
            <span class="badge badge-sm badge-outline gap-1"><Weight class="h-3 w-3" /> {{ weapon.encumbrance }}</span>
            <span v-if="weapon.damageFormula" class="badge badge-sm badge-outline gap-1">
              <Sword class="h-3 w-3" /> {{ weapon.damageFormula }}
            </span>
          </div>
          <details
            v-if="weapon.attributes.length > 0"
            class="collapse collapse-arrow rounded-box border border-base-300 bg-base-200/40"
          >
            <summary class="collapse-title min-h-11 py-2 text-sm font-medium">
              Attributs de l arme ({{ weapon.attributes.length }})
            </summary>
            <div class="collapse-content pt-1">
              <div class="flex flex-wrap gap-1.5">
                <span v-for="attribute in weapon.attributes" :key="attribute.id" class="badge badge-sm badge-outline">
                  {{ attribute.name }}
                </span>
              </div>
            </div>
          </details>
        </div>
      </article>
    </div>
  </CharacterSection>
</template>
