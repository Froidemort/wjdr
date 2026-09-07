import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { CampaignSummary } from '../../src/types/domain'

const dependencies = vi.hoisted(() => ({
  addUsers: vi.fn(),
  confirmAction: vi.fn(),
  createInvitations: vi.fn(),
  listInvitations: vi.fn(),
  listJoinRequests: vi.fn(),
  markRead: vi.fn(),
  notifyAccepted: vi.fn(),
  notifyRejected: vi.fn(),
  searchProfiles: vi.fn(),
}))

vi.mock('../../src/composables/useConfirmAction', () => ({
  useConfirmAction: () => ({ confirmAction: dependencies.confirmAction }),
}))
vi.mock('../../src/services/invitationsRepository', () => ({
  createCampaignInvitations: dependencies.createInvitations,
  listCampaignInvitations: dependencies.listInvitations,
}))
vi.mock('../../src/services/notificationsRepository', () => ({
  listPendingJoinRequestsForCampaign: dependencies.listJoinRequests,
  markNotificationRead: dependencies.markRead,
  notifyJoinRequestAccepted: dependencies.notifyAccepted,
  notifyJoinRequestRejected: dependencies.notifyRejected,
}))
vi.mock('../../src/services/usersCampaignsRepository', () => ({
  addUsersToCampaign: dependencies.addUsers,
  searchInvitableProfilesByMembership: dependencies.searchProfiles,
}))

import { useCampaignManagement } from '../../src/composables/useCampaignManagement'

const campaign: CampaignSummary = {
  id: 'campaign-1',
  name: 'La couronne ennemie',
  code: 'CODE123',
  description: null,
  isArchived: false,
  mjId: 'mj-1',
  createdAt: null,
}

function createManagement(overrides: Partial<CampaignSummary> = {}) {
  return useCampaignManagement({
    session: ref({ ...campaign, ...overrides }),
    userId: ref('mj-1'),
    isMj: ref(true),
  })
}

