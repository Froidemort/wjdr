<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<div v-if="loading" class="skeleton h-48 w-full" />

		<div v-else-if="errorMessage" role="alert" class="alert alert-error alert-soft">
			<span>{{ errorMessage }}</span>
		</div>

		<template v-else-if="session">
			<AppCard :title="session.name">
				<!-- En-tête : role + code de session avec copie -->
				<div class="flex flex-wrap items-center justify-between gap-3 mb-3">
					<div class="flex flex-wrap items-center gap-2">
					<span class="badge" :class="isMj ? 'badge-secondary' : 'badge-neutral'">{{ isMj ? 'MJ' : 'Joueur' }}</span>
					<span v-if="session.isArchived" class="badge badge-warning">Archivée</span>
					<div class="tooltip" :data-tip="copyFeedback || `Code : ${session.code}`">
						<button class="btn btn-xs btn-ghost font-mono" @click="copySessionLink">
							<Copy class="h-3 w-3" />
							{{ session.code }}
						</button>
					</div>
					</div>
					<button
						v-if="isMj"
						class="btn btn-sm"
						:class="session.isArchived ? 'btn-success' : 'btn-warning'"
						:disabled="archiveBusy"
						@click="toggleSessionArchivedState"
					>
						<span v-if="archiveBusy" class="loading loading-spinner loading-xs" aria-hidden="true" />
						{{ session.isArchived ? 'Désarchiver' : 'Archiver' }}
					</button>
				</div>

				<!-- Description (collapse optionnel) -->
				<div class="collapse collapse-arrow border border-base-300 bg-base-200">
					<input v-model="sessionInfoOpen" type="checkbox" />
					<div class="collapse-title font-semibold">Description</div>
					<div class="collapse-content">
						<p class="text-sm opacity-80">{{ session.description || 'Aucune description.' }}</p>
					</div>
				</div>

				<!-- Personnages -->
				<div class="mt-4 space-y-3">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<h2 class="text-lg font-semibold">Personnages</h2>
						<button
							v-if="canCreateOwnCharacter"
							class="btn btn-sm"
							@click="characterCreateModalRef?.open()"
						>
							Créer mon personnage
						</button>
					</div>

					<div v-if="characters.length === 0" class="alert alert-warning alert-soft">
						<span>Aucun personnage dans cette session.</span>
					</div>

					<div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<CharacterSummaryCard
							v-for="character in characters"
							:key="character.id"
							:character="character"
							action-label="Voir la fiche"
							compact
						>
						</CharacterSummaryCard>
					</div>
				</div>
			</AppCard>

			<SessionNotesPanel
				:session-id="session.id"
				:is-mj="isMj"
			/>

			<section v-if="isMj" class="space-y-3">
				<h2 class="text-xl font-semibold">Gestion de session</h2>
				
				<!-- MJ Sections Desktop Grid -->
				<div class="grid gap-3 lg:grid-cols-2">
					<!-- Ajouter des membres -->
					<div>
						<h3 class="mb-2 text-sm font-semibold opacity-75">INVITER DES JOUEURS</h3>
						<AppCard title="Ajouter des membres">
					<div class="space-y-3">
						<div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
							<span>Session archivee: invitations bloquees.</span>
						</div>
						<SearchInput v-model="inviteQuery" placeholder="Chercher un joueur (username ou email)" />

						<div v-if="inviteCandidates.length > 0" class="max-h-56 overflow-y-auto rounded-box border border-base-300">
							<ul class="menu p-2">
								<li v-for="candidate in inviteCandidates" :key="candidate.id">
									<label class="label cursor-pointer justify-start gap-3">
										<input
											type="checkbox"
											class="checkbox checkbox-sm"
											:checked="selectedInvitees.has(candidate.id)"
											@change="toggleInvitee(candidate.id)"
										/>
										<div>
											<div class="font-medium">{{ candidate.username }}</div>
											<div class="text-xs opacity-70">{{ candidate.email }}</div>
										</div>
									</label>
								</li>
							</ul>
						</div>

						<div class="flex items-center gap-2">
							<button class="btn btn-sm btn-accent" :disabled="selectedInvitees.size === 0 || inviting || session.isArchived" @click="inviteSelectedUsers">
								<span v-if="inviting" class="loading loading-spinner loading-xs" aria-hidden="true" />
								Inviter {{ selectedInvitees.size > 0 ? `(${selectedInvitees.size})` : '' }}
							</button>
						</div>

						<div v-if="inviteError" role="alert" class="alert alert-error alert-soft text-sm">
							<span>{{ inviteError }}</span>
						</div>
					</div>
				</AppCard>
					</div>
					
					<!-- Statut des invitations -->
					<div>
						<h3 class="mb-2 text-sm font-semibold opacity-75">STATUT DES INVITATIONS</h3>
						<div class="space-y-3">
							<AppCard title="Invitations envoyees" compact>
								<div v-if="invitations.length === 0" class="text-sm opacity-70">Aucun joueur invite.</div>
								<ul v-else class="list bg-base-200 rounded-box">
									<li v-for="invitation in invitations" :key="invitation.userId" class="list-row">
										<div class="font-medium">{{ invitation.username }}</div>
										<div class="text-xs opacity-70">{{ invitation.email }}</div>
										<div class="text-xs" :class="invitation.isRead ? 'text-success' : 'opacity-70'">
											{{ invitation.isRead ? 'Lue' : 'Non lue' }}
										</div>
									</li>
								</ul>
							</AppCard>

							<AppCard title="Demandes de session" compact>
								<div v-if="joinRequests.length === 0" class="text-sm opacity-70">Aucune demande en attente.</div>
								<ul v-else class="list rounded-box bg-base-200">
									<li v-for="request in joinRequests" :key="request.notificationId" class="list-row">
							<div class="font-medium">{{ request.username }}</div>
							<div class="text-xs opacity-70">{{ request.email }}</div>
							<div class="join">
								<button
									class="btn btn-xs join-item"
									:disabled="joinRequestBusy"
									@click="acceptJoinRequest(request.notificationId, request.requesterId)"
								>
									Accepter
								</button>
								<button
									class="btn btn-xs join-item"
									:disabled="joinRequestBusy"
									@click="rejectJoinRequest(request.notificationId, request.requesterId)"
								>
									Refuser
								</button>
							</div>
						</li>
					</ul>

								<div v-if="joinRequestError" role="alert" class="alert alert-error alert-soft text-sm mt-2">
									<span>{{ joinRequestError }}</span>
								</div>
							</AppCard>
						</div>
					</div>
				</div>
			</section>

		</template>

		<template v-else>
			<SessionAccessRequest
				v-if="authStore.user"
				:session-id="sessionId"
				:user-id="authStore.user.id"
			/>
			<AppCard v-else title="Accès restreint">
				<p class="text-sm opacity-80">Connectez-vous pour accéder à cette session.</p>
			</AppCard>
		</template>

		<!-- Pied de page navigation -->
		<footer class="flex justify-start pt-2">
			<router-link class="btn btn-sm btn-ghost" to="/sessions">
				<ChevronLeft class="h-4 w-4" />
				Retour aux sessions
			</router-link>
		</footer>

		<CharacterCreateModal
			v-if="session && authStore.user"
			ref="characterCreateModalRef"
			:session-id="session.id"
			:user-id="authStore.user.id"
			@created="onCharacterCreated"
		/>
	</main>
