<template>
  <nav class="navbar border-b border-base-300 bg-base-200 px-4">
    <div class="flex-shrink-0">
      <router-link to="/" class="btn btn-sm normal-case text-lg font-bold sm:text-xl">
        GRIMORIUM
      </router-link>
    </div>

    <div class="ml-auto flex items-center gap-2">
      <template v-if="isAuthenticated">
        <!-- Desktop Navigation (hidden on mobile) -->
        <div class="hidden sm:flex items-center rounded-box border border-base-300 bg-base-100 p-1 gap-1">
          <div 
            class="tooltip tooltip-bottom flex-shrink-0"
            :data-tip="displayName?.substring(0, 20) || 'Profil'"
          >
            <router-link to="/profile" class="btn btn-sm btn-square nav-icon-btn" aria-label="Profil">
              <div v-if="avatarUrl" class="avatar">
                <div class="w-7 rounded-full ring ring-base-300 ring-offset-1 ring-offset-base-100">
                  <img :src="avatarUrl" alt="Avatar utilisateur" class="object-cover" />
                </div>
              </div>
              <UserCircle v-else class="h-6 w-6" />
            </router-link>
          </div>

          <div ref="notificationsMenuRef" class="relative">
            <button
              ref="notificationsButtonRef"
              class="btn btn-square min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 tooltip tooltip-bottom nav-icon-btn"
              data-tip="Notifications"
              @click="toggleNotifications"
              aria-label="Notifications"
              aria-haspopup="menu"
              :aria-expanded="notificationsOpen ? 'true' : 'false'"
              :aria-controls="notificationsPanelId"
            >
              <div class="indicator">
                <Bell class="h-6 w-6" />
                <span
                  v-if="unreadCount > 0"
                  class="badge badge-xs indicator-item badge-warning"
                >
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </div>
            </button>

            <div
              v-if="notificationsOpen"
              :id="notificationsPanelId"
              class="absolute right-0 top-12 z-30 w-80 max-w-[calc(100vw-1rem)] md:w-96 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
              role="menu"
              aria-label="Apercu des notifications"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold">Missives</h3>
                <span class="badge">{{ unreadCount }} non lues</span>
              </div>

              <div v-if="notificationsLoading" class="alert alert-info alert-soft text-sm mt-3" role="status" aria-live="polite">
                <span class="loading loading-spinner loading-xs" aria-hidden="true" />
                <span>Chargement des missives...</span>
              </div>

              <div v-else-if="notificationsError" class="alert alert-error alert-soft text-sm mt-3" role="alert">
                <span>{{ notificationsError }}</span>
              </div>

              <div v-else-if="notificationsPreview.length === 0" class="alert alert-warning alert-soft text-sm mt-3">
                <span>Aucune missive pour l'instant.</span>
              </div>

              <div v-else class="mt-3 space-y-2 max-h-72 overflow-y-auto">
                <button
                  v-for="notification in notificationsPreview"
                  :key="notification.id"
                  class="w-full rounded-box border border-base-300 bg-base-200 p-3 text-left transition hover:bg-base-300"
                  @click="markPreviewAsRead(notification.id)"
                >
                  <p class="truncate text-sm font-medium">{{ getNotificationDisplayTitle(notification.title) }}</p>
                  <p class="mt-1 truncate text-xs opacity-70">{{ getNotificationDisplayMessage(notification.message) }}</p>
                  <p class="mt-2 text-xs" :class="notification.isRead ? 'text-success' : 'text-warning'">
                    {{ notification.isRead ? 'Lue' : 'Non lue' }}
                  </p>
                </button>
              </div>

              <router-link
                to="/notifications"
                class="btn btn-sm mt-3 w-full"
                @click="notificationsOpen = false"
              >
                Consulter toutes les missives
              </router-link>
            </div>
          </div>

          <router-link to="/campaigns" class="btn btn-square min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 tooltip tooltip-bottom nav-icon-btn" data-tip="Mes campagnes" aria-label="Mes campagnes">
            <Scroll class="w-6 h-6" />
          </router-link>

          <router-link to="/characters" class="btn btn-square min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 tooltip tooltip-bottom nav-icon-btn" data-tip="Mes personnages" aria-label="Mes personnages">
            <Users class="w-6 h-6" />
          </router-link>

          <button @click="logout" class="btn btn-square min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 tooltip tooltip-bottom nav-icon-btn text-error" data-tip="Se déconnecter">
            <LogOut class="w-6 h-6" />
          </button>

        </div>
        
        <!-- Mobile Menu (visible only on mobile) -->
        <button
          class="btn btn-ghost btn-square min-h-11 min-w-11 sm:hidden"
          aria-label="Menu"
          popovertarget="mobile-nav-menu"
          style="anchor-name:--mobile-nav-anchor"
        >
          <Menu class="h-6 w-6" />
        </button>
        <ul
          id="mobile-nav-menu"
          popover
          class="dropdown dropdown-end menu bg-base-100 rounded-box z-50 w-56 p-2 shadow-lg"
          style="position-anchor:--mobile-nav-anchor"
        >
          <li>
            <router-link to="/profile" class="flex min-h-11 items-center gap-2">
              <UserCircle class="h-5 w-5 text-primary" />
              <span>Profil</span>
            </router-link>
          </li>
          <li>
            <button @click="handleMobileNotificationsClick" class="flex min-h-11 items-center gap-2">
              <div class="indicator">
                <Bell class="h-5 w-5 text-primary" />
                <span
                  v-if="unreadCount > 0"
                  class="badge badge-xs indicator-item badge-warning"
                >
                  {{ unreadCount > 99 ? '99+' : unreadCount }}
                </span>
              </div>
              <span>Notifications</span>
            </button>
          </li>
          <li>
            <router-link to="/campaigns" class="flex min-h-11 items-center gap-2">
              <Scroll class="h-5 w-5 text-primary" />
              <span>Mes campagnes</span>
            </router-link>
          </li>
          <li>
            <router-link to="/characters" class="flex min-h-11 items-center gap-2">
              <Users class="h-5 w-5 text-primary" />
              <span>Mes personnages</span>
            </router-link>
          </li>
          <li>
            <button @click="logout" class="flex min-h-11 items-center gap-2 text-error">
              <LogOut class="h-5 w-5" />
              <span>Se déconnecter</span>
            </button>
          </li>
        </ul>
      </template>

      <div class="tooltip tooltip-bottom" data-tip="Basculer thème">
        <ThemeToggle />
      </div>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { Bell, LogOut, Menu, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  countUnreadNotifications,
  getNotificationDisplayMessage,
  getNotificationDisplayTitle,
  listNotificationsForUser,
  markNotificationRead,
  type NotificationItem,
} from '../../repositories/notificationsRepository'
import { useAuthStore } from '../../stores/auth'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import ThemeToggle from './ThemeToggle.vue'

