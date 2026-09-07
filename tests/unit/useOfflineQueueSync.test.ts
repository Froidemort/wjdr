import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencies = vi.hoisted(() => ({
  countQueued: vi.fn(),
  isOnline: { value: true },
  onBeforeUnmount: vi.fn(),
  onMounted: vi.fn(),
  replayQueue: vi.fn(),
  subscribeChanges: vi.fn(),
  unsubscribeChanges: vi.fn(),
  watch: vi.fn(),
}))

vi.mock('@vueuse/core', () => ({ useNetwork: () => ({ isOnline: dependencies.isOnline }) }))
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return {
    ...actual,
    onBeforeUnmount: dependencies.onBeforeUnmount,
    onMounted: dependencies.onMounted,
    watch: dependencies.watch,
  }
})
vi.mock('../../src/services/offlineQueueRepository', () => ({
  countQueuedUpdates: dependencies.countQueued,
  subscribeOfflineQueueChanges: dependencies.subscribeChanges,
}))
vi.mock('../../src/services/offlineSyncService', () => ({ replayOfflineQueue: dependencies.replayQueue }))

import { useOfflineQueueSync } from '../../src/composables/useOfflineQueueSync'

describe('useOfflineQueueSync', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.countQueued.mockResolvedValue(2)
    dependencies.replayQueue.mockResolvedValue(undefined)
    dependencies.subscribeChanges.mockReturnValue(dependencies.unsubscribeChanges)
    dependencies.isOnline.value = true
  })

  it('replays the queue and refreshes its pending count', async () => {
    const sync = useOfflineQueueSync()

    await sync.flushQueue()

    expect(dependencies.replayQueue).toHaveBeenCalledWith({ onDropped: expect.any(Function) })
    expect(dependencies.countQueued).toHaveBeenCalledOnce()
    expect(sync.pendingCount.value).toBe(2)
    expect(sync.isSyncing.value).toBe(false)
    expect(sync.lastSyncError.value).toBeNull()
  })

  it('exposes replay errors and forwards dropped-entry errors', async () => {
    const onDropped = vi.fn()
    dependencies.replayQueue.mockImplementation(async ({ onDropped: reportDropped }) => {
      reportDropped({}, new Error('Abandonnee'))
      throw new Error('Synchronisation impossible')
    })
    const sync = useOfflineQueueSync({ onDropped })

    await sync.flushQueue()

    expect(onDropped).toHaveBeenCalledWith(expect.objectContaining({ message: 'Abandonnee' }))
    expect(sync.lastSyncError.value).toBe('Synchronisation impossible')
    expect(sync.isSyncing.value).toBe(false)
  })

  it('does not replay while a synchronization is already running', async () => {
    let releaseReplay: (() => void) | null = null
    dependencies.replayQueue.mockImplementation(
      () => new Promise<void>((resolve) => { releaseReplay = resolve })
    )
    const sync = useOfflineQueueSync()
    const firstFlush = sync.flushQueue()

    await sync.flushQueue()
    expect(dependencies.replayQueue).toHaveBeenCalledOnce()

    releaseReplay?.()
    await firstFlush
  })

  it('uses the fallback message for non-Error replay failures', async () => {
    dependencies.replayQueue.mockRejectedValue('indisponible')
    const sync = useOfflineQueueSync()

    await sync.flushQueue()

    expect(sync.lastSyncError.value).toBe('Synchronisation échouée.')
  })

  it('only flushes from online lifecycle events and refreshes on queue subscriptions', async () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    vi.stubGlobal('window', { addEventListener, removeEventListener })
    const sync = useOfflineQueueSync()
    const mounted = dependencies.onMounted.mock.calls[0]?.[0] as (() => void)
    const queueChange = dependencies.subscribeChanges.mock.calls[0]?.[0] as () => void

    mounted()
    const onlineListener = addEventListener.mock.calls[0]?.[1] as () => Promise<void>
    await vi.waitFor(() => expect(dependencies.countQueued).toHaveBeenCalledOnce())
    dependencies.isOnline.value = false
    await onlineListener()
    expect(dependencies.replayQueue).not.toHaveBeenCalled()

    dependencies.isOnline.value = true
    await onlineListener()
    expect(dependencies.replayQueue).toHaveBeenCalledOnce()
    queueChange()
    await vi.waitFor(() => expect(dependencies.countQueued).toHaveBeenCalledTimes(3))
  })

  it('reacts to network watch callbacks and removes lifecycle subscriptions', async () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    vi.stubGlobal('window', { addEventListener, removeEventListener })
    useOfflineQueueSync()
    const mounted = dependencies.onMounted.mock.calls[0]?.[0] as (() => void)
    const watchCallback = dependencies.watch.mock.calls[0]?.[1] as () => void
    const unmounted = dependencies.onBeforeUnmount.mock.calls[0]?.[0] as (() => void)
    mounted()

    dependencies.isOnline.value = false
    watchCallback()
    await Promise.resolve()
    expect(dependencies.replayQueue).not.toHaveBeenCalled()

    dependencies.isOnline.value = true
    watchCallback()
    await vi.waitFor(() => expect(dependencies.replayQueue).toHaveBeenCalledOnce())
    unmounted()

    expect(removeEventListener).toHaveBeenCalledWith('online', addEventListener.mock.calls[0]?.[1])
    expect(dependencies.unsubscribeChanges).toHaveBeenCalledOnce()
  })
})