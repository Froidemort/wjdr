import { isUuidLike } from '../utils/validation'

export type CampaignCodeLookup = {
  id: string
  mjId: string
  isArchived: boolean
} | null

export type CampaignCodeResolutionStatus = 200 | 302 | 404 | 429

export interface CampaignCodeResolutionResult {
  status: CampaignCodeResolutionStatus
  location?: string
  message?: string
}

export interface CampaignCodeResolutionContext {
  identifier: string
  request: Request
  findCampaignByCode: (code: string) => Promise<CampaignCodeLookup>
  resolveUserId: (request: Request) => Promise<string | null>
  rateLimiter?: RateLimiter
}

export interface RateLimiter {
  consume: (ip: string) => boolean
}


const CODE_PATTERN = /^[A-Z0-9]{6}$/i


export function isCampaignCodeIdentifier(identifier: string): boolean {
  return CODE_PATTERN.test(identifier.trim())
}

export function normalizeCampaignCode(identifier: string): string {
  return identifier.trim().toUpperCase()
}

export function createInMemoryRateLimiter(limit: number, windowMs: number): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>()

  return {
    consume(ip: string): boolean {
      const now = Date.now()
      const current = buckets.get(ip)
      if (!current || current.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs })
        return true
      }

      if (current.count >= limit) {
        return false
      }

      current.count += 1
      return true
    },
  }
}

  const rateLimiter = context.rateLimiter
  const clientIp = getClientIp(context.request)
  if (rateLimiter && clientIp !== 'unknown' && !rateLimiter.consume(clientIp)) {
    return { status: 429, message: 'Trop de requetes.' }
  }
  const campaign = await context.findCampaignByCode(normalizeCampaignCode(identifier))
  if (!campaign) {
    return { status: 404, message: 'Campagne introuvable.' }
  }

  if (!campaign.isArchived) {
    return { status: 302, location: `/campaigns/${campaign.id}` }
  }

  const userId = await context.resolveUserId(context.request)
  if (userId && userId === campaign.mjId) {
    return { status: 302, location: `/campaigns/${campaign.id}` }
  }

  return { status: 404, message: 'Campagne introuvable.' }
}
