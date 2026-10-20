import { getMapTileUrl } from '../config/map'
import { supabase } from '../db/supabase'
import type { TileCoords } from '../utils/mapTileCache'

const REFRESH_COOLDOWN_MS = 30_000

/** No session, or the session could not be refreshed. */
export class MapTilesAuthError extends Error {
  constructor() {
    super('Authentication required to load map tiles.')
    this.name = 'MapTilesAuthError'
  }
}

const apiKey = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined) ?? ''

let refreshing: Promise<string | null> | null = null
let lastRefreshAt = 0

async function currentToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Shared by concurrent tile requests; throttled so a persistent 403 does not hammer the auth API. */
function refreshToken(): Promise<string | null> {
  if (!refreshing) {
    if (Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
      return currentToken()
    }

    lastRefreshAt = Date.now()
    refreshing = supabase.auth
      .refreshSession()
      .then(({ data }) => data.session?.access_token ?? null)
      .catch(() => null)
      .finally(() => {
        refreshing = null
      })
  }

  return refreshing
}

function request(url: string, token: string): Promise<Response> {
  return fetch(url, { headers: { Authorization: `Bearer ${token}`, apikey: apiKey } })
}

/** Fetches one tile from the private bucket; retries once with a refreshed token on 401/403. */
export async function fetchMapTile(coords: TileCoords): Promise<Response> {
  const url = getMapTileUrl(coords.z, coords.x, coords.y)
  if (!url) {
    throw new Error('Supabase URL is not configured.')
  }

  const token = await currentToken()
  if (!token) {
    throw new MapTilesAuthError()
  }

  const response = await request(url, token)
  if (response.status !== 401 && response.status !== 403) {
    return response
  }

  const fresh = await refreshToken()
  if (!fresh) {
    throw new MapTilesAuthError()
  }

  return fresh === token ? response : request(url, fresh)
}
