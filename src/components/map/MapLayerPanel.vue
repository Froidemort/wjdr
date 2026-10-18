<script setup lang="ts">
import { resolveMarkerIcon } from '../../config/mapMarkerIcons'
import type { MarkerType } from '../../types/map'

const showBase = defineModel<boolean>('showBase', { required: true })
const showCampaign = defineModel<boolean>('showCampaign', { required: true })

defineProps<{
  types: MarkerType[]
  hiddenTypeIds: string[]
  hasCampaign: boolean
}>()

defineEmits<{
  toggleType: [typeId: string]
}>()
</script>

<template>
  <section class="flex flex-col gap-5 p-4" aria-labelledby="map-layers-title">
    <h2 id="map-layers-title" class="text-lg font-bold">Calques</h2>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">Couches</legend>
      <label class="label min-h-11 cursor-pointer justify-between gap-3">
        <span>Carte du Vieux Monde</span>
        <input v-model="showBase" type="checkbox" class="toggle toggle-primary" />
      </label>
      <label class="label min-h-11 justify-between gap-3" :class="hasCampaign ? 'cursor-pointer' : 'opacity-50'">
        <span>Marqueurs de campagne</span>
        <input v-model="showCampaign" type="checkbox" class="toggle toggle-primary" :disabled="!hasCampaign" />
      </label>
      <p v-if="!hasCampaign" class="text-xs opacity-70">Connecte-toi et choisis une campagne pour afficher ses marqueurs.</p>
    </fieldset>

    <fieldset class="flex flex-col gap-1">
      <legend class="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">Types</legend>
      <label v-for="type in types" :key="type.id" class="label min-h-11 cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          :checked="!hiddenTypeIds.includes(type.id)"
          @change="$emit('toggleType', type.id)"
        />
        <component :is="resolveMarkerIcon(type.icon)" class="size-4" :style="{ color: type.color ?? undefined }" aria-hidden="true" />
        <span>{{ type.label }}</span>
      </label>
    </fieldset>
  </section>
</template>
