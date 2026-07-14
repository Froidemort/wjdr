<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppCard from '../components/AppCard.vue'
import { useAuthStore } from '../../stores/auth'
import { invitationTitle } from '../../repositories/invitationsRepository'
import {
	deleteNotification,
	markAllNotificationsRead,
	markNotificationRead,
	type NotificationItem
} from '../../repositories/notificationsRepository'
import { usePagination } from '../composables/usePagination'
import { useBusyOperations } from '../composables/useBusyOperations'
import { useNotificationsLoad } from '../composables/useNotificationsLoad'

const authStore = useAuthStore()
const router = useRouter()
const pageSize = 12
const { page, totalItems, totalPages, canGoPrevious, canGoNext, nextPage, previousPage } = usePagination({ pageSize })
const { busyIds, isBusy, setBusy, clearBusy, clearAllBusy } = useBusyOperations()
const { notifications, totalNotifications, loading, error, load, subscribe, unsubscribe } = useNotificationsLoad({
	userId: authStore.user?.id,
	pageSize,
	page: page.value
})

const invitationTitleLabel = computed(() => invitationTitle())
totalItems.value = totalNotifications.value

function getDisplayTitle(rawTitle: string): string {
	if (rawTitle.startsWith('INVITATION_SESSION_') || rawTitle === invitationTitleLabel.value) {
		return 'Invitation a une session'
	}
	return rawTitle
}

function extractInvitationSessionId(notification: NotificationItem): string | null {
	const fromLegacyTitle = notification.title.match(/^INVITATION_SESSION_([0-9a-f-]{36})$/i)
	if (fromLegacyTitle?.[1]) return fromLegacyTitle[1]
	const fromMarker = notification.message.match(/\[session:([0-9a-f-]{36})\]/i)
	if (fromMarker?.[1]) return fromMarker[1]
	const fromPath = notification.message.match(/\/sessions\/([0-9a-f-]{36})/i)
	return fromPath?.[1] ?? null
}

async function openSessionFromNotification(notif: NotificationItem): Promise<void> {
	const sessionId = extractInvitationSessionId(notif)
	if (sessionId) {
		await router.push(`/sessions/${sessionId}`)
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

function goToPreviousPage(): void {
	if (!canGoPrevious.value || loading.value) return
	previousPage()
	void load()
}

function goToNextPage(): void {
	if (!canGoNext.value || loading.value) return
	nextPage()
	void load()
}

onMounted(load)

watch(
	() => authStore.user?.id,
	(userId) => {
		if (!userId) {
			unsubscribe()
			return
		}
		subscribe(userId, load)
		void load()
	},
	{ immediate: true }
)
</script>

<template>
	<main class="mx-auto max-w-5xl p-4 sm:p-6 space-y-4">
		<header class="flex items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold">Notifications</h1>
				<p class="text-sm opacity-70">Invitations et messages système.</p>
			</div>
			<button class="btn btn-sm" :class="loading ? 'btn-disabled' : ''" @click="handleMarkAllRead">
				Tout marquer lu
			</button>
		</header>

		<div v-if="loading" class="space-y-3">
			<div v-for="item in 6" :key="item" class="skeleton rounded-box h-32 w-full bg-base-300" />
		</div>

		<div v-else-if="error" role="alert" class="alert alert-error alert-soft">
			<span>{{ error }}</span>
		</div>

		<div v-else-if="notifications.length === 0" class="alert alert-warning alert-soft">
			<span>Aucune notification.</span>
		</div>

		<div v-else class="space-y-3">
			<AppCard v-for="notif in notifications" :key="notif.id" :title="getDisplayTitle(notif.title)">
				<p class="text-sm whitespace-pre-line opacity-80">{{ notif.message }}</p>
				<div class="mt-3 flex items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						<span class="badge" :class="notif.isRead ? 'badge-success' : 'badge-warning'">
							{{ notif.isRead ? 'Lue' : 'Non lue' }}
						</span>
						<button
							v-if="extractInvitationSessionId(notif)"
							class="btn btn-sm"
							@click="openSessionFromNotification(notif)"
						>
							Ouvrir la session
						</button>
						<button 
							class="btn btn-sm btn-error btn-soft" 
							:class="isBusy(notif.id) ? 'btn-disabled' : ''" 
							@click="handleRemove(notif.id)"
						>
							Supprimer
						</button>
					</div>
					<button 
						v-if="!notif.isRead" 
						class="btn btn-sm" 
						:class="isBusy(notif.id) ? 'btn-disabled' : ''" 
						@click="handleMarkRead(notif.id)"
					>
						Marquer lu
					</button>
				</div>
			</AppCard>

			<div class="flex items-center justify-between gap-2 rounded-box border border-base-300 bg-base-100 p-3">
				<p class="text-sm opacity-70">Page {{ page }} / {{ totalPages }}</p>
				<div class="join">
					<button class="btn btn-sm join-item" :class="!canGoPrevious || loading ? 'btn-disabled' : ''" @click="goToPreviousPage">
						Precedent
					</button>
					<button class="btn btn-sm join-item" :class="!canGoNext || loading ? 'btn-disabled' : ''" @click="goToNextPage">
						Suivant
					</button>
				</div>
			</div>
		</div>
	</main>
</template>

