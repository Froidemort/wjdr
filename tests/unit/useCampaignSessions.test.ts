import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CampaignSummary, SessionSummary } from '../../src/types/domain'

const dependencies = vi.hoisted(() => ({
  confirmAction: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  enqueueOfflineUpdate: vi.fn(),
  flush: vi.fn(),
  optimisticError: { value: null as Error | null },
  optimisticOptions: null as { onSave: (payload: { sessionId: string; date: string; name: string; description: string }) => Promise<void> } | null,
  refresh: vi.fn(),
  setErrorMessage: vi.fn(),
  transientError: vi.fn(),
  updateSession: vi.fn(),
}))

vi.mock('../../src/composables/useConfirmAction', () => ({
  useConfirmAction: () => ({ confirmAction: dependencies.confirmAction }),
}))
vi.mock('../../src/composables/useOptimisticUpdate', () => ({
  useOptimisticUpdate: (options: typeof dependencies.optimisticOptions) => {
    dependencies.optimisticOptions = options
    return { flush: dependencies.flush, error: dependencies.optimisticError }
  },
}))
vi.mock('../../src/services/sessionsRepository', () => ({
  createSession: dependencies.createSession,
  deleteSession: dependencies.deleteSession,
  updateSession: dependencies.updateSession,
}))
vi.mock('../../src/services/offlineQueueRepository', () => ({ enqueueOfflineUpdate: dependencies.enqueueOfflineUpdate }))
vi.mock('../../src/services/shared/networkErrors', () => ({ isTransientError: dependencies.transientError }))

import { useCampaignSessions } from '../../src/composables/useCampaignSessions'

const campaign: CampaignSummary = {
  id: 'campaign-1',
  name: 'La couronne ennemie',
  code: 'CODE123',
  description: null,
  isArchived: false,
  mjId: 'mj-1',
  createdAt: null,
}

const existingSession: SessionSummary = {
  id: 'session-1',
  campaignId: 'campaign-1',
  date: '2026-09-10',
  name: 'La route',
  description: null,
  createdAt: null,
  updatedAt: null,
}

function createSessions(options: { isMj?: boolean; sessions?: SessionSummary[]; isArchived?: boolean } = {}) {
  return useCampaignSessions({
    session: ref({ ...campaign, isArchived: options.isArchived ?? false }),
    sessions: ref(options.sessions ?? [existingSession]),
    isMj: ref(options.isMj ?? true),
    campaignId: ref('campaign-1'),
    refreshSessionDetail: dependencies.refresh,
    setErrorMessage: dependencies.setErrorMessage,
  })
}

