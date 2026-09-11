import { describe, expect, it } from 'vitest'
import { useSessionNoteEditor } from '../../src/composables/useSessionNoteEditor'

describe('useSessionNoteEditor', () => {
  it('loads nullable note fields into a draft and resets the editor', () => {
    const editor = useSessionNoteEditor()

    editor.startEdit({
      id: 'note-1', campaignId: 'campaign-1', sessionId: null, authorUserId: null,
      title: 'Titre', contentText: null, isVisible: false, isArchived: false,
      createdAt: '2026-09-01', updatedAt: '2026-09-01',
    })

    expect(editor.editNoteId.value).toBe('note-1')
    expect(editor.editDraft).toEqual({ title: 'Titre', contentText: '', sessionId: '' })
    editor.cancelEdit()
    expect(editor.editNoteId.value).toBeNull()
    expect(editor.editDraft).toEqual({ title: '', contentText: '', sessionId: '' })
  })

  it('validates blank and non-blank note content', () => {
    const editor = useSessionNoteEditor()

    expect(editor.validateContent('  ')).toBe('Ajoutez un contenu texte.')
    expect(editor.validateContent('Une note')).toBeNull()
  })
})