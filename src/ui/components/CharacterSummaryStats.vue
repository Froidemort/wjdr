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

function getProgress(current: number, max: number): number {
  if (max <= 0) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)))
}
</script>

<template>
  <div
    class="min-w-0"
    :class="compact ? 'flex flex-wrap items-center gap-x-2 gap-y-1 text-sm opacity-80' : 'flex items-center gap-2'"
  >
    <p class="text-sm opacity-80 capitalize font-medium">{{ character.race }}</p>
    <component
      :is="character.gender === 'masculin' ? Mars : Venus"
      class="h-4 w-4 shrink-0 opacity-75"
    />
    <p class="min-w-0 text-sm opacity-80" :class="compact ? 'truncate' : ''">
      {{ compact ? character.careerName || character.careerId : `· ${character.careerName || character.careerId}` }}
    </p>
  </div>

  <div class="text-sm" :class="compact ? 'mt-2 grid gap-2 md:grid-cols-2' : 'mt-3 space-y-2.5'">
    <div class="rounded-box border border-base-300 bg-base-200 px-3 py-2">
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Heart class="h-4 w-4 text-error" />
          <span class="font-semibold">Vie</span>
        </div>
        <span class="font-semibold tabular-nums">{{ character.pvCurrent }}/{{ character.pvMax }}</span>
      </div>
      <progress class="progress progress-error h-3 w-full bg-base-100" :value="getProgress(character.pvCurrent, character.pvMax)" max="100" />
    </div>

    <div class="rounded-box border border-base-300 bg-base-200 px-3 py-2">
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Clover class="h-4 w-4 text-success" />
          <span class="font-semibold">Fortune</span>
        </div>
        <span class="font-semibold tabular-nums">{{ character.fortuneCurrent }}/{{ character.fortuneMax }}</span>
      </div>
      <progress class="progress progress-success h-3 w-full bg-base-100" :value="getProgress(character.fortuneCurrent, character.fortuneMax)" max="100" />
    </div>

    <div class="rounded-box border border-base-300 bg-base-200 px-3 py-2">
      <div class="mb-1.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <WandSparkles class="h-4 w-4 text-accent" />
          <span class="font-semibold">Destin</span>
        </div>
        <span class="font-semibold tabular-nums">{{ character.destinyCurrent }}/{{ resolvedDestinyTotal }}</span>
      </div>
      <progress class="progress progress-warning h-3 w-full bg-base-100" :value="getProgress(character.destinyCurrent, resolvedDestinyTotal)" max="100" />
    </div>

    <div class="rounded-box border border-base-300 bg-base-200 px-3 py-2">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Hospital class="h-4 w-4 text-secondary" />
          <span class="font-semibold">Folie</span>
        </div>
        <span class="font-semibold tabular-nums">{{ character.insanityPoints }}</span>
      </div>
    </div>
  </div>
</template>