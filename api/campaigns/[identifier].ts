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
  const serviceRoleKey = getRequiredEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    'SUPABASE_SERVICE_ROLE_KEY'
  )

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
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
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, mj_id, is_archived')
        .eq('code', code)
        .maybeSingle()

      if (error) {
        throw error
      }

      return data
        ? {
            id: data.id as string,
            mjId: data.mj_id as string,
            isArchived: Boolean(data.is_archived),
          }
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
