<script setup lang="ts">
import { Crosshair, X } from '@lucide/vue'
import type { City } from '../../types/cities'

defineProps<{
  city: City
}>()

const emit = defineEmits<{
  close: []
  center: []
}>()
</script>

<template>
  <aside
    class="absolute inset-x-2 bottom-2 z-20 max-h-[min(60%,calc(100%-5rem))] overflow-y-auto overscroll-contain rounded-box border border-base-300 bg-base-100 p-4 shadow-xl lg:inset-x-auto lg:bottom-8 lg:right-4 lg:w-96"
    aria-labelledby="city-detail-title"
  >
    <header class="sticky -top-4 z-10 -mx-4 -mt-4 flex items-start justify-between gap-2 bg-base-100 p-4 pb-2">
      <div class="min-w-0">
        <h2 id="city-detail-title" class="truncate text-lg font-bold">{{ city.name }}</h2>
        <p v-if="city.region" class="text-sm opacity-70">{{ city.region }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-square min-h-11 min-w-11" aria-label="Fermer" @click="emit('close')">
        <X class="size-5" aria-hidden="true" />
      </button>
    </header>

    <p class="mt-3 flex flex-wrap gap-2">
      <span v-if="city.type" class="badge badge-outline">{{ city.type }}</span>
      <span v-if="city.population" class="badge badge-ghost">{{ city.population.toLocaleString('fr-FR') }} habitants</span>
    </p>

    <footer class="mt-4">
      <button type="button" class="btn btn-sm min-h-11" @click="emit('center')">
        <Crosshair class="size-4" aria-hidden="true" />
        Centrer
      </button>
    </footer>
  </aside>
</template>
