<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<div v-if="loading" class="skeleton h-48 w-full" />

		<div v-else-if="errorMessage" role="alert" class="alert alert-error alert-soft">
			<span>{{ errorMessage }}</span>
		</div>

    <template v-else-if="session">
      <CampaignDetailTabs v-model="activeCampaignTab" :is-mj="isMj" :is-mobile="isMobile" />

      <CampaignOverviewSection
        v-show="activeCampaignTab === 'overview'"
        :session="session"
        :is-mj="isMj"
        :feedback-map="feedbackMap"
        :archive-busy="archiveBusy"
        :session-info-open="sessionInfoOpen"
        :can-create-own-character="canCreateOwnCharacter"
        :character-stats="characterStats"
        :character-list-filter="characterListFilter"
        :characters="characters"
        :filtered-characters="filteredCharacters"
        :highlighted-character-id="highlightedCharacterId"
        :character-create-success="characterCreateSuccess"
        @update:session-info-open="sessionInfoOpen = $event"
        @update:character-list-filter="characterListFilter = $event"
        @open-character-create="characterCreateModalRef?.open()"
        @toggle-archive="toggleSessionArchivedState"
        @copy-code="copyCampaignCode"
        @copy-link="copyCampaignLink"
      />

      <CampaignSessionsSection
        v-show="activeCampaignTab === 'sessions'"
        :session="session"
        :sessions="sessions"
        :timeline-sessions="timelineSessions"
        :timeline-stats="timelineStats"
        :next-session="nextSession"
        :session-timeline-filter="sessionTimelineFilter"
        :session-action-success-message="sessionActionSuccessMessage"
        :is-mj="isMj"
        :session-delete-busy-id="sessionDeleteBusyId"
        :session-edit-id="sessionEditId"
        :session-edit-busy-id="sessionEditBusyId"
        :session-edit-error="sessionEditError"
        :session-edit-date-error="sessionEditDateError"
        :session-edit-form="sessionEditForm"
        :session-create-loading="sessionCreateLoading"
        :session-create-error="sessionCreateError"
        :session-create-date-error="sessionCreateDateError"
        :session-create-form="sessionCreateForm"
        :is-mobile="isMobile"
        :format-campaign-session-date="formatCampaignSessionDate"
        :format-campaign-session-date-compact="formatCampaignSessionDateCompact"
        :format-campaign-session-title="formatCampaignSessionTitle"
        :get-session-date-status="getSessionDateStatus"
        :build-campaign-session-detail-link="buildCampaignSessionDetailLink"
        @update:session-timeline-filter="sessionTimelineFilter = $event"
        @patch:session-edit-form="patchSessionEditForm"
        @patch:session-create-form="patchSessionCreateForm"
        @focus-notes="focusNotesPanel()"
        @start-session-edit="startSessionEdit"
        @delete-session="deleteCampaignSession"
        @save-session-edit="saveSessionEdit"
        @cancel-session-edit="cancelSessionEdit"
        @create-session="createCampaignSession"
      />

      <section
        v-show="activeCampaignTab === 'notes'"
        id="campaign-notes-section"
        ref="notesSectionRef"
        role="tabpanel"
        aria-labelledby="campaign-tab-notes"
        class="scroll-mt-20"
      >
				<SessionNotesPanel
					:campaign-id="session.id"
					:is-mj="isMj"
          :sessions="sessions"
          :current-user-id="authStore.user?.id ?? null"
          :is-session-archived="session.isArchived"
          :selected-session-id="notesFocusedSessionId"
          :selected-session-label="notesFocusedSessionLabel"
				/>
      </section>

      <section
        v-if="isMj"
        v-show="activeCampaignTab === 'management'"
        id="campaign-panel-management"
        role="tabpanel"
        aria-labelledby="campaign-tab-management"
        class="space-y-3"
      >
        <CampaignManagementSection
          :session="session"
          :admin-loading="adminLoading"
          :invite-query="inviteQuery"
          :invite-query-error="inviteQueryError"
          :invite-search-loading="inviteSearchLoading"
          :show-invite-no-result="showInviteNoResult"
          :invite-candidates="inviteCandidates"
          :selected-invitees="selectedInvitees"
          :selected-invitee-count="selectedInviteeCount"
          :can-submit-invites="canSubmitInvites"
          :inviting="inviting"
          :invite-success-message="inviteSuccessMessage"
          :invite-error="inviteError"
          :invitation-stats="invitationStats"
          :invitation-filter="invitationFilter"
          :invitations="invitations"
          :filtered-invitations="filteredInvitations"
          :join-requests="joinRequests"
          :join-request-busy-notification-id="joinRequestBusyNotificationId"
          :join-request-success-message="joinRequestSuccessMessage"
          :join-request-error="joinRequestError"
          @update:invite-query="inviteQuery = $event"
          @update:invitation-filter="invitationFilter = $event"
          @toggle-invitee="toggleInvitee"
          @select-all-invite-candidates="selectAllInviteCandidates"
          @clear-invite-selection="clearInviteSelection"
          @invite-selected-users="inviteSelectedUsers"
          @accept-join-request="acceptJoinRequest"
          @reject-join-request="rejectJoinRequest"
        />
			</section>

		</template>

		<template v-else>
      <SessionAccessRequest
        v-if="authStore.user"
				:session-id="campaignId"
				:user-id="authStore.user.id"
			/>
			<AppCard v-else title="Accès restreint">
        <p class="text-sm opacity-80">Connectez-vous pour accéder à cette campagne.</p>
			</AppCard>
		</template>

		<!-- Pied de page navigation -->
    <footer class="flex justify-start pt-2 max-sm:hidden">
      <router-link class="btn btn-sm btn-ghost ui-critical-action" to="/campaigns">
				<ChevronLeft class="h-4 w-4" />
        Retour aux campagnes
			</router-link>
		</footer>

		<CharacterCreateModal
			v-if="session && authStore.user"
			ref="characterCreateModalRef"
			:campaign-id="session.id"
			:user-id="authStore.user.id"
			@created="onCharacterCreated"
		/>
	</main>
