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
import AppCard from '../components/ui/AppCard.vue'
import { useBusyOperations } from '../composables/useBusyOperations'
import { useNotificationsLoad } from '../composables/useNotificationsLoad'
import { usePaginatedNavigation } from '../composables/usePaginatedNavigation'
import { usePagination } from '../composables/usePagination'

const authStore = useAuthStore()
const router = useRouter()
const pageSize = 12
const { page, totalItems, totalPages, canGoPrevious, canGoNext, nextPage, previousPage } =
  usePagination({ pageSize })
const { busyIds, isBusy, setBusy, clearBusy, clearAllBusy } = useBusyOperations()
const { notifications, totalNotifications, loading, error, load, subscribe, unsubscribe } =
  useNotificationsLoad({
    userId: () => authStore.user?.id,
    pageSize,
    page: () => page.value,
  })
const { goToPreviousPage, goToNextPage } = usePaginatedNavigation({
	canGoPrevious,
	canGoNext,
	loading,
	previousPage,
	nextPage,
	onNavigate: load,
})

totalItems.value = totalNotifications.value

async function openCampaignFromNotification(notif: NotificationItem): Promise<void> {
	const campaignId = extractNotificationSessionId(notif)
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
  { immediate: true }
)
</script>

<template>
	<main class="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
		<header class="flex items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold">Missives</h1>
				<p class="text-sm opacity-70">Courriers de votre table et nouvelles du Vieux Monde.</p>
			</div>
			<button class="btn btn-sm" :disabled="loading || busyIds.size > 0" @click="handleMarkAllRead">
				Tout marquer comme lu
			</button>
		</header>

		<div v-if="loading" class="space-y-3">
			<div v-for="item in 6" :key="item" class="skeleton rounded-box h-32 w-full bg-base-300" />
		</div>

		<div v-else-if="error" role="alert" class="alert alert-error alert-soft">
			<span>{{ error }}</span>
		</div>

		<div v-else-if="notifications.length === 0" class="empty-state-panel rounded-box p-8 text-center">
			<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-base-300 bg-base-100">
				<ScrollText class="h-7 w-7 text-accent" aria-hidden="true" />
			</div>
			<h2 class="text-2xl">Aucune missive pour l'instant</h2>
			<p class="mt-2 text-sm opacity-75">Quand un maitre de jeu te contacte, ses messages apparaitront ici.</p>
			<div class="mt-4">
				<router-link class="btn btn-sm" to="/campaigns">Voir mes campagnes</router-link>
			</div>
		</div>

		<div v-else class="space-y-3">
			<AppCard v-for="notif in notifications" :key="notif.id">
				<div class="flex items-start justify-between gap-2">
					<h3 class="text-lg font-semibold leading-tight">{{ getNotificationDisplayTitle(notif.title) }}</h3>
					<div class="flex items-center gap-2">
						<span class="badge badge-sm" :class="notif.isRead ? 'badge-neutral badge-soft' : 'badge-warning'">
							{{ notif.isRead ? 'Lue' : 'Non lue' }}
						</span>
						<button
							v-if="!notif.isRead"
							class="btn btn-ghost btn-xs"
							:disabled="isBusy(notif.id)"
							@click="handleMarkRead(notif.id)"
						>
							Marquer lu
						</button>
					</div>
				</div>
				<p class="text-sm whitespace-pre-line opacity-80">{{ getNotificationDisplayMessage(notif.message) }}</p>
				<div class="mt-3 flex items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						<button
							v-if="extractNotificationSessionId(notif)"
							class="btn btn-sm"
							@click="openCampaignFromNotification(notif)"
						>
							Ouvrir la campagne
						</button>
						<button 
							class="btn btn-sm btn-ghost" 
							:disabled="isBusy(notif.id)" 
							@click="handleRemove(notif.id)"
						>
							Supprimer
						</button>
					</div>
				</div>
			</AppCard>

			<div class="flex items-center justify-between gap-2 rounded-box border border-base-300 bg-base-100 p-3">
				<p class="text-sm opacity-70">Page {{ page }} / {{ totalPages }}</p>
				<div class="join">
					<button class="btn btn-sm join-item" :disabled="!canGoPrevious || loading" @click="goToPreviousPage">
						Precedent
					</button>
					<button class="btn btn-sm join-item" :disabled="!canGoNext || loading" @click="goToNextPage">
						Suivant
					</button>
				</div>
			</div>
		</div>
	</main>
</template>

