<script setup lang="ts">
import type { JoinRequestItem } from '../../services/notificationsRepository'
import type { SessionInvitation } from '../../services/invitationsRepository'
import type { CampaignSummary, Profile } from '../../types/domain'
import AppCard from './AppCard.vue'
import SearchInput from './SearchInput.vue'

type InvitationFilter = 'all' | 'read' | 'unread'

defineProps<{
  session: CampaignSummary
  adminLoading: boolean
  inviteQuery: string
  inviteQueryError: string | null
  inviteSearchLoading: boolean
  showInviteNoResult: boolean
  inviteCandidates: Profile[]
  selectedInvitees: Set<string>
  selectedInviteeCount: number
  canSubmitInvites: boolean
  inviting: boolean
  inviteSuccessMessage: string | null
  inviteError: string | null
  invitationStats: {
    total: number
    read: number
    unread: number
  }
  invitationFilter: InvitationFilter
  invitations: SessionInvitation[]
  filteredInvitations: SessionInvitation[]
  joinRequests: JoinRequestItem[]
  joinRequestBusyNotificationId: string | null
  joinRequestSuccessMessage: string | null
  joinRequestError: string | null
}>()

const emit = defineEmits<{
  'update:inviteQuery': [value: string]
  'update:invitationFilter': [value: InvitationFilter]
  'toggle-invitee': [userId: string]
  'select-all-invite-candidates': []
  'clear-invite-selection': []
  'invite-selected-users': []
  'accept-join-request': [notificationId: string, requesterId: string, requesterUsername: string]
  'reject-join-request': [notificationId: string, requesterId: string, requesterUsername: string]
}>()
</script>