</template>

<script setup lang="ts">
import { ChevronLeft, Copy } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listCharactersBySession } from '../../repositories/charactersRepository'
import {
  createSessionInvitations,
  listSessionInvitations,
  type SessionInvitation,
} from '../../repositories/invitationsRepository'
import {
  type JoinRequestItem,
  listPendingJoinRequestsForSession,
  markNotificationRead,
  notifyJoinRequestAccepted,
  notifyJoinRequestRejected,
} from '../../repositories/notificationsRepository'
import { getSessionById, updateSessionArchivedState } from '../../repositories/sessionsRepository'
import {
  addUsersToSession,
  searchInvitableProfilesByMembership,
} from '../../repositories/usersSessionRepository'
import { useAuthStore } from '../../stores/auth'
import type { CharacterSummary, Profile, SessionSummary } from '../../types/domain'
import AppCard from '../components/AppCard.vue'
import type CharacterCreateModal from '../components/CharacterCreateModal.vue'
import CharacterSummaryCard from '../components/CharacterSummaryCard.vue'
import SearchInput from '../components/SearchInput.vue'
import SessionAccessRequest from '../components/SessionAccessRequest.vue'
import SessionNotesPanel from '../components/SessionNotesPanel.vue'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'
import { useSmartRefresh } from '../composables/useSmartRefresh'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const session = ref<SessionSummary | null>(null)
const characters = ref<CharacterSummary[]>([])
const invitations = ref<SessionInvitation[]>([])
const inviteCandidates = ref<Profile[]>([])
const inviteQuery = ref('')
const selectedInvitees = ref(new Set<string>())
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const copyFeedback = ref('')
const sessionInfoOpen = ref(true)
const joinRequestError = ref<string | null>(null)
const joinRequestBusy = ref(false)
const archiveBusy = ref(false)
const joinRequests = ref<JoinRequestItem[]>([])
const characterCreateModalRef = ref<InstanceType<typeof CharacterCreateModal> | null>(null)
let sessionRefreshTimer: ReturnType<typeof setTimeout> | null = null
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const sessionId = computed(() => String(route.params.id ?? ''))
const isMj = computed(() => Boolean(session.value && authStore.user?.id === session.value.mjId))
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
const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    scheduleSessionRefresh()
  },
  { debounceMs: 500 }
)

