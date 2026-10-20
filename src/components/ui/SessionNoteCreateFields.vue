<script setup lang="ts">
import type { SessionSummary } from '../../types/domain'
import MarkdownEditor from '../campaign/MarkdownEditor.vue'

interface SessionNoteCreateForm {
  title: string
  contentText: string
  isVisible: boolean
  sessionId: string
}

const props = defineProps<{
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
  key: Exclude<keyof SessionNoteCreateForm, 'contentText'>,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  const nextValue = key === 'isVisible' && 'checked' in target ? target.checked : target.value
  emit('patch:createForm', { [key]: nextValue })
}
</script>

<template>
  <div class="space-y-3">
    <label class="form-control w-full">
      <span class="label-text mb-2">Titre (optionnel)</span>
      <input
        :value="props.createForm.title"
        type="text"
        class="input input-bordered ui-critical-control min-h-11 w-full"
        placeholder="Généré depuis le contenu si vide"
        @input="onCreateFieldInput('title', $event)"
      />
    </label>

    <MarkdownEditor
      :model-value="props.createForm.contentText"
      textarea-id="notes-create-content"
      :invalid="Boolean(createContentError)"
      error-id="notes-create-content-error"
      @update:model-value="emit('patch:createForm', { contentText: $event })"
    />
    <p v-if="createContentError" id="notes-create-content-error" class="label text-error text-xs">
      {{ createContentError }}
    </p>

    <label v-if="sessions.length && !selectedSessionId" class="form-control w-full">
      <span class="label-text mb-2">Session liée</span>
      <select
        :value="props.createForm.sessionId"
        class="select select-bordered ui-critical-control min-h-11 w-full"
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
        type="button"
        class="btn btn-sm min-h-11 ui-critical-action md:min-h-8"
        :disabled="creating || isSessionArchived"
        :aria-busy="creating ? 'true' : 'false'"
        @click="emit('create')"
      >
        <span v-if="creating" class="loading loading-spinner loading-xs" aria-hidden="true" />
        Créer la note
      </button>
    </div>

    <div v-if="createError" role="alert" class="alert alert-error alert-soft text-sm">
      <span>{{ createError }}</span>
    </div>
  </div>
</template>
