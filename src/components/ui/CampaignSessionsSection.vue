<script setup lang="ts">
import { CalendarDays, CircleCheck, Eye, Hourglass, Pencil, Trash2 } from '@lucide/vue'
import type { CampaignSummary, SessionSummary } from '../../types/domain'
import AppCard from './AppCard.vue'

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
  formatCampaignSessionDate: (value: string) => string
  formatCampaignSessionDateCompact: (value: string) => string
  formatCampaignSessionTitle: (session: SessionSummary) => string
  getSessionDateStatus: (value: string) => 'today' | 'upcoming' | 'past'
  buildCampaignSessionDetailLink: (targetSessionId: string) => string
}>()

const emit = defineEmits<{
  'update:sessionTimelineFilter': [value: SessionTimelineFilter]
  'focus-notes': []
  'start-session-edit': [sessionItem: SessionSummary]
  'delete-session': [sessionItem: SessionSummary]
  'save-session-edit': [sessionId: string]
  'cancel-session-edit': []
  'create-session': []
}>()
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
            A venir: {{ timelineStats.upcoming }}
          </span>
          <span class="badge badge-outline badge-sm whitespace-nowrap">
            Passees: {{ timelineStats.past }}
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
              A venir
            </button>
            <button
              class="btn btn-xs ui-critical-action join-item"
              :class="sessionTimelineFilter === 'past' ? 'btn-active' : ''"
              @click="emit('update:sessionTimelineFilter', 'past')"
            >
              Passees
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

      <ul
        v-else
        class="timeline timeline-snap-icon timeline-vertical relative pl-1 sm:pl-3 [--timeline-col-start:4.8rem] sm:[--timeline-col-start:minmax(0,1fr)] before:absolute before:top-0 before:bottom-0 before:w-px before:bg-base-300 before:left-[5.05rem] sm:before:left-1/2 sm:before:-translate-x-1/2"
      >
        <li v-for="sessionItem in timelineSessions" :key="sessionItem.id">
          <hr class="hidden" />
          <div class="timeline-start">
            <div class="space-y-2 text-right">
              <div class="badge badge-outline badge-primary text-xs sm:hidden">
                {{ formatCampaignSessionDateCompact(sessionItem.date) }}
              </div>
              <div class="badge badge-outline badge-primary hidden sm:inline-flex">
                {{ formatCampaignSessionDate(sessionItem.date) }}
              </div>
            </div>
          </div>
          <div class="timeline-middle">
            <Hourglass
              v-if="getSessionDateStatus(sessionItem.date) !== 'past'"
              class="h-4 w-4 rounded-full bg-info/10 text-info ring-1 ring-info/30 shadow-sm"
              aria-hidden="true"
            />
            <CircleCheck
              v-else
              class="h-4 w-4 rounded-full bg-secondary/10 text-secondary ring-1 ring-secondary/30 shadow-sm"
              aria-hidden="true"
            />
          </div>
          <div class="timeline-end timeline-box w-full space-y-3 p-4 sm:p-5">
            <div class="space-y-2">
              <div class="pr-1">
                <h3
                  class="block max-w-full truncate text-xs font-semibold leading-snug sm:text-sm md:text-base"
                  :title="formatCampaignSessionTitle(sessionItem)"
                >
                  {{ formatCampaignSessionTitle(sessionItem) }}
                </h3>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <router-link class="btn btn-xs ui-critical-action" :to="buildCampaignSessionDetailLink(sessionItem.id)">
                  <Eye class="h-3.5 w-3.5" aria-hidden="true" />
                  <span class="sr-only sm:not-sr-only sm:inline">Ouvrir</span>
                </router-link>
                <button
                  v-if="isMj"
                  class="btn btn-xs ui-critical-action"
                  :disabled="sessionEditBusyId === sessionItem.id"
                  :aria-busy="sessionEditBusyId === sessionItem.id ? 'true' : 'false'"
                  @click="emit('start-session-edit', sessionItem)"
                >
                  <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
                  <span class="sr-only sm:not-sr-only sm:inline">Modifier</span>
                </button>
                <button
                  v-if="isMj"
                  class="btn btn-xs btn-error ui-critical-action"
                  :disabled="sessionDeleteBusyId === sessionItem.id || sessionEditBusyId === sessionItem.id"
                  :aria-busy="sessionDeleteBusyId === sessionItem.id ? 'true' : 'false'"
                  @click="emit('delete-session', sessionItem)"
                >
                  <span
                    v-if="sessionDeleteBusyId === sessionItem.id"
                    class="loading loading-spinner loading-xs"
                    aria-hidden="true"
                  />
                  <Trash2 v-else class="h-3.5 w-3.5" aria-hidden="true" />
                  <span class="sr-only sm:not-sr-only sm:inline">Supprimer</span>
                </button>
              </div>
            </div>
            <p v-if="sessionItem.description" class="text-sm whitespace-pre-line opacity-80">
              {{ sessionItem.description }}
            </p>

            <div
              v-if="sessionEditId === sessionItem.id"
              class="rounded-box border border-base-300 bg-base-100 p-4 space-y-3"
            >
              <div class="grid gap-3 lg:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-2">Date</span>
                  <input
                    v-model="props.sessionEditForm.date"
                    type="date"
                    class="input input-bordered ui-critical-control"
                    :aria-invalid="sessionEditDateError ? 'true' : 'false'"
                    :aria-errormessage="sessionEditDateError ? 'session-edit-date-error' : undefined"
                    :aria-describedby="sessionEditDateError ? 'session-edit-date-error' : undefined"
                  />
                  <p v-if="sessionEditDateError" id="session-edit-date-error" class="label text-error text-xs">
                    {{ sessionEditDateError }}
                  </p>
                </label>
                <label class="form-control">
                  <span class="label-text mb-2">Titre</span>
                  <input
                    v-model="props.sessionEditForm.name"
                    type="text"
                    class="input input-bordered ui-critical-control"
                    :aria-invalid="sessionEditError ? 'true' : 'false'"
                    maxlength="100"
                    placeholder="Titre optionnel"
                  />
                </label>
                <label class="form-control lg:col-span-2">
                  <span class="label-text mb-2">Description</span>
                  <textarea
                    v-model="props.sessionEditForm.description"
                    class="textarea textarea-bordered ui-critical-control min-h-24"
                    :aria-invalid="sessionEditError ? 'true' : 'false'"
                    maxlength="500"
                    placeholder="Résumé, enjeux, conséquences..."
                  />
                </label>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button
                  class="btn btn-xs ui-critical-action"
                  :disabled="sessionEditBusyId === sessionItem.id"
                  :aria-busy="sessionEditBusyId === sessionItem.id ? 'true' : 'false'"
                  @click="emit('save-session-edit', sessionItem.id)"
                >
                  <span
                    v-if="sessionEditBusyId === sessionItem.id"
                    class="loading loading-spinner loading-xs"
                    aria-hidden="true"
                  />
                  Enregistrer
                </button>
                <button
                  class="btn btn-xs btn-ghost ui-critical-action"
                  :disabled="sessionEditBusyId === sessionItem.id"
                  @click="emit('cancel-session-edit')"
                >
                  Annuler
                </button>
              </div>

              <div v-if="sessionEditError" role="alert" class="alert alert-error alert-soft text-sm">
                <span>{{ sessionEditError }}</span>
              </div>
            </div>
          </div>
        </li>
      </ul>

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
                v-model="props.sessionCreateForm.date"
                type="date"
                class="input input-bordered ui-critical-control"
                :aria-invalid="sessionCreateDateError ? 'true' : 'false'"
                :aria-errormessage="sessionCreateDateError ? 'session-create-date-error' : undefined"
                :aria-describedby="sessionCreateDateError ? 'session-create-date-error' : undefined"
                required
              />
              <p v-if="sessionCreateDateError" id="session-create-date-error" class="label text-error text-xs">
                {{ sessionCreateDateError }}
              </p>
            </label>
            <label class="form-control">
              <span class="label-text mb-2">Titre optionnel</span>
              <input
                v-model="props.sessionCreateForm.name"
                type="text"
                class="input input-bordered ui-critical-control"
                :aria-invalid="sessionCreateError ? 'true' : 'false'"
                maxlength="100"
                placeholder="Ex. Arrivée à Middenheim"
              />
            </label>
            <label class="form-control md:col-span-2">
              <span class="label-text mb-2">Description optionnelle</span>
              <textarea
                v-model="props.sessionCreateForm.description"
                class="textarea textarea-bordered ui-critical-control min-h-24"
                :aria-invalid="sessionCreateError ? 'true' : 'false'"
                maxlength="500"
                placeholder="Résumé, objectifs, conséquences..."
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
