import { ref, onBeforeUnmount } from 'vue'
import { type RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../db/supabase'
import {
	listNotificationsForUserPaginated,
	type NotificationItem
} from '../../repositories/notificationsRepository'

interface UseNotificationsLoadOptions {
	userId: string | undefined
	pageSize: number
	page: number
}

export function useNotificationsLoad(options: UseNotificationsLoadOptions) {
	const notifications = ref<NotificationItem[]>([])
	const totalNotifications = ref(0)
	const loading = ref(false)
	const error = ref<string | null>(null)
	let channel: RealtimeChannel | null = null

	async function load(): Promise<void> {
		if (!options.userId) {
			notifications.value = []
			totalNotifications.value = 0
			return
		}

		loading.value = true
		error.value = null
		try {
			const result = await listNotificationsForUserPaginated(options.userId, options.page, options.pageSize)
			notifications.value = result.items
			totalNotifications.value = result.total
		} catch (err) {
			error.value = err instanceof Error ? err.message : 'Impossible de charger les notifications.'
		} finally {
			loading.value = false
		}
	}

	function subscribe(userId: string, onUpdate: () => void): void {
		if (channel) {
			void supabase.removeChannel(channel)
		}

		channel = supabase
			.channel(`notifications-${userId}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'notifications' },
				onUpdate
			)
			.subscribe()
	}

	function unsubscribe(): void {
		if (channel) {
			void supabase.removeChannel(channel)
			channel = null
		}
	}

	onBeforeUnmount(unsubscribe)

	return {
		notifications,
		totalNotifications,
		loading,
		error,
		load,
		subscribe,
		unsubscribe
	}
}
