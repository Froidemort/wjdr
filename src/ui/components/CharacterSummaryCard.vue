<script setup lang="ts">
import type { CharacterSummary } from '../../types/domain'
import AppCard from './AppCard.vue'
import CharacterSummaryStats from './CharacterSummaryStats.vue'

withDefaults(
  defineProps<{
    character: CharacterSummary
    actionLabel: string
    actionTo?: string
    compact?: boolean
    destinyTotal?: number
  }>(),
  {
    actionTo: undefined,
    compact: false,
    destinyTotal: undefined,
  }
)
</script>

<template>
  <AppCard
    :title="character.name"
    :avatar-url="character.ownerAvatarUrl"
    avatar-alt="Avatar du joueur"
    :compact="compact"
  >
    <CharacterSummaryStats :character="character" :compact="compact" :destiny-total="destinyTotal" />

    <div class="card-actions justify-end" :class="compact ? 'mt-3' : 'mt-4'">
      <router-link class="btn btn-sm btn-accent" :to="actionTo || `/characters/${character.id}`">{{ actionLabel }}</router-link>
    </div>
  </AppCard>
</template>