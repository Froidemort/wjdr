<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLeafletMap, type MapPin } from '../../composables/useLeafletMap'
import type { MapFlyTarget } from '../../types/map'

const props = defineProps<{
  pins: MapPin[]
  flyTarget: MapFlyTarget | null
}>()

const emit = defineEmits<{
  select: [id: string]
  contextmenu: [lat: number, lng: number]
}>()

const container = ref<HTMLElement | null>(null)
const { ready, error, setPins, flyTo } = useLeafletMap(container, {
  onSelect: (id) => emit('select', id),
  onContextMenu: (lat, lng) => emit('contextmenu', lat, lng),
})

watch([() => props.pins, ready], () => setPins(props.pins), { immediate: true })
watch(
  () => props.flyTarget,
  (target) => {
    if (target) flyTo(target.lat, target.lng, target.zoom)
  }
)
</script>

<template>
  <div class="relative size-full bg-base-300">
    <div ref="container" class="size-full" role="application" aria-label="Carte du Vieux Monde" />
    <div v-if="!ready && !error" class="absolute inset-0 flex items-center justify-center">
      <span class="loading loading-spinner loading-lg text-primary" aria-label="Chargement de la carte" />
    </div>
    <div v-if="error" role="alert" class="alert alert-warning absolute inset-x-4 top-4 z-[1000]">
      <span>{{ error }}</span>
    </div>
  </div>
</template>
