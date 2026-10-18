<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import type { CampaignTableEntry } from '../../composables/useCampaignTable'
import CampaignCharacterPanel from './CampaignCharacterPanel.vue'

defineProps<{
  entries: CampaignTableEntry[]
  loading: boolean
  error: string | null
  isMobile: boolean
}>()

const emit = defineEmits<{
  reload: []
}>()
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">Table</h2>
      <button
        type="button"
        class="btn btn-ghost btn-sm min-h-11 gap-1"
        :disabled="loading"
        @click="emit('reload')"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Actualiser
      </button>
    </div>

    <div v-if="error" role="alert" class="alert alert-error alert-soft text-sm">
      <span>{{ error }}</span>
    </div>
    <div v-else-if="loading && entries.length === 0" class="skeleton h-48 w-full" />
    <p v-else-if="entries.length === 0" class="text-sm opacity-70">
      Aucun personnage dans cette campagne.
    </p>
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CampaignCharacterPanel
        v-for="entry in entries"
        :key="entry.character.id"
        :entry="entry"
        :collapsible="isMobile"
      />
    </div>
  </div>
</template>
