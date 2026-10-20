<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLeafletMap, type MapPin } from '../../composables/useLeafletMap'
import type { City } from '../../types/cities'
import type { MapFlyTarget } from '../../types/map'

const props = defineProps<{
  pins: MapPin[]
  cities?: City[]
  showCities?: boolean
  selectedCityId?: number | null
  flyTarget: MapFlyTarget | null
}>()

const emit = defineEmits<{
  select: [id: string]
  selectCity: [id: number]
  contextmenu: [lat: number, lng: number]
}>()

const container = ref<HTMLElement | null>(null)
const { ready, error, authRequired, setPins, setCities, setCitiesVisible, setSelectedCity, flyTo } = useLeafletMap(container, {
  onSelect: (id) => emit('select', id),
  onCitySelect: (id) => emit('selectCity', id),
  onContextMenu: (lat, lng) => emit('contextmenu', lat, lng),
})

watch([() => props.pins, ready], () => setPins(props.pins), { immediate: true })
watch([() => props.cities, ready], () => setCities(props.cities ?? []), { immediate: true })
watch([() => props.showCities, ready], () => setCitiesVisible(props.showCities ?? true), { immediate: true })
watch([() => props.selectedCityId, ready], () => setSelectedCity(props.selectedCityId ?? null), { immediate: true })
watch(
  () => props.flyTarget,
  (target) => {
    if (target) flyTo(target.lat, target.lng, target.zoom)
  }
)
</script>

<template>
  <div class="relative isolate size-full bg-base-300">
    <div ref="container" class="size-full" role="application" aria-label="Carte du Vieux Monde" />
    <div v-if="!ready && !error" class="absolute inset-0 flex items-center justify-center">
      <span class="loading loading-spinner loading-lg text-primary" aria-label="Chargement de la carte" />
    </div>
    <div v-if="authRequired" role="alert" class="alert alert-info absolute inset-x-4 top-20 z-20 sm:inset-x-auto sm:right-4 sm:w-96">
      <span>Connecte-toi pour afficher le fond de carte. Les lieux restent visibles.</span>
    </div>
    <div v-if="error" role="alert" class="alert alert-warning absolute inset-x-4 top-20 z-20">
      <span>{{ error }}</span>
    </div>
  </div>
</template>
