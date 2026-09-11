import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { getCampaignById, createCampaign, listCampaignsForUser, listCampaignsForUserPaginated, updateCampaignArchivedState } from '../../src/services/campaignsRepository'

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
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
    insert: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  }

  builder.select.mockReturnValue(builder)
  builder.insert.mockReturnValue(builder)
  builder.upsert.mockReturnValue(builder)
  builder.update.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.single.mockResolvedValue({ data, error: null })
  builder.maybeSingle.mockResolvedValue({ data, error: null })

  return builder
}

function createBuilderArray(data: {
  id: string
  name: string
  code: string
  description: string | null
  is_archived: boolean
  mj_id: string
  created_at: string | null
}[]): QueryBuilder {
  const builder = createBuilder(null)
  builder.select.mockReturnValue(builder)
  builder.single.mockResolvedValue({ data, error: null })
  builder.maybeSingle.mockResolvedValue({ data, error: null })
  builder.order.mockReturnValue({data, error: null})
  return builder
}

describe('createCampaign', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('should create a campaign', async () => {
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

    await createCampaign({
      name: 'Campagne test',
      code: 'APHWDQ',
      description: "",
      mjId: 'mj-1',
    })

    expect(fromMock).toHaveBeenCalledWith('campaigns')
    expect(builder.insert).toHaveBeenCalledWith({
      name: 'Campagne test',
      code: 'APHWDQ',
      description: "",
      mj_id: 'mj-1',
    })
  })

  it('should throw an error if creation fails', async () => {
    const builder = createBuilder(null)
    fromMock.mockReturnValue(builder)

    await expect(createCampaign({
      name: 'Campagne test',
      code: 'APHWDQ',
      description: "",
      mjId: 'mj-1',
    })).rejects.toThrow()
  })

  it('should throw an error if MJ membership upsert fails', async () => {
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

    // Simulate an error during the upsert
    builder.upsert.mockResolvedValue({ data: null, error: new Error('upsert failed') })

    await expect(createCampaign({
      name: 'Campagne test',
      code: 'APHWDQ',
      description: "",
      mjId: 'mj-1',
    })).rejects.toThrow('upsert failed')
  })
})

describe('listCampaignsForUser', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('should list campaigns for a user', async () => {
    const builder = createBuilderArray([
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Campagne test',
        code: 'APHWDQ',
        description: null,
        is_archived: false,
        mj_id: 'mj-1',
        created_at: '2024-06-01T00:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Campagne test 2',
        code: 'BHQWRE',
        description: null,
        is_archived: false,
        mj_id: 'mj-2',
        created_at: '2024-06-06T00:00:00Z',
      }
    ])
    fromMock.mockReturnValue(builder)

    const campaigns = await listCampaignsForUser('mj-1')

    expect(fromMock).toHaveBeenCalledWith('campaigns')
    expect(campaigns).toHaveLength(2)
    // test the order, newest first based on created_at
    // we assume that we inverted the order
    expect(campaigns[0].id).toBe('550e8400-e29b-41d4-a716-446655440001')
    expect(campaigns[0].name).toBe('Campagne test 2')
    expect(campaigns[1].id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(campaigns[1].name).toBe('Campagne test')
  })

  // Add tests for listCampaignsForUser here
})

describe('listCampaignsForUserPaginated', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('clamps pagination values and returns the requested page', async () => {
    const builder = createBuilderArray([
      {
        id: 'campaign-1', name: 'First', code: 'FIRST1', description: null, is_archived: false, mj_id: 'mj-1', created_at: '2024-06-01T00:00:00Z',
      },
      {
        id: 'campaign-2', name: 'Second', code: 'SECOND', description: null, is_archived: false, mj_id: 'mj-1', created_at: '2024-06-02T00:00:00Z',
      },
    ])
    fromMock.mockReturnValue(builder)

    await expect(listCampaignsForUserPaginated('mj-1', 0, 99)).resolves.toEqual({
      items: expect.arrayContaining([expect.objectContaining({ id: 'campaign-2' })]),
      total: 2,
    })
  })
})

describe('updateCampaignArchivedState', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('updates the archived state of the campaign', async () => {
    const builder = createBuilder(null)
    fromMock.mockReturnValue(builder)

    await updateCampaignArchivedState('campaign-1', true)

    expect(builder.update).toHaveBeenCalledWith({ is_archived: true })
    expect(builder.eq).toHaveBeenCalledWith('id', 'campaign-1')
  })

  it('maps Supabase write errors', async () => {
    const builder = createBuilder(null)
    builder.eq.mockResolvedValue({ error: new Error('permission denied') })
    fromMock.mockReturnValue(builder)

    await expect(updateCampaignArchivedState('campaign-1', true)).rejects.toThrow('Acces refuse (403)')
  })
})


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
