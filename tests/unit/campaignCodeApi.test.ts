import { describe, expect, it, vi, beforeEach } from 'vitest'

const createClientMock = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

function createSupabaseMock(options: {
  campaign?: { id: string; mj_id: string; is_archived: boolean } | null
  userId?: string | null
}) {
  const selectMock = vi.fn().mockReturnThis()
  const eqMock = vi.fn().mockReturnThis()
  const maybeSingleMock = vi.fn().mockResolvedValue({
    data: options.campaign ?? null,
    error: null,
  })

  const fromMock = vi.fn(() => ({ select: selectMock, eq: eqMock, maybeSingle: maybeSingleMock }))
  const getUserMock = vi.fn().mockResolvedValue({
    data: { user: options.userId ? { id: options.userId } : null },
    error: null,
  })

  createClientMock.mockReturnValue({
    from: fromMock,
    auth: { getUser: getUserMock },
  })

  return { fromMock, getUserMock }
}

async function importHandler() {
  return import('../../api/campaigns/[identifier]')
}

beforeEach(() => {
  createClientMock.mockReset()
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
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
        headers: { cookie: 'wjdr_auth_token=' + encodeURIComponent('token') },
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
      headers: { 'x-forwarded-for': '198.51.100.42' },
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
})
