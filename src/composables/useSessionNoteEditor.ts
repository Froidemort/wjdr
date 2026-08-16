import { reactive, ref } from 'vue'
import type { SessionNote } from '../types/domain'

interface SessionNoteDraft {
  title: string
  contentText: string
  sessionId: string
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
