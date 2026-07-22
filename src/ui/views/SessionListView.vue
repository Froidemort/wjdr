<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<header class="flex items-center justify-between">
			<h1 class="text-2xl font-semibold">Sessions</h1>
      <button class="btn btn-sm" @click="openSessionCreate">Creer une session</button>
		</header>

    <InputAction
      v-model="joinCode"
      title="Rejoindre une session"
      placeholder="A B C D E F"
      button-label="Rejoindre"
      :loading="joining"
      :success-message="joinSuccess"
      :error-message="joinError"
      :max-length="6"
      input-class="uppercase text-center font-semibold tracking-[0.35em] max-w-72"
      compact
      @submit="joinWithCode"
    />

		<DataGrid
			:items="sessionsList"
			:loading="showBlockingLoading"
			:error="showBlockingError"
			empty-message="Aucune session disponible."
			grid-class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
			:page="page"
			:total-pages="totalPages"
			show-pagination
			@prev-page="goToPreviousPage"
			@next-page="goToNextPage"
		>
			<template #default="{ items }">
				<AppCard v-for="session in items" :key="session.id" :title="session.name">
					<p class="text-sm opacity-80 line-clamp-3">{{ session.description || 'Aucune description.' }}</p>
					<div class="mt-3 flex items-center gap-2">
            <span class="badge badge-sm" :class="session.isArchived ? 'badge-warning' : 'badge-success'">
							{{ session.isArchived ? 'Archivée' : 'Active' }}
						</span>
					</div>
          <div class="card-actions mt-4 items-center justify-between">
            <button
              class="link link-hover text-sm"
              :title="feedbackMap[session.id] || `Code : ${session.code}`"
              @click="copyLink(session.id, `/sessions/${session.id}`)"
            >
              Copier le lien de session
            </button>
            <router-link class="btn btn-sm" :to="`/sessions/${session.id}`">Ouvrir</router-link>
					</div>
				</AppCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { requestJoinByCode } from '../../repositories/notificationsRepository'
import { listSessionsForUserPaginated } from '../../repositories/sessionsRepository'
import { useAuthStore } from '../../stores/auth'
import { useSessionCreateModalStore } from '../../stores/sessionCreateModal'
import type { SessionSummary } from '../../types/domain'
import AppCard from '../components/AppCard.vue'
import DataGrid from '../components/DataGrid.vue'
import InputAction from '../components/InputAction.vue'
import PageFooter from '../components/PageFooter.vue'
import { useCopyFeedback } from '../composables/useCopyFeedback'
import { usePagination } from '../composables/usePagination'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const authStore = useAuthStore()
const sessionCreateModalStore = useSessionCreateModalStore()
const pageSize = 9
const {
  page,
  totalItems,
  totalPages,
  canGoPrevious,
  canGoNext,
  nextPage,
  previousPage,
  resetPage,
} = usePagination({ pageSize })
const { feedbackMap, copyLink } = useCopyFeedback()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const sessions = ref<SessionSummary[]>([])
const joinCode = ref('')
const joining = ref(false)
const joinSuccess = ref<string | null>(null)
const joinError = ref<string | null>(null)
const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadSessions({ background: true })
  },
  { debounceMs: 500 }
)

const sessionsList = computed(() => sessions.value)
const showBlockingLoading = computed(() => loading.value && sessions.value.length === 0)
const showBlockingError = computed(() => (sessions.value.length === 0 ? errorMessage.value : null))

async function loadSessions(options: { background?: boolean } = {}): Promise<void> {
  if (!authStore.user?.id) {
    sessions.value = []
    totalItems.value = 0
    return
  }

  const isBackgroundRefresh = Boolean(options.background && sessions.value.length > 0)
  if (!isBackgroundRefresh) {
    loading.value = true
    errorMessage.value = null
  }
  try {
    const result = await listSessionsForUserPaginated(authStore.user.id, page.value, pageSize)
    sessions.value = result.items
    totalItems.value = result.total
  } catch (error) {
    if (!isBackgroundRefresh || sessions.value.length === 0) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Impossible de charger les sessions.'
    }
  } finally {
    if (!isBackgroundRefresh) {
      loading.value = false
    }
  }
}

function goToPreviousPage(): void {
  if (!canGoPrevious.value || loading.value) return
  previousPage()
  void loadSessions()
}

function goToNextPage(): void {
  if (!canGoNext.value || loading.value) return
  nextPage()
  void loadSessions()
}

function subscribeRealtime(userId: string): void {
  subscribe(`sessions-list-${userId}`, [
    { table: 'sessions', filter: `mj_id=eq.${userId}` },
    { table: 'users_session', filter: `user_id=eq.${userId}` },
  ])
}

function openSessionCreate(): void {
  sessionCreateModalStore.openModal()
}

async function joinWithCode(): Promise<void> {
  if (!authStore.user?.id || joining.value) return

  joining.value = true
  joinError.value = null
  joinSuccess.value = null
  try {
    await requestJoinByCode(authStore.user.id, joinCode.value)
    joinCode.value = ''
    joinSuccess.value =
      "Ta demande a été envoyée au Maître du Jeu ! Que Sigmar t'accorde sa faveur."
  } catch (error) {
    joinError.value = error instanceof Error ? error.message : "Impossible d'envoyer la demande."
  } finally {
    joining.value = false
  }
}

watch(
  () => authStore.user?.id,
  (userId) => {
    resetPage()
    if (!userId) {
      unsubscribe()
      return
    }
    void loadSessions()
    subscribeRealtime(userId)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  unsubscribe()
})
</script>
