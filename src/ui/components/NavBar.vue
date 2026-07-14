<template>
  <nav class="navbar border-b border-base-300 bg-base-200 px-4">
    <div class="flex-shrink-0">
      <router-link to="/" class="btn btn-soft normal-case text-lg font-bold sm:text-xl font-warhammer">
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
            <router-link to="/profile" class="btn btn-ghost btn-sm btn-square text-primary">
              <UserCircle class="h-6 w-6" />
            </router-link>
          </div>

          <div ref="notificationsMenuRef" class="relative">
            <button
              class="btn btn-ghost btn-sm btn-square tooltip tooltip-bottom text-primary"
              data-tip="Notifications"
              @click="toggleNotifications"
              aria-label="Notifications"
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
              class="absolute right-0 top-12 z-30 w-[min(20rem,calc(100vw-1rem))] md:w-96 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
            >
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold">Notifications</h3>
                <span class="badge">{{ unreadCount }} non lue(s)</span>
              </div>

              <div v-if="notificationsPreview.length === 0" class="alert alert-warning alert-soft text-sm mt-3">
                <span>Aucune notification.</span>
              </div>

              <div v-else class="mt-3 space-y-2 max-h-72 overflow-y-auto">
                <button
                  v-for="notification in notificationsPreview"
                  :key="notification.id"
                  class="w-full rounded-box border border-base-300 bg-base-200 p-3 text-left transition hover:bg-base-300"
                  @click="markPreviewAsRead(notification.id)"
                >
                  <p class="truncate text-sm font-medium">{{ notification.title }}</p>
                  <p class="mt-1 truncate text-xs opacity-70">{{ notification.message }}</p>
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
                Voir toutes les notifications
              </router-link>
            </div>
          </div>

          <router-link to="/sessions" class="btn btn-ghost btn-sm btn-square tooltip tooltip-bottom text-primary" data-tip="Mes sessions">
            <Scroll class="w-6 h-6" />
          </router-link>

          <router-link to="/characters" class="btn btn-ghost btn-sm btn-square tooltip tooltip-bottom text-primary" data-tip="Mes personnages">
            <Users class="w-6 h-6" />
          </router-link>

          <button @click="logout" class="btn btn-ghost btn-sm btn-square tooltip tooltip-left text-error" data-tip="Se déconnecter">
            <LogOut class="w-6 h-6" />
          </button>

        </div>
        
        <!-- Theme Toggle (Desktop) -->
        <div class="ml-1 border-l border-base-300 pl-1">
          <div class="tooltip tooltip-bottom" data-tip="Basculer thème">
            <ThemeToggle />
          </div>
        </div>
        <!-- Mobile Menu (visible only on mobile) -->
        <details class="dropdown dropdown-end sm:hidden">
          <summary class="btn btn-ghost btn-sm btn-square" aria-label="Menu">
            <Menu class="h-6 w-6" />
          </summary>
          <ul class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li>
              <router-link to="/profile" class="flex items-center gap-2">
                <UserCircle class="h-5 w-5 text-primary" />
                <span>Profil</span>
              </router-link>
            </li>
            <li>
              <button @click="handleMobileNotificationsClick" class="flex items-center gap-2">
                <Bell class="h-5 w-5 text-primary" />
                <span>Notifications {{ unreadCount > 0 ? `(${unreadCount})` : '' }}</span>
              </button>
            </li>
            <li>
              <router-link to="/sessions" class="flex items-center gap-2">
                <Scroll class="h-5 w-5 text-primary" />
                <span>Mes sessions</span>
              </router-link>
            </li>
            <li>
              <router-link to="/characters" class="flex items-center gap-2">
                <Users class="h-5 w-5 text-primary" />
                <span>Mes personnages</span>
              </router-link>
            </li>
            <li>
              <button @click="logout" class="flex items-center gap-2 text-error">
                <LogOut class="h-5 w-5" />
                <span>Se déconnecter</span>
              </button>
            </li>
          </ul>
        </details>
      </template>

      <button
        v-if="!isAuthenticated"
        @click="openSignUp"
        class="btn btn-sm btn-outline"
        data-tip="S'inscrire"
        aria-label="S'inscrire"
      >
        <span class="text-xs sm:text-sm">S'inscrire</span>
      </button>

      <button
        v-if="!isAuthenticated"
        @click="openLogin"
        class="btn btn-sm"
        data-tip="Se connecter"
        aria-label="Se connecter"
      >
        <LogIn class="w-4 h-4" />
        <span class="text-xs sm:text-sm">Se connecter</span>
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Scroll, Users, LogIn, LogOut, Bell, UserCircle, Menu } from '@lucide/vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle.vue'
import { useAuthModalStore } from '../../stores/authModal'
import { useAuthStore } from '../../stores/auth'
import { supabase } from '../../db/supabase'
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationRead,
  type NotificationItem
} from '../../repositories/notificationsRepository'

const authModalStore = useAuthModalStore()
const authStore = useAuthStore()
const router = useRouter()
const notificationsPreview = ref<NotificationItem[]>([])
const notificationsOpen = ref(false)
const unreadCount = ref(0)
const notificationsMenuRef = ref<HTMLElement | null>(null)
let notificationsChannel: RealtimeChannel | null = null

const isAuthenticated = computed(() => authStore.isAuthenticated)
const displayName = computed(() => authStore.displayName)

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
    return
  }

  const [list, unread] = await Promise.all([
    listNotificationsForUser(userId),
    countUnreadNotifications(userId)
  ])

  notificationsPreview.value = list.slice(0, 5)
  unreadCount.value = unread
}

function subscribeNotificationsRealtime(userId: string): void {
  if (notificationsChannel) {
    void supabase.removeChannel(notificationsChannel)
    notificationsChannel = null
  }

  notificationsChannel = supabase
    .channel(`navbar-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `receiver_user_id=eq.${userId}`
      },
      () => {
        void loadNotificationsPreview()
      }
    )
    .subscribe()
}

function toggleNotifications(): void {
  notificationsOpen.value = !notificationsOpen.value
  if (notificationsOpen.value) {
    void loadNotificationsPreview()
  }
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

async function markPreviewAsRead(notificationId: string): Promise<void> {
  await markNotificationRead(notificationId)
  await loadNotificationsPreview()
}

function openLogin(): void {
  authModalStore.openModal('login')
}

function openSignUp(): void {
  authModalStore.openModal('signup')
}

watch(
  () => authStore.user?.id,
  (userId) => {
    if (!userId) {
      notificationsPreview.value = []
      unreadCount.value = 0
      if (notificationsChannel) {
        void supabase.removeChannel(notificationsChannel)
        notificationsChannel = null
      }
      return
    }

    void loadNotificationsPreview()
    subscribeNotificationsRealtime(userId)
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  if (authStore.user?.id) {
    void loadNotificationsPreview()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  if (notificationsChannel) {
    void supabase.removeChannel(notificationsChannel)
    notificationsChannel = null
  }
})
</script>