describe('useCampaignManagement', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.confirmAction.mockResolvedValue(true)
    dependencies.listInvitations.mockResolvedValue([])
    dependencies.listJoinRequests.mockResolvedValue([])
  })

  it('loads MJ invitations and join requests, then exposes their statistics', async () => {
    dependencies.listInvitations.mockResolvedValue([
      { userId: 'player-1', username: 'Karl', email: 'karl@example.test', invitedAt: null, isRead: true },
      { userId: 'player-2', username: 'Marta', email: 'marta@example.test', invitedAt: null, isRead: false },
    ])
    dependencies.listJoinRequests.mockResolvedValue([
      { notificationId: 'request-1', requesterId: 'player-3', username: 'Felix', email: 'felix@example.test', createdAt: '2026-01-01' },
    ])
    const management = createManagement()

    await management.refreshMjData()

    expect(dependencies.listInvitations).toHaveBeenCalledWith('campaign-1', 'mj-1')
    expect(dependencies.listJoinRequests).toHaveBeenCalledWith('campaign-1', 'mj-1')
    expect(management.adminLoading.value).toBe(false)
    expect(management.invitationStats.value).toEqual({ total: 2, read: 1, unread: 1 })
    expect(management.joinRequests.value).toHaveLength(1)
  })

  it('clears management state when MJ prerequisites are unavailable', async () => {
    const management = useCampaignManagement({
      session: ref<CampaignSummary | null>(null),
      userId: ref<string | null>(null),
      isMj: ref(false),
    })
    management.invitations.value = [{ userId: 'player-1', username: 'Karl', email: 'karl@example.test', invitedAt: null, isRead: false }]
    management.joinRequests.value = [{ notificationId: 'request-1', requesterId: 'player-2', username: 'Marta', email: 'marta@example.test', createdAt: '2026-01-01' }]

    await management.refreshMjData()

    expect(management.invitations.value).toEqual([])
    expect(management.joinRequests.value).toEqual([])
    expect(dependencies.listInvitations).not.toHaveBeenCalled()
  })

  it('sends selected invitations and resets the invitation state after success', async () => {
    const management = createManagement()
    management.inviteQuery.value = 'kar'
    management.inviteCandidates.value = [{ id: 'player-1', username: 'Karl', email: 'karl@example.test' }]
    management.toggleInvitee('player-1')

    await management.inviteSelectedUsers()

    expect(dependencies.addUsers).toHaveBeenCalledWith('campaign-1', ['player-1'])
    expect(dependencies.createInvitations).toHaveBeenCalledWith(
      'campaign-1',
      'La couronne ennemie',
      'CODE123',
      'mj-1',
      ['player-1']
    )
    expect(management.selectedInviteeCount.value).toBe(0)
    expect(management.inviteQuery.value).toBe('')
    expect(management.inviteSuccessMessage.value).toBe('1 invitation envoyee.')
  })

  it('reports invitation failures and does not run the archived campaign action', async () => {
    const management = createManagement()
    management.toggleInvitee('player-1')
    dependencies.addUsers.mockRejectedValue(new Error('Indisponible'))

    await management.inviteSelectedUsers()

    expect(management.inviteError.value).toBe('Indisponible')
    expect(management.inviting.value).toBe(false)

    const archivedManagement = createManagement({ isArchived: true })
    archivedManagement.toggleInvitee('player-2')
    await archivedManagement.inviteSelectedUsers()

    expect(dependencies.confirmAction).toHaveBeenCalledTimes(1)
  })

  it('accepts a confirmed join request and records its success state', async () => {
    dependencies.listJoinRequests.mockResolvedValue([])
    const management = createManagement()

    await management.acceptJoinRequest('request-1', 'player-1', 'Karl')

    expect(dependencies.addUsers).toHaveBeenCalledWith('campaign-1', ['player-1'])
    expect(dependencies.markRead).toHaveBeenCalledWith('request-1')
    expect(dependencies.notifyAccepted).toHaveBeenCalledWith('campaign-1', 'player-1', 'mj-1')
    expect(management.joinRequestSuccessMessage.value).toBe('Demande de Karl acceptee.')
    expect(management.joinRequestBusyNotificationId.value).toBeNull()
  })

  it('filters invitations, searches candidates, and reports search failures', async () => {
    vi.useFakeTimers()
    const management = createManagement()
    management.invitations.value = [
      { userId: 'player-1', username: 'Karl', email: 'karl@example.test', invitedAt: null, isRead: true },
      { userId: 'player-2', username: 'Marta', email: 'marta@example.test', invitedAt: null, isRead: false },
    ]
    management.invitationFilter.value = 'unread'
    management.inviteQuery.value = 'karl'
    dependencies.searchProfiles.mockResolvedValue([{ id: 'player-1', username: 'Karl', email: 'karl@example.test' }])

    await nextTick()
    await vi.advanceTimersByTimeAsync(250)

    expect(management.filteredInvitations.value).toHaveLength(1)
    expect(management.inviteCandidates.value).toHaveLength(1)

    dependencies.searchProfiles.mockRejectedValue('indisponible')
    management.inviteQuery.value = 'marta'
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)
    expect(management.inviteError.value).toBe('Impossible de charger la liste des joueurs.')
    vi.useRealTimers()
  })

  it('rejects a confirmed join request and reports action failures', async () => {
    const management = createManagement()
    dependencies.notifyRejected.mockRejectedValue(new Error('Indisponible'))

    await management.rejectJoinRequest('request-1', 'player-1', 'Karl')

    expect(dependencies.markRead).toHaveBeenCalledWith('request-1')
    expect(dependencies.notifyRejected).toHaveBeenCalledWith('campaign-1', 'player-1', 'mj-1')
    expect(management.joinRequestError.value).toBe('Indisponible')
    expect(management.joinRequestBusyNotificationId.value).toBeNull()
  })

  it('computes search, invitation, and selection states across their edge cases', () => {
    const management = createManagement()

    management.inviteQuery.value = 'k'
    expect(management.inviteQueryError.value).toBe('Saisissez au moins 2 caracteres pour lancer la recherche.')
    expect(management.showInviteNoResult.value).toBe(false)
    management.inviteQuery.value = 'karl'
    expect(management.showInviteNoResult.value).toBe(true)
    expect(management.canSubmitInvites.value).toBe(false)

    management.inviteCandidates.value = [
      { id: 'player-1', username: 'Karl', email: 'karl@example.test' },
      { id: 'player-2', username: 'Marta', email: 'marta@example.test' },
    ]
    management.selectAllInviteCandidates()
    expect(management.selectedInviteeCount.value).toBe(2)
    expect(management.canSubmitInvites.value).toBe(true)
    management.toggleInvitee('player-1')
    expect(management.selectedInviteeCount.value).toBe(1)
    management.clearInviteSelection()
    management.inviteCandidates.value = []
    management.selectAllInviteCandidates()
    expect(management.selectedInviteeCount.value).toBe(0)

    management.invitations.value = [
      { userId: 'player-1', username: 'Karl', email: 'karl@example.test', invitedAt: null, isRead: true },
      { userId: 'player-2', username: 'Marta', email: 'marta@example.test', invitedAt: null, isRead: false },
    ]
    management.invitationFilter.value = 'read'
    expect(management.filteredInvitations.value).toHaveLength(1)
    management.invitationFilter.value = 'all'
    expect(management.filteredInvitations.value).toHaveLength(2)
  })

  it('handles loading guards and clears state explicitly', async () => {
    const management = useCampaignManagement({
      session: ref<CampaignSummary | null>(null), userId: ref<string | null>(null), isMj: ref(false),
    })
    management.inviteCandidates.value = [{ id: 'player-1', username: 'Karl', email: 'karl@example.test' }]
    management.inviteSuccessMessage.value = 'envoyee'
    management.joinRequestError.value = 'erreur'
    management.clearManagementState()
    expect(management.inviteCandidates.value).toEqual([])
    expect(management.inviteSuccessMessage.value).toBeNull()
    expect(management.joinRequestError.value).toBeNull()

    await management.loadJoinRequests()
    await management.loadInvitations()
    expect(dependencies.listJoinRequests).not.toHaveBeenCalled()
    expect(dependencies.listInvitations).not.toHaveBeenCalled()
  })

  it('cancels invitations and join requests without calling their repositories', async () => {
    const management = createManagement()
    management.toggleInvitee('player-1')
    dependencies.confirmAction.mockResolvedValue(false)

    await management.inviteSelectedUsers()
    await management.acceptJoinRequest('request-1', 'player-1', 'Karl')
    await management.rejectJoinRequest('request-2', 'player-2', 'Marta')

    expect(dependencies.addUsers).not.toHaveBeenCalled()
    expect(dependencies.createInvitations).not.toHaveBeenCalled()
    expect(dependencies.markRead).not.toHaveBeenCalled()
  })

  it('reports MJ loading and candidate-search errors and ignores invalid searches', async () => {
    vi.useFakeTimers()
    const management = createManagement()
    dependencies.listInvitations.mockRejectedValue('indisponible')
    await management.refreshMjData()
    expect(management.inviteError.value).toBe('Chargement MJ impossible.')
    expect(management.joinRequestError.value).toBe('Chargement MJ impossible.')

    management.inviteQuery.value = 'x'
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)
    expect(dependencies.searchProfiles).not.toHaveBeenCalled()
    expect(management.inviteCandidates.value).toEqual([])
    vi.useRealTimers()
  })
})