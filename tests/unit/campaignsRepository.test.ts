import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { getCampaignById } from '../../src/repositories/campaignsRepository'

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
}

function createBuilder(data: {
  id: string
  name: string
  code: string
  description: string | null
  is_archived: boolean
  mj_id: string
  created_at: string | null
} | null): QueryBuilder {
  const builder: QueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }

  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.maybeSingle.mockResolvedValue({ data, error: null })

  return builder
}

describe('getCampaignById', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('queries campaigns.id when identifier is a UUID', async () => {
    const builder = createBuilder({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Campagne test',
      code: 'APHWDQ',
      description: null,
      is_archived: false,
      mj_id: 'mj-1',
      created_at: null,
    })
    fromMock.mockReturnValue(builder)

    await getCampaignById('550e8400-e29b-41d4-a716-446655440000')

    expect(fromMock).toHaveBeenCalledWith('campaigns')
    expect(builder.eq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000')
  })

  it('queries campaigns.code when identifier is a short code', async () => {
    const builder = createBuilder({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Campagne test',
      code: 'APHWDQ',
      description: null,
      is_archived: false,
      mj_id: 'mj-1',
      created_at: null,
    })
    fromMock.mockReturnValue(builder)

    await getCampaignById('aphwdq')

    expect(fromMock).toHaveBeenCalledWith('campaigns')
    expect(builder.eq).toHaveBeenCalledWith('code', 'APHWDQ')
  })
})
