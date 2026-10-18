import { isUuidLike } from '../utils/validation'

type CampaignCodeLookup = {
  id: string
  mjId: string
  isArchived: boolean
} | null

type CampaignCodeResolutionStatus = 200 | 302 | 404 | 429

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

export function isUuidIdentifier(identifier: string): boolean {
  return isUuidLike(identifier.trim())
}


export function isCampaignCodeIdentifier(identifier: string): boolean {
  return CODE_PATTERN.test(identifier.trim())
}

export function normalizeCampaignCode(identifier: string): string {
  return identifier.trim().toUpperCase()
}

/**
 * Best-effort limiter: state lives in a single function instance and is lost on
 * cold start, so it only slows bursts. Real protection needs a shared store or WAF.
 */
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

// Vercel overwrites x-vercel-forwarded-for, so unlike x-forwarded-for it cannot be spoofed by clients.
function getClientIp(request: Request): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  return vercelIp || 'unknown'
}

export async function resolveCampaignCodeRedirect(
  context: CampaignCodeResolutionContext
): Promise<CampaignCodeResolutionResult> {
  const identifier = context.identifier.trim()
  if (isUuidIdentifier(identifier)) {
    return { status: 200 }
  }

  if (!isCampaignCodeIdentifier(identifier)) {
    return { status: 404, message: 'Campagne introuvable.' }
  }

  const rateLimiter = context.rateLimiter
  // Unknown IPs share one bucket instead of bypassing the limiter.
  if (rateLimiter && !rateLimiter.consume(getClientIp(context.request))) {
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
