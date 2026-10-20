<script setup lang="ts">
import { resolveMarkerIcon } from '../../config/mapMarkerIcons'
import type { MapPrefetchState } from '../../composables/useMapTilePrefetch'
import type { MarkerType } from '../../types/map'

const showCampaign = defineModel<boolean>('showCampaign', { required: true })
const showCities = defineModel<boolean>('showCities', { default: true })

defineProps<{
  types: MarkerType[]
  hiddenTypeIds: string[]
  cityTypes?: string[]
  hiddenCityTypes?: string[]
  hasCampaign: boolean
  prefetch?: MapPrefetchState
}>()

defineEmits<{
  toggleType: [typeId: string]
  toggleCityType: [cityType: string]
  prefetch: []
  cancelPrefetch: []
}>()
</script>

<template>
  <section class="flex flex-col gap-5 p-4" aria-labelledby="map-layers-title">
    <h2 id="map-layers-title" class="text-lg font-bold">Le Vieux Monde</h2>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">Calques</legend>
      <label class="label min-h-11 cursor-pointer justify-between gap-3">
        <span>Points d'intérêt</span>
        <input v-model="showCities" type="checkbox" class="toggle toggle-primary" />
      </label>
      <div
        v-if="cityTypes?.length || types.length"
        role="group"
        aria-label="Filtres par type de lieu"
        class="ms-2 flex flex-col border-s border-base-300 ps-3"
        :class="{ 'opacity-50': !showCities }"
      >
        <label v-for="cityType in cityTypes" :key="`city-${cityType}`" class="label min-h-11 justify-start gap-3" :class="showCities ? 'cursor-pointer' : ''">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="!hiddenCityTypes?.includes(cityType)"
            :disabled="!showCities"
            @change="$emit('toggleCityType', cityType)"
          />
          <span>{{ cityType }}</span>
        </label>
        <label v-for="type in types" :key="type.id" class="label min-h-11 justify-start gap-3" :class="showCities ? 'cursor-pointer' : ''">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            :checked="!hiddenTypeIds.includes(type.id)"
            :disabled="!showCities"
            @change="$emit('toggleType', type.id)"
          />
          <component :is="resolveMarkerIcon(type.icon)" class="size-4" :style="{ color: type.color ?? undefined }" aria-hidden="true" />
          <span>{{ type.label }}</span>
        </label>
      </div>
      <label class="label min-h-11 justify-between gap-3" :class="hasCampaign ? 'cursor-pointer' : 'opacity-50'">
        <span>Marqueurs de campagne</span>
        <input v-model="showCampaign" type="checkbox" class="toggle toggle-primary" :disabled="!hasCampaign" />
      </label>
      <p v-if="!hasCampaign" class="text-xs opacity-70">Connecte-toi et choisis une campagne pour afficher ses marqueurs.</p>
    </fieldset>

    <section v-if="prefetch" class="flex flex-col gap-2" aria-labelledby="map-offline-title">
      <p id="map-offline-title" class="text-xs font-bold uppercase tracking-wider opacity-70">Carte hors ligne</p>
      <progress v-if="prefetch.running" class="progress progress-primary w-full" :value="prefetch.done" :max="prefetch.total" />
      <p v-if="prefetch.running" class="text-xs opacity-70" role="status">{{ prefetch.done }} / {{ prefetch.total }} tuiles</p>
      <button v-if="!prefetch.running" type="button" class="btn btn-sm min-h-11" @click="$emit('prefetch')">Précharger la carte</button>
      <button v-else type="button" class="btn btn-sm btn-outline min-h-11" @click="$emit('cancelPrefetch')">Annuler</button>
      <p v-if="prefetch.message && !prefetch.running" class="text-xs opacity-70" role="status">{{ prefetch.message }}</p>
    </section>
  </section>
</template>
