<script setup lang="ts">
import { ChevronLeft, ChevronRight, Eye } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { SessionSummary } from '../../types/domain'
import {
  getCampaignSessionCalendarGrid,
  getCampaignSessionTodayKey,
  type SessionDateStatus,
} from '../../utils/campaignSessions'

const props = defineProps<{
  sessions: SessionSummary[]
  formatCampaignSessionTitle: (session: SessionSummary) => string
  getSessionDateStatus: (value: string) => SessionDateStatus
  buildCampaignSessionDetailLink: (targetSessionId: string) => string
}>()

const today = new Date()
const visibleYear = ref(today.getFullYear())
const visibleMonth = ref(today.getMonth())

const monthLabel = computed(() => new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
}).format(new Date(visibleYear.value, visibleMonth.value, 1, 12)))

const days = computed(() => getCampaignSessionCalendarGrid(visibleYear.value, visibleMonth.value))
const todayKey = getCampaignSessionTodayKey()
const sessionsByDate = computed(() => {
  const grouped = new Map<string, SessionSummary[]>()
  for (const sessionItem of props.sessions) {
    const dateSessions = grouped.get(sessionItem.date) ?? []
    dateSessions.push(sessionItem)
    grouped.set(sessionItem.date, dateSessions)
  }
  return grouped
})

function moveMonth(offset: number): void {
  const nextMonth = new Date(visibleYear.value, visibleMonth.value + offset, 1, 12)
  visibleYear.value = nextMonth.getFullYear()
  visibleMonth.value = nextMonth.getMonth()
}

function statusClass(status: SessionDateStatus): string {
  return status === 'past'
    ? 'border-secondary/50 bg-secondary/10'
    : status === 'today'
      ? 'border-primary bg-primary/10'
      : 'border-info/50 bg-info/10'
}
</script>

<template>
  <div class="space-y-3" aria-labelledby="campaign-sessions-calendar-title">
    <div class="flex items-center justify-between gap-2">
      <h3 id="campaign-sessions-calendar-title" class="text-sm font-semibold capitalize">{{ monthLabel }}</h3>
      <div class="join" aria-label="Navigation du calendrier">
        <button
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Mois précédent"
          title="Mois précédent"
          @click="moveMonth(-1)"
        >
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          class="btn btn-sm btn-square btn-ghost join-item"
          aria-label="Mois suivant"
          title="Mois suivant"
          @click="moveMonth(1)"
        >
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase opacity-70" aria-hidden="true">
      <span v-for="label in ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']" :key="label">{{ label }}</span>
    </div>

    <div class="grid grid-cols-7 gap-1" role="grid" :aria-label="`Calendrier de ${monthLabel}`">
      <div
        v-for="day in days"
        :key="day.date"
        role="gridcell"
        class="min-w-0 min-h-20 rounded-box border p-1"
        :class="day.isCurrentMonth ? 'border-base-300 bg-base-100' : 'border-base-200 bg-base-200/40 opacity-60'"
      >
        <div class="flex items-center justify-between gap-1">
          <span class="text-xs font-semibold" :class="day.date === todayKey ? 'text-primary' : ''">
            {{ day.dayOfMonth }}
          </span>
          <span v-if="(sessionsByDate.get(day.date)?.length ?? 0) > 1" class="badge badge-xs" :aria-label="`${sessionsByDate.get(day.date)?.length} sessions`">
            {{ sessionsByDate.get(day.date)?.length }}
          </span>
        </div>
        <div class="mt-1 space-y-1">
          <router-link
            v-for="sessionItem in sessionsByDate.get(day.date) ?? []"
            :key="sessionItem.id"
            class="block min-w-0 rounded border px-1 py-1 text-left text-[0.65rem] leading-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            :class="statusClass(props.getSessionDateStatus(sessionItem.date))"
            :to="props.buildCampaignSessionDetailLink(sessionItem.id)"
            :title="props.formatCampaignSessionTitle(sessionItem)"
          >
            <span class="flex items-start gap-1">
              <Eye class="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span class="min-w-0 truncate">{{ props.formatCampaignSessionTitle(sessionItem) }}</span>
            </span>
          </router-link>
        </div>
      </div>
    </div>

    <p v-if="props.sessions.length === 0" class="alert alert-info alert-soft text-sm">
      Aucun rendez-vous pour ce mois avec ce filtre. Utilisez les flèches pour consulter un autre mois.
    </p>
  </div>
</template>