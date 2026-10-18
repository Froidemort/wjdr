import { createClient } from '@supabase/supabase-js'
import {
  createInMemoryRateLimiter,
  resolveCampaignCodeRedirect,
} from '../../src/server/campaignCodeRedirect'

const rateLimiter = createInMemoryRateLimiter(10, 60_000)

function getRequiredEnv(value: string | undefined, variableName: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${variableName}`)
  }

  return value
}

function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin
}

function getAuthToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')?.trim()
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim() || null
  }

  return null
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const url = new URL(request.url)
  const identifier = url.pathname.split('/').filter(Boolean).at(-1) ?? ''

  const supabaseUrl = getRequiredEnv(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    'SUPABASE_URL'
  )
  const publicKey = getRequiredEnv(
    process.env.SUPABASE_ANON_KEY ??
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env.VITE_SUPABASE_ANON_KEY,
    'SUPABASE_ANON_KEY'
  )

  const supabase = createClient(supabaseUrl, publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const resolution = await resolveCampaignCodeRedirect({
    identifier,
    request,
    rateLimiter,
    findCampaignByCode: async (code) => {
      const { data, error } = await supabase.rpc('resolve_campaign_code', { code })

      if (error) {
        throw error
      }

      const row = (data as { id: string; mj_id: string; is_archived: boolean }[] | null)?.[0]
      return row
        ? { id: row.id, mjId: row.mj_id, isArchived: Boolean(row.is_archived) }
        : null
    },
    resolveUserId: async (incomingRequest) => {
      const token = getAuthToken(incomingRequest)
      if (!token) {
        return null
      }

      const { data, error } = await supabase.auth.getUser(token)
      if (error) {
        return null
      }

      return data.user?.id ?? null
    },
  })

  if (resolution.status === 200) {
    return new Response(null, { status: 200 })
  }

  if (resolution.status === 302 && resolution.location) {
    return Response.redirect(new URL(resolution.location, getRequestOrigin(request)), 302)
  }

  return new Response(resolution.message ?? 'Not Found', { status: resolution.status })
}
