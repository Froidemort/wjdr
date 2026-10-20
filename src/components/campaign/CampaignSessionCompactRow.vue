<script setup lang="ts">
import { computed } from 'vue'
import type { SessionSummary } from '../../types/domain'
import {
  getCampaignSessionDateStatus,
  getCampaignSessionRelativeLabel,
  parseCampaignSessionDate,
} from '../../utils/campaignSessions'

const props = defineProps<{
  session: SessionSummary
  title: string
  todayKey: string
  to: string
}>()

const parsedDate = computed(() => parseCampaignSessionDate(props.session.date))
const day = computed(() => (parsedDate.value ? String(parsedDate.value.getDate()) : '--'))
const month = computed(() =>
  parsedDate.value ? new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(parsedDate.value) : ''
)
const status = computed(() => getCampaignSessionDateStatus(props.session.date, props.todayKey))
const relativeLabel = computed(() => getCampaignSessionRelativeLabel(props.session.date, props.todayKey))
</script>

<template>
  <router-link
    class="flex min-h-11 items-center gap-3 rounded-box border px-2 py-1.5"
    :class="status === 'today' ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100'"
    :to="to"
    :title="title"
    data-testid="session-compact-row"
  >
    <span
      class="flex w-10 shrink-0 flex-col items-center rounded-field bg-base-200 py-0.5 leading-tight"
      aria-hidden="true"
    >
      <span class="text-sm font-semibold">{{ day }}</span>
      <span class="text-[0.65rem] uppercase opacity-70">{{ month }}</span>
    </span>
    <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ title }}</span>
    <span
      v-if="status === 'today'"
      class="badge badge-primary badge-sm shrink-0 motion-safe:animate-pulse"
      data-testid="session-today-badge"
    >
      {{ relativeLabel }}
    </span>
    <span v-else class="shrink-0 text-xs opacity-70">{{ relativeLabel }}</span>
  </router-link>
</template>