const authStore = useAuthStore()
const router = useRouter()
const notificationsPreview = ref<NotificationItem[]>([])
const notificationsOpen = ref(false)
const unreadCount = ref(0)
const notificationsLoading = ref(false)
const notificationsError = ref<string | null>(null)
const notificationsMenuRef = ref<HTMLElement | null>(null)
const notificationsButtonRef = ref<HTMLButtonElement | null>(null)
const notificationsPanelId = 'navbar-notifications-panel'
const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadNotificationsPreview()
  },
  { debounceMs: 300 }
)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const displayName = computed(() => authStore.displayName)
const avatarUrl = computed(() => authStore.avatarUrl)

async function logout(): Promise<void> {
  await authStore.signOut()
  notificationsOpen.value = false
  await router.replace('/')
}

function handleMobileNotificationsClick(): void {
  void router.push('/notifications')
}

async function loadNotificationsPreview(): Promise<void> {
  const userId = authStore.user?.id
  if (!userId) {
    notificationsPreview.value = []
    unreadCount.value = 0
    notificationsError.value = null
    return
  }

  notificationsLoading.value = true
  notificationsError.value = null
  try {
    const [list, unread] = await Promise.all([
      listNotificationsForUser(userId),
      countUnreadNotifications(userId),
    ])

    notificationsPreview.value = list.slice(0, 5)
    unreadCount.value = unread
  } catch (error) {
    notificationsError.value =
      error instanceof Error ? error.message : 'Impossible de charger les missives.'
  } finally {
    notificationsLoading.value = false
  }
}

function subscribeNotificationsRealtime(userId: string): void {
  subscribe(`navbar-notifications-${userId}`, [
    { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
  ])
}

function toggleNotifications(): void {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) {
    void loadNotificationsPreview()
  }
}

function closeNotifications(): void {
  notificationsOpen.value = false
  notificationsButtonRef.value?.focus()
}

function handleOutsideClick(event: MouseEvent): void {
  if (!notificationsOpen.value) {
    return
  }

  const target = event.target as Node | null
  if (!target || !notificationsMenuRef.value) {
    return
  }

  if (!notificationsMenuRef.value.contains(target)) {
    notificationsOpen.value = false
  }
}

function handleEscapeKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && notificationsOpen.value) {
    closeNotifications()
  }
}

async function markPreviewAsRead(notificationId: string): Promise<void> {
  await markNotificationRead(notificationId)
  await loadNotificationsPreview()
}

watch(
  () => authStore.user?.id,
  (userId) => {
    if (!userId) {
      notificationsPreview.value = []
      unreadCount.value = 0
      unsubscribe()
      return
    }

    void loadNotificationsPreview()
    subscribeNotificationsRealtime(userId)
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', handleEscapeKey)
  if (authStore.user?.id) {
    void loadNotificationsPreview()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleEscapeKey)
  unsubscribe()
})
</script>