</template>

<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'
import { useTimeoutFn } from '@vueuse/core'
import { useRouteParams } from '@vueuse/router'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { listCharactersByCampaign } from '../services/charactersRepository'
import { listSessionsForCampaign } from '../services/sessionsRepository'
import { getCampaignById, updateCampaignArchivedState } from '../services/campaignsRepository'
import { useAuthStore } from '../stores/auth'
import type { CharacterSummary, CampaignSummary, SessionSummary } from '../types/domain'
import AppCard from '../components/ui/AppCard.vue'
import CharacterCreateModal from '../components/ui/CharacterCreateModal.vue'
import CampaignDetailTabs from '../components/ui/CampaignDetailTabs.vue'
import CampaignManagementSection from '../components/ui/CampaignManagementSection.vue'
import CampaignOverviewSection from '../components/ui/CampaignOverviewSection.vue'
import CampaignSessionsSection from '../components/ui/CampaignSessionsSection.vue'
import { useCampaignSessions } from '../composables/useCampaignSessions'
import SessionAccessRequest from '../components/ui/SessionAccessRequest.vue'
import SessionNotesPanel from '../components/ui/SessionNotesPanel.vue'
import { useCampaignManagement } from '../composables/useCampaignManagement'
import { useConfirmAction } from '../composables/useConfirmAction'
import { useCopyFeedback } from '../composables/useCopyFeedback'
import { useDeviceBreakpoint } from '../composables/useDeviceBreakpoint'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const authStore = useAuthStore()
const { confirmAction } = useConfirmAction()
const { isMobile } = useDeviceBreakpoint()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const session = ref<CampaignSummary | null>(null)
const activeCampaignTab = ref<'overview' | 'management' | 'sessions' | 'notes'>('overview')
const characters = ref<CharacterSummary[]>([])
const sessions = ref<SessionSummary[]>([])
const sessionInfoOpen = ref(true)
const archiveBusy = ref(false)
const characterCreateModalRef = ref<InstanceType<typeof CharacterCreateModal> | null>(null)
const { feedbackMap, copyText, copyLink } = useCopyFeedback()
const notesSectionRef = ref<HTMLElement | null>(null)
const notesFocusedSessionId = ref<string | null>(null)
const notesFocusedSessionLabel = ref<string | null>(null)
const characterCreateSuccess = ref<string | null>(null)
const highlightedCharacterId = ref<string | null>(null)
const characterListFilter = ref<'all' | 'mine' | 'others'>('all')
const { start: startCharacterFeedbackReset, stop: stopCharacterFeedbackReset } = useTimeoutFn(
  () => {
    characterCreateSuccess.value = null
    highlightedCharacterId.value = null
  },
  5000,
  { immediate: false }
)

