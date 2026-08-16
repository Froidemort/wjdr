import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { CampaignSummary } from '../types/domain'
import {
  createCampaignInvitations,
  listCampaignInvitations,
  type SessionInvitation,
} from '../services/invitationsRepository'
import {
  type JoinRequestItem,
  listPendingJoinRequestsForCampaign,
  markNotificationRead,
  notifyJoinRequestAccepted,
  notifyJoinRequestRejected,
} from '../services/notificationsRepository'
import {
  addUsersToCampaign,
  searchInvitableProfilesByMembership,
} from '../services/usersCampaignsRepository'
import { useConfirmAction } from './useConfirmAction'
import type { Profile } from '../types/domain'

interface UseCampaignManagementOptions {
  session: Ref<CampaignSummary | null>
  userId: Ref<string | null>
  isMj: Ref<boolean>
}

export function useCampaignManagement(options: UseCampaignManagementOptions) {
  const { confirmAction } = useConfirmAction()
  const invitations = ref<SessionInvitation[]>([])
  const inviteCandidates = ref<Profile[]>([])
  const inviteQuery = ref('')
  const selectedInvitees = ref(new Set<string>())
  const inviting = ref(false)
  const inviteError = ref<string | null>(null)
  const inviteSuccessMessage = ref<string | null>(null)
  const inviteSearchLoading = ref(false)

  const joinRequestError = ref<string | null>(null)
  const joinRequestSuccessMessage = ref<string | null>(null)
  const joinRequestBusyNotificationId = ref<string | null>(null)
  const adminLoading = ref(false)
  const joinRequests = ref<JoinRequestItem[]>([])

  const invitationFilter = ref<'all' | 'read' | 'unread'>('all')

  const selectedInviteeCount = computed(() => selectedInvitees.value.size)
  const inviteQueryError = computed(() => {
    const query = inviteQuery.value.trim()
    if (!query) {
      return null
    }

    return query.length < 2 ? 'Saisissez au moins 2 caracteres pour lancer la recherche.' : null
  })
  const canRunInviteSearch = computed(
    () => Boolean(inviteQuery.value.trim()) && !inviteQueryError.value
  )
  const showInviteNoResult = computed(
    () =>
      canRunInviteSearch.value && !inviteSearchLoading.value && inviteCandidates.value.length === 0
  )
  const canSubmitInvites = computed(
    () =>
      Boolean(
        options.session.value &&
          !options.session.value.isArchived &&
          !inviting.value &&
          selectedInviteeCount.value > 0
      )
  )
  const invitationStats = computed(() => {
    const total = invitations.value.length
    const read = invitations.value.filter((invitation) => invitation.isRead).length
    const unread = total - read

    return { total, read, unread }
  })
  const filteredInvitations = computed(() => {
    if (invitationFilter.value === 'all') {
      return invitations.value
    }

    return invitations.value.filter((invitation) =>
      invitationFilter.value === 'read' ? invitation.isRead : !invitation.isRead
    )
  })

  function clearManagementState(): void {
    invitations.value = []
    joinRequests.value = []
    inviteCandidates.value = []
    selectedInvitees.value = new Set<string>()
    inviteSuccessMessage.value = null
    inviteError.value = null
    joinRequestSuccessMessage.value = null
    joinRequestError.value = null
    adminLoading.value = false
  }

  async function loadJoinRequests(): Promise<void> {
    if (!options.session.value || !options.userId.value || !options.isMj.value) {
      joinRequests.value = []
      return
    }

    joinRequests.value = await listPendingJoinRequestsForCampaign(
      options.session.value.id,
      options.userId.value
    )
  }

  async function loadInvitations(): Promise<void> {
    if (!options.session.value || !options.userId.value) {
      invitations.value = []
      return
    }

    invitations.value = await listCampaignInvitations(options.session.value.id, options.userId.value)
  }

  async function refreshMjData(): Promise<void> {
    if (!options.session.value || !options.userId.value || !options.isMj.value) {
      clearManagementState()
      return
    }

    adminLoading.value = true
    joinRequestError.value = null
    joinRequestSuccessMessage.value = null
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

  async function loadInviteCandidates(): Promise<void> {
    inviteError.value = null
    if (!options.session.value || !inviteQuery.value.trim() || inviteQueryError.value) {
      inviteCandidates.value = []
      return
    }

    inviteSearchLoading.value = true
    try {
      inviteCandidates.value = await searchInvitableProfilesByMembership(
        options.session.value.id,
        inviteQuery.value,
        options.session.value.mjId
      )
    } catch (error) {
      inviteError.value =
        error instanceof Error ? error.message : 'Impossible de charger la liste des joueurs.'
    } finally {
      inviteSearchLoading.value = false
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

  function selectAllInviteCandidates(): void {
    if (inviteCandidates.value.length === 0) {
      return
    }

    selectedInvitees.value = new Set(inviteCandidates.value.map((candidate) => candidate.id))
  }

  function clearInviteSelection(): void {
    selectedInvitees.value = new Set<string>()
  }

  async function inviteSelectedUsers(): Promise<void> {
    if (
      !options.session.value ||
      selectedInvitees.value.size === 0 ||
      inviting.value ||
      options.session.value.isArchived
    ) {
      return
    }

    inviting.value = true
    inviteError.value = null
    inviteSuccessMessage.value = null
    try {
      const inviteeIds = Array.from(selectedInvitees.value)
      const confirmed = await confirmAction(
        `Envoyer ${inviteeIds.length} invitation${inviteeIds.length > 1 ? 's' : ''} ?`
      )
      if (!confirmed) {
        return
      }
      await addUsersToCampaign(options.session.value.id, inviteeIds)
      await createCampaignInvitations(
        options.session.value.id,
        options.session.value.name,
        options.session.value.code,
        options.session.value.mjId,
        inviteeIds
      )
      selectedInvitees.value = new Set<string>()
      inviteQuery.value = ''
      inviteCandidates.value = []
      inviteSuccessMessage.value = `${inviteeIds.length} invitation${inviteeIds.length > 1 ? 's envoyees.' : ' envoyee.'}`
      await loadInvitations()
    } catch (error) {
      inviteError.value = error instanceof Error ? error.message : 'Invitation impossible.'
    } finally {
      inviting.value = false
    }
  }

  async function acceptJoinRequest(
    notificationId: string,
    requesterId: string,
    requesterUsername: string
  ): Promise<void> {
    if (!options.session.value || !options.userId.value || joinRequestBusyNotificationId.value) {
      return
    }

    const confirmed = await confirmAction(
      `Accepter la demande de ${requesterUsername} et l ajouter a la campagne ?`
    )
    if (!confirmed) {
      return
    }

    joinRequestBusyNotificationId.value = notificationId
    joinRequestError.value = null
    joinRequestSuccessMessage.value = null
    try {
      await addUsersToCampaign(options.session.value.id, [requesterId])
      await markNotificationRead(notificationId)
      await notifyJoinRequestAccepted(options.session.value.id, requesterId, options.userId.value)
      await loadJoinRequests()
      joinRequestSuccessMessage.value = `Demande de ${requesterUsername} acceptee.`
    } catch (error) {
      joinRequestError.value = error instanceof Error ? error.message : 'Traitement impossible.'
    } finally {
      joinRequestBusyNotificationId.value = null
    }
  }

  async function rejectJoinRequest(
    notificationId: string,
    requesterId: string,
    requesterUsername: string
  ): Promise<void> {
    if (!options.session.value || !options.userId.value || joinRequestBusyNotificationId.value) {
      return
    }

    const confirmed = await confirmAction(`Refuser la demande de ${requesterUsername} ?`)
    if (!confirmed) {
      return
    }

    joinRequestBusyNotificationId.value = notificationId
    joinRequestError.value = null
    joinRequestSuccessMessage.value = null
    try {
      await markNotificationRead(notificationId)
      await notifyJoinRequestRejected(options.session.value.id, requesterId, options.userId.value)
      await loadJoinRequests()
      joinRequestSuccessMessage.value = `Demande de ${requesterUsername} refusee.`
    } catch (error) {
      joinRequestError.value = error instanceof Error ? error.message : 'Traitement impossible.'
    } finally {
      joinRequestBusyNotificationId.value = null
    }
  }

  const scheduleInviteSearch = useDebounceFn(() => {
    void loadInviteCandidates()
  }, 250)

  watch(inviteQuery, () => {
    void scheduleInviteSearch()
  })

  onBeforeUnmount(() => {
    scheduleInviteSearch.cancel()
  })

  return {
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
    loadJoinRequests,
    loadInvitations,
    toggleInvitee,
    selectAllInviteCandidates,
    clearInviteSelection,
    inviteSelectedUsers,
    acceptJoinRequest,
    rejectJoinRequest,
  }
}
