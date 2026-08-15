import { ref, watch } from 'vue'
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationRead,
  type NotificationItem,
} from '../services/notificationsRepository'
import { useAuthStore } from '../stores/auth'
import { useRealtimeChannels } from './useRealtimeChannels'

const PREVIEW_LIMIT = 5

const preview = ref<NotificationItem[]>([])
const unreadCount = ref(0)
const error = ref<string | null>(null)

const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void refreshMissives()
  },
  { debounceMs: 300 },
)

let isWatchingAuth = false

async function refreshMissives(): Promise<void> {
  const userId = useAuthStore().user?.id
  if (!userId) {
    preview.value = []
    unreadCount.value = 0
    error.value = null
    return
  }

  try {
    const [list, unread] = await Promise.all([
      listNotificationsForUser(userId),
      countUnreadNotifications(userId),
    ])
    preview.value = list.slice(0, PREVIEW_LIMIT)
    unreadCount.value = unread
    error.value = null
  } catch (loadError) {
    error.value =
      loadError instanceof Error ? loadError.message : 'Impossible de charger les missives.'
  }
}

async function markMissiveAsRead(notificationId: string): Promise<void> {
  await markNotificationRead(notificationId)
  await refreshMissives()
}

function ensureMissivesSubscription(): void {
  if (isWatchingAuth) {
    return
  }

  isWatchingAuth = true
  const authStore = useAuthStore()

  watch(
    () => authStore.user?.id,
    (userId) => {
      if (!userId) {
        preview.value = []
        unreadCount.value = 0
        error.value = null
        unsubscribe()
        return
      }

      void refreshMissives()
      subscribe(`navbar-missives-${userId}`, [
        { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
      ])
    },
    { immediate: true },
  )
}

export function useMissivesInbox() {
  ensureMissivesSubscription()

  return {
    preview,
    unreadCount,
    error,
    refreshMissives,
    markMissiveAsRead,
  }
}
