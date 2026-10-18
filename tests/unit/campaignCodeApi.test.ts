import { describe, expect, it, vi, beforeEach } from 'vitest'

const createClientMock = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

function createSupabaseMock(options: {
  campaign?: { id: string; mj_id: string; is_archived: boolean } | null
  userId?: string | null
}) {
  const rpcMock = vi.fn().mockResolvedValue({
    data: options.campaign ? [options.campaign] : [],
    error: null,
  })
  const getUserMock = vi.fn().mockResolvedValue({
    data: { user: options.userId ? { id: options.userId } : null },
    error: null,
  })

  createClientMock.mockReturnValue({
    rpc: rpcMock,
    auth: { getUser: getUserMock },
  })

  return { rpcMock, getUserMock }
}

async function importHandler() {
  return import('../../api/campaigns/[identifier]')
}

beforeEach(() => {
  createClientMock.mockReset()
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  vi.stubEnv('SUPABASE_ANON_KEY', 'public-test-value')
})

describe('campaign code api handler', () => {
  it('returns 200 for UUID identifiers', async () => {
    createSupabaseMock({})
    const { default: handler } = await importHandler()

    const response = await handler(
      new Request('https://app.test/campaigns/550e8400-e29b-41d4-a716-446655440000')
    )

    expect(response.status).toBe(200)
  })

  it('redirects an active campaign code to the campaign UUID', async () => {
    createSupabaseMock({
      campaign: { id: 'campaign-uuid', mj_id: 'mj-1', is_archived: false },
    })
    const { default: handler } = await importHandler()

    const response = await handler(new Request('https://app.test/campaigns/AB12CD'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://app.test/campaigns/campaign-uuid')
  })

  it('returns 404 for an unknown campaign code', async () => {
    createSupabaseMock({ campaign: null })
    const { default: handler } = await importHandler()

    const response = await handler(new Request('https://app.test/campaigns/AB12CD'))

    expect(response.status).toBe(404)
  })

  it('allows the MJ of an archived campaign and blocks others', async () => {
    createSupabaseMock({
      campaign: { id: 'campaign-uuid', mj_id: 'mj-1', is_archived: true },
      userId: 'mj-1',
    })
    const { default: handler } = await importHandler()

    const mjResponse = await handler(
      new Request('https://app.test/campaigns/AB12CD', {
        headers: { authorization: 'Bearer token' },
      })
    )

    expect(mjResponse.status).toBe(302)

    createClientMock.mockReset()
    createSupabaseMock({
      campaign: { id: 'campaign-uuid', mj_id: 'mj-1', is_archived: true },
      userId: null,
    })

    const archivedResponse = await handler(new Request('https://app.test/campaigns/AB12CD'))
    expect(archivedResponse.status).toBe(404)
  })

  it('returns 429 when the short-code resolver is rate limited', async () => {
    createSupabaseMock({ campaign: { id: 'campaign-uuid', mj_id: 'mj-1', is_archived: false } })
    const { default: handler } = await importHandler()

    const request = new Request('https://app.test/campaigns/AB12CD', {
      headers: { 'x-vercel-forwarded-for': '198.51.100.42' },
    })

    for (let index = 0; index < 10; index += 1) {
      const response = await handler(request)
      if (index < 9) {
        expect(response.status).toBe(302)
      }
    }

    const blocked = await handler(request)
    expect(blocked.status).toBe(429)
  })

  it('resolves codes through the RPC with the public key', async () => {
    const { rpcMock } = createSupabaseMock({
      campaign: { id: 'campaign-uuid', mj_id: 'mj-1', is_archived: false },
    })
    const { default: handler } = await importHandler()

    await handler(new Request('https://app.test/campaigns/ab12cd'))

    expect(createClientMock.mock.calls[0]?.[1]).toBe('public-test-value')
    expect(rpcMock).toHaveBeenCalledWith('resolve_campaign_code', { code: 'AB12CD' })
  })

  it('rate limits requests without a trusted client IP', async () => {
    createSupabaseMock({ campaign: null })
    const { default: handler } = await importHandler()

    let last = 0
    for (let index = 0; index < 12; index += 1) {
      last = (await handler(new Request('https://app.test/campaigns/ZZ99ZZ'))).status
    }

    expect(last).toBe(429)
  })
})
