import { ref } from 'vue'
import { useRealtimeChannels } from './useRealtimeChannels'
import {
  listNotificationsForUserPaginated,
  type NotificationItem,
} from '../../repositories/notificationsRepository'

interface UseNotificationsLoadOptions {
  userId: () => string | undefined
  pageSize: number
  page: () => number
}

export function useNotificationsLoad(options: UseNotificationsLoadOptions) {
  const notifications = ref<NotificationItem[]>([])
  const totalNotifications = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { subscribe, unsubscribe } = useRealtimeChannels(
    () => {
      void load()
    },
    { debounceMs: 300 }
  )

  async function load(): Promise<void> {
    const userId = options.userId()
    if (!userId) {
      notifications.value = []
      totalNotifications.value = 0
      return
    }

    loading.value = true
    error.value = null
    try {
      const result = await listNotificationsForUserPaginated(
        userId,
        options.page(),
        options.pageSize
      )
      notifications.value = result.items
      totalNotifications.value = result.total
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Impossible de charger les notifications.'
    } finally {
      loading.value = false
    }
  }

  function subscribeToNotifications(userId: string): void {
    subscribe(`notifications-${userId}`, [
      { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
    ])
  }

  return {
    notifications,
    totalNotifications,
    loading,
    error,
    load,
    subscribe: subscribeToNotifications,
    unsubscribe,
  }
}
