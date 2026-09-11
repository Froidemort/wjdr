import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: { from: fromMock } }))

import { assertCampaignWritable } from '../../src/services/shared/campaignGuards'
import { mapBasicProfile, searchProfilesByTerm } from '../../src/services/shared/profileSearch'

describe('campaign guards', () => {
  beforeEach(() => fromMock.mockReset())

  it.each([
    [{ id: 'campaign-1', is_archived: false }, null, undefined],
    [null, null, 'Campagne introuvable.'],
    [{ id: 'campaign-1', is_archived: true }, null, 'Campagne archivee: action interdite.'],
    [null, new Error('Indisponible'), 'Indisponible'],
  ])('handles campaign write state', async (data, error, message) => {
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data, error }))

    if (message) {
      await expect(assertCampaignWritable('campaign-1')).rejects.toThrow(message)
      return
    }

    await expect(assertCampaignWritable('campaign-1')).resolves.toBeUndefined()
  })
})

describe('profile search', () => {
  beforeEach(() => fromMock.mockReset())

  it('maps profiles and skips blank queries', async () => {
    expect(mapBasicProfile({ id: 'user-1', username: 'mj', email: 'mj@example.fr' }))
      .toEqual({ id: 'user-1', username: 'mj', email: 'mj@example.fr' })
    await expect(searchProfilesByTerm('   ')).resolves.toEqual([])
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('normalizes a query, applies its limit, and propagates errors', async () => {
    const builder = createSupabaseQueryBuilder({ data: [{ id: 'user-1' }], error: null })
    fromMock.mockReturnValue(builder)

    await expect(searchProfilesByTerm('  MJ  ', 4)).resolves.toEqual([{ id: 'user-1' }])
    expect(builder.or).toHaveBeenCalledWith('username.ilike.%mj%,email.ilike.%mj%')
    expect(builder.limit).toHaveBeenCalledWith(4)

    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error: new Error('Indisponible') }))
    await expect(searchProfilesByTerm('mj')).rejects.toThrow('Indisponible')
  })
})