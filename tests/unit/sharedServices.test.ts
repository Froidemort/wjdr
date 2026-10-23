import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: { from: fromMock } }))

import { assertCampaignWritable } from '../../src/services/shared/campaignGuards'
import { fetchAllPages } from '../../src/services/shared/pagination'
import { mapBasicProfile, searchProfilesByTerm } from '../../src/services/shared/profileSearch'
import { throwIfError } from '../../src/services/shared/supabase'

describe('campaign guards', () => {
  beforeEach(() => fromMock.mockReset())

  it.each([
    [{ id: 'campaign-1', is_archived: false }, null, undefined],
    [null, null, 'Campagne introuvable.'],
    [{ id: 'campaign-1', is_archived: true }, null, 'Campagne archivée : action interdite.'],
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

describe('throwIfError', () => {
  it('throws the given error when truthy', () => {
    const error = new Error('boom')
    expect(() => throwIfError(error)).toThrow(error)
  })

  it('does nothing for null or undefined', () => {
    expect(() => throwIfError(null)).not.toThrow()
    expect(() => throwIfError(undefined)).not.toThrow()
  })
})

describe('fetchAllPages', () => {
  it('stops after a short page using the 1000-row range window', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], error: null })
    await expect(fetchAllPages(fetchPage)).resolves.toEqual([{ id: '1' }, { id: '2' }])
    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(fetchPage).toHaveBeenCalledWith(0, 999)
  })

  it('requests the next 1000-row window when a page is full', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }))
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ data: fullPage, error: null })
      .mockResolvedValueOnce({ data: [{ id: 'last' }], error: null })

    const rows = await fetchAllPages(fetchPage)
    expect(rows).toHaveLength(1001)
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0, 999)
    expect(fetchPage).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it('treats a null page as empty and propagates fetch errors', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: null, error: null })
    await expect(fetchAllPages(fetchPage)).resolves.toEqual([])

    const failing = vi.fn().mockResolvedValue({ data: null, error: new Error('boom') })
    await expect(fetchAllPages(failing)).rejects.toThrow('boom')
  })
})
