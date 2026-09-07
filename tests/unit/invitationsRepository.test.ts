import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const dependencies = vi.hoisted(() => ({
  assertCampaignWritable: vi.fn(),
  from: vi.fn(),
  searchProfilesByTerm: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({ supabase: { from: dependencies.from } }))
vi.mock('../../src/services/shared/campaignGuards', () => ({ assertCampaignWritable: dependencies.assertCampaignWritable }))
vi.mock('../../src/services/shared/profileSearch', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/services/shared/profileSearch')>(),
  searchProfilesByTerm: dependencies.searchProfilesByTerm,
}))

import {
  createCampaignInvitations,
  invitationMarker,
  invitationTitle,
  listCampaignInvitations,
  searchInvitableProfilesByNotification,
} from '../../src/services/invitationsRepository'

describe('invitationsRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.assertCampaignWritable.mockResolvedValue(undefined)
  })

  it('lists only campaign invitations with valid recipient profiles', async () => {
    dependencies.from.mockReturnValue(createSupabaseQueryBuilder({
      data: [
        { receiver_user_id: 'user-1', is_read: false, created_at: '2026-09-01', title: invitationTitle(), message: '' , receiver: [{ username: 'Kurt', email: 'kurt@example.fr' }] },
        { receiver_user_id: 'user-2', is_read: true, created_at: '2026-09-02', title: 'Autre', message: invitationMarker('campaign-1'), receiver: [{ username: 'Lena', email: 'lena@example.fr' }] },
        { receiver_user_id: 'user-3', is_read: false, created_at: null, title: 'INVITATION_SESSION_campaign-1', message: '', receiver: [] },
        { receiver_user_id: 'user-4', is_read: false, created_at: null, title: 'Autre', message: '', receiver: [{ username: 'Ignore', email: 'ignore@example.fr' }] },
      ], error: null,
    }))

    await expect(listCampaignInvitations('campaign-1', 'mj-1')).resolves.toEqual([
      expect.objectContaining({ userId: 'user-1', username: 'Kurt', isRead: false }),
      expect.objectContaining({ userId: 'user-2', username: 'Lena', isRead: true }),
    ])
  })

  it('returns only profiles that are not the MJ or already invited', async () => {
    dependencies.searchProfilesByTerm.mockResolvedValue([
      { id: 'mj-1', username: 'MJ', email: 'mj@example.fr' },
      { id: 'user-1', username: 'Kurt', email: 'kurt@example.fr' },
      { id: 'user-2', username: 'Lena', email: 'lena@example.fr' },
    ])
    dependencies.from.mockReturnValue(createSupabaseQueryBuilder({
      data: [{ receiver_user_id: 'user-1', title: invitationTitle(), message: '', is_read: false, created_at: null }], error: null,
    }))

    await expect(searchInvitableProfilesByNotification('campaign-1', 'ku', 'mj-1')).resolves.toEqual([
      { id: 'user-2', username: 'Lena', email: 'lena@example.fr' },
    ])

    dependencies.searchProfilesByTerm.mockResolvedValue([])
    await expect(searchInvitableProfilesByNotification('campaign-1', 'none', 'mj-1')).resolves.toEqual([])
  })

  it('creates only unique, non-existing invitations after the write guard', async () => {
    const existing = createSupabaseQueryBuilder({
      data: [{ receiver_user_id: 'user-1', title: invitationTitle(), message: '', is_read: false, created_at: null }], error: null,
    })
    const insert = createSupabaseQueryBuilder({ data: null, error: null })
    dependencies.from.mockReturnValueOnce(existing).mockReturnValueOnce(insert)

    await createCampaignInvitations('campaign-1', 'La table', 'IGNORED', 'mj-1', ['user-1', 'user-2', 'user-2'])

    expect(dependencies.assertCampaignWritable).toHaveBeenCalledWith('campaign-1')
    expect(insert.insert).toHaveBeenCalledWith([expect.objectContaining({ receiver_user_id: 'user-2' })])
  })

  it('does not query notifications for an empty invitation selection', async () => {
    await createCampaignInvitations('campaign-1', 'La table', 'IGNORED', 'mj-1', [])

    expect(dependencies.assertCampaignWritable).toHaveBeenCalledOnce()
    expect(dependencies.from).not.toHaveBeenCalled()
  })
})