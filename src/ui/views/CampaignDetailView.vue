<template>
	<main class="mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
		<div v-if="loading" class="skeleton h-48 w-full" />

		<div v-else-if="errorMessage" role="alert" class="alert alert-error alert-soft">
			<span>{{ errorMessage }}</span>
		</div>

		<template v-else-if="session">
      <AppCard :title="session.name">
        <!-- En-tête : role + code de campagne avec copie -->
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
            <span>Aucun personnage dans cette campagne.</span>
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

      <AppCard title="Sessions de campagne" class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <span class="badge badge-outline badge-sm whitespace-nowrap">
              <List class="h-3.5 w-3.5" aria-hidden="true" />
              <span class="sm:hidden">{{ sessions.length }} sess.</span>
              <span class="hidden sm:inline">{{ sessions.length }} sessions</span>
            </span>
            <span v-if="nextSession" class="badge badge-soft badge-success badge-sm whitespace-nowrap">
              <CalendarDays class="h-3.5 w-3.5" aria-hidden="true" />
              <span class="sm:hidden">{{ formatCampaignSessionDateCompact(nextSession.date) }}</span>
              <span class="hidden sm:inline">Prochaine: {{ formatCampaignSessionDate(nextSession.date) }}</span>
            </span>
          </div>

          <div class="join self-start sm:self-auto">
            <button
              class="btn btn-xs join-item"
              :class="sessionTimelineFilter === 'all' ? 'btn-active' : ''"
              @click="sessionTimelineFilter = 'all'"
            >
              Toutes
            </button>
            <button
              class="btn btn-xs join-item"
              :class="sessionTimelineFilter === 'upcoming' ? 'btn-active' : ''"
              @click="sessionTimelineFilter = 'upcoming'"
            >
              A venir
            </button>
            <button
              class="btn btn-xs join-item"
              :class="sessionTimelineFilter === 'past' ? 'btn-active' : ''"
              @click="sessionTimelineFilter = 'past'"
            >
              Passees
            </button>
          </div>
        </div>

        <div v-if="sessions.length === 0" class="alert alert-info alert-soft text-sm">
          <span>Aucune session n'a encore été posée sur cette campagne.</span>
        </div>

        <div v-else-if="timelineSessions.length === 0" class="alert alert-info alert-soft text-sm">
          <span>Aucune session pour ce filtre.</span>
        </div>

        <ul
          v-else
          class="timeline timeline-snap-icon timeline-vertical relative pl-1 sm:pl-3 [--timeline-col-start:4.8rem] sm:[--timeline-col-start:minmax(0,1fr)] before:absolute before:top-0 before:bottom-0 before:w-px before:bg-base-300 before:left-[5.05rem] sm:before:left-1/2 sm:before:-translate-x-1/2"
        >
          <li v-for="sessionItem in timelineSessions" :key="sessionItem.id">
            <hr class="hidden" />
            <div class="timeline-start">
              <div class="space-y-2 text-right">
                <div class="badge badge-outline badge-primary text-xs sm:hidden">
                  {{ formatCampaignSessionDateCompact(sessionItem.date) }}
                </div>
                <div class="badge badge-outline badge-primary hidden sm:inline-flex">
                  {{ formatCampaignSessionDate(sessionItem.date) }}
                </div>
              </div>
            </div>
            <div class="timeline-middle">
              <Hourglass
                v-if="getSessionDateStatus(sessionItem.date) !== 'past'"
                class="h-4 w-4 text-info rounded-full bg-info/10 ring-1 ring-info/30 shadow-sm"
                aria-hidden="true"
              />
              <CircleCheck
                v-else
                class="h-4 w-4 text-secondary rounded-full bg-secondary/10 ring-1 ring-secondary/30 shadow-sm"
                aria-hidden="true"
              />
            </div>
            <div class="timeline-end timeline-box w-full space-y-3 p-4 sm:p-5">
              <div class="space-y-2">
                <div class="pr-1">
                  <h3 class="block max-w-full truncate text-xs sm:text-sm md:text-base font-semibold leading-snug" :title="formatCampaignSessionTitle(sessionItem)">
                    {{ formatCampaignSessionTitle(sessionItem) }}
                  </h3>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <router-link class="btn btn-xs" :to="buildCampaignSessionDetailLink(sessionItem.id)">
                    <Eye class="h-3.5 w-3.5" aria-hidden="true" />
                    <span class="sr-only sm:not-sr-only sm:inline">Ouvrir</span>
                  </router-link>
                  <button
                    v-if="isMj"
                    class="btn btn-xs"
                    :disabled="sessionEditBusyId === sessionItem.id"
                    @click="startSessionEdit(sessionItem)"
                  >
                    <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
                    <span class="sr-only sm:not-sr-only sm:inline">Modifier</span>
                  </button>
                  <button
                    v-if="isMj"
                    class="btn btn-xs btn-error"
                    :disabled="sessionDeleteBusyId === sessionItem.id || sessionEditBusyId === sessionItem.id"
                    @click="deleteCampaignSession(sessionItem)"
                  >
                    <span
                      v-if="sessionDeleteBusyId === sessionItem.id"
                      class="loading loading-spinner loading-xs"
                      aria-hidden="true"
                    />
                    <Trash2 v-else class="h-3.5 w-3.5" aria-hidden="true" />
                    <span class="sr-only sm:not-sr-only sm:inline">Supprimer</span>
                  </button>
                </div>
              </div>
              <p v-if="sessionItem.description" class="text-sm whitespace-pre-line opacity-80">
                {{ sessionItem.description }}
              </p>

              <div
                v-if="sessionEditId === sessionItem.id"
                class="rounded-box border border-base-300 bg-base-100 p-4 space-y-3"
              >
                <div class="grid gap-3 lg:grid-cols-2">
                  <label class="form-control">
                    <span class="label-text mb-2">Date</span>
                    <input v-model="sessionEditForm.date" type="date" class="input input-bordered" />
                  </label>
                  <label class="form-control">
                    <span class="label-text mb-2">Titre</span>
                    <input
                      v-model="sessionEditForm.name"
                      type="text"
                      class="input input-bordered"
                      maxlength="100"
                      placeholder="Titre optionnel"
                    />
                  </label>
                  <label class="form-control lg:col-span-2">
                    <span class="label-text mb-2">Description</span>
                    <textarea
                      v-model="sessionEditForm.description"
                      class="textarea textarea-bordered min-h-24"
                      maxlength="500"
                      placeholder="Résumé, enjeux, conséquences..."
                    />
                  </label>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    class="btn btn-xs"
                    :disabled="sessionEditBusyId === sessionItem.id"
                    @click="saveSessionEdit(sessionItem.id)"
                  >
                    <span
                      v-if="sessionEditBusyId === sessionItem.id"
                      class="loading loading-spinner loading-xs"
                      aria-hidden="true"
                    />
                    Enregistrer
                  </button>
                  <button class="btn btn-xs btn-ghost" :disabled="sessionEditBusyId === sessionItem.id" @click="cancelSessionEdit">
                    Annuler
                  </button>
                </div>

                <div v-if="sessionEditError" role="alert" class="alert alert-error alert-soft text-sm">
                  <span>{{ sessionEditError }}</span>
                </div>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="isMj" class="space-y-4 border-t border-base-300 pt-4">
          <h3 class="text-sm font-semibold uppercase tracking-[0.15em] opacity-70">
            Ajouter une session datée
          </h3>
          <div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
            <span>Campagne archivée: création de session bloquée.</span>
          </div>
          <div class="rounded-box border border-base-300 bg-base-200/70 p-4 sm:p-5">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="form-control">
                <span class="label-text mb-2">Date</span>
                <input v-model="sessionCreateForm.date" type="date" class="input input-bordered" required />
              </label>
              <label class="form-control">
                <span class="label-text mb-2">Titre optionnel</span>
                <input
                  v-model="sessionCreateForm.name"
                  type="text"
                  class="input input-bordered"
                  maxlength="100"
                  placeholder="Ex. Arrivée à Middenheim"
                />
              </label>
              <label class="form-control md:col-span-2">
                <span class="label-text mb-2">Description optionnelle</span>
                <textarea
                  v-model="sessionCreateForm.description"
                  class="textarea textarea-bordered min-h-24"
                  maxlength="500"
                  placeholder="Résumé, objectifs, conséquences..."
                />
              </label>
            </div>
            <div class="mt-4 flex items-center justify-start gap-3">
              <button
                class="btn btn-sm"
                :disabled="sessionCreateLoading || session.isArchived"
                @click="createCampaignSession"
              >
                <span v-if="sessionCreateLoading" class="loading loading-spinner loading-xs" aria-hidden="true" />
                Créer la session
              </button>
            </div>
          </div>
          <div v-if="sessionCreateError" role="alert" class="alert alert-error alert-soft text-sm">
            <span>{{ sessionCreateError }}</span>
          </div>
        </div>
      </AppCard>

			<SessionNotesPanel
				:campaign-id="session.id"
				:is-mj="isMj"
        :sessions="sessions"
        :current-user-id="authStore.user?.id ?? null"
        :is-session-archived="session.isArchived"
			/>

      <section v-if="isMj" class="space-y-3">
        <h2 class="text-xl font-semibold">Gestion de campagne</h2>
        <div v-if="adminLoading" class="flex items-center gap-2 text-sm opacity-70">
          <span class="loading loading-spinner loading-xs" aria-hidden="true" />
          Chargement des données MJ...
        </div>
				
				<!-- MJ Sections Desktop Grid -->
				<div class="grid gap-3 lg:grid-cols-2">
					<!-- Ajouter des membres -->
					<div>
						<h3 class="mb-2 text-sm font-semibold opacity-75">INVITER DES JOUEURS</h3>
						<AppCard title="Ajouter des membres">
					<div class="space-y-3">
            <div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
              <span>Campagne archivée: invitations bloquées.</span>
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

                <AppCard title="Demandes de campagne" compact>
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
				:session-id="campaignId"
				:user-id="authStore.user.id"
			/>
			<AppCard v-else title="Accès restreint">
        <p class="text-sm opacity-80">Connectez-vous pour accéder à cette campagne.</p>
			</AppCard>
		</template>

		<!-- Pied de page navigation -->
		<footer class="flex justify-start pt-2">
      <router-link class="btn btn-sm btn-ghost" to="/campaigns">
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
import { CalendarDays, ChevronLeft, CircleCheck, Copy, Eye, Hourglass, List, Pencil, Trash2 } from '@lucide/vue'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listCharactersByCampaign } from '../../repositories/charactersRepository'
import {
  createCampaignInvitations,
  listCampaignInvitations,
  type SessionInvitation,
} from '../../repositories/invitationsRepository'
import {
  createSession,
  deleteSession,
  listSessionsForCampaign,
  updateSession,
} from '../../repositories/sessionsRepository'
import {
  type JoinRequestItem,
  listPendingJoinRequestsForCampaign,
  markNotificationRead,
  notifyJoinRequestAccepted,
  notifyJoinRequestRejected,
} from '../../repositories/notificationsRepository'
import { getCampaignById, updateCampaignArchivedState } from '../../repositories/campaignsRepository'
import {
  addUsersToCampaign,
  searchInvitableProfilesByMembership,
} from '../../repositories/usersCampaignsRepository'
import { useAuthStore } from '../../stores/auth'
import type { CharacterSummary, Profile, CampaignSummary, SessionSummary } from '../../types/domain'
import AppCard from '../components/AppCard.vue'
import CharacterCreateModal from '../components/CharacterCreateModal.vue'
import CharacterSummaryCard from '../components/CharacterSummaryCard.vue'
import SearchInput from '../components/SearchInput.vue'
import SessionAccessRequest from '../components/SessionAccessRequest.vue'
import SessionNotesPanel from '../components/SessionNotesPanel.vue'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const session = ref<CampaignSummary | null>(null)
const characters = ref<CharacterSummary[]>([])
const sessions = ref<SessionSummary[]>([])
const invitations = ref<SessionInvitation[]>([])
const inviteCandidates = ref<Profile[]>([])
const inviteQuery = ref('')
const selectedInvitees = ref(new Set<string>())
const inviting = ref(false)
const inviteError = ref<string | null>(null)
const sessionCreateLoading = ref(false)
const sessionCreateError = ref<string | null>(null)
const sessionCreateForm = ref({
  date: '',
  name: '',
  description: '',
})
const sessionTimelineFilter = ref<'all' | 'upcoming' | 'past'>('all')
const sessionDeleteBusyId = ref<string | null>(null)
const sessionEditId = ref<string | null>(null)
const sessionEditBusyId = ref<string | null>(null)
const sessionEditError = ref<string | null>(null)
const sessionEditForm = ref({
  date: '',
  name: '',
  description: '',
})
const copyFeedback = ref('')
const sessionInfoOpen = ref(true)
const joinRequestError = ref<string | null>(null)
const joinRequestBusy = ref(false)
const archiveBusy = ref(false)
const adminLoading = ref(false)
const joinRequests = ref<JoinRequestItem[]>([])
const characterCreateModalRef = ref<InstanceType<typeof CharacterCreateModal> | null>(null)
let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const campaignId = computed(() => String(route.params.id ?? ''))
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
const todaySessionDate = computed(() => new Date().toISOString().slice(0, 10))
const timelineSessions = computed(() => {
  const source = [...sessions.value]
  source.sort((left, right) => right.date.localeCompare(left.date))

  if (sessionTimelineFilter.value === 'all') {
    return source
  }

  return source.filter((sessionItem) => {
    const status = getSessionDateStatus(sessionItem.date)
    return sessionTimelineFilter.value === 'upcoming' ? status !== 'past' : status === 'past'
  })
})
const nextSession = computed(() => {
  const upcoming = sessions.value
    .filter((sessionItem) => getSessionDateStatus(sessionItem.date) !== 'past')
    .sort((left, right) => left.date.localeCompare(right.date))

  return upcoming[0] ?? null
})

