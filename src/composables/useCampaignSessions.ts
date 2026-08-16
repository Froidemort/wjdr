import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { CampaignSummary, SessionSummary } from '../types/domain'
import { createSession, deleteSession, updateSession } from '../services/sessionsRepository'

interface SessionEditForm {
  date: string
  name: string
  description: string
}

interface SessionCreateForm {
  date: string
  name: string
  description: string
}

interface UseCampaignSessionsOptions {
  session: Ref<CampaignSummary | null>
  sessions: Ref<SessionSummary[]>
  isMj: Ref<boolean>
  campaignId: Ref<string>
  refreshSessionDetail: () => Promise<void>
  setErrorMessage: (value: string | null) => void
}

export function useCampaignSessions(options: UseCampaignSessionsOptions) {
  const sessionCreateLoading = ref(false)
  const sessionCreateError = ref<string | null>(null)
  const sessionCreateDateError = ref<string | null>(null)
  const sessionCreateForm = ref<SessionCreateForm>({
    date: '',
    name: '',
    description: '',
  })

  const sessionTimelineFilter = ref<'all' | 'upcoming' | 'past'>('all')
  const sessionDeleteBusyId = ref<string | null>(null)
  const sessionEditId = ref<string | null>(null)
  const sessionEditBusyId = ref<string | null>(null)
  const sessionEditError = ref<string | null>(null)
  const sessionEditDateError = ref<string | null>(null)
  const sessionEditForm = ref<SessionEditForm>({
    date: '',
    name: '',
    description: '',
  })

  const sessionActionSuccessMessage = ref<string | null>(null)
  let sessionActionFeedbackTimer: ReturnType<typeof setTimeout> | null = null

  const todaySessionDate = computed(() => new Date().toISOString().slice(0, 10))

  function parseSessionDate(value: string): Date | null {
    const parsed = new Date(`${value}T12:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  function getSessionDateStatus(value: string): 'today' | 'upcoming' | 'past' {
    const parsed = parseSessionDate(value)
    const todayParsed = parseSessionDate(todaySessionDate.value)

    if (!parsed || !todayParsed) {
      return 'upcoming'
    }

    const parsedKey = parsed.toISOString().slice(0, 10)
    const todayKey = todayParsed.toISOString().slice(0, 10)
    if (parsedKey === todayKey) {
      return 'today'
    }

    return parsed > todayParsed ? 'upcoming' : 'past'
  }

  const timelineSessions = computed(() => {
    const source = [...options.sessions.value]
    source.sort((left, right) => right.date.localeCompare(left.date))

    if (sessionTimelineFilter.value === 'all') {
      return source
    }

    return source.filter((sessionItem) => {
      const status = getSessionDateStatus(sessionItem.date)
      return sessionTimelineFilter.value === 'upcoming' ? status !== 'past' : status === 'past'
    })
  })

  const nextSession = computed(() => {
    const upcoming = options.sessions.value
      .filter((sessionItem) => getSessionDateStatus(sessionItem.date) !== 'past')
      .sort((left, right) => left.date.localeCompare(right.date))

    return upcoming[0] ?? null
  })

  const timelineStats = computed(() => {
    const upcoming = options.sessions.value.filter((sessionItem) => getSessionDateStatus(sessionItem.date) !== 'past').length
    const past = options.sessions.value.filter((sessionItem) => getSessionDateStatus(sessionItem.date) === 'past').length

    return {
      upcoming,
      past,
    }
  })

  function mapCreateSessionError(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Creation de session impossible.'
    }

    const maybeStatus = (error as { status?: number }).status
    const message = error.message.toLowerCase()

    if (
      maybeStatus === 403 ||
      message.includes('row-level security') ||
      message.includes('permission denied')
    ) {
      return 'Acces refuse: seul le MJ de la campagne peut creer une session.'
    }

    if (message.includes('invalid input syntax') || message.includes('date')) {
      return 'Date invalide. Utilisez un format de date valide.'
    }

    return error.message
  }

  function formatCampaignSessionDate(value: string): string {
    const parsed = new Date(`${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
    }).format(parsed)
  }

  function formatCampaignSessionDateCompact(value: string): string {
    const parsed = new Date(`${value}T12:00:00`)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
    }).format(parsed)
  }

  function formatCampaignSessionTitle(sessionItem: SessionSummary): string {
    const trimmedTitle = sessionItem.name?.trim()
    return trimmedTitle ? trimmedTitle : `Session du ${formatCampaignSessionDate(sessionItem.date)}`
  }

  function buildCampaignSessionDetailLink(targetSessionId: string): string {
    const identifier = options.session.value?.id ?? options.campaignId.value
    return `/campaigns/${identifier}/timeline/${targetSessionId}`
  }

  function setSessionActionSuccess(message: string): void {
    sessionActionSuccessMessage.value = message
    if (sessionActionFeedbackTimer) {
      clearTimeout(sessionActionFeedbackTimer)
    }

    sessionActionFeedbackTimer = setTimeout(() => {
      sessionActionSuccessMessage.value = null
    }, 4500)
  }

  function resetSessionCreateForm(): void {
    sessionCreateDateError.value = null
    sessionCreateForm.value = {
      date: todaySessionDate.value,
      name: '',
      description: '',
    }
  }

  function startSessionEdit(sessionItem: SessionSummary): void {
    sessionEditId.value = sessionItem.id
    sessionEditError.value = null
    sessionEditDateError.value = null
    sessionEditForm.value = {
      date: sessionItem.date,
      name: sessionItem.name ?? '',
      description: sessionItem.description ?? '',
    }
  }

  function cancelSessionEdit(): void {
    sessionEditId.value = null
    sessionEditBusyId.value = null
    sessionEditError.value = null
    sessionEditDateError.value = null
    sessionEditForm.value = {
      date: '',
      name: '',
      description: '',
    }
  }

  async function saveSessionEdit(targetSessionId: string): Promise<void> {
    if (!options.isMj.value || sessionEditBusyId.value) {
      return
    }

    const date = sessionEditForm.value.date.trim()
    sessionEditDateError.value = null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sessionEditDateError.value = 'La date de session est requise.'
      return
    }

    sessionEditBusyId.value = targetSessionId
    sessionEditError.value = null

    try {
      await updateSession(targetSessionId, {
        date,
        name: sessionEditForm.value.name.trim() || null,
        description: sessionEditForm.value.description.trim() || null,
      })
      cancelSessionEdit()
      await options.refreshSessionDetail()
      setSessionActionSuccess('Session mise a jour.')
    } catch (error) {
      sessionEditError.value =
        error instanceof Error ? error.message : 'Mise a jour de session impossible.'
    } finally {
      sessionEditBusyId.value = null
    }
  }

  async function createCampaignSession(): Promise<void> {
    if (
      !options.session.value ||
      !options.isMj.value ||
      sessionCreateLoading.value ||
      options.session.value.isArchived
    ) {
      return
    }

    sessionCreateError.value = null
    sessionCreateDateError.value = null
    const date = sessionCreateForm.value.date.trim()
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      sessionCreateDateError.value = 'La date de session est requise.'
      return
    }

    sessionCreateLoading.value = true
    try {
      await createSession({
        campaignId: options.session.value.id,
        date,
        name: sessionCreateForm.value.name.trim() || null,
        description: sessionCreateForm.value.description.trim() || null,
      })
      resetSessionCreateForm()
      await options.refreshSessionDetail()
      setSessionActionSuccess('Session creee.')
    } catch (error) {
      sessionCreateError.value = mapCreateSessionError(error)
    } finally {
      sessionCreateLoading.value = false
    }
  }

  async function deleteCampaignSession(sessionItem: SessionSummary): Promise<void> {
    if (!options.isMj.value) {
      return
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Supprimer la session du ${formatCampaignSessionDate(sessionItem.date)} ?`
      )
      if (!confirmed) {
        return
      }
    }

    try {
      if (sessionEditId.value === sessionItem.id) {
        cancelSessionEdit()
      }
      sessionDeleteBusyId.value = sessionItem.id
      await deleteSession(sessionItem.id)
      await options.refreshSessionDetail()
      setSessionActionSuccess('Session supprimee.')
    } catch (error) {
      options.setErrorMessage(
        error instanceof Error ? error.message : 'Suppression de session impossible.'
      )
    } finally {
      sessionDeleteBusyId.value = null
    }
  }

  watch(options.isMj, (value) => {
    if (value && !sessionCreateForm.value.date) {
      resetSessionCreateForm()
    }
  })

  onBeforeUnmount(() => {
    if (sessionActionFeedbackTimer) {
      clearTimeout(sessionActionFeedbackTimer)
    }
  })

  return {
    sessionCreateLoading,
    sessionCreateError,
    sessionCreateDateError,
    sessionCreateForm,
    sessionTimelineFilter,
    sessionDeleteBusyId,
    sessionEditId,
    sessionEditBusyId,
    sessionEditError,
    sessionEditDateError,
    sessionEditForm,
    sessionActionSuccessMessage,
    timelineSessions,
    nextSession,
    timelineStats,
    getSessionDateStatus,
    formatCampaignSessionDate,
    formatCampaignSessionDateCompact,
    formatCampaignSessionTitle,
    buildCampaignSessionDetailLink,
    createCampaignSession,
    startSessionEdit,
    cancelSessionEdit,
    saveSessionEdit,
    deleteCampaignSession,
  }
}