const campaignId = useRouteParams('id', '', {
  transform: (value) => String(value ?? ''),
})
const isMj = computed(() => Boolean(session.value && authStore.user?.id === session.value.mjId))
const managementUserId = computed(() => authStore.user?.id ?? null)
const {
  invitations,
  inviteCandidates,
  inviteQuery,
  selectedInvitees,
  inviting,
  inviteError,
  inviteSuccessMessage,
  inviteSearchLoading,
  joinRequestError,
  joinRequestSuccessMessage,
  joinRequestBusyNotificationId,
  adminLoading,
  joinRequests,
  invitationFilter,
  selectedInviteeCount,
  inviteQueryError,
  showInviteNoResult,
  canSubmitInvites,
  invitationStats,
  filteredInvitations,
  clearManagementState,
  refreshMjData,
  inviteSelectedUsers,
  acceptJoinRequest,
  rejectJoinRequest,
  toggleInvitee,
  selectAllInviteCandidates,
  clearInviteSelection,
} = useCampaignManagement({
  session,
  userId: managementUserId,
  isMj,
})
const {
  sessionCreateLoading,
  sessionCreateError,
  sessionCreateDateError,
  sessionCreateForm,
  sessionTimelineFilter,
  sessionDeleteBusyId,
  sessionEditId,
  sessionEditBusyId,
  sessionEditError,
  sessionEditDateError,
  sessionEditForm,
  sessionActionSuccessMessage,
  timelineSessions,
  nextSession,
  timelineStats,
  getSessionDateStatus,
  formatCampaignSessionDate,
  formatCampaignSessionDateCompact,
  formatCampaignSessionTitle,
  buildCampaignSessionDetailLink,
  createCampaignSession,
  startSessionEdit,
  cancelSessionEdit,
  saveSessionEdit,
  deleteCampaignSession,
} = useCampaignSessions({
  session,
  sessions,
  isMj,
  campaignId,
  refreshSessionDetail: async () => {
    await loadSessionDetail()
  },
  setErrorMessage: (value) => {
    errorMessage.value = value
  },
})
const hasOwnCharacter = computed(() =>
  Boolean(
    authStore.user?.id &&
      characters.value.some((character) => character.userId === authStore.user?.id)
  )
)
const canCreateOwnCharacter = computed(() =>
  Boolean(
    session.value &&
      authStore.user?.id &&
      !isMj.value &&
      !session.value.isArchived &&
      !hasOwnCharacter.value
  )
)
const sortedCharacters = computed(() =>
  [...characters.value].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
)
const filteredCharacters = computed(() => {
  if (!authStore.user?.id || characterListFilter.value === 'all') {
    return sortedCharacters.value
  }

  return sortedCharacters.value.filter((character) =>
    characterListFilter.value === 'mine'
      ? character.userId === authStore.user?.id
      : character.userId !== authStore.user?.id
  )
})
const characterStats = computed(() => {
  const total = characters.value.length
  const mine = authStore.user?.id
    ? characters.value.filter((character) => character.userId === authStore.user?.id).length
    : 0

  return {
    total,
    mine,
    others: Math.max(0, total - mine),
  }
})

function resetCharacterCreationFeedback(): void {
  stopCharacterFeedbackReset()
  characterCreateSuccess.value = null
  highlightedCharacterId.value = null
}

function formatSessionNoteLabel(sessionItem: SessionSummary): string {
  const title = formatCampaignSessionTitle(sessionItem)
  return `${formatCampaignSessionDateCompact(sessionItem.date)} - ${title}`
}

function patchSessionEditForm(patch: {
  date?: string
  name?: string
  description?: string
}): void {
  Object.assign(sessionEditForm.value, patch)
}

function patchSessionCreateForm(patch: {
  date?: string
  name?: string
  description?: string
}): void {
  Object.assign(sessionCreateForm.value, patch)
}

async function focusNotesPanel(sessionItem?: SessionSummary): Promise<void> {
  if (sessionItem) {
    notesFocusedSessionId.value = sessionItem.id
    notesFocusedSessionLabel.value = formatSessionNoteLabel(sessionItem)
  } else {
    notesFocusedSessionId.value = null
    notesFocusedSessionLabel.value = null
  }

  activeCampaignTab.value = 'notes'
  await nextTick()

  if (notesSectionRef.value) {
    notesSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadSessionDetail({ background: true })
  },
  { debounceMs: 500 }
)