<template>
  <section id="campaign-panel-management" role="tabpanel" aria-labelledby="campaign-tab-management" class="space-y-3">
    <h2 class="text-xl font-semibold">Gestion de campagne</h2>
    <div v-if="adminLoading" class="flex items-center gap-2 text-sm opacity-70">
      <span class="loading loading-spinner loading-xs" aria-hidden="true" />
      Chargement des données MJ...
    </div>

    <div class="grid gap-3 lg:grid-cols-2">
      <div>
        <h3 class="mb-2 text-sm font-semibold opacity-75">INVITER DES JOUEURS</h3>
        <AppCard title="Ajouter des membres">
          <div class="space-y-3">
            <div v-if="session.isArchived" class="alert alert-warning alert-soft text-sm">
              <span>Campagne archivée: invitations bloquées.</span>
            </div>
            <SearchInput
              :model-value="inviteQuery"
              placeholder="Chercher un joueur (username ou email)"
              aria-label="Recherche de joueur a inviter"
              @update:model-value="emit('update:inviteQuery', $event)"
            />

            <p class="text-xs opacity-70">Entrez au moins 2 caracteres pour rechercher un joueur.</p>

            <div v-if="inviteQueryError" role="alert" class="alert alert-error alert-soft text-sm">
              <span>{{ inviteQueryError }}</span>
            </div>

            <div v-if="inviteSearchLoading" class="flex items-center gap-2 text-sm opacity-70">
              <span class="loading loading-spinner loading-xs" aria-hidden="true" />
              Recherche de joueurs...
            </div>

            <div v-if="showInviteNoResult" role="status" class="alert alert-info alert-soft text-sm">
              <span>Aucun joueur trouve. Essayez un autre email ou nom d'utilisateur.</span>
            </div>

            <div v-if="inviteCandidates.length > 0" class="max-h-56 overflow-y-auto rounded-box border border-base-300">
              <ul class="menu p-2">
                <li v-for="candidate in inviteCandidates" :key="candidate.id">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="selectedInvitees.has(candidate.id)"
                      @change="emit('toggle-invitee', candidate.id)"
                    />
                    <div>
                      <div class="font-medium">{{ candidate.username }}</div>
                      <div class="text-xs opacity-70">{{ candidate.email }}</div>
                    </div>
                  </label>
                </li>
              </ul>
            </div>

            <div v-if="inviteCandidates.length > 0 || selectedInviteeCount > 0" class="flex flex-wrap items-center gap-2">
              <button class="btn btn-xs ui-critical-action" :disabled="inviteCandidates.length === 0" @click="emit('select-all-invite-candidates')">
                Tout selectionner
              </button>
              <button class="btn btn-xs btn-ghost ui-critical-action" :disabled="selectedInviteeCount === 0" @click="emit('clear-invite-selection')">
                Effacer la selection
              </button>
              <span class="badge badge-outline">Selection: {{ selectedInviteeCount }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button class="btn btn-sm btn-accent ui-critical-action" :disabled="!canSubmitInvites" :aria-busy="inviting ? 'true' : 'false'" @click="emit('invite-selected-users')">
                <span v-if="inviting" class="loading loading-spinner loading-xs" aria-hidden="true" />
                Inviter {{ selectedInviteeCount > 0 ? `(${selectedInviteeCount})` : '' }}
              </button>
            </div>

            <div v-if="inviteSuccessMessage" role="status" class="alert alert-success alert-soft text-sm">
              <span>{{ inviteSuccessMessage }}</span>
            </div>

            <div v-if="inviteError" role="alert" class="alert alert-error alert-soft text-sm">
              <span>{{ inviteError }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold opacity-75">STATUT DES INVITATIONS</h3>
        <div class="space-y-3">
          <AppCard title="Invitations envoyees" compact>
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="badge badge-outline">Total: {{ invitationStats.total }}</span>
              <span class="badge badge-outline">Lues: {{ invitationStats.read }}</span>
              <span class="badge badge-outline">Non lues: {{ invitationStats.unread }}</span>
            </div>
            <div class="join join-vertical sm:join-horizontal mb-3">
              <button class="btn btn-xs join-item ui-critical-action" :class="invitationFilter === 'all' ? 'btn-active' : ''" @click="emit('update:invitationFilter', 'all')">Toutes</button>
              <button class="btn btn-xs join-item ui-critical-action" :class="invitationFilter === 'unread' ? 'btn-active' : ''" @click="emit('update:invitationFilter', 'unread')">Non lues</button>
              <button class="btn btn-xs join-item ui-critical-action" :class="invitationFilter === 'read' ? 'btn-active' : ''" @click="emit('update:invitationFilter', 'read')">Lues</button>
            </div>
            <div v-if="invitations.length === 0" class="text-sm opacity-70">Aucun joueur invite.</div>
            <div v-else-if="filteredInvitations.length === 0" class="text-sm opacity-70">Aucune invitation ne correspond au filtre actif.</div>
            <ul v-else class="list bg-base-200 rounded-box">
              <li v-for="invitation in filteredInvitations" :key="invitation.userId" class="list-row">
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
                <div class="join join-vertical sm:join-horizontal">
                  <button
                    class="btn btn-xs ui-critical-action join-item"
                    :disabled="joinRequestBusyNotificationId === request.notificationId"
                    :aria-busy="joinRequestBusyNotificationId === request.notificationId ? 'true' : 'false'"
                    @click="emit('accept-join-request', request.notificationId, request.requesterId, request.username)"
                  >
                    <span
                      v-if="joinRequestBusyNotificationId === request.notificationId"
                      class="loading loading-spinner loading-xs"
                      aria-hidden="true"
                    />
                    Accepter
                  </button>
                  <button
                    class="btn btn-xs ui-critical-action join-item"
                    :disabled="joinRequestBusyNotificationId === request.notificationId"
                    :aria-busy="joinRequestBusyNotificationId === request.notificationId ? 'true' : 'false'"
                    @click="emit('reject-join-request', request.notificationId, request.requesterId, request.username)"
                  >
                    <span
                      v-if="joinRequestBusyNotificationId === request.notificationId"
                      class="loading loading-spinner loading-xs"
                      aria-hidden="true"
                    />
                    Refuser
                  </button>
                </div>
              </li>
            </ul>

            <div v-if="joinRequestSuccessMessage" role="status" class="alert alert-success alert-soft mt-2 text-sm">
              <span>{{ joinRequestSuccessMessage }}</span>
            </div>

            <div v-if="joinRequestError" role="alert" class="alert alert-error alert-soft mt-2 text-sm">
              <span>{{ joinRequestError }}</span>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  </section>
</template>
