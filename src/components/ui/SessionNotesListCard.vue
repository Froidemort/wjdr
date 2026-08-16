<script setup lang="ts">
import type { SessionNote, SessionSummary } from '../../types/domain'
import AppCard from './AppCard.vue'
import DataGrid from './DataGrid.vue'
import SearchInput from './SearchInput.vue'

interface SessionNoteEditDraft {
  title: string
  contentText: string
  sessionId: string
}

const props = defineProps<{
  title: string
  sessions: SessionSummary[]
  selectedSessionId: string | null | undefined
  linkedSessionFilter: 'all' | 'none' | string
  linkedSessionFilterOptions: Array<{ value: 'all' | 'none' | string; label: string }>
  searchQuery: string
  items: SessionNote[]
  loading: boolean
  errorMessage: string | null
  emptyMessage: string
  isMj: boolean
  editNoteId: string | null
  editError: string | null
  editContentError: string | null
  editDraft: SessionNoteEditDraft
  isBusy: (id: string) => boolean
  canManageNote: (note: SessionNote) => boolean
  resolveSessionLabel: (sessionId: string | null | undefined) => string
  resolveNoteMainContent: (note: SessionNote) => string
  formatDateTime: (value: string) => string
  formatSessionLabel: (session: SessionSummary) => string
}>()

const emit = defineEmits<{
  'update:linkedSessionFilter': [value: 'all' | 'none' | string]
  'update:searchQuery': [value: string]
  'patch:editDraft': [patch: Partial<SessionNoteEditDraft>]
  'toggle-visibility': [note: SessionNote]
  'toggle-archived': [note: SessionNote]
  'start-edit': [note: SessionNote]
  'delete': [noteId: string]
  'save-edit': [noteId: string]
  'cancel-edit': []
}>()

function onLinkedSessionFilterChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value as 'all' | 'none' | string
  emit('update:linkedSessionFilter', value)
}

function onSearchQueryUpdate(value: string): void {
  emit('update:searchQuery', value)
}

function onEditDraftFieldInput(
  key: keyof SessionNoteEditDraft,
  event: Event
): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  emit('patch:editDraft', { [key]: target.value })
}
</script>

