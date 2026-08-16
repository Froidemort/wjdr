import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import type { SessionNote, SessionSummary } from '../types/domain'

interface UseSessionNotesFilteringOptions {
  notes: Ref<SessionNote[]>
  searchQuery: Ref<string>
  sessions: Ref<SessionSummary[]>
  selectedSessionId: Ref<string | null>
  isMj: Ref<boolean>
}

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

function formatSessionDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
  }).format(parsed)
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

export function formatSessionLabel(session: SessionSummary): string {
  const dateLabel = formatSessionDate(session.date)
  const titleLabel = session.name?.trim() ? session.name.trim() : 'Sans titre'
  return `${dateLabel} - ${titleLabel}`
}

export function useSessionNotesFiltering(options: UseSessionNotesFilteringOptions) {
  const linkedSessionFilter = ref<'all' | 'none' | string>('all')

  const visibleNotes = computed(() => options.notes.value.filter((note) => note.isVisible))
  const notesToDisplay = computed(() => (options.isMj.value ? options.notes.value : visibleNotes.value))

  const linkedSessionFilterOptions = computed(() => {
    const filterOptions: Array<{ value: 'all' | 'none' | string; label: string }> = [
      { value: 'all', label: 'Toutes les sessions' },
      { value: 'none', label: 'Sans session liée' },
    ]

    for (const session of options.sessions.value) {
      filterOptions.push({
        value: session.id,
        label: formatSessionLabel(session),
      })
    }

    return filterOptions
  })

  const notesFilteredBySession = computed(() => {
    if (options.selectedSessionId.value) {
      return notesToDisplay.value
    }

    if (linkedSessionFilter.value === 'all') {
      return notesToDisplay.value
    }

    if (linkedSessionFilter.value === 'none') {
      return notesToDisplay.value.filter((note) => !note.sessionId)
    }

    return notesToDisplay.value.filter((note) => note.sessionId === linkedSessionFilter.value)
  })

  const filteredNotes = computed(() => {
    const query = options.searchQuery.value.trim().toLowerCase()
    if (!query) {
      return notesFilteredBySession.value
    }

    return notesFilteredBySession.value
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

  function resetLinkedSessionFilter(): void {
    linkedSessionFilter.value = 'all'
  }

  function resolveSessionLabel(sessionId: string | null | undefined): string {
    if (!sessionId) {
      return 'Sans session liée'
    }

    const session = options.sessions.value.find((entry) => entry.id === sessionId)
    return session ? formatSessionLabel(session) : 'Session liée inconnue'
  }

  return {
    linkedSessionFilter,
    linkedSessionFilterOptions,
    filteredNotes,
    resetLinkedSessionFilter,
    resolveSessionLabel,
    formatSessionDate,
    formatSessionLabel,
  }
}
