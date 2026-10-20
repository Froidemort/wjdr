import { useLocalStorage } from '@vueuse/core'
import { computed, reactive, ref, toValue, type MaybeRefOrGetter } from 'vue'
import type { SessionNote } from '../types/domain'

interface SessionNoteDraft {
  title: string
  contentText: string
  sessionId: string
}

export function buildNoteDraftKey(campaignId: string, sessionId: string | null | undefined): string {
  return `wjdr:note-draft:${campaignId}:${sessionId || 'none'}`
}

export function useSessionNoteDraft(
  campaignId: MaybeRefOrGetter<string>,
  sessionId: MaybeRefOrGetter<string | null | undefined>
) {
  const draft = useLocalStorage(
    computed(() => buildNoteDraftKey(toValue(campaignId), toValue(sessionId))),
    ''
  )

  function clearDraft(): void {
    draft.value = ''
  }

  // The draft survives a failed save and is cleared only once `save` resolves.
  async function clearOnSuccess<T>(save: () => Promise<T>): Promise<T> {
    const result = await save()
    clearDraft()
    return result
  }

  return { draft, clearDraft, clearOnSuccess }
}

export function useSessionNoteEditor() {
  const editNoteId = ref<string | null>(null)
  const editError = ref<string | null>(null)
  const editDraft = reactive<SessionNoteDraft>({
    title: '',
    contentText: '',
    sessionId: '',
  })

  function startEdit(note: SessionNote): void {
    editError.value = null
    editNoteId.value = note.id
    editDraft.title = note.title
    editDraft.contentText = note.contentText ?? ''
    editDraft.sessionId = note.sessionId ?? ''
  }

  function cancelEdit(): void {
    editNoteId.value = null
    editError.value = null
    editDraft.title = ''
    editDraft.contentText = ''
    editDraft.sessionId = ''
  }

  function validateContent(text: string): string | null {
    const hasText = text.trim().length > 0

    if (!hasText) {
      return 'Ajoutez un contenu texte.'
    }

    return null
  }

  return {
    editNoteId,
    editError,
    editDraft,
    startEdit,
    cancelEdit,
    validateContent,
  }
}
