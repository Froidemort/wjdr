<script setup lang="ts">
import { computed } from 'vue'
import type { MapMarker } from '../../types/map'
import SearchInput from '../ui/SearchInput.vue'

const query = defineModel<string>({ default: '' })

const props = defineProps<{
  results: MapMarker[]
}>()

const emit = defineEmits<{
  select: [marker: MapMarker]
}>()

const open = computed(() => query.value.trim().length > 0)

function pick(marker: MapMarker): void {
  emit('select', marker)
  query.value = ''
}
</script>

<template>
  <div class="relative w-full">
    <SearchInput v-model="query" placeholder="Rechercher un lieu" aria-label="Rechercher un lieu sur la carte" />
    <ul
      v-if="open"
      class="menu absolute inset-x-0 top-full z-10 mt-1 max-h-64 flex-nowrap overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1 shadow-lg"
      aria-label="Résultats de recherche"
    >
      <li v-for="marker in props.results" :key="marker.id">
        <button type="button" class="min-h-11" @click="pick(marker)">{{ marker.name }}</button>
      </li>
      <li v-if="props.results.length === 0" class="px-3 py-2 text-sm opacity-70">Aucun lieu trouvé.</li>
    </ul>
  </div>
</template>