function parseSessionDate(value: string): Date | null {
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getSessionDateStatus(value: string): 'today' | 'upcoming' | 'past' {
  const parsed = parseSessionDate(value)
  const todayParsed = parseSessionDate(todaySessionDate.value)

  if (!parsed || !todayParsed) {
    return 'upcoming'
  }

  const parsedKey = parsed.toISOString().slice(0, 10)
  const todayKey = todayParsed.toISOString().slice(0, 10)
  if (parsedKey === todayKey) {
    return 'today'
  }

  return parsed > todayParsed ? 'upcoming' : 'past'
}

function mapCreateSessionError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Creation de session impossible.'
  }

  const maybeStatus = (error as { status?: number }).status
  const message = error.message.toLowerCase()

  if (
    maybeStatus === 403 ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  ) {
    return 'Acces refuse: seul le MJ de la campagne peut creer une session.'
  }

  if (message.includes('invalid input syntax') || message.includes('date')) {
    return 'Date invalide. Utilisez un format de date valide.'
  }

  return error.message
}

function formatCampaignSessionDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
  }).format(parsed)
}

function formatCampaignSessionDateCompact(value: string): string {
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
  }).format(parsed)
}

function formatCampaignSessionTitle(sessionItem: SessionSummary): string {
  const trimmedTitle = sessionItem.name?.trim()
  return trimmedTitle ? trimmedTitle : `Session du ${formatCampaignSessionDate(sessionItem.date)}`
}

