<script setup lang="ts">
import { computed } from 'vue'
import type { SessionSummary } from '../../types/domain'
import {
  getCampaignSessionDateStatus,
  getCampaignSessionRelativeLabel,
  parseCampaignSessionDate,
} from '../../utils/campaignSessions'

const props = defineProps<{
  session: SessionSummary | null
  todayKey: string
}>()

const emit = defineEmits<{
  'take-note': []
}>()

const longDate = computed(() => {
  const parsed = props.session ? parseCampaignSessionDate(props.session.date) : null
  if (!parsed) {
    return props.session?.date ?? ''
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(parsed)
})

const title = computed(() => props.session?.name?.trim() || 'Session de jeu')
const relativeLabel = computed(() =>
  props.session ? getCampaignSessionRelativeLabel(props.session.date, props.todayKey) : ''
)
const isToday = computed(
  () => props.session !== null && getCampaignSessionDateStatus(props.session.date, props.todayKey) === 'today'
)
</script>

<template>
  <section class="card card-border bg-base-100" aria-label="Prochaine session" data-testid="next-session-hero">
    <div class="card-body gap-3 p-4">
      <template v-if="session">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="card-title text-base">Prochaine session</h2>
          <span
            v-if="isToday"
            class="badge badge-primary badge-sm motion-safe:animate-pulse"
            data-testid="next-session-today-badge"
          >
            {{ relativeLabel }}
          </span>
          <span v-else class="badge badge-soft badge-sm">{{ relativeLabel }}</span>
        </div>
        <div>
          <p class="text-lg font-semibold capitalize">{{ longDate }}</p>
          <p class="text-sm opacity-80">{{ title }}</p>
        </div>
        <button type="button" class="btn btn-primary min-h-11 w-full" @click="emit('take-note')">
          Prendre une note
        </button>
      </template>
      <p v-else class="text-sm opacity-80" data-testid="next-session-empty">
        Aucune session à venir.
      </p>
    </div>
  </section>
</template>
