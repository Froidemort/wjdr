<script setup lang="ts">
import type { SessionSummary } from '../../types/domain'
import AppCard from './AppCard.vue'

interface SessionNoteCreateForm {
  title: string
  contentText: string
  isVisible: boolean
  sessionId: string
}

const props = defineProps<{
  title: string
  isSessionArchived: boolean
  isMj: boolean
  creating: boolean
  createError: string | null
  createContentError: string | null
  createForm: SessionNoteCreateForm
  sessions: SessionSummary[]
  selectedSessionId: string | null | undefined
  formatSessionLabel: (session: SessionSummary) => string
}>()

const emit = defineEmits<{
  create: []
  'patch:createForm': [patch: Partial<SessionNoteCreateForm>]
}>()

function onCreateFieldInput(
  key: keyof SessionNoteCreateForm,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  const nextValue = key === 'isVisible' && 'checked' in target ? target.checked : target.value
  emit('patch:createForm', { [key]: nextValue })
}

function onCreate(): void {
  emit('create')
}
</script>

<template>
  <AppCard :title="title" compact>
    <div class="space-y-3">
      <div v-if="isSessionArchived" class="alert alert-warning alert-soft text-sm">
        <span>Campagne archivée: ajout de note indisponible.</span>
      </div>

      <label class="form-control w-full">
        <span class="label-text mb-2">Titre</span>
        <input
          :value="props.createForm.title"
          type="text"
          class="input input-bordered ui-critical-control w-full"
          :aria-invalid="createContentError ? 'true' : 'false'"
          placeholder="Titre de la note"
          @input="onCreateFieldInput('title', $event)"
        />
      </label>

      <label class="form-control w-full">
        <span class="label-text mb-2">Contenu texte</span>
        <textarea
          :value="props.createForm.contentText"
          class="textarea textarea-bordered ui-critical-control min-h-24 w-full"
          :aria-invalid="createContentError ? 'true' : 'false'"
          :aria-errormessage="createContentError ? 'notes-create-content-error' : undefined"
          :aria-describedby="createContentError ? 'notes-create-content-error' : undefined"
          placeholder="Message, indice, contexte..."
          @input="onCreateFieldInput('contentText', $event)"
        />
      </label>
      <p v-if="createContentError" id="notes-create-content-error" class="label text-error text-xs">
        {{ createContentError }}
      </p>

      <label v-if="sessions.length && !selectedSessionId" class="form-control w-full">
        <span class="label-text mb-2">Session liée</span>
        <select
          :value="props.createForm.sessionId"
          class="select select-bordered ui-critical-control w-full"
          :aria-invalid="createContentError ? 'true' : 'false'"
          @change="onCreateFieldInput('sessionId', $event)"
        >
          <option value="">Sans session liée</option>
          <option v-for="session in sessions" :key="session.id" :value="session.id">
            {{ formatSessionLabel(session) }}
          </option>
        </select>
      </label>

      <label v-if="isMj" class="label cursor-pointer justify-start gap-3">
        <input
          :checked="props.createForm.isVisible"
          type="checkbox"
          class="toggle toggle-sm"
          @change="onCreateFieldInput('isVisible', $event)"
        />
        <span class="label-text">Visible par les joueurs</span>
      </label>

      <div class="flex items-center gap-2">
        <button
          class="btn btn-sm ui-critical-action"
          :disabled="creating || isSessionArchived"
          :aria-busy="creating ? 'true' : 'false'"
          @click="onCreate"
        >
          <span v-if="creating" class="loading loading-spinner loading-xs" aria-hidden="true" />
          Créer la note
        </button>
      </div>

      <div v-if="createError" role="alert" class="alert alert-error alert-soft text-sm">
        <span>{{ createError }}</span>
      </div>
    </div>
  </AppCard>
</template>