function buildCampaignSessionDetailLink(targetSessionId: string): string {
  const identifier = session.value?.id ?? campaignId.value
  return `/campaigns/${identifier}/timeline/${targetSessionId}`
}

function resetSessionCreateForm(): void {
  sessionCreateForm.value = {
    date: todaySessionDate.value,
    name: '',
    description: '',
  }
}

function startSessionEdit(sessionItem: SessionSummary): void {
  sessionEditId.value = sessionItem.id
  sessionEditError.value = null
  sessionEditForm.value = {
    date: sessionItem.date,
    name: sessionItem.name ?? '',
    description: sessionItem.description ?? '',
  }
}

function cancelSessionEdit(): void {
  sessionEditId.value = null
  sessionEditBusyId.value = null
  sessionEditError.value = null
  sessionEditForm.value = {
    date: '',
    name: '',
    description: '',
  }
}

async function saveSessionEdit(targetSessionId: string): Promise<void> {
  if (!isMj.value || sessionEditBusyId.value) {
    return
  }

  const date = sessionEditForm.value.date.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    sessionEditError.value = 'La date de session est requise.'
    return
  }

  sessionEditBusyId.value = targetSessionId
  sessionEditError.value = null

  try {
    await updateSession(targetSessionId, {
      date,
      name: sessionEditForm.value.name.trim() || null,
      description: sessionEditForm.value.description.trim() || null,
    })
    cancelSessionEdit()
    await loadSessionDetail()
  } catch (error) {
    sessionEditError.value = error instanceof Error ? error.message : 'Mise a jour de session impossible.'
  } finally {
    sessionEditBusyId.value = null
  }
}

