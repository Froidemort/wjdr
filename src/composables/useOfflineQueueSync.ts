import { useNetwork } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  countQueuedUpdates,
  subscribeOfflineQueueChanges,
} from '../services/offlineQueueRepository'
import { replayOfflineQueue } from '../services/offlineSyncService'

export function useOfflineQueueSync(options?: {
  onDropped?: (error: unknown) => void
}) {
  const { isOnline } = useNetwork()
  const pendingCount = ref(0)
  const isSyncing = ref(false)
  const lastSyncError = ref<string | null>(null)

  async function refreshPendingCount(): Promise<void> {
    pendingCount.value = await countQueuedUpdates()
  }

  async function flushQueue(): Promise<void> {
    if (isSyncing.value) {
      return
    }

    isSyncing.value = true
    lastSyncError.value = null

    try {
      await replayOfflineQueue({
        onDropped: (_entry, error) => {
          options?.onDropped?.(error)
        },
      })
    } catch (error) {
      lastSyncError.value = error instanceof Error ? error.message : 'Synchronisation échouée.'
    } finally {
      isSyncing.value = false
      await refreshPendingCount()
    }
  }

  async function handleOnline(): Promise<void> {
    if (!isOnline.value) {
      return
    }

    await flushQueue()
  }

  watch(isOnline, () => {
    void handleOnline()
  })

  const unsubscribeQueueChanges = subscribeOfflineQueueChanges(() => {
    void refreshPendingCount()
  })

  onMounted(() => {
    void refreshPendingCount()
    window.addEventListener('online', handleOnline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
    unsubscribeQueueChanges()
  })

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncError,
    refreshPendingCount,
    flushQueue,
  }
}