async function loadSessionDetail(options: { background?: boolean } = {}): Promise<void> {
  if (!sessionId.value) {
    errorMessage.value = 'Session invalide.'
    return
  }

  const isBackgroundRefresh = Boolean(options.background && session.value)
  if (!isBackgroundRefresh) {
    loading.value = true
    errorMessage.value = null
    joinRequestError.value = null
  }
  try {
    const [sessionData, characterData] = await Promise.all([
      getSessionById(sessionId.value),
      listCharactersBySession(sessionId.value),
    ])

    session.value = sessionData
    characters.value = sessionData ? characterData : []

    if (!session.value) {
      joinRequests.value = []
      return
    }

    const currentUserId = authStore.user?.id
    if (!currentUserId) {
      errorMessage.value = 'Utilisateur non connecté.'
      return
    }

    const userIsMj = currentUserId === session.value.mjId

    if (userIsMj) {
      await loadJoinRequests()
      await loadInvitations()
    } else {
      joinRequests.value = []
    }
  } catch (error) {
    if (!isBackgroundRefresh) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Impossible de charger la session.'
    }
  } finally {
    if (!isBackgroundRefresh) {
      loading.value = false
    }
  }
}

async function loadJoinRequests(): Promise<void> {
  if (!session.value || !authStore.user?.id || !isMj.value) {
    joinRequests.value = []
    return
  }

  joinRequests.value = await listPendingJoinRequestsForSession(session.value.id, authStore.user.id)
}

async function loadInvitations(): Promise<void> {
  if (!session.value || !authStore.user?.id) {
    return
  }

  invitations.value = await listSessionInvitations(session.value.id, authStore.user.id)
}

async function loadInviteCandidates(): Promise<void> {
  inviteError.value = null
  if (!session.value || !inviteQuery.value.trim()) {
    inviteCandidates.value = []
    return
  }

  try {
    inviteCandidates.value = await searchInvitableProfilesByMembership(
      session.value.id,
      inviteQuery.value,
      session.value.mjId
    )
  } catch (error) {
    inviteError.value =
      error instanceof Error ? error.message : 'Impossible de charger la liste des joueurs.'
  }
}

function toggleInvitee(userId: string): void {
  if (selectedInvitees.value.has(userId)) {
    selectedInvitees.value.delete(userId)
  } else {
    selectedInvitees.value.add(userId)
  }
  selectedInvitees.value = new Set(selectedInvitees.value)
}

async function inviteSelectedUsers(): Promise<void> {
  if (
    !session.value ||
    selectedInvitees.value.size === 0 ||
    inviting.value ||
    session.value.isArchived
  ) {
    return
  }

  inviting.value = true
  inviteError.value = null
  try {
    const inviteeIds = Array.from(selectedInvitees.value)
    await addUsersToSession(session.value.id, inviteeIds)
    await createSessionInvitations(
      session.value.id,
      session.value.name,
      session.value.code,
      session.value.mjId,
      inviteeIds
    )
    selectedInvitees.value = new Set<string>()
    inviteQuery.value = ''
    inviteCandidates.value = []
    await loadInvitations()
  } catch (error) {
    inviteError.value = error instanceof Error ? error.message : 'Invitation impossible.'
  } finally {
    inviting.value = false
  }
}

