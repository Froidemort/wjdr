<script setup lang="ts">
import { RotateCcw } from '@lucide/vue'
import { computed } from 'vue'
import type { CareerGraphMode } from '../../composables/useCareerGraph'
import SearchSelect from '../ui/SearchSelect.vue'

const MODES: { value: CareerGraphMode; label: string }[] = [
  { value: 'chemin', label: 'Chemin' },
  { value: 'vers', label: 'Vers' },
  { value: 'depuis', label: 'Depuis' },
]

const mode = defineModel<CareerGraphMode>('mode', { required: true })
const start = defineModel<string>('start', { required: true })
const end = defineModel<string>('end', { required: true })

const props = defineProps<{
  careers: { id: string; name: string }[]
  noPathFound?: boolean
}>()

defineEmits<{
  reset: []
}>()

const options = computed(() => props.careers.map((career) => ({ id: career.id, label: career.name })))
</script>

<template>
  <section class="flex flex-col gap-5 p-4" aria-labelledby="career-options-title">
    <h2 id="career-options-title" class="text-lg font-bold">Carrières</h2>

    <fieldset class="flex flex-col gap-2">
      <legend class="mb-1 text-xs font-bold uppercase tracking-wider opacity-70">Mode d'affichage</legend>
      <div class="join w-full" role="group" aria-label="Mode d'affichage">
        <button
          v-for="option in MODES"
          :key="option.value"
          type="button"
          class="btn join-item min-h-11 flex-1"
          :class="mode === option.value ? 'btn-primary' : 'btn-ghost'"
          :aria-pressed="mode === option.value"
          @click="mode = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </fieldset>

    <div class="flex flex-col gap-4">
      <SearchSelect v-if="mode !== 'vers'" v-model="start" :options="options" label="Départ" placeholder="Rechercher une carrière" />
      <SearchSelect v-if="mode !== 'depuis'" v-model="end" :options="options" label="Arrivée" placeholder="Rechercher une carrière" />
      <p v-if="noPathFound" role="alert" class="alert alert-warning alert-soft py-2 text-sm">Aucun chemin possible entre ces deux carrières.</p>
    </div>

    <button type="button" class="btn btn-outline min-h-11 gap-2" @click="$emit('reset')">
      <RotateCcw class="size-4" aria-hidden="true" />
      Réinitialiser
    </button>
  </section>
</template>
