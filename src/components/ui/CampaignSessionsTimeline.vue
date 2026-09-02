<script setup lang="ts">
import { CircleCheck, Eye, Hourglass, Pencil, Trash2 } from '@lucide/vue'
import type { SessionSummary } from '../../types/domain'

interface SessionEditForm {
  date: string
  name: string
  description: string
}

const props = defineProps<{
  sessions: SessionSummary[]
  isMj: boolean
  sessionDeleteBusyId: string | null
  sessionEditId: string | null
  sessionEditBusyId: string | null
  sessionEditError: string | null
  sessionEditDateError: string | null
  sessionEditForm: SessionEditForm
  formatCampaignSessionDate: (value: string) => string
  formatCampaignSessionDateCompact: (value: string) => string
  formatCampaignSessionTitle: (session: SessionSummary) => string
  getSessionDateStatus: (value: string) => 'today' | 'upcoming' | 'past'
  buildCampaignSessionDetailLink: (targetSessionId: string) => string
}>()

const emit = defineEmits<{
  'patch:sessionEditForm': [patch: Partial<SessionEditForm>]
  'start-session-edit': [sessionItem: SessionSummary]
  'delete-session': [sessionItem: SessionSummary]
  'save-session-edit': [sessionId: string]
  'cancel-session-edit': []
}>()

function onSessionEditFieldInput(
  key: keyof SessionEditForm,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('patch:sessionEditForm', { [key]: target.value })
}
</script>

<template>
  <ul
    class="timeline timeline-snap-icon timeline-vertical relative pl-1 sm:pl-3 [--timeline-col-start:4.8rem] sm:[--timeline-col-start:minmax(0,1fr)] before:absolute before:top-0 before:bottom-0 before:w-px before:bg-base-300 before:left-[5.05rem] sm:before:left-1/2 sm:before:-translate-x-1/2"
  >
    <li v-for="sessionItem in props.sessions" :key="sessionItem.id">
      <hr class="hidden" />
      <div class="timeline-start">
        <div class="space-y-2 text-right">
          <div class="badge badge-outline badge-primary text-xs sm:hidden">
            {{ props.formatCampaignSessionDateCompact(sessionItem.date) }}
          </div>
          <div class="badge badge-outline badge-primary hidden sm:inline-flex">
            {{ props.formatCampaignSessionDate(sessionItem.date) }}
          </div>
        </div>
      </div>
      <div class="timeline-middle">
        <Hourglass
          v-if="props.getSessionDateStatus(sessionItem.date) !== 'past'"
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
              :title="props.formatCampaignSessionTitle(sessionItem)"
            >
              {{ props.formatCampaignSessionTitle(sessionItem) }}
            </h3>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <router-link class="btn btn-xs ui-critical-action" :to="props.buildCampaignSessionDetailLink(sessionItem.id)">
              <Eye class="h-3.5 w-3.5" aria-hidden="true" />
              <span class="sr-only sm:not-sr-only sm:inline">Ouvrir</span>
            </router-link>
            <button
              v-if="props.isMj"
              class="btn btn-xs ui-critical-action"
              :disabled="props.sessionEditBusyId === sessionItem.id"
              :aria-busy="props.sessionEditBusyId === sessionItem.id ? 'true' : 'false'"
              @click="emit('start-session-edit', sessionItem)"
            >
              <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
              <span class="sr-only sm:not-sr-only sm:inline">Modifier</span>
            </button>
            <button
              v-if="props.isMj"
              class="btn btn-xs btn-error ui-critical-action"
              :disabled="props.sessionDeleteBusyId === sessionItem.id || props.sessionEditBusyId === sessionItem.id"
              :aria-busy="props.sessionDeleteBusyId === sessionItem.id ? 'true' : 'false'"
              @click="emit('delete-session', sessionItem)"
            >
              <span
                v-if="props.sessionDeleteBusyId === sessionItem.id"
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
          v-if="props.sessionEditId === sessionItem.id"
          class="rounded-box border border-base-300 bg-base-100 p-4 space-y-3"
        >
          <div class="grid gap-3 lg:grid-cols-2">
            <label class="form-control">
              <span class="label-text mb-2">Date</span>
              <input
                :value="props.sessionEditForm.date"
                type="date"
                class="input input-bordered ui-critical-control"
                :aria-invalid="props.sessionEditDateError ? 'true' : 'false'"
                :aria-describedby="props.sessionEditDateError ? 'session-edit-date-error' : undefined"
                @input="onSessionEditFieldInput('date', $event)"
              />
              <p v-if="props.sessionEditDateError" id="session-edit-date-error" class="label text-error text-xs">
                {{ props.sessionEditDateError }}
              </p>
            </label>
            <label class="form-control">
              <span class="label-text mb-2">Titre</span>
              <input
                :value="props.sessionEditForm.name"
                type="text"
                class="input input-bordered ui-critical-control"
                :aria-invalid="props.sessionEditError ? 'true' : 'false'"
                maxlength="100"
                placeholder="Titre optionnel"
                @input="onSessionEditFieldInput('name', $event)"
              />
            </label>
            <label class="form-control lg:col-span-2">
              <span class="label-text mb-2">Description</span>
              <textarea
                :value="props.sessionEditForm.description"
                class="textarea textarea-bordered ui-critical-control min-h-24"
                :aria-invalid="props.sessionEditError ? 'true' : 'false'"
                maxlength="500"
                placeholder="Résumé, enjeux, conséquences..."
                @input="onSessionEditFieldInput('description', $event)"
              />
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              class="btn btn-xs ui-critical-action"
              :disabled="props.sessionEditBusyId === sessionItem.id"
              :aria-busy="props.sessionEditBusyId === sessionItem.id ? 'true' : 'false'"
              @click="emit('save-session-edit', sessionItem.id)"
            >
              <span
                v-if="props.sessionEditBusyId === sessionItem.id"
                class="loading loading-spinner loading-xs"
                aria-hidden="true"
              />
              Enregistrer
            </button>
            <button
              class="btn btn-xs btn-ghost ui-critical-action"
              :disabled="props.sessionEditBusyId === sessionItem.id"
              @click="emit('cancel-session-edit')"
            >
              Annuler
            </button>
          </div>

          <div v-if="props.sessionEditError" role="alert" class="alert alert-error alert-soft text-sm">
            <span>{{ props.sessionEditError }}</span>
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>
