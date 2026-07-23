<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
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
import type { SessionNote } from '../../types/domain'
import { useBusyOperations } from '../composables/useBusyOperations'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import AppCard from './AppCard.vue'
import DataGrid from './DataGrid.vue'
import SearchInput from './SearchInput.vue'

interface SessionNoteDraft {
  title: string
  contentText: string
}

const props = defineProps<{
  sessionId: string
  isMj: boolean
  currentUserId?: string | null
  isSessionArchived?: boolean
}>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const notes = ref<SessionNote[]>([])
const creating = ref(false)
const createError = ref<string | null>(null)
const searchQuery = ref('')
const createForm = reactive({
  title: '',
  contentText: '',
  isVisible: false,
})

const editNoteId = ref<string | null>(null)
const editError = ref<string | null>(null)
const editDraft = reactive<SessionNoteDraft>({
  title: '',
  contentText: '',
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
const canCreateNote = computed(
  () => Boolean(props.currentUserId) && !Boolean(props.isSessionArchived)
)

function countOccurrences(haystack: string, needle: string): number {
  if (!haystack || !needle) {
    return 0
  }

  let index = 0
  let count = 0
  while (index <= haystack.length) {
    const found = haystack.indexOf(needle, index)
    if (found === -1) {
      break
    }
    count += 1
    index = found + needle.length
  }
  return count
}

function computeSearchScore(note: SessionNote, query: string): number {
  if (!query) {
    return 0
  }

  const title = note.title.toLowerCase()
  const content = (note.contentText ?? '').toLowerCase()
  const tokens = query.split(/\s+/).filter(Boolean)

  let score = 0
  for (const token of tokens) {
    const titleHits = countOccurrences(title, token)
    const contentHits = countOccurrences(content, token)

    if (titleHits > 0) {
      score += 50 + titleHits * 10
    }

    if (contentHits > 0) {
      score += 18 + contentHits * 4
    }
  }

  if (title.includes(query)) {
    score += 60
  }

  if (content.includes(query)) {
    score += 20
  }

  return score
}

const filteredNotes = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return notesToDisplay.value
  }

  return notesToDisplay.value
    .map((note) => ({ note, score: computeSearchScore(note, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }
      return right.note.createdAt.localeCompare(left.note.createdAt)
    })
    .map((entry) => entry.note)
})

function canManageNote(note: SessionNote): boolean {
  if (!props.currentUserId) {
    return false
  }

  return props.isMj || note.authorUserId === props.currentUserId
}

function resolveNoteMainContent(note: SessionNote): string {
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
  createForm.isVisible = false
}

function startEdit(note: SessionNote): void {
  editError.value = null
  editNoteId.value = note.id
  editDraft.title = note.title
  editDraft.contentText = note.contentText ?? ''
}

function cancelEdit(): void {
  editNoteId.value = null
  editError.value = null
}

function validateContent(text: string): string | null {
  const hasText = text.trim().length > 0

  if (!hasText) {
    return 'Ajoutez un contenu texte.'
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
  if (!canCreateNote.value || creating.value) {
    return
  }

  createError.value = validateContent(createForm.contentText)
  if (createError.value) {
    return
  }

  creating.value = true
  try {
    await createSessionNote({
      sessionId: props.sessionId,
      title: createForm.title,
      contentText: createForm.contentText,
      isVisible: props.isMj ? createForm.isVisible : true,
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
  const currentNote = notes.value.find((note) => note.id === noteId)
  if (!currentNote || !canManageNote(currentNote)) {
    return
  }

  const unchanged =
    currentNote.title.trim() === editDraft.title.trim() &&
    (currentNote.contentText ?? '').trim() === editDraft.contentText.trim()

  if (unchanged) {
    cancelEdit()
    return
  }

  editError.value = validateContent(editDraft.contentText)
  if (editError.value) {
    return
  }

  setBusy(`save-${noteId}`)
  try {
    await updateSessionNote(noteId, {
      title: editDraft.title,
      contentText: editDraft.contentText,
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
  const currentNote = notes.value.find((note) => note.id === noteId)
  if (!currentNote || !canManageNote(currentNote)) {
    return
  }

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

</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Notes de session</h2>

    <AppCard v-if="canCreateNote" title="Ajouter une note" compact>
      <div class="space-y-3">
        <div v-if="isSessionArchived" class="alert alert-warning alert-soft text-sm">
          <span>Session archivée: ajout de note indisponible.</span>
        </div>

        <label class="form-control w-full">
          <span class="label-text mb-2">Titre</span>
          <input v-model="createForm.title" type="text" class="input input-bordered w-full" placeholder="Titre de la note" />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-2">Contenu texte</span>
          <textarea
            v-model="createForm.contentText"
            class="textarea textarea-bordered min-h-24 w-full"
            placeholder="Message, indice, contexte..."
          />
        </label>

        <label v-if="isMj" class="label cursor-pointer justify-start gap-3">
          <input v-model="createForm.isVisible" type="checkbox" class="toggle toggle-sm" />
          <span class="label-text">Visible par les joueurs</span>
        </label>

        <div class="flex items-center gap-2">
          <button class="btn btn-sm" :disabled="creating || isSessionArchived" @click="handleCreate">
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
      <div class="mb-3 space-y-2">
        <SearchInput v-model="searchQuery" placeholder="Rechercher dans le titre et le texte" />
        <p class="text-xs opacity-70">
          Priorite de tri: correspondances du titre, puis du texte.
        </p>
      </div>

      <DataGrid
        :items="filteredNotes"
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
                  Note texte · {{ formatDate(note.createdAt) }}
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

            <template v-if="canManageNote(note)">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="isMj"
                  class="btn btn-xs"
                  :disabled="isBusy(`visibility-${note.id}`) || note.isArchived"
                  @click="handleToggleVisibility(note)"
                >
                  {{ note.isVisible ? 'Rendre privee' : 'Rendre visible' }}
                </button>
                <button
                  v-if="isMj"
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
                  <span class="label-text mb-2">Titre</span>
                  <input v-model="editDraft.title" type="text" class="input input-bordered w-full" />
                </label>
                <label class="form-control w-full">
                  <span class="label-text mb-2">Contenu texte</span>
                  <textarea v-model="editDraft.contentText" class="textarea textarea-bordered min-h-20 w-full" />
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