describe('useCampaignSessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.confirmAction.mockResolvedValue(true)
    dependencies.createSession.mockResolvedValue('session-2')
    dependencies.deleteSession.mockResolvedValue(undefined)
    dependencies.flush.mockResolvedValue(undefined)
    dependencies.refresh.mockResolvedValue(undefined)
    dependencies.optimisticError.value = null
    dependencies.transientError.mockReturnValue(false)
  })

  it('validates a session creation date before calling the repository', async () => {
    const sessions = createSessions()
    sessions.sessionCreateForm.value.date = '10/09/2026'

    await sessions.createCampaignSession()

    expect(sessions.sessionCreateDateError.value).toBe('La date de session est requise.')
    expect(dependencies.createSession).not.toHaveBeenCalled()
  })

  it('creates a session, normalizes optional fields, refreshes, and resets the form', async () => {
    const sessions = createSessions()
    sessions.sessionCreateForm.value = { date: '2026-09-12', name: '  Le guet  ', description: '  ' }

    await sessions.createCampaignSession()

    expect(dependencies.createSession).toHaveBeenCalledWith({ campaignId: 'campaign-1', date: '2026-09-12', name: 'Le guet', description: null })
    expect(dependencies.refresh).toHaveBeenCalledOnce()
    expect(sessions.sessionCreateLoading.value).toBe(false)
    expect(sessions.sessionCreateForm.value.name).toBe('')
    expect(sessions.sessionActionSuccessMessage.value).toBe('Session creee.')
  })

  it('maps creation permission failures and guards archived campaigns', async () => {
    dependencies.createSession.mockRejectedValue(Object.assign(new Error('permission denied'), { status: 403 }))
    const sessions = createSessions({ sessions: [] })
    sessions.sessionCreateForm.value.date = '2026-09-12'

    await sessions.createCampaignSession()

    expect(sessions.sessionCreateError.value).toBe('Acces refuse: seul le MJ de la campagne peut creer une session.')

    const archivedSessions = createSessions({ isArchived: true, sessions: [] })
    archivedSessions.sessionCreateForm.value.date = '2026-09-13'
    await archivedSessions.createCampaignSession()

    expect(dependencies.createSession).toHaveBeenCalledTimes(1)
  })

  it('prevents conflicting edits and saves a valid edit through the optimistic boundary', async () => {
    const sessions = createSessions({ sessions: [existingSession, { ...existingSession, id: 'session-2', date: '2026-09-11' }] })
    sessions.startSessionEdit(existingSession)
    sessions.sessionEditForm.value.date = '2026-09-11'

    await sessions.saveSessionEdit('session-1')

    expect(sessions.sessionEditDateError.value).toBe('Une session existe déjà à cette date.')
    expect(dependencies.flush).not.toHaveBeenCalled()

    sessions.sessionEditForm.value.date = '2026-09-12'
    await sessions.saveSessionEdit('session-1')

    expect(dependencies.flush).toHaveBeenCalledWith({ sessionId: 'session-1', date: '2026-09-12', name: 'La route', description: '' })
    expect(sessions.sessionEditId.value).toBeNull()
    expect(sessions.sessionActionSuccessMessage.value).toBe('Session mise a jour.')
  })

  it('deletes only after confirmation and forwards repository failures to the page error', async () => {
    dependencies.confirmAction.mockResolvedValue(false)
    const sessions = createSessions()

    await sessions.deleteCampaignSession(existingSession)

    expect(dependencies.deleteSession).not.toHaveBeenCalled()

    dependencies.confirmAction.mockResolvedValue(true)
    dependencies.deleteSession.mockRejectedValue(new Error('Indisponible'))
    await sessions.deleteCampaignSession(existingSession)

    expect(dependencies.setErrorMessage).toHaveBeenCalledWith('Indisponible')
    expect(sessions.sessionDeleteBusyId.value).toBeNull()
  })

  it('exposes timeline data and session presentation helpers', () => {
    const sessions = createSessions({
      sessions: [
        { ...existingSession, date: '2099-09-06', name: null },
        { ...existingSession, id: 'session-2', date: '2099-09-08', name: '  ' },
      ],
    })

    expect(sessions.timelineStats.value).toEqual({ upcoming: 2, past: 0 })
    expect(sessions.nextSession.value?.id).toBe('session-1')
    expect(sessions.formatCampaignSessionDate('invalide')).toBe('invalide')
    expect(sessions.formatCampaignSessionTitle(sessions.nextSession.value!)).toContain('Session du')
    expect(sessions.buildCampaignSessionDetailLink('session-2')).toBe('/campaigns/campaign-1/timeline/session-2')
  })

  it('maps invalid database creation errors and retains edit state when saving fails', async () => {
    dependencies.createSession.mockRejectedValue(new Error('invalid input syntax for date'))
    const sessions = createSessions({ sessions: [] })
    sessions.sessionCreateForm.value.date = '2026-09-12'

    await sessions.createCampaignSession()

    expect(sessions.sessionCreateError.value).toBe('Date invalide. Utilisez un format de date valide.')

    sessions.startSessionEdit(existingSession)
    dependencies.flush.mockRejectedValue(new Error('Indisponible'))
    await sessions.saveSessionEdit('session-1')

    expect(sessions.sessionEditId.value).toBe('session-1')
    expect(sessions.sessionEditError.value).toBe('Indisponible')
  })

  it('handles creation guards, conflicts, and generic repository failures', async () => {
    const sessions = createSessions({ isMj: false })
    sessions.sessionCreateForm.value.date = '2026-09-12'

    await sessions.createCampaignSession()
    expect(dependencies.createSession).not.toHaveBeenCalled()

    const conflictingSessions = createSessions()
    conflictingSessions.sessionCreateForm.value.date = existingSession.date
    await conflictingSessions.createCampaignSession()
    expect(conflictingSessions.sessionCreateDateError.value).toBe('Une session existe déjà à cette date.')

    const failingSessions = createSessions({ sessions: [] })
    failingSessions.sessionCreateForm.value.date = '2026-09-12'
    dependencies.createSession.mockRejectedValue('indisponible')
    await failingSessions.createCampaignSession()
    expect(failingSessions.sessionCreateError.value).toBe('Creation de session impossible.')
  })

  it('normalizes optimistic saves and queues transient edit failures for replay', async () => {
    const sessions = createSessions()
    const onSave = dependencies.optimisticOptions?.onSave

    await onSave?.({ sessionId: '', date: '', name: 'ignored', description: 'ignored' })
    expect(dependencies.updateSession).not.toHaveBeenCalled()

    await onSave?.({ sessionId: 'session-1', date: '2026-09-12', name: '  Le guet ', description: ' ' })
    expect(dependencies.updateSession).toHaveBeenCalledWith('session-1', {
      date: '2026-09-12', name: 'Le guet', description: null,
    })

    dependencies.updateSession.mockRejectedValue(new Error('hors ligne'))
    dependencies.transientError.mockReturnValue(true)
    await onSave?.({ sessionId: 'session-1', date: '2026-09-13', name: '', description: '  Notes ' })
    expect(dependencies.enqueueOfflineUpdate).toHaveBeenCalledWith({
      entityType: 'session', entityId: 'session-1',
      payload: { kind: 'session', patch: { date: '2026-09-13', name: null, description: 'Notes' } },
      baseUpdatedAt: null, localUpdatedAt: expect.any(Number),
    })

    dependencies.transientError.mockReturnValue(false)
    await expect(onSave?.({ sessionId: 'session-1', date: '2026-09-14', name: '', description: '' })).rejects.toThrow('hors ligne')
    expect(sessions.sessionEditId.value).toBeNull()
  })

  it('resets and guards edits, deletes an active edit, and exposes date helpers', async () => {
    const sessions = createSessions()
    sessions.startSessionEdit(existingSession)
    sessions.cancelSessionEdit()
    expect(sessions.sessionEditForm.value).toEqual({ date: '', name: '', description: '' })

    await sessions.saveSessionEdit('session-1')
    expect(dependencies.flush).not.toHaveBeenCalled()

    sessions.startSessionEdit(existingSession)
    sessions.sessionEditForm.value.date = 'invalid'
    await sessions.saveSessionEdit('session-1')
    expect(sessions.sessionEditDateError.value).toBe('La date de session est requise.')

    await sessions.deleteCampaignSession(existingSession)
    expect(dependencies.deleteSession).toHaveBeenCalledWith('session-1')
    expect(sessions.sessionEditId.value).toBeNull()
    expect(sessions.formatCampaignSessionDateCompact('2026-09-10')).not.toBe('2026-09-10')
    expect(sessions.formatCampaignSessionTitle(existingSession)).toBe('La route')
  })
})