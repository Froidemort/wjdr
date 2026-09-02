<script setup lang="ts">
import { CalendarDays } from '@lucide/vue'
import type { CampaignSummary, SessionSummary } from '../../types/domain'
import AppCard from './AppCard.vue'
import CampaignSessionsCalendar from './CampaignSessionsCalendar.vue'
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

const props = defineProps<{
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
  isMobile: boolean
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
}>()

function onSessionCreateFieldInput(
  key: keyof SessionCreateForm,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('patch:sessionCreateForm', { [key]: target.value })
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

      <CampaignSessionsCalendar
        v-if="isMobile"
        :sessions="timelineSessions"
        :format-campaign-session-title="formatCampaignSessionTitle"
        :get-session-date-status="getSessionDateStatus"
        :build-campaign-session-detail-link="buildCampaignSessionDetailLink"
      />

      <CampaignSessionsTimeline
        v-else
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

      <div v-if="isMj" class="space-y-4 border-t border-base-300 pt-4">
        <h3 class="text-sm font-semibold uppercase tracking-[0.15em] opacity-70">Ajouter une session datée</h3>
        <div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
          <span>Campagne archivée: création de session bloquée.</span>
        </div>
        <div class="rounded-box border border-base-300 bg-base-200/70 p-4 sm:p-5">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text mb-2">Date</span>
              <input
                :value="props.sessionCreateForm.date"
                type="date"
                class="input input-bordered ui-critical-control"
                :aria-invalid="sessionCreateDateError ? 'true' : 'false'"
                :aria-errormessage="sessionCreateDateError ? 'session-create-date-error' : undefined"
                :aria-describedby="sessionCreateDateError ? 'session-create-date-error' : undefined"
                required
                @input="onSessionCreateFieldInput('date', $event)"
              />
              <p v-if="sessionCreateDateError" id="session-create-date-error" class="label text-error text-xs">
                {{ sessionCreateDateError }}
              </p>
            </label>
            <label class="form-control">
              <span class="label-text mb-2">Titre optionnel</span>
              <input
                :value="props.sessionCreateForm.name"
                type="text"
                class="input input-bordered ui-critical-control"
                :aria-invalid="sessionCreateError ? 'true' : 'false'"
                maxlength="100"
                placeholder="Ex. Arrivée à Middenheim"
                @input="onSessionCreateFieldInput('name', $event)"
              />
            </label>
            <label class="form-control md:col-span-2">
              <span class="label-text mb-2">Description optionnelle</span>
              <textarea
                :value="props.sessionCreateForm.description"
                class="textarea textarea-bordered ui-critical-control min-h-24"
                :aria-invalid="sessionCreateError ? 'true' : 'false'"
                maxlength="500"
                placeholder="Résumé, objectifs, conséquences..."
                @input="onSessionCreateFieldInput('description', $event)"
              />
            </label>
          </div>
          <div class="mt-4 flex items-center justify-start gap-3">
            <button
              class="btn btn-sm ui-critical-action"
              :disabled="sessionCreateLoading || session.isArchived"
              :aria-busy="sessionCreateLoading ? 'true' : 'false'"
              @click="emit('create-session')"
            >
              <span v-if="sessionCreateLoading" class="loading loading-spinner loading-xs" aria-hidden="true" />
              Créer la session
            </button>
          </div>
        </div>
        <div v-if="sessionCreateError" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ sessionCreateError }}</span>
        </div>
      </div>
    </AppCard>
  </section>
</template>
