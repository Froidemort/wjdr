<script setup lang="ts">
import { ChevronDown, Hospital, Mars, ScrollText, UserPen, Venus } from '@lucide/vue'
import { ref } from 'vue'
import type { CharacterGender, CharacterRace } from '../../types/character'
import type { CharacterQuickField, CharacterQuickValues } from '../../types/characterSheet'
import CharacterValueCard from '../ui/CharacterValueCard.vue'
import FortuneClover from '../ui/FortuneClover.vue'
import HealthHeart from '../ui/HealthHeart.vue'
import CharacterVitalStepper from './CharacterVitalStepper.vue'

defineProps<{
  name: string
  race: CharacterRace
  gender: CharacterGender
  careerName: string | null
  values: CharacterQuickValues
  editable: boolean
}>()

const emit = defineEmits<{
  'edit-career': []
  'quick-change': [field: CharacterQuickField, value: number]
}>()

const detailsOpen = ref(false)
</script>

<template>
  <header
    class="sticky top-14 z-30 -mx-4 border-b border-base-300 bg-base-100/95 px-4 py-2 backdrop-blur sm:top-(--grim-nav-height) sm:mx-0 sm:rounded-box sm:border sm:px-4"
    data-testid="character-summary"
  >
    <div class="flex items-center gap-2">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-lg font-black leading-tight sm:text-xl">{{ name }}</h1>
        <p class="flex items-center gap-1.5 truncate text-sm opacity-85">
          <component :is="gender === 'masculin' ? Mars : Venus" class="h-4 w-4 shrink-0 opacity-75" />
          <span class="capitalize">{{ race }}</span>
          <span aria-hidden="true">·</span>
          <span class="truncate">{{ careerName || 'Inconnue' }}</span>
          <span v-if="!editable" class="badge badge-neutral badge-sm shrink-0">Lecture seule</span>
        </p>
      </div>
      <button
        v-if="editable"
        type="button"
        class="btn btn-accent btn-square min-h-11 min-w-11"
        aria-label="Modifier la carrière"
        @click="emit('edit-career')"
      >
        <UserPen :size="22" stroke-width="1.5" />
      </button>
    </div>

    <div class="mt-2 grid grid-cols-3 gap-1.5">
      <CharacterVitalStepper
        label="PV"
        :value="values.pvCurrent"
        :max="values.pvMax"
        :editable="editable"
        tone-class="text-error"
        @update:value="emit('quick-change', 'pvCurrent', $event)"
      />
      <CharacterVitalStepper
        label="Fortune"
        :value="values.fortuneCurrent"
        :max="values.fortuneMax"
        :editable="editable"
        tone-class="text-success"
        @update:value="emit('quick-change', 'fortuneCurrent', $event)"
      />
      <CharacterVitalStepper
        label="Destin"
        :value="values.destinyCurrent"
        :max="values.destinyMax"
        :editable="editable"
        tone-class="text-warning"
        @update:value="emit('quick-change', 'destinyCurrent', $event)"
      />
    </div>

    <button
      type="button"
      class="btn btn-ghost btn-sm mt-1 min-h-11 w-full justify-between"
      :aria-expanded="detailsOpen"
      aria-controls="character-summary-details"
      @click="detailsOpen = !detailsOpen"
    >
      Détails
      <ChevronDown class="h-4 w-4 transition-transform" :class="{ 'rotate-180': detailsOpen }" />
    </button>

    <div
      v-show="detailsOpen"
      id="character-summary-details"
      class="max-h-[60vh] overflow-y-auto pb-1"
    >
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <HealthHeart
          :model-value="values.pvCurrent"
          :max-hp="values.pvMax"
          label="Points de Blessures"
          mobile-label="Blessures"
          :editable="editable"
          @update:model-value="emit('quick-change', 'pvCurrent', $event)"
        />
        <FortuneClover
          label="Fortune"
          :model-value="values.fortuneCurrent"
          :max-points="values.fortuneMax"
          max-points-editable
          :editable="editable"
          @update:model-value="emit('quick-change', 'fortuneCurrent', $event)"
          @update:max-points="emit('quick-change', 'fortuneMax', $event)"
        />
        <FortuneClover
          label="Destin"
          :model-value="values.destinyCurrent"
          :max-points="values.destinyMax"
          max-points-editable
          variant="destin"
          :editable="editable"
          @update:model-value="emit('quick-change', 'destinyCurrent', $event)"
          @update:max-points="emit('quick-change', 'destinyMax', $event)"
        />
        <CharacterValueCard
          label="Experience"
          :icon="ScrollText"
          icon-class="h-6 w-6 text-base-content/80"
          :current="values.xpAvailable"
          :max="values.xpTotal"
          :editable="editable"
          current-aria-label="Experience disponible"
          max-aria-label="Experience maximale"
          @update:current="emit('quick-change', 'xpAvailable', $event)"
          @update:max="emit('quick-change', 'xpTotal', $event)"
        />
        <CharacterValueCard
          label="Points de folie"
          :icon="Hospital"
          icon-class="h-6 w-6 text-warning"
          :current="values.insanityPoints"
          :editable="editable"
          class="border-2"
          current-aria-label="Points de folie"
          @update:current="emit('quick-change', 'insanityPoints', $event)"
        />
      </div>
    </div>
  </header>
</template>
