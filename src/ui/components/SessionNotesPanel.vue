<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppCard from './AppCard.vue'
import DataGrid from './DataGrid.vue'
import { useBusyOperations } from '../composables/useBusyOperations'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import { useSmartRefresh } from '../composables/useSmartRefresh'
import type { SessionNote } from '../../types/domain'
import {
  buildSessionNotesChannelName,
  buildSessionNotesRealtimeSubscriptions,
  createSessionNote,
  deleteSessionNote,
  listSessionNotesForSession,
  toggleSessionNoteArchivedState,
  toggleSessionNoteVisibility,
  updateSessionNote,
} from '../../repositories/sessionNotesRepository'

interface SessionNoteDraft {
  title: string
  contentText: string
  contentCharacterNote: string
}

const props = defineProps<{
  sessionId: string
  isMj: boolean
}>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const notes = ref<SessionNote[]>([])
const creating = ref(false)
const createError = ref<string | null>(null)
const createForm = reactive({
  title: '',
  contentText: '',
  contentCharacterNote: '',
  isVisible: false,
})

const editNoteId = ref<string | null>(null)
const editError = ref<string | null>(null)
const editDraft = reactive<SessionNoteDraft>({
  title: '',
  contentText: '',
  contentCharacterNote: '',
})

const { isBusy, setBusy, clearBusy } = useBusyOperations()
const { subscribe } = useRealtimeChannels(
  () => {
    void loadNotes(false)
  },
  { debounceMs: 300 }
)

const visibleNotes = computed(() => notes.value.filter((note) => note.isVisible))
const notesToDisplay = computed(() => (props.isMj ? notes.value : visibleNotes.value))

function resolveNoteKindLabel(note: SessionNote): string {
  if ((note.contentCharacterNote ?? '').trim().length > 0) {
    return 'Note personnage'
  }

  if ((note.contentText ?? '').trim().length > 0) {
    return 'Note texte'
  }

  return 'Note'
}

function resolveNoteMainContent(note: SessionNote): string {
  const characterContent = note.contentCharacterNote?.trim()
  if (characterContent) {
    return characterContent
  }

  const textContent = note.contentText?.trim()
  if (textContent) {
    return textContent
  }

  return 'Contenu indisponible.'
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed)
}

function resetCreateForm(): void {
  createForm.title = ''
  createForm.contentText = ''
  createForm.contentCharacterNote = ''
  createForm.isVisible = false
}

function startEdit(note: SessionNote): void {
  editError.value = null
  editNoteId.value = note.id
  editDraft.title = note.title
  editDraft.contentText = note.contentText ?? ''
  editDraft.contentCharacterNote = note.contentCharacterNote ?? ''
}

function cancelEdit(): void {
  editNoteId.value = null
  editError.value = null
}

function validateContent(text: string, characterNote: string): string | null {
  const hasText = text.trim().length > 0
  const hasCharacterNote = characterNote.trim().length > 0

  if (!hasText && !hasCharacterNote) {
    return 'Ajoutez un contenu texte ou une note personnage.'
  }

  if (hasText && hasCharacterNote) {
    return 'Remplissez un seul type de contenu par note.'
  }

  return null
}

async function loadNotes(showLoading = true): Promise<void> {
  if (!props.sessionId) {
    return
  }

  if (showLoading) {
    loading.value = true
  }

  errorMessage.value = null
  try {
    notes.value = await listSessionNotesForSession(props.sessionId, { visibleOnly: !props.isMj })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Impossible de charger les notes de session.'
  } finally {
    if (showLoading) {
      loading.value = false
    }
  }
}

async function handleCreate(): Promise<void> {
  if (!props.isMj || creating.value) {
    return
  }

  createError.value = validateContent(createForm.contentText, createForm.contentCharacterNote)
  if (createError.value) {
    return
  }

  creating.value = true
  try {
    await createSessionNote({
      sessionId: props.sessionId,
      title: createForm.title,
      contentText: createForm.contentText,
      contentCharacterNote: createForm.contentCharacterNote,
      isVisible: createForm.isVisible,
    })
    resetCreateForm()
    await loadNotes()
  } catch (error) {
    createError.value = error instanceof Error ? error.message : 'Creation de note impossible.'
  } finally {
    creating.value = false
  }
}

async function handleSaveEdit(noteId: string): Promise<void> {
  if (!props.isMj) {
    return
  }

  editError.value = validateContent(editDraft.contentText, editDraft.contentCharacterNote)
  if (editError.value) {
    return
  }

  setBusy(`save-${noteId}`)
  try {
    await updateSessionNote(noteId, {
      title: editDraft.title,
      contentText: editDraft.contentText,
      contentCharacterNote: editDraft.contentCharacterNote,
    })
    cancelEdit()
    await loadNotes()
  } catch (error) {
    editError.value = error instanceof Error ? error.message : 'Mise a jour de note impossible.'
  } finally {
    clearBusy(`save-${noteId}`)
  }
}

async function handleToggleVisibility(note: SessionNote): Promise<void> {
  setBusy(`visibility-${note.id}`)
  try {
    await toggleSessionNoteVisibility(note.id, !note.isVisible)
    await loadNotes()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Mise a jour de visibilite impossible.'
  } finally {
    clearBusy(`visibility-${note.id}`)
  }
}

