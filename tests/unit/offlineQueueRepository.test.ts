import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearQueuedUpdates,
  countQueuedUpdates,
  enqueueOfflineUpdate,
  listQueuedUpdates,
  removeQueuedUpdate,
} from '../../src/services/offlineQueueRepository'

describe('offlineQueueRepository', () => {
  beforeEach(async () => {
    await clearQueuedUpdates()
  })

  it('coalesces updates for same entity and merges patch payload', async () => {
    await enqueueOfflineUpdate({
      entityType: 'character',
      entityId: 'char-1',
      payload: {
        kind: 'character-core',
        patch: {
          pvCurrent: 12,
        },
      },
      baseUpdatedAt: '2025-01-01T10:00:00.000Z',
      localUpdatedAt: 1735725600000,
    })

    await enqueueOfflineUpdate({
      entityType: 'character',
      entityId: 'char-1',
      payload: {
        kind: 'character-core',
        patch: {
          moneyGold: 3,
        },
      },
      baseUpdatedAt: '2025-01-01T10:00:00.000Z',
      localUpdatedAt: 1735725601000,
    })

    const rows = await listQueuedUpdates()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.payload).toEqual({
      kind: 'character-core',
      patch: {
        pvCurrent: 12,
        moneyGold: 3,
      },
    })
  })

  it('tracks queue size when removing an entry', async () => {
    const id = await enqueueOfflineUpdate({
      entityType: 'session',
      entityId: 'session-1',
      payload: {
        kind: 'session',
        patch: { name: 'Nouveau nom' },
      },
    })

    expect(await countQueuedUpdates()).toBe(1)
    await removeQueuedUpdate(id)
    expect(await countQueuedUpdates()).toBe(0)
  })
})
