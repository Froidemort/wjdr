import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({
  supabase: { from: fromMock },
}))

import {
  createSession,
  deleteSession,
  getSessionById,
  listSessionsForCampaign,
  updateSession,
} from '../../src/services/sessionsRepository'

const sessionRow = {
  id: 'session-1',
  campaign_id: 'campaign-1',
  date: '2026-09-07',
  name: 'La tour noire',
  description: null,
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-02T00:00:00.000Z',
}

describe('sessionsRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('lists mapped sessions for a campaign', async () => {
    const builder = createSupabaseQueryBuilder({ data: [sessionRow], error: null })
    fromMock.mockReturnValue(builder)

    await expect(listSessionsForCampaign('campaign-1')).resolves.toEqual([
      expect.objectContaining({ campaignId: 'campaign-1', name: 'La tour noire' }),
    ])
    expect(builder.eq).toHaveBeenCalledWith('campaign_id', 'campaign-1')
    expect(builder.order).toHaveBeenCalledWith('date', { ascending: false })
  })

  it('creates a session with nullable optional fields', async () => {
    const builder = createSupabaseQueryBuilder({ data: { id: 'session-1' }, error: null })
    fromMock.mockReturnValue(builder)

    await expect(createSession({ campaignId: 'campaign-1', date: '2026-09-07', name: '', description: '' })).resolves.toBe('session-1')
    expect(builder.insert).toHaveBeenCalledWith({
      campaign_id: 'campaign-1', date: '2026-09-07', name: null, description: null,
    })
  })

  it('maps write permission errors', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    builder.single.mockResolvedValue({ data: null, error: new Error('permission denied') })
    fromMock.mockReturnValue(builder)

    await expect(createSession({ campaignId: 'campaign-1', date: '2026-09-07', name: 'Test', description: '' }))
      .rejects.toThrow('Acces refuse (403)')
  })

  it('updates only supplied fields and timestamps the session', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await updateSession('session-1', { name: '' })

    expect(builder.update).toHaveBeenCalledWith({ name: null, updated_at: '2026-09-07T12:00:00.000Z' })
    expect(builder.eq).toHaveBeenCalledWith('id', 'session-1')
    vi.useRealTimers()
  })

  it('deletes a session and retrieves an absent session as null', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await expect(deleteSession('session-1')).resolves.toBeUndefined()
    await expect(getSessionById('session-1')).resolves.toBeNull()
    expect(builder.delete).toHaveBeenCalledOnce()
    expect(builder.maybeSingle).toHaveBeenCalledOnce()
  })
})