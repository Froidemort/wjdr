import { ref, watch } from 'vue'
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationRead,
  type NotificationItem,
} from '../services/notificationsRepository'
import { useAuthStore } from '../stores/auth'
import { useAsyncList } from './useAsyncList'
import { useRealtimeSync } from './useRealtimeSync'

const PREVIEW_LIMIT = 5

export function useMissivesInbox() {
  const authStore = useAuthStore()
  const unreadCount = ref(0)
  const previewList = useAsyncList<NotificationItem>({
    fallbackItems: [],
    errorMessage: 'Impossible de charger les missives.',
    loadItems: async () => {
      const userId = authStore.user?.id
      if (!userId) {
        return []
      }

      const list = await listNotificationsForUser(userId)
      return list.slice(0, PREVIEW_LIMIT)
    },
  })

  const realtimeSync = useRealtimeSync({
    debounceMs: 300,
    onUpdate: refreshMissives,
  })

  async function loadUnreadCount(): Promise<void> {
    const userId = authStore.user?.id
    if (!userId) {
      unreadCount.value = 0
      return
    }

    unreadCount.value = await countUnreadNotifications(userId)
  }

  async function refreshMissives(): Promise<void> {
    const userId = authStore.user?.id
    if (!userId) {
      previewList.clear([])
      unreadCount.value = 0
      return
    }

    try {
      await Promise.all([previewList.load(), loadUnreadCount()])
    } catch {
      unreadCount.value = 0
    }
  }

  async function markMissiveAsRead(notificationId: string): Promise<void> {
    await markNotificationRead(notificationId)
    await refreshMissives()
  }

  watch(
    () => authStore.user?.id,
    (userId) => {
      if (!userId) {
        previewList.clear([])
        unreadCount.value = 0
        realtimeSync.stop()
        return
      }

      void refreshMissives()
      realtimeSync.start(`navbar-missives-${userId}`, [
        { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
      ])
    },
    { immediate: true },
  )

  return {
    preview: previewList.items,
    unreadCount,
    error: previewList.error,
    refreshMissives,
    markMissiveAsRead,
  }
}