async function loadSessionDetail(options: { background?: boolean } = {}): Promise<void> {
  if (!campaignId.value) {
    errorMessage.value = 'Campagne invalide.'
    return
  }

  const isBackgroundRefresh = Boolean(options.background && session.value)
  if (!isBackgroundRefresh) {
    loading.value = true
    errorMessage.value = null
  }
  try {
    const sessionData = await getCampaignById(campaignId.value)
    session.value = sessionData

    if (!session.value) {
      characters.value = []
      clearManagementState()
      sessions.value = []
      return
    }

    const resolvedCampaignId = session.value.id

    try {
      characters.value = await listCharactersByCampaign(resolvedCampaignId)
    } catch {
      characters.value = []
    }

    try {
      sessions.value = await listSessionsForCampaign(resolvedCampaignId)
    } catch {
      sessions.value = []
    }

    const currentUserId = authStore.user?.id
    if (!currentUserId) {
      errorMessage.value = 'Utilisateur non connecté.'
      return
    }

    const userIsMj = currentUserId === session.value.mjId

    if (userIsMj) {
      void refreshMjData()
    } else {
      clearManagementState()
    }
  } catch (error) {
    if (!isBackgroundRefresh) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Impossible de charger la campagne.'
    }
  } finally {
    if (!isBackgroundRefresh) {
      loading.value = false
    }
  }
}

async function toggleSessionArchivedState(): Promise<void> {
  if (!session.value || !isMj.value || archiveBusy.value) {
    return
  }

  const confirmationMessage = session.value.isArchived
    ? 'Restaurer cette campagne ? Les invitations et ajouts redeviendront disponibles.'
    : 'Archiver cette campagne ? Les invitations et ajouts seront bloques.'
  const confirmed = await confirmAction(confirmationMessage)
  if (!confirmed) {
    return
  }

  archiveBusy.value = true
  errorMessage.value = null
  try {
    await updateCampaignArchivedState(session.value.id, !session.value.isArchived)
    await loadSessionDetail()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Modification de la campagne impossible.'
  } finally {
    archiveBusy.value = false
  }
}

async function onCharacterCreated(characterId: string): Promise<void> {
  await loadSessionDetail()
  highlightedCharacterId.value = characterId
  characterCreateSuccess.value = 'Personnage cree. Il est maintenant visible dans la liste ci-dessous.'

  document.getElementById('campaign-characters-section')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })

  stopCharacterFeedbackReset()
  startCharacterFeedbackReset()
}

async function copyCampaignCode(): Promise<void> {
  if (!session.value) {
    return
  }

  await copyText('campaign-code', session.value.code, 'Code copie !')
}

async function copyCampaignLink(): Promise<void> {
  if (!session.value) {
    return
  }

  await copyLink('campaign-link', `/campaigns/${session.value.code}`)
}

function subscribeRealtime(targetSessionId: string): void {
  const userId = authStore.user?.id
  if (!userId) {
    unsubscribe()
    return
  }

  subscribe(`session-detail-${targetSessionId}-${userId}`, [
    { table: 'campaigns', filter: `id=eq.${targetSessionId}` },
    { table: 'sessions', filter: `campaign_id=eq.${targetSessionId}` },
    { table: 'users_campaigns', filter: `campaign_id=eq.${targetSessionId}` },
    { table: 'characters', filter: `campaign_id=eq.${targetSessionId}` },
    { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
    { table: 'notifications', filter: `sender_user_id=eq.${userId}` },
  ])
}

watch(isMj, (value) => {
  if (!value && activeCampaignTab.value === 'management') {
    activeCampaignTab.value = 'overview'
  }
})
watch(
  () => [campaignId.value, authStore.user?.id] as const,
  ([value, userId]) => {
    if (!value || !userId) {
      session.value = null
      characters.value = []
      clearManagementState()
      unsubscribe()
      return
    }

    void (async () => {
      await loadSessionDetail()
      const resolvedCampaignId = session.value?.id
      if (resolvedCampaignId) {
        subscribeRealtime(resolvedCampaignId)
      } else {
        unsubscribe()
      }
    })()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  resetCharacterCreationFeedback()

  unsubscribe()
})
</script>