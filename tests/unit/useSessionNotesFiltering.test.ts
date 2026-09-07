import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import type { SessionNote, SessionSummary } from '../../src/types/domain'
import { formatSessionLabel, useSessionNotesFiltering } from '../../src/composables/useSessionNotesFiltering'

const sessions = ref<SessionSummary[]>([
  { id: 'session-1', campaignId: 'campaign-1', date: '2026-09-07', name: 'La tour noire' } as SessionSummary,
])

function createFiltering(isMj = false) {
  const searchQuery = ref('')
  return {
    ...useSessionNotesFiltering({
    notes: ref<SessionNote[]>([
      { id: 'note-1', title: 'La tour', contentText: 'Tour tournee', sessionId: 'session-1', isVisible: true, createdAt: '2026-09-02' } as SessionNote,
      { id: 'note-2', title: 'Secret', contentText: 'Cache', sessionId: null, isVisible: false, createdAt: '2026-09-03' } as SessionNote,
      { id: 'note-3', title: 'Tournee', contentText: 'Rien', sessionId: null, isVisible: true, createdAt: '2026-09-01' } as SessionNote,
    ]),
    searchQuery,
    sessions,
    selectedSessionId: ref(null),
    isMj: ref(isMj),
    }),
    searchQuery,
  }
}

describe('useSessionNotesFiltering', () => {
  it('hides private notes for players and filters unlinked notes', () => {
    const filtering = createFiltering()

    expect(filtering.filteredNotes.value.map((note) => note.id)).toEqual(['note-1', 'note-3'])
    filtering.linkedSessionFilter.value = 'none'
    expect(filtering.filteredNotes.value.map((note) => note.id)).toEqual(['note-3'])
  })

  it('shows every note to the MJ and selects notes linked to a session', () => {
    const filtering = createFiltering(true)

    filtering.linkedSessionFilter.value = 'session-1'
    expect(filtering.filteredNotes.value.map((note) => note.id)).toEqual(['note-1'])
    filtering.resetLinkedSessionFilter()
    expect(filtering.linkedSessionFilter.value).toBe('all')
  })

  it('ranks matching notes and exposes session labels', () => {
    const filtering = createFiltering()
    filtering.linkedSessionFilter.value = 'none'
    filtering.filteredNotes.value
    filtering.linkedSessionFilter.value = 'all'
    filtering.filteredNotes.value
    filtering.searchQuery.value = 'tour'

    expect(filtering.filteredNotes.value.map((note) => note.id)).toEqual(['note-1', 'note-3'])
    expect(filtering.linkedSessionFilterOptions.value).toHaveLength(3)
    expect(filtering.resolveSessionLabel(null)).toBe('Sans session liée')
    expect(filtering.resolveSessionLabel('missing')).toBe('Session liée inconnue')
    expect(filtering.resolveSessionLabel('session-1')).toContain('La tour noire')
    expect(formatSessionLabel({ id: 'session-2', date: 'bad', name: ' ' } as SessionSummary)).toBe('bad - Sans titre')
  })
})