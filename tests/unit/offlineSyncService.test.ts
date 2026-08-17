import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearQueuedUpdates,
  enqueueOfflineUpdate,
  listQueuedUpdates,
} from '../../src/services/offlineQueueRepository'
import { replayOfflineQueue } from '../../src/services/offlineSyncService'

const {
  updateCharacterCoreMock,
  updateCharacterStatValuesMock,
  getSessionByIdMock,
  updateSessionMock,
} = vi.hoisted(() => ({
  updateCharacterCoreMock: vi.fn(),
  updateCharacterStatValuesMock: vi.fn(),
  getSessionByIdMock: vi.fn(),
  updateSessionMock: vi.fn(),
}))

vi.mock('../../src/services/charactersRepository', () => ({
  updateCharacterCore: updateCharacterCoreMock,
  updateCharacterStatValues: updateCharacterStatValuesMock,
}))

vi.mock('../../src/services/sessionsRepository', () => ({
  getSessionById: getSessionByIdMock,
  updateSession: updateSessionMock,
}))

describe('offlineSyncService', () => {
  beforeEach(async () => {
    updateCharacterCoreMock.mockReset()
    updateCharacterStatValuesMock.mockReset()
    getSessionByIdMock.mockReset()
    updateSessionMock.mockReset()
    await clearQueuedUpdates()
  })

  it('replays character core update and removes queue entry', async () => {
    await enqueueOfflineUpdate({
      entityType: 'character',
      entityId: 'char-1',
      payload: {
        kind: 'character-core',
        patch: {
          pvCurrent: 10,
          moneyGold: 2,
        },
      },
    })

    const result = await replayOfflineQueue()

    expect(updateCharacterCoreMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ applied: 1, reconciled: 0, dropped: 0, pending: 0 })
  })

  it('keeps entry when replay fails with transient error', async () => {
    updateCharacterCoreMock.mockRejectedValueOnce(new Error('network timeout'))

    await enqueueOfflineUpdate({
      entityType: 'character',
      entityId: 'char-2',
      payload: {
        kind: 'character-core',
        patch: {
          xpAvailable: 4,
        },
      },
    })

    const result = await replayOfflineQueue()

    expect(result).toEqual({ applied: 0, reconciled: 0, dropped: 0, pending: 1 })
    expect((await listQueuedUpdates())[0]?.retryCount).toBe(1)
  })

  it('drops entry when replay fails with non-transient error', async () => {
    updateCharacterCoreMock.mockRejectedValueOnce(new Error('forbidden'))
    const onDropped = vi.fn()

    await enqueueOfflineUpdate({
      entityType: 'character',
      entityId: 'char-3',
      payload: {
        kind: 'character-core',
        patch: {
          fortuneCurrent: 1,
        },
      },
    })

    const result = await replayOfflineQueue({ onDropped })

    expect(result).toEqual({ applied: 0, reconciled: 0, dropped: 1, pending: 0 })
    expect(onDropped).toHaveBeenCalledTimes(1)
  })

  it('skips outdated session patch when remote changed later', async () => {
    getSessionByIdMock.mockResolvedValue({
      id: 'session-1',
      campaignId: 'camp-1',
      date: '2025-01-02',
      name: 'Session',
      description: null,
      createdAt: '2025-01-02T10:00:00.000Z',
      updatedAt: '2025-01-02T12:00:00.000Z',
    })

    await enqueueOfflineUpdate({
      entityType: 'session',
      entityId: 'session-1',
      payload: {
        kind: 'session',
        patch: {
          name: 'Nom local',
          description: 'Description locale',
        },
      },
      baseUpdatedAt: '2025-01-02T11:00:00.000Z',
      localUpdatedAt: new Date('2025-01-02T11:30:00.000Z').getTime(),
    })

    const onReconciled = vi.fn()
    const result = await replayOfflineQueue({ onReconciled })

    expect(updateSessionMock).not.toHaveBeenCalled()
    expect(onReconciled).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ applied: 0, reconciled: 1, dropped: 0, pending: 0 })
  })

  it('applies local session patch when local update is newer than remote mutation', async () => {
    getSessionByIdMock.mockResolvedValue({
      id: 'session-2',
      campaignId: 'camp-1',
      date: '2025-01-03',
      name: 'Session 2',
      description: null,
      createdAt: '2025-01-03T10:00:00.000Z',
      updatedAt: '2025-01-03T12:00:00.000Z',
    })

    await enqueueOfflineUpdate({
      entityType: 'session',
      entityId: 'session-2',
      payload: {
        kind: 'session',
        patch: {
          name: 'Nom local récent',
        },
      },
      baseUpdatedAt: '2025-01-03T11:00:00.000Z',
      localUpdatedAt: new Date('2025-01-03T13:00:00.000Z').getTime(),
    })

    const result = await replayOfflineQueue()

    expect(updateSessionMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ applied: 1, reconciled: 0, dropped: 0, pending: 0 })
  })
})
