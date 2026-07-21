<script setup lang="ts">
import { Clover, Heart, Hospital, Mars, Venus, WandSparkles } from '@lucide/vue'
import { computed } from 'vue'
import type { CharacterSummary } from '../../types/domain'

const props = withDefaults(
  defineProps<{
    character: CharacterSummary
    compact?: boolean
    destinyTotal?: number
  }>(),
  {
    compact: false,
    destinyTotal: undefined,
  }
)

const resolvedDestinyTotal = computed(() => props.destinyTotal ?? props.character.destinyCurrent)
</script>

<template>
  <div class="flex items-center gap-2" :class="compact ? 'text-sm opacity-80' : ''">
    <p class="text-sm opacity-80 capitalize">{{ character.race }}</p>
    <component
      :is="character.gender === 'masculin' ? Mars : Venus"
      class="h-4 w-4 opacity-75"
    />
    <p class="text-sm opacity-80">· {{ character.careerName || character.careerId }}</p>
  </div>

  <div class="text-sm" :class="compact ? 'mt-2 grid gap-1' : 'mt-3 grid gap-2'">
    <div class="flex items-center gap-2">
      <Heart class="h-4 w-4 text-error" />
      <span class="font-medium">Vie</span>
      <span class="opacity-80">{{ character.pvCurrent }}/{{ character.pvMax }}</span>
    </div>
    <div class="flex items-center gap-2">
      <Clover class="h-4 w-4 text-success" />
      <span class="font-medium">Fortune</span>
      <span class="opacity-80">{{ character.fortuneCurrent }}/{{ character.fortuneMax }}</span>
    </div>
    <div class="flex items-center gap-2">
      <WandSparkles class="h-4 w-4 text-accent" />
      <span class="font-medium">Destin</span>
      <span class="opacity-80">{{ character.destinyCurrent }}/{{ resolvedDestinyTotal }}</span>
    </div>
    <div class="flex items-center gap-2">
      <Hospital class="h-4 w-4 text-secondary" />
      <span class="font-medium">Folie</span>
      <span class="opacity-80">{{ character.insanityPoints }}</span>
    </div>
  </div>
</template>