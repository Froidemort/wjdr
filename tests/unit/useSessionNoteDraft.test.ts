// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { buildNoteDraftKey, useSessionNoteDraft } from '../../src/composables/useSessionNoteEditor'

describe('useSessionNoteDraft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('builds a key per campaign and session', () => {
    expect(buildNoteDraftKey('c1', 's1')).toBe('wjdr:note-draft:c1:s1')
    expect(buildNoteDraftKey('c1', null)).toBe('wjdr:note-draft:c1:none')
  })

  it('persists the draft in localStorage and restores it', async () => {
    const first = useSessionNoteDraft('c1', 's1')
    first.draft.value = 'Brouillon'
    await nextTick()

    expect(localStorage.getItem('wjdr:note-draft:c1:s1')).toBe('Brouillon')
    expect(useSessionNoteDraft('c1', 's1').draft.value).toBe('Brouillon')
    expect(useSessionNoteDraft('c1', 's2').draft.value).toBe('')
  })

  it('clears the draft once the save succeeds', async () => {
    const { draft, clearOnSuccess } = useSessionNoteDraft('c1', 's1')
    draft.value = 'Texte'

    await expect(clearOnSuccess(async () => 'note-1')).resolves.toBe('note-1')
    await nextTick()

    expect(draft.value).toBe('')
    expect(localStorage.getItem('wjdr:note-draft:c1:s1')).toBe('')
  })

  it('keeps the draft when the save fails', async () => {
    const { draft, clearOnSuccess } = useSessionNoteDraft('c1', 's1')
    draft.value = 'Texte'

    await expect(clearOnSuccess(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom')

    expect(draft.value).toBe('Texte')
  })
})