<template>
  <AppCard :title="title" compact>
    <div class="mb-3 space-y-2">
      <label v-if="sessions.length && !selectedSessionId" class="form-control w-full">
        <span class="label-text mb-2">Filtrer par session liée</span>
        <select
          :value="linkedSessionFilter"
          class="select select-bordered ui-critical-control w-full"
          @change="onLinkedSessionFilterChange"
        >
          <option
            v-for="option in linkedSessionFilterOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
      <SearchInput
        :model-value="searchQuery"
        placeholder="Rechercher dans le titre et le texte"
        @update:model-value="onSearchQueryUpdate"
      />
      <p class="text-xs opacity-70">
        Priorité de tri: correspondances du titre, puis du texte.
      </p>
    </div>

    <DataGrid
      :items="items"
      :loading="loading"
      :error="errorMessage"
      :empty-message="emptyMessage"
      grid-class="grid gap-3"
      :skeleton-count="3"
      skeleton-height="10rem"
    >
      <template #default="{ items: noteItems }">
        <article
          v-for="note in noteItems"
          :key="note.id"
          class="rounded-box border border-base-300 bg-base-200 p-4 space-y-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 class="font-semibold">{{ note.title }}</h3>
              <p class="text-xs opacity-70">
                {{ formatDateTime(note.createdAt) }}
              </p>
              <p class="mt-1 text-xs">
                <span
                  class="badge badge-outline badge-xs inline-block max-w-[11rem] overflow-hidden text-ellipsis whitespace-nowrap align-middle sm:max-w-none"
                  :title="resolveSessionLabel(note.sessionId)"
                >
                  {{ resolveSessionLabel(note.sessionId) }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge" :class="note.isVisible ? 'badge-success' : 'badge-neutral'">
                {{ note.isVisible ? 'Visible' : 'Masquée' }}
              </span>
              <span v-if="note.isArchived" class="badge badge-warning">Archivée</span>
            </div>
          </div>

          <p class="whitespace-pre-wrap text-sm">{{ resolveNoteMainContent(note) }}</p>

          <template v-if="canManageNote(note)">
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="isMj"
                class="btn btn-xs ui-critical-action"
                :disabled="isBusy(`visibility-${note.id}`) || note.isArchived"
                :aria-busy="isBusy(`visibility-${note.id}`) ? 'true' : 'false'"
                @click="emit('toggle-visibility', note)"
              >
                {{ note.isVisible ? 'Rendre privée' : 'Rendre visible' }}
              </button>
              <button
                v-if="isMj"
                class="btn btn-xs ui-critical-action"
                :disabled="isBusy(`archive-${note.id}`)"
                :aria-busy="isBusy(`archive-${note.id}`) ? 'true' : 'false'"
                @click="emit('toggle-archived', note)"
              >
                {{ note.isArchived ? 'Désarchiver' : 'Archiver' }}
              </button>
              <button
                class="btn btn-xs ui-critical-action"
                :disabled="note.isArchived"
                @click="emit('start-edit', note)"
              >
                Modifier
              </button>
              <button
                class="btn btn-xs btn-error ui-critical-action"
                :disabled="isBusy(`delete-${note.id}`)"
                :aria-busy="isBusy(`delete-${note.id}`) ? 'true' : 'false'"
                @click="emit('delete', note.id)"
              >
                Supprimer
              </button>
            </div>

            <div
              v-if="editNoteId === note.id"
              class="rounded-box border border-base-300 bg-base-100 p-3 space-y-2"
            >
              <label class="form-control w-full">
                <span class="label-text mb-2">Titre</span>
                <input
                  :value="props.editDraft.title"
                  type="text"
                  class="input input-bordered ui-critical-control w-full"
                  :aria-invalid="editContentError ? 'true' : 'false'"
                  @input="onEditDraftFieldInput('title', $event)"
                />
              </label>
              <label v-if="sessions.length && !selectedSessionId" class="form-control w-full">
                <span class="label-text mb-2">Session liée</span>
                <select
                  :value="props.editDraft.sessionId"
                  class="select select-bordered ui-critical-control w-full"
                  :aria-invalid="editContentError ? 'true' : 'false'"
                  @change="onEditDraftFieldInput('sessionId', $event)"
                >
                  <option value="">Sans session liée</option>
                  <option v-for="session in sessions" :key="session.id" :value="session.id">
                    {{ formatSessionLabel(session) }}
                  </option>
                </select>
              </label>
              <label class="form-control w-full">
                <span class="label-text mb-2">Contenu texte</span>
                <textarea
                  :value="props.editDraft.contentText"
                  class="textarea textarea-bordered ui-critical-control min-h-20 w-full"
                  :aria-invalid="editContentError ? 'true' : 'false'"
                  :aria-errormessage="editContentError ? 'notes-edit-content-error' : undefined"
                  :aria-describedby="editContentError ? 'notes-edit-content-error' : undefined"
                  @input="onEditDraftFieldInput('contentText', $event)"
                />
              </label>
              <p v-if="editContentError" id="notes-edit-content-error" class="label text-error text-xs">
                {{ editContentError }}
              </p>
              <div class="flex items-center gap-2">
                <button
                  class="btn btn-xs ui-critical-action"
                  :disabled="isBusy(`save-${note.id}`)"
                  :aria-busy="isBusy(`save-${note.id}`) ? 'true' : 'false'"
                  @click="emit('save-edit', note.id)"
                >
                  Enregistrer
                </button>
                <button class="btn btn-xs ui-critical-action" @click="emit('cancel-edit')">
                  Annuler
                </button>
              </div>
              <div v-if="editError" role="alert" class="alert alert-error alert-soft text-xs">
                <span>{{ editError }}</span>
              </div>
            </div>
          </template>
        </article>
      </template>
    </DataGrid>
  </AppCard>
</template>