async function createCampaignSession(): Promise<void> {
  if (!session.value || !isMj.value || sessionCreateLoading.value || session.value.isArchived) {
    return
  }

  sessionCreateError.value = null
  const date = sessionCreateForm.value.date.trim()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    sessionCreateError.value = 'La date de session est requise.'
    return
  }

  sessionCreateLoading.value = true
  try {
    await createSession({
      campaignId: session.value.id,
      date,
      name: sessionCreateForm.value.name.trim() || null,
      description: sessionCreateForm.value.description.trim() || null,
    })
    resetSessionCreateForm()
    await loadSessionDetail()
  } catch (error) {
    sessionCreateError.value = mapCreateSessionError(error)
  } finally {
    sessionCreateLoading.value = false
  }
}

async function deleteCampaignSession(sessionItem: SessionSummary): Promise<void> {
  if (!isMj.value) {
    return
  }

  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(
      `Supprimer la session du ${formatCampaignSessionDate(sessionItem.date)} ?`
    )
    if (!confirmed) {
      return
    }
  }

  try {
    if (sessionEditId.value === sessionItem.id) {
      cancelSessionEdit()
    }
    sessionDeleteBusyId.value = sessionItem.id
    await deleteSession(sessionItem.id)
    await loadSessionDetail()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Suppression de session impossible.'
  } finally {
    sessionDeleteBusyId.value = null
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
    joinRequestError.value = null
  }
  try {
    const sessionData = await getCampaignById(campaignId.value)
    session.value = sessionData

    if (!session.value) {
      characters.value = []
      joinRequests.value = []
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
      joinRequests.value = []
      invitations.value = []
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

async function refreshMjData(): Promise<void> {
  if (!session.value || !authStore.user?.id || !isMj.value) {
    joinRequests.value = []
    invitations.value = []
    adminLoading.value = false
    return
  }

  adminLoading.value = true
  joinRequestError.value = null
  inviteError.value = null

  try {
    await Promise.all([loadJoinRequests(), loadInvitations()])
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chargement MJ impossible.'
    joinRequestError.value = message
    inviteError.value = message
  } finally {
    adminLoading.value = false
  }
}

async function loadJoinRequests(): Promise<void> {
  if (!session.value || !authStore.user?.id || !isMj.value) {
    joinRequests.value = []
    return
  }

  joinRequests.value = await listPendingJoinRequestsForCampaign(session.value.id, authStore.user.id)
}

async function loadInvitations(): Promise<void> {
  if (!session.value || !authStore.user?.id) {
    return
  }

  invitations.value = await listCampaignInvitations(session.value.id, authStore.user.id)
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
    await addUsersToCampaign(session.value.id, inviteeIds)
    await createCampaignInvitations(
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
    await addUsersToCampaign(session.value.id, [requesterId])
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
  await router.push(`/characters/${characterId}`)
}

function buildSessionLink(code: string): string {
  if (typeof window === 'undefined') {
    return `/campaigns/${code}`
  }

  return `${window.location.origin}/campaigns/${code}`
}

async function copySessionLink(): Promise<void> {
  if (!session.value) {
    return
  }

  const link = buildSessionLink(session.value.code)

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
  if (value && !sessionCreateForm.value.date) {
    resetSessionCreateForm()
  }
})
watch(
  () => [campaignId.value, authStore.user?.id] as const,
  ([value, userId]) => {
    if (!value || !userId) {
      session.value = null
      characters.value = []
      invitations.value = []
      joinRequests.value = []
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

  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }

  unsubscribe()
})
</script>