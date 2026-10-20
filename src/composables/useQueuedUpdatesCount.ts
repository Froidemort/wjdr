import { onBeforeUnmount, onMounted, ref } from 'vue'
import { countQueuedUpdates, subscribeOfflineQueueChanges } from '../services/offlineQueueRepository'

export function useQueuedUpdatesCount() {
  const queuedCount = ref(0)

  async function refresh(): Promise<void> {
    try {
      queuedCount.value = await countQueuedUpdates()
    } catch {
      queuedCount.value = 0
    }
  }

  const unsubscribe = subscribeOfflineQueueChanges(() => {
    void refresh()
  })

  onMounted(() => {
    void refresh()
  })
  onBeforeUnmount(unsubscribe)

  return { queuedCount }
}
