<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Campagnes</h1>
    <button class="btn btn-sm" @click="openCampaignCreate">Créer une campagne</button>
		</header>

    <InputAction
      v-model="joinCode"
      title="Rejoindre une campagne"
      placeholder="A B C D E F"
      button-label="Rejoindre"
      helper-message="Demande le code au Maitre du Jeu puis saisis 6 caracteres (lettres/chiffres). Exemple: A1B2C3."
      :loading="joining"
      :success-message="joinSuccess"
      :error-message="joinError"
      :max-length="6"
      input-class="uppercase text-center font-semibold tracking-[0.35em] max-w-72"
      compact
      @submit="joinWithCode"
    />

		<DataGrid
      :items="campaignsList"
			:loading="showBlockingLoading"
			:error="showBlockingError"
      empty-message="Aucune campagne disponible."
			grid-class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
			:page="page"
			:total-pages="totalPages"
			show-pagination
			@prev-page="goToPreviousPage"
			@next-page="goToNextPage"
		>
			<template #default="{ items }">
        <AppCard v-for="campaign in items" :key="campaign.id" :title="campaign.name">
          <p class="text-sm opacity-80 line-clamp-3">{{ campaign.description || 'Aucune description.' }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="badge badge-sm" :class="campaign.isArchived ? 'badge-warning' : 'badge-success'">
							{{ campaign.isArchived ? 'Archivée' : 'Active' }}
						</span>
            <span class="badge badge-outline badge-sm font-mono">Code: {{ campaign.code }}</span>
					</div>
          <div class="card-actions mt-4 flex-wrap items-center justify-between gap-2">
            <div class="join">
              <button
                class="btn btn-xs join-item"
                :title="feedbackMap[`${campaign.id}-code`] || `Code : ${campaign.code}`"
                @click="copyText(`${campaign.id}-code`, campaign.code, 'Code copie !')"
              >
                Copier le code
              </button>
              <button
                class="btn btn-xs join-item"
                :title="feedbackMap[`${campaign.id}-link`] || `Lien : /campaigns/${campaign.code}`"
                @click="copyLink(`${campaign.id}-link`, `/campaigns/${campaign.code}`)"
              >
                Copier le lien
              </button>
            </div>
						<router-link class="btn btn-sm" :to="`/campaigns/${campaign.id}`">Ouvrir</router-link>
					</div>
				</AppCard>
			</template>
		</DataGrid>

		<PageFooter back-to="/" back-label="Menu principal" />
	</main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { requestCampaignJoinByCode } from '../services/notificationsRepository'
import { listCampaignsForUserPaginated } from '../services/campaignsRepository'
import { useAuthStore } from '../stores/auth'
import { useCampaignCreateModalStore } from '../stores/campaignCreateModal'
import type { CampaignSummary } from '../types/domain'
import AppCard from '../components/ui/AppCard.vue'
import DataGrid from '../components/ui/DataGrid.vue'
import InputAction from '../components/ui/InputAction.vue'
import PageFooter from '../components/ui/PageFooter.vue'
import { useCopyFeedback } from '../composables/useCopyFeedback'
import { usePaginatedNavigation } from '../composables/usePaginatedNavigation'
import { usePagination } from '../composables/usePagination'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const authStore = useAuthStore()
const campaignCreateModalStore = useCampaignCreateModalStore()
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
const { feedbackMap, copyText, copyLink } = useCopyFeedback()

const loading = ref(false)
const errorMessage = ref<string | null>(null)
const campaigns = ref<CampaignSummary[]>([])
const joinCode = ref('')
const joining = ref(false)
const joinSuccess = ref<string | null>(null)
const joinError = ref<string | null>(null)
const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadCampaigns({ background: true })
  },
  { debounceMs: 500 }
)
const { goToPreviousPage, goToNextPage } = usePaginatedNavigation({
  canGoPrevious,
  canGoNext,
  loading,
  previousPage,
  nextPage,
  onNavigate: loadCampaigns,
})

const campaignsList = computed(() => campaigns.value)
const showBlockingLoading = computed(() => loading.value && campaigns.value.length === 0)
const showBlockingError = computed(() => (campaigns.value.length === 0 ? errorMessage.value : null))

async function loadCampaigns(options: { background?: boolean } = {}): Promise<void> {
  if (!authStore.user?.id) {
    campaigns.value = []
    totalItems.value = 0
    return
  }

  const isBackgroundRefresh = Boolean(options.background && campaigns.value.length > 0)
  if (!isBackgroundRefresh) {
    loading.value = true
    errorMessage.value = null
  }
  try {
    const result = await listCampaignsForUserPaginated(authStore.user.id, page.value, pageSize)
    campaigns.value = result.items
    totalItems.value = result.total
  } catch (error) {
    if (!isBackgroundRefresh || campaigns.value.length === 0) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Impossible de charger les campagnes.'
    }
  } finally {
    if (!isBackgroundRefresh) {
      loading.value = false
    }
  }
}

function subscribeRealtime(userId: string): void {
  subscribe(`campaigns-list-${userId}`, [
    { table: 'campaigns', filter: `mj_id=eq.${userId}` },
    { table: 'users_campaigns', filter: `user_id=eq.${userId}` },
  ])
}

function openCampaignCreate(): void {
  campaignCreateModalStore.openModal()
}

async function joinWithCode(): Promise<void> {
  if (!authStore.user?.id || joining.value) return

  joining.value = true
  joinError.value = null
  joinSuccess.value = null
  try {
    const normalizedCode = joinCode.value.replaceAll(/\s+/g, '').toUpperCase()
    await requestCampaignJoinByCode(authStore.user.id, normalizedCode)
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
    void loadCampaigns()
    subscribeRealtime(userId)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  unsubscribe()
})
</script>
