<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRef, watch } from 'vue'
import {
  buildSessionNotesChannelName,
  buildSessionNotesRealtimeSubscriptions,
  createSessionNote,
  deleteSessionNote,
  listSessionNotesForCampaign,
  toggleSessionNoteArchivedState,
  toggleSessionNoteVisibility,
  updateSessionNote,
} from '../../services/sessionNotesRepository'
import type { SessionNote, SessionSummary } from '../../types/domain'
import { useBusyOperations } from '../../composables/useBusyOperations'
import { useRealtimeChannels } from '../../composables/useRealtimeChannels'
import {
  useSessionNotesFiltering,
  formatSessionLabel,
} from '../../composables/useSessionNotesFiltering'
import { useSessionNoteEditor } from '../../composables/useSessionNoteEditor'
import SessionNotesCreateCard from './SessionNotesCreateCard.vue'
import SessionNotesListCard from './SessionNotesListCard.vue'

const props = defineProps<{
  campaignId: string
  isMj: boolean
  currentUserId?: string | null
  isSessionArchived?: boolean
  sessions?: SessionSummary[]
  selectedSessionId?: string | null
  selectedSessionLabel?: string | null
}>()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const notes = ref<SessionNote[]>([])
const creating = ref(false)
const createError = ref<string | null>(null)
const searchQuery = ref('')
const sessionsRef = computed(() => props.sessions ?? [])
const selectedSessionIdRef = computed(() => props.selectedSessionId ?? null)
const isMjRef = toRef(props, 'isMj')
const createForm = reactive({
  title: '',
  contentText: '',
  isVisible: false,
  sessionId: '',
})
const { editNoteId, editError, editDraft, startEdit, cancelEdit, validateContent } =
  useSessionNoteEditor()

const { isBusy, setBusy, clearBusy } = useBusyOperations()
const { subscribe } = useRealtimeChannels(
  () => {
    void loadNotes(false)
  },
  { debounceMs: 300 }
)

const {
  linkedSessionFilter,
  linkedSessionFilterOptions,
  filteredNotes,
  resetLinkedSessionFilter,
  resolveSessionLabel,
} = useSessionNotesFiltering({
  notes,
  searchQuery,
  sessions: sessionsRef,
  selectedSessionId: selectedSessionIdRef,
  isMj: isMjRef,
})

const canCreateNote = computed(
  () => Boolean(props.currentUserId && !props.isSessionArchived)
)
const effectiveSessionId = computed(() => props.selectedSessionId ?? null)
const notesSectionTitle = computed(() =>
  effectiveSessionId.value ? 'Notes de session' : 'Notes de campagne'
)
const createCardTitle = computed(() =>
  effectiveSessionId.value ? 'Ajouter une note à cette session' : 'Ajouter une note à la campagne'
)
const listCardTitle = computed(() =>
  effectiveSessionId.value ? 'Notes de la session' : 'Liste des notes'
)
const emptyMessage = computed(() =>
  effectiveSessionId.value ? 'Aucune note pour cette session.' : 'Aucune note disponible.'
)

const createContentError = computed(() =>
  createError.value === 'Ajoutez un contenu texte.' ? createError.value : null
)

const editContentError = computed(() =>
  editError.value === 'Ajoutez un contenu texte.' ? editError.value : null
)

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

function formatDateTime(value: string): string {
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
  createForm.sessionId = effectiveSessionId.value ?? ''
  if (!effectiveSessionId.value) {
    resetLinkedSessionFilter()
  }
}

async function loadNotes(showLoading = true): Promise<void> {
  if (!props.campaignId) {
    return
  }

  if (showLoading) {
    loading.value = true
  }

  errorMessage.value = null
  try {
    notes.value = await listSessionNotesForCampaign(props.campaignId, {
      visibleOnly: !props.isMj,
      sessionId: effectiveSessionId.value,
    })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Impossible de charger les notes de campagne.'
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
      campaignId: props.campaignId,
      sessionId: createForm.sessionId || null,
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
    (currentNote.contentText ?? '').trim() === editDraft.contentText.trim() &&
    (currentNote.sessionId ?? '') === editDraft.sessionId.trim()

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
      sessionId: editDraft.sessionId.trim() || null,
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
  resetCreateForm()
  void loadNotes()
  subscribe(
    buildSessionNotesChannelName(props.campaignId),
    buildSessionNotesRealtimeSubscriptions(props.campaignId)
  )
})

watch(
  () => [props.campaignId, props.selectedSessionId, props.isMj] as const,
  () => {
    resetCreateForm()
    void loadNotes(false)
  }
)

</script>

<template>
  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-xl font-semibold">{{ notesSectionTitle }}</h2>
      <span v-if="selectedSessionLabel" class="badge badge-outline">{{ selectedSessionLabel }}</span>
    </div>

    <SessionNotesCreateCard
      v-if="canCreateNote"
      :title="createCardTitle"
      :is-session-archived="Boolean(isSessionArchived)"
      :is-mj="isMj"
      :creating="creating"
      :create-error="createError"
      :create-content-error="createContentError"
      :create-form="createForm"
      :sessions="sessions ?? []"
      :selected-session-id="selectedSessionId"
      :format-session-label="formatSessionLabel"
      @create="handleCreate"
    />

    <SessionNotesListCard
      :title="listCardTitle"
      :sessions="sessions ?? []"
      :selected-session-id="selectedSessionId"
      :linked-session-filter="linkedSessionFilter"
      :linked-session-filter-options="linkedSessionFilterOptions"
      :search-query="searchQuery"
      :items="filteredNotes"
      :loading="loading"
      :error-message="errorMessage"
      :empty-message="emptyMessage"
      :is-mj="isMj"
      :edit-note-id="editNoteId"
      :edit-error="editError"
      :edit-content-error="editContentError"
      :edit-draft="editDraft"
      :is-busy="isBusy"
      :can-manage-note="canManageNote"
      :resolve-session-label="resolveSessionLabel"
      :resolve-note-main-content="resolveNoteMainContent"
      :format-date-time="formatDateTime"
      :format-session-label="formatSessionLabel"
      @update:linked-session-filter="linkedSessionFilter = $event"
      @update:search-query="searchQuery = $event"
      @toggle-visibility="handleToggleVisibility"
      @toggle-archived="handleToggleArchived"
      @start-edit="startEdit"
      @delete="handleDelete"
      @save-edit="handleSaveEdit"
      @cancel-edit="cancelEdit"
    />
  </section>
</template>
