<script setup lang="ts">
import { CalendarDays, Plus } from '@lucide/vue'
import { ref } from 'vue'
import type { CampaignSummary, SessionSummary } from '../../types/domain'
import CampaignSessionCompactRow from '../campaign/CampaignSessionCompactRow.vue'
import SessionCreatePanel from '../campaign/SessionCreatePanel.vue'
import AppCard from './AppCard.vue'
import CampaignSessionsTimeline from './CampaignSessionsTimeline.vue'

type SessionTimelineFilter = 'all' | 'upcoming' | 'past'

interface SessionEditForm {
  date: string
  name: string
  description: string
}

interface SessionCreateForm {
  date: string
  name: string
  description: string
}

defineProps<{
  session: CampaignSummary
  sessions: SessionSummary[]
  timelineSessions: SessionSummary[]
  timelineStats: {
    upcoming: number
    past: number
  }
  nextSession: SessionSummary | null
  sessionTimelineFilter: SessionTimelineFilter
  sessionActionSuccessMessage: string | null
  isMj: boolean
  sessionDeleteBusyId: string | null
  sessionEditId: string | null
  sessionEditBusyId: string | null
  sessionEditError: string | null
  sessionEditDateError: string | null
  sessionEditForm: SessionEditForm
  sessionCreateLoading: boolean
  sessionCreateError: string | null
  sessionCreateDateError: string | null
  sessionCreateForm: SessionCreateForm
  todayKey: string
  formatCampaignSessionDate: (value: string) => string
  formatCampaignSessionDateCompact: (value: string) => string
  formatCampaignSessionTitle: (session: SessionSummary) => string
  getSessionDateStatus: (value: string) => 'today' | 'upcoming' | 'past'
  buildCampaignSessionDetailLink: (targetSessionId: string) => string
}>()

const emit = defineEmits<{
  'update:sessionTimelineFilter': [value: SessionTimelineFilter]
  'patch:sessionEditForm': [patch: Partial<SessionEditForm>]
  'patch:sessionCreateForm': [patch: Partial<SessionCreateForm>]
  'focus-notes': []
  'start-session-edit': [sessionItem: SessionSummary]
  'delete-session': [sessionItem: SessionSummary]
  'save-session-edit': [sessionId: string]
  'cancel-session-edit': []
  'create-session': []
  'reset-session-create-form': []
}>()

const isCreatePanelOpen = ref(false)

function openCreatePanel(): void {
  emit('reset-session-create-form')
  isCreatePanelOpen.value = true
}
</script>

<template>
  <section id="campaign-sessions-section" role="tabpanel" aria-labelledby="campaign-tab-sessions">
    <AppCard title="Sessions de campagne" class="space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="badge badge-outline badge-sm whitespace-nowrap">
            <span class="sm:hidden">{{ sessions.length }} sess.</span>
            <span class="hidden sm:inline">{{ sessions.length }} sessions</span>
          </span>
          <span class="badge badge-outline badge-sm whitespace-nowrap">
            À venir: {{ timelineStats.upcoming }}
          </span>
          <span class="badge badge-outline badge-sm whitespace-nowrap">
            Passées: {{ timelineStats.past }}
          </span>
          <span v-if="nextSession" class="badge badge-soft badge-success badge-sm whitespace-nowrap">
            <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
            <span class="sm:hidden">{{ formatCampaignSessionDateCompact(nextSession.date) }}</span>
            <span class="hidden sm:inline">Prochaine: {{ formatCampaignSessionDate(nextSession.date) }}</span>
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div class="join join-vertical sm:join-horizontal">
            <button
              class="btn btn-xs ui-critical-action join-item"
              :class="sessionTimelineFilter === 'all' ? 'btn-active' : ''"
              @click="emit('update:sessionTimelineFilter', 'all')"
            >
              Toutes
            </button>
            <button
              class="btn btn-xs ui-critical-action join-item"
              :class="sessionTimelineFilter === 'upcoming' ? 'btn-active' : ''"
              @click="emit('update:sessionTimelineFilter', 'upcoming')"
            >
              À venir
            </button>
            <button
              class="btn btn-xs ui-critical-action join-item"
              :class="sessionTimelineFilter === 'past' ? 'btn-active' : ''"
              @click="emit('update:sessionTimelineFilter', 'past')"
            >
              Passées
            </button>
          </div>
          <button class="btn btn-xs ui-critical-action" @click="emit('focus-notes')">Aller aux notes</button>
        </div>
      </div>

      <div v-if="sessionActionSuccessMessage" role="status" class="alert alert-success alert-soft text-sm">
        <span>{{ sessionActionSuccessMessage }}</span>
      </div>

      <div v-if="sessions.length === 0" class="alert alert-info alert-soft text-sm">
        <span>Aucune session n'a encore été posée sur cette campagne.</span>
      </div>

      <div v-else-if="timelineSessions.length === 0" class="alert alert-info alert-soft text-sm">
        <span>Aucune session pour ce filtre.</span>
      </div>

      <ul v-if="timelineSessions.length > 0" class="space-y-2 md:hidden" aria-label="Sessions">
        <li v-for="sessionItem in timelineSessions" :key="sessionItem.id">
          <CampaignSessionCompactRow
            :session="sessionItem"
            :title="formatCampaignSessionTitle(sessionItem)"
            :today-key="todayKey"
            :to="buildCampaignSessionDetailLink(sessionItem.id)"
          />
        </li>
      </ul>

      <div class="hidden md:block">
        <CampaignSessionsTimeline
          :sessions="timelineSessions"
          :is-mj="isMj"
          :session-delete-busy-id="sessionDeleteBusyId"
          :session-edit-id="sessionEditId"
          :session-edit-busy-id="sessionEditBusyId"
          :session-edit-error="sessionEditError"
          :session-edit-date-error="sessionEditDateError"
          :session-edit-form="sessionEditForm"
          :format-campaign-session-date="formatCampaignSessionDate"
          :format-campaign-session-date-compact="formatCampaignSessionDateCompact"
          :format-campaign-session-title="formatCampaignSessionTitle"
          :get-session-date-status="getSessionDateStatus"
          :build-campaign-session-detail-link="buildCampaignSessionDetailLink"
          @patch:session-edit-form="emit('patch:sessionEditForm', $event)"
          @start-session-edit="emit('start-session-edit', $event)"
          @delete-session="emit('delete-session', $event)"
          @save-session-edit="emit('save-session-edit', $event)"
          @cancel-session-edit="emit('cancel-session-edit')"
        />
      </div>

      <div v-if="isMj" class="space-y-4 border-t border-base-300 pt-4">
        <div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
          <span>Campagne archivée: création de session bloquée.</span>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-primary ui-critical-action"
          :disabled="session.isArchived"
          @click="openCreatePanel"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
          Nouvelle session
        </button>
      </div>

      <SessionCreatePanel
        v-if="isMj"
        :open="isCreatePanelOpen"
        :form="sessionCreateForm"
        :loading="sessionCreateLoading"
        :error="sessionCreateError"
        :date-error="sessionCreateDateError"
        @patch:form="emit('patch:sessionCreateForm', $event)"
        @submit="emit('create-session')"
        @created="isCreatePanelOpen = false"
        @close="isCreatePanelOpen = false"
      />
    </AppCard>
  </section>
</template>
