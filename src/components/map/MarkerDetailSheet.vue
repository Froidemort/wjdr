<script setup lang="ts">
import { Crosshair, Trash2, Pencil, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import type { MapMarker, MarkerType } from '../../types/map'
import { formatLatLng } from '../../utils/mapCoordinates'

const props = defineProps<{
  marker: MapMarker
  type: MarkerType | null
  canEdit: boolean
}>()

const emit = defineEmits<{
  close: []
  center: []
  edit: []
  remove: []
}>()

const VISIBILITY_LABELS = { mj: 'MJ uniquement', players: 'Tous les joueurs', private: 'Privé' } as const

const confirmingDelete = ref(false)

watch(
  () => props.marker.id,
  () => {
    confirmingDelete.value = false
  }
)
</script>

<template>
  <aside
    class="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-box border border-base-300 bg-base-100 p-4 shadow-xl lg:inset-x-auto lg:bottom-8 lg:right-4 lg:w-96 lg:rounded-box"
    aria-labelledby="marker-detail-title"
  >
    <header class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 id="marker-detail-title" class="truncate text-lg font-bold">{{ marker.name }}</h2>
        <p class="text-sm opacity-70">
          {{ type?.label ?? 'Lieu' }} · {{ formatLatLng(marker.lat, marker.lng) }}
        </p>
      </div>
      <button type="button" class="btn btn-ghost btn-square min-h-11 min-w-11" aria-label="Fermer" @click="emit('close')">
        <X class="size-5" aria-hidden="true" />
      </button>
    </header>

    <p v-if="marker.visibility" class="mt-2">
      <span class="badge badge-outline">{{ VISIBILITY_LABELS[marker.visibility] }}</span>
      <span v-if="marker.pending" class="badge badge-ghost ml-2">Enregistrement…</span>
    </p>
    <p v-if="marker.description" class="mt-3 whitespace-pre-line text-sm">{{ marker.description }}</p>

    <footer class="mt-4 flex flex-wrap gap-2">
      <button type="button" class="btn btn-sm min-h-11" @click="emit('center')">
        <Crosshair class="size-4" aria-hidden="true" />
        Centrer
      </button>
      <template v-if="canEdit && !marker.pending">
        <button type="button" class="btn btn-sm min-h-11" @click="emit('edit')">
          <Pencil class="size-4" aria-hidden="true" />
          Modifier
        </button>
        <button v-if="!confirmingDelete" type="button" class="btn btn-sm btn-outline btn-error min-h-11" @click="confirmingDelete = true">
          <Trash2 class="size-4" aria-hidden="true" />
          Supprimer
        </button>
        <button v-else type="button" class="btn btn-sm btn-error min-h-11" @click="emit('remove')">Confirmer la suppression</button>
      </template>
    </footer>
  </aside>
</template>
