import { describe, expect, it, vi } from 'vitest'
import {
  createInMemoryRateLimiter,
  isCampaignCodeIdentifier,
  isUuidIdentifier,
  normalizeCampaignCode,
  resolveCampaignCodeRedirect,
} from '../../src/server/campaignCodeRedirect'

describe('campaign code redirect helpers', () => {
  it('detects uuid and campaign code identifiers', () => {
    expect(isUuidIdentifier('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isCampaignCodeIdentifier('AB12CD')).toBe(true)
    expect(isCampaignCodeIdentifier('ABC')).toBe(false)
  })

  it('normalizes campaign codes to uppercase', () => {
    expect(normalizeCampaignCode('ab12cd')).toBe('AB12CD')
  })
})

describe('resolveCampaignCodeRedirect', () => {
  it('returns 200 for uuid identifiers', async () => {
    const result = await resolveCampaignCodeRedirect({
      identifier: '550e8400-e29b-41d4-a716-446655440000',
      request: new Request('https://example.test/campaigns/550e8400-e29b-41d4-a716-446655440000'),
      findCampaignByCode: vi.fn(),
      resolveUserId: vi.fn(),
    })

    expect(result).toEqual({ status: 200 })
  })

  it('returns 302 for an active campaign code', async () => {
    const result = await resolveCampaignCodeRedirect({
      identifier: 'AB12CD',
      request: new Request('https://example.test/campaigns/AB12CD'),
      findCampaignByCode: vi.fn().mockResolvedValue({
        id: 'campaign-uuid',
        mjId: 'mj-1',
        isArchived: false,
      }),
      resolveUserId: vi.fn(),
      rateLimiter: createInMemoryRateLimiter(10, 60_000),
    })

    expect(result).toEqual({ status: 302, location: '/campaigns/campaign-uuid' })
  })

  it('returns 404 for an archived campaign when no MJ identity is available', async () => {
    const result = await resolveCampaignCodeRedirect({
      identifier: 'AB12CD',
      request: new Request('https://example.test/campaigns/AB12CD'),
      findCampaignByCode: vi.fn().mockResolvedValue({
        id: 'campaign-uuid',
        mjId: 'mj-1',
        isArchived: true,
      }),
      resolveUserId: vi.fn().mockResolvedValue(null),
      rateLimiter: createInMemoryRateLimiter(10, 60_000),
    })

    expect(result.status).toBe(404)
  })

  it('returns 302 for an archived campaign when the requester is the MJ', async () => {
    const result = await resolveCampaignCodeRedirect({
      identifier: 'AB12CD',
      request: new Request('https://example.test/campaigns/AB12CD'),
      findCampaignByCode: vi.fn().mockResolvedValue({
        id: 'campaign-uuid',
        mjId: 'mj-1',
        isArchived: true,
      }),
      resolveUserId: vi.fn().mockResolvedValue('mj-1'),
      rateLimiter: createInMemoryRateLimiter(10, 60_000),
    })

    expect(result).toEqual({ status: 302, location: '/campaigns/campaign-uuid' })
  })

  it('returns 429 when the rate limit is exhausted', async () => {
    const rateLimiter = createInMemoryRateLimiter(1, 60_000)
    expect(rateLimiter.consume('203.0.113.10')).toBe(true)

    const result = await resolveCampaignCodeRedirect({
      identifier: 'AB12CD',
      request: new Request('https://example.test/campaigns/AB12CD', {
        headers: {
          'x-forwarded-for': '203.0.113.10',
        },
      }),
      findCampaignByCode: vi.fn(),
      resolveUserId: vi.fn(),
      rateLimiter,
    })

    expect(result.status).toBe(429)
  })
})