async function acceptJoinRequest(notificationId: string, requesterId: string): Promise<void> {
  if (!session.value || !authStore.user?.id || joinRequestBusy.value) {
    return
  }

  joinRequestBusy.value = true
  joinRequestError.value = null
  try {
    await addUsersToSession(session.value.id, [requesterId])
    await markNotificationRead(notificationId)
    await notifyJoinRequestAccepted(session.value.id, requesterId, authStore.user.id)
    await loadJoinRequests()
  } catch (error) {
    joinRequestError.value = error instanceof Error ? error.message : 'Traitement impossible.'
  } finally {
    joinRequestBusy.value = false
  }
}

async function rejectJoinRequest(notificationId: string, requesterId: string): Promise<void> {
  if (!session.value || !authStore.user?.id || joinRequestBusy.value) {
    return
  }

  joinRequestBusy.value = true
  joinRequestError.value = null
  try {
    await markNotificationRead(notificationId)
    await notifyJoinRequestRejected(session.value.id, requesterId, authStore.user.id)
    await loadJoinRequests()
  } catch (error) {
    joinRequestError.value = error instanceof Error ? error.message : 'Traitement impossible.'
  } finally {
    joinRequestBusy.value = false
  }
}

async function toggleSessionArchivedState(): Promise<void> {
  if (!session.value || !isMj.value || archiveBusy.value) {
    return
  }

  archiveBusy.value = true
  errorMessage.value = null
  try {
    await updateSessionArchivedState(session.value.id, !session.value.isArchived)
    await loadSessionDetail()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Modification de la session impossible.'
  } finally {
    archiveBusy.value = false
  }
}

async function onCharacterCreated(characterId: string): Promise<void> {
  await loadSessionDetail()
  await router.push(`/characters/${characterId}`)
}

function buildSessionLink(id: string): string {
  if (typeof window === 'undefined') {
    return `/sessions/${id}`
  }

  return `${window.location.origin}/sessions/${id}`
}

async function copySessionLink(): Promise<void> {
  if (!session.value) {
    return
  }

  const link = buildSessionLink(session.value.id)

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
    } else {
      throw new Error('Clipboard API indisponible')
    }

    copyFeedback.value = 'Lien copié.'
  } catch {
    copyFeedback.value = 'Copie impossible automatiquement.'
  }

  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }

  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = ''
  }, 2500)
}

useSmartRefresh(
  () => {
    if (!sessionId.value || !authStore.user?.id) {
      return
    }

    void loadSessionDetail({ background: true })
  },
  {
    enabled: true,
    minIntervalMs: 1500,
  }
)

function scheduleSessionRefresh(): void {
  if (sessionRefreshTimer) {
    clearTimeout(sessionRefreshTimer)
  }

  sessionRefreshTimer = setTimeout(() => {
    void loadSessionDetail()
  }, 150)
}

function subscribeRealtime(targetSessionId: string): void {
  const userId = authStore.user?.id
  if (!userId) {
    unsubscribe()
    return
  }

  subscribe(`session-detail-${targetSessionId}-${userId}`, [
    { table: 'sessions', filter: `id=eq.${targetSessionId}` },
    { table: 'users_session', filter: `session_id=eq.${targetSessionId}` },
    { table: 'characters', filter: `session_id=eq.${targetSessionId}` },
    { table: 'notifications', filter: `receiver_user_id=eq.${userId}` },
    { table: 'notifications', filter: `sender_user_id=eq.${userId}` },
  ])
}

watch(
  () => [sessionId.value, authStore.user?.id] as const,
  ([value, userId]) => {
    if (!value || !userId) {
      session.value = null
      characters.value = []
      invitations.value = []
      joinRequests.value = []
      unsubscribe()
      return
    }

    void loadSessionDetail()
    subscribeRealtime(value)
  },
  { immediate: true }
)

let inviteSearchTimer: ReturnType<typeof setTimeout> | null = null

function scheduleInviteSearch(): void {
  if (inviteSearchTimer) {
    clearTimeout(inviteSearchTimer)
  }

  inviteSearchTimer = setTimeout(() => {
    void loadInviteCandidates()
  }, 250)
}

watch(inviteQuery, () => {
  scheduleInviteSearch()
})

onBeforeUnmount(() => {
  if (inviteSearchTimer) {
    clearTimeout(inviteSearchTimer)
  }

  if (sessionRefreshTimer) {
    clearTimeout(sessionRefreshTimer)
  }

  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }

  unsubscribe()
})
</script>