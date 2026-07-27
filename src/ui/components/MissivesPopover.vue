<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  getNotificationDisplayMessage,
  getNotificationDisplayTitle,
} from '../../repositories/notificationsRepository'
import { useMissivesInbox } from '../composables/useMissivesInbox'
import { usePopoverPanel } from '../composables/usePopoverPanel'

// Notification inbox preview — full list lives on /notifications.
const emit = defineEmits<{
  open: []
}>()

const route = useRoute()
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const { preview, unreadCount, error, refreshMissives, markMissiveAsRead } = useMissivesInbox()
const { isOpen, close, toggle } = usePopoverPanel({
  rootRef,
  triggerRef,
  onOpen: () => {
    emit('open')
    void refreshMissives()
  },
})

const isActive = computed(() => route.path.startsWith('/notifications'))

defineExpose({ close })
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      ref="triggerRef"
      type="button"
      class="btn btn-ghost btn-square relative min-h-11 min-w-11"
      :class="{ 'bg-primary/10 text-primary': isActive }"
      aria-label="Missives"
      aria-haspopup="menu"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-controls="navbar-missives-panel"
      @click="toggle"
    >
      <Bell class="size-5" />
      <span
        v-if="unreadCount > 0"
        class="badge badge-xs badge-warning absolute right-1 top-1 min-h-4 px-1"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      id="navbar-missives-panel"
      class="fixed inset-x-4 top-16 z-50 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-80 md:w-96"
      role="menu"
      aria-label="Aperçu des missives"
    >
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-[family-name:var(--font-grim-title)] text-base tracking-wide">Missives</h3>
        <span class="badge badge-sm">{{ unreadCount }} non lues</span>
      </div>

      <div v-if="error" class="alert alert-error alert-soft mt-3 text-sm" role="alert">
        {{ error }}
      </div>

      <div v-else-if="preview.length === 0" class="alert alert-warning alert-soft mt-3 text-sm">
        Aucune missive pour l'instant.
      </div>

      <ul v-else class="mt-3 max-h-72 space-y-2 overflow-y-auto">
        <li v-for="notification in preview" :key="notification.id">
          <button
            type="button"
            class="w-full rounded-box border border-base-300 bg-base-200 p-3 text-left transition hover:bg-base-300"
            @click="markMissiveAsRead(notification.id)"
          >
            <p class="truncate text-sm font-medium">
              {{ getNotificationDisplayTitle(notification.title) }}
            </p>
            <p class="mt-1 truncate text-xs opacity-70">
              {{ getNotificationDisplayMessage(notification.message) }}
            </p>
            <p class="mt-2 text-xs" :class="notification.isRead ? 'text-success' : 'text-warning'">
              {{ notification.isRead ? 'Lue' : 'Non lue' }}
            </p>
          </button>
        </li>
      </ul>

      <router-link to="/notifications" class="btn btn-sm mt-3 w-full" @click="close">
        Consulter toutes les missives
      </router-link>
    </div>
  </div>
</template>