async function handleToggleArchived(note: SessionNote): Promise<void> {
  setBusy(`archive-${note.id}`)
  try {
    await toggleSessionNoteArchivedState(note.id, !note.isArchived)
    await loadNotes()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Mise a jour du statut impossible.'
  } finally {
    clearBusy(`archive-${note.id}`)
  }
}

async function handleDelete(noteId: string): Promise<void> {
  setBusy(`delete-${noteId}`)
  try {
    await deleteSessionNote(noteId)
    if (editNoteId.value === noteId) {
      cancelEdit()
    }
    await loadNotes()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression de note impossible.'
  } finally {
    clearBusy(`delete-${noteId}`)
  }
}

onMounted(() => {
  void loadNotes()
  subscribe(
    buildSessionNotesChannelName(props.sessionId),
    buildSessionNotesRealtimeSubscriptions(props.sessionId)
  )
})

useSmartRefresh(
  () => {
    void loadNotes(false)
  },
  {
    enabled: !props.isMj,
    minIntervalMs: 1500,
  }
)
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Notes de session</h2>

    <AppCard v-if="isMj" title="Ajouter une note" compact>
      <div class="space-y-3">
        <label class="form-control w-full">
          <span class="label-text mb-1">Titre</span>
          <input v-model="createForm.title" type="text" class="input input-bordered w-full" placeholder="Titre de la note" />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-1">Contenu texte</span>
          <textarea
            v-model="createForm.contentText"
            class="textarea textarea-bordered min-h-24 w-full"
            placeholder="Message, indice, contexte..."
          />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-1">Note personnage simplifiee</span>
          <textarea
            v-model="createForm.contentCharacterNote"
            class="textarea textarea-bordered min-h-24 w-full"
            placeholder="Nom, role, traits utiles..."
          />
        </label>

        <label class="label cursor-pointer justify-start gap-3">
          <input v-model="createForm.isVisible" type="checkbox" class="toggle toggle-sm" />
          <span class="label-text">Visible par les joueurs</span>
        </label>

        <div class="flex items-center gap-2">
          <button class="btn btn-sm" :disabled="creating" @click="handleCreate">
            <span v-if="creating" class="loading loading-spinner loading-xs" aria-hidden="true" />
            Creer la note
          </button>
        </div>

        <div v-if="createError" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ createError }}</span>
        </div>
      </div>
    </AppCard>

    <AppCard title="Liste des notes" compact>
      <DataGrid
        :items="notesToDisplay"
        :loading="loading"
        :error="errorMessage"
        empty-message="Aucune note disponible."
        grid-class="grid gap-3"
        :skeleton-count="3"
        skeleton-height="10rem"
      >
        <template #default="{ items }">
          <article v-for="note in items" :key="note.id" class="rounded-box border border-base-300 bg-base-200 p-4 space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold">{{ note.title }}</h3>
                <p class="text-xs opacity-70">
                  {{ resolveNoteKindLabel(note) }} · {{ formatDate(note.createdAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge" :class="note.isVisible ? 'badge-success' : 'badge-neutral'">
                  {{ note.isVisible ? 'Visible' : 'Masquee' }}
                </span>
                <span v-if="note.isArchived" class="badge badge-warning">Archivee</span>
              </div>
            </div>

            <p class="whitespace-pre-wrap text-sm">{{ resolveNoteMainContent(note) }}</p>

            <template v-if="isMj">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  class="btn btn-xs"
                  :disabled="isBusy(`visibility-${note.id}`) || note.isArchived"
                  @click="handleToggleVisibility(note)"
                >
                  {{ note.isVisible ? 'Rendre privee' : 'Rendre visible' }}
                </button>
                <button
                  class="btn btn-xs"
                  :disabled="isBusy(`archive-${note.id}`)"
                  @click="handleToggleArchived(note)"
                >
                  {{ note.isArchived ? 'Desarchiver' : 'Archiver' }}
                </button>
                <button
                  class="btn btn-xs"
                  :disabled="note.isArchived"
                  @click="startEdit(note)"
                >
                  Modifier
                </button>
                <button
                  class="btn btn-xs btn-error"
                  :disabled="isBusy(`delete-${note.id}`)"
                  @click="handleDelete(note.id)"
                >
                  Supprimer
                </button>
              </div>

              <div v-if="editNoteId === note.id" class="rounded-box border border-base-300 bg-base-100 p-3 space-y-2">
                <label class="form-control w-full">
                  <span class="label-text mb-1">Titre</span>
                  <input v-model="editDraft.title" type="text" class="input input-bordered w-full" />
                </label>
                <label class="form-control w-full">
                  <span class="label-text mb-1">Contenu texte</span>
                  <textarea v-model="editDraft.contentText" class="textarea textarea-bordered min-h-20 w-full" />
                </label>
                <label class="form-control w-full">
                  <span class="label-text mb-1">Note personnage simplifiee</span>
                  <textarea v-model="editDraft.contentCharacterNote" class="textarea textarea-bordered min-h-20 w-full" />
                </label>
                <div class="flex items-center gap-2">
                  <button class="btn btn-xs" :disabled="isBusy(`save-${note.id}`)" @click="handleSaveEdit(note.id)">
                    Enregistrer
                  </button>
                  <button class="btn btn-xs" @click="cancelEdit">Annuler</button>
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
  </section>
</template>
