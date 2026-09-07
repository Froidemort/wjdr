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
  addUsersToCampaign,
  canAccessCampaign,
  isUserInCampaign,
  joinCampaignByCode,
  listUserCampaignIds,
  searchInvitableProfilesByMembership,
} from '../../src/services/usersCampaignsRepository'

describe('usersCampaignsRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.assertCampaignWritable.mockResolvedValue(undefined)
  })

  it('deduplicates campaign identifiers and resolves membership', async () => {
    const list = createSupabaseQueryBuilder({ data: [{ campaign_id: 'campaign-1' }, { campaign_id: 'campaign-1' }, { campaign_id: 'campaign-2' }], error: null })
    const membership = createSupabaseQueryBuilder({ data: { campaign_id: 'campaign-1' }, error: null })
    dependencies.from.mockReturnValueOnce(list).mockReturnValueOnce(membership)

    await expect(listUserCampaignIds('user-1')).resolves.toEqual(['campaign-1', 'campaign-2'])
    await expect(isUserInCampaign('campaign-1', 'user-1')).resolves.toBe(true)
  })

  it('adds unique users only after a writable-campaign check', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    dependencies.from.mockReturnValue(builder)

    await addUsersToCampaign('campaign-1', ['user-1', 'user-1', 'user-2'])
    expect(dependencies.assertCampaignWritable).toHaveBeenCalledWith('campaign-1')
    expect(builder.upsert).toHaveBeenCalledWith([
      { campaign_id: 'campaign-1', user_id: 'user-1', active: true },
      { campaign_id: 'campaign-1', user_id: 'user-2', active: true },
    ], { onConflict: 'campaign_id,user_id' })
  })

  it('does not query membership when no users are supplied', async () => {
    await addUsersToCampaign('campaign-1', [])

    expect(dependencies.assertCampaignWritable).not.toHaveBeenCalled()
    expect(dependencies.from).not.toHaveBeenCalled()
  })

  it('filters the MJ and existing members from searchable profiles', async () => {
    dependencies.searchProfilesByTerm.mockResolvedValue([
      { id: 'mj-1', username: 'MJ', email: 'mj@example.fr' },
      { id: 'user-1', username: 'Kurt', email: 'kurt@example.fr' },
      { id: 'user-2', username: 'Lena', email: 'lena@example.fr' },
    ])
    dependencies.from.mockReturnValue(createSupabaseQueryBuilder({ data: [{ user_id: 'user-1' }], error: null }))

    await expect(searchInvitableProfilesByMembership('campaign-1', 'ku', 'mj-1')).resolves.toEqual([
      { id: 'user-2', username: 'Lena', email: 'lena@example.fr' },
    ])
  })

  it('joins an active campaign and rejects empty or archived codes', async () => {
    const activeCampaign = createSupabaseQueryBuilder({ data: { id: 'campaign-1', is_archived: false }, error: null })
    const membership = createSupabaseQueryBuilder({ data: null, error: null })
    dependencies.from.mockReturnValueOnce(activeCampaign).mockReturnValueOnce(membership)

    await expect(joinCampaignByCode('user-1', ' abc123 ')).resolves.toEqual({ campaignId: 'campaign-1' })
    expect(activeCampaign.eq).toHaveBeenCalledWith('code', 'ABC123')
    await expect(joinCampaignByCode('user-1', ' ')).resolves.toBeNull()

    dependencies.from.mockReturnValue(createSupabaseQueryBuilder({ data: { id: 'campaign-1', is_archived: true }, error: null }))
    await expect(joinCampaignByCode('user-1', 'ABC123')).resolves.toBeNull()
  })

  it('grants access for either membership or campaign ownership', async () => {
    const membership = createSupabaseQueryBuilder({ data: null, error: null })
    const ownership = createSupabaseQueryBuilder({ data: { id: 'campaign-1' }, error: null })
    dependencies.from.mockReturnValueOnce(membership).mockReturnValueOnce(ownership)

    await expect(canAccessCampaign('campaign-1', 'user-1')).resolves.toBe(true)
  })
})