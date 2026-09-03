<script setup lang="ts">
import { ScrollText } from '@lucide/vue'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  deleteNotification,
  extractNotificationSessionId,
  getNotificationDisplayMessage,
  getNotificationDisplayTitle,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '../services/notificationsRepository'
import { useAuthStore } from '../stores/auth'
import PageFooter from '../components/ui/PageFooter.vue'
import { useBusyOperations } from '../composables/useBusyOperations'
import { useNotificationsLoad } from '../composables/useNotificationsLoad'
import { usePagination } from '../composables/usePagination'

const authStore = useAuthStore()
const router = useRouter()
const pageSize = 12
const {
  page,
  totalItems,
  totalPages,
  canGoPrevious,
  canGoNext,
  goToPreviousPage: goToPreviousPageBase,
  goToNextPage: goToNextPageBase,
} = usePagination({ pageSize })
const { busyIds, isBusy, setBusy, clearBusy, clearAllBusy } = useBusyOperations()
const { notifications, totalNotifications, loading, error, load, subscribe, unsubscribe } =
  useNotificationsLoad({
    userId: () => authStore.user?.id,
    pageSize,
    page: () => page.value,
  })

totalItems.value = totalNotifications.value

function campaignIdOf(notif: NotificationItem): string | null {
  return extractNotificationSessionId(notif)
}

function missiveIndex(index: number): string {
  return String((page.value - 1) * pageSize + index + 1).padStart(2, '0')
}

async function goToPreviousPage(): Promise<void> {
  await goToPreviousPageBase({ loading, onNavigate: load })
}

async function goToNextPage(): Promise<void> {
  await goToNextPageBase({ loading, onNavigate: load })
}

async function openCampaignFromNotification(notif: NotificationItem): Promise<void> {
  const campaignId = campaignIdOf(notif)
  if (campaignId) {
    await router.push(`/campaigns/${campaignId}`)
  }
}

async function handleMarkRead(notifId: string): Promise<void> {
  if (isBusy(notifId)) return
  setBusy(notifId)
  try {
    await markNotificationRead(notifId)
    await load()
  } finally {
    clearBusy(notifId)
  }
}

async function handleRemove(notifId: string): Promise<void> {
  if (isBusy(notifId)) return
  setBusy(notifId)
  try {
    await deleteNotification(notifId)
    await load()
  } finally {
    clearBusy(notifId)
  }
}

async function handleMarkAllRead(): Promise<void> {
  if (!authStore.user?.id || busyIds.value.size > 0) return
  try {
    await markAllNotificationsRead(authStore.user.id)
    await load()
  } finally {
    clearAllBusy()
  }
}

watch(
  () => authStore.user?.id,
  (userId) => {
    if (!userId) {
      notifications.value = []
      unsubscribe()
      return
    }
    subscribe(userId)
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6 px-4 py-5 sm:px-6 sm:py-8">
    <header class="space-y-3">
      <h1 class="grim-modal-title text-3xl sm:text-4xl">Missives</h1>
      <div class="flex w-40 items-center gap-2" aria-hidden="true">
        <span class="h-px flex-1 bg-linear-to-r from-primary/50 to-transparent" />
        <span class="size-1 rotate-45 border border-primary/50 bg-primary/20" />
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <p class="max-w-md text-sm leading-relaxed text-base-content/65">
          Courriers de votre table et nouvelles du Vieux Monde.
        </p>
        <button
          type="button"
          class="self-start font-grim-title text-xs uppercase tracking-[0.16em] text-primary/80 transition-colors hover:text-primary disabled:opacity-40"
          :disabled="loading || busyIds.size > 0 || notifications.length === 0"
          @click="handleMarkAllRead"
        >
          Tout marquer comme lu
        </button>
      </div>
    </header>

    <div v-if="loading" class="space-y-3">
      <div v-for="item in 4" :key="item" class="skeleton h-24 w-full rounded-box bg-base-300" />
    </div>

    <div v-else-if="error" role="alert" class="alert alert-error alert-soft">
      <span>{{ error }}</span>
    </div>

    <div
      v-else-if="notifications.length === 0"
      class="grim-hero-panel rounded-box px-5 py-10 text-center"
    >
      <ScrollText class="mx-auto size-8 text-primary/50" aria-hidden="true" />
      <h2 class="mt-4 text-xl">Aucune missive pour l'instant</h2>
      <p class="mt-2 text-sm text-base-content/60">
        Quand un maître de jeu te contacte, ses messages apparaîtront ici.
      </p>
      <router-link
        class="mt-5 inline-flex font-grim-title text-xs uppercase tracking-[0.16em] text-primary"
        to="/campaigns"
      >
        Voir mes campagnes
      </router-link>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="(notif, index) in notifications" :key="notif.id">
        <article
          class="grim-hero-panel rounded-box px-4 py-4 sm:px-5"
          :class="notif.isRead ? 'border-base-content/8' : 'border-primary/25'"
        >
          <div class="flex gap-3.5">
            <span
              class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full font-grim-title text-xs"
              :class="
                notif.isRead
                  ? 'border border-base-content/15 text-base-content/40'
                  : 'bg-primary text-primary-content shadow-[0_2px_8px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]'
              "
              aria-hidden="true"
            >
              {{ missiveIndex(index) }}
            </span>

            <div class="min-w-0 flex-1 space-y-2.5">
              <div class="flex items-start justify-between gap-3">
                <h2 class="min-w-0 text-lg leading-snug">
                  {{ getNotificationDisplayTitle(notif.title) }}
                </h2>
                <span
                  class="shrink-0 pt-0.5 font-grim-title text-[0.65rem] uppercase tracking-[0.18em]"
                  :class="notif.isRead ? 'text-base-content/40' : 'text-primary'"
                >
                  {{ notif.isRead ? 'Lue' : 'Nouvelle' }}
                </span>
              </div>

              <p class="text-sm leading-relaxed whitespace-pre-line text-base-content/70">
                {{ getNotificationDisplayMessage(notif.message) }}
              </p>

              <div class="flex items-center justify-between gap-3 pt-1">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button
                    v-if="campaignIdOf(notif)"
                    type="button"
                    class="font-grim-title text-xs uppercase tracking-[0.16em] text-primary"
                    @click="openCampaignFromNotification(notif)"
                  >
                    Ouvrir la campagne
                  </button>
                  <button
                    v-if="!notif.isRead"
                    type="button"
                    class="text-xs uppercase tracking-[0.12em] text-base-content/50 hover:text-base-content disabled:opacity-40"
                    :disabled="isBusy(notif.id)"
                    @click="handleMarkRead(notif.id)"
                  >
                    Marquer lu
                  </button>
                </div>
                <button
                  type="button"
                  class="shrink-0 text-xs uppercase tracking-[0.12em] text-base-content/35 hover:text-error disabled:opacity-40"
                  :disabled="isBusy(notif.id)"
                  @click="handleRemove(notif.id)"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </article>
      </li>
    </ul>

    <div
      v-if="!loading && !error && notifications.length > 0"
      class="flex items-center justify-between gap-3 text-sm"
    >
      <p class="text-base-content/45">Page {{ page }} / {{ totalPages }}</p>
      <div class="flex items-center gap-4">
        <button
          type="button"
          class="font-grim-title text-xs uppercase tracking-[0.14em] text-base-content/60 disabled:opacity-25"
          :disabled="!canGoPrevious || loading"
          @click="goToPreviousPage"
        >
          Precedent
        </button>
        <button
          type="button"
          class="font-grim-title text-xs uppercase tracking-[0.14em] text-base-content/60 disabled:opacity-25"
          :disabled="!canGoNext || loading"
          @click="goToNextPage"
        >
          Suivant
        </button>
      </div>
    </div>

    <PageFooter back-to="/" back-label="Menu principal" />
  </div>
</template>
