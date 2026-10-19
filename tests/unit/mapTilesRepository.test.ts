import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: { auth } }))

const coords = { z: 3, x: 1, y: 2 }
const session = (token: string | null) => ({ data: { session: token ? { access_token: token } : null } })

async function load() {
  vi.resetModules()
  return import('../../src/services/mapTilesRepository')
}

describe('fetchMapTile', () => {
  beforeEach(() => {
    auth.getSession.mockReset()
    auth.refreshSession.mockReset()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co/')
    vi.stubGlobal('fetch', vi.fn())
  })

  it('throws MapTilesAuthError without a session and does not fetch', async () => {
    auth.getSession.mockResolvedValue(session(null))
    const { fetchMapTile, MapTilesAuthError } = await load()

    await expect(fetchMapTile(coords)).rejects.toBeInstanceOf(MapTilesAuthError)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('requests the authenticated storage URL with the bearer token', async () => {
    auth.getSession.mockResolvedValue(session('tok'))
    vi.mocked(fetch).mockResolvedValue(new Response('img'))
    const { fetchMapTile } = await load()

    await fetchMapTile(coords)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('https://example.supabase.co/storage/v1/object/authenticated/map-tiles/3/1/2.jpg')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('refreshes the session and retries once on 401', async () => {
    auth.getSession.mockResolvedValue(session('old'))
    auth.refreshSession.mockResolvedValue(session('new'))
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(new Response('img'))
    const { fetchMapTile } = await load()

    const response = await fetchMapTile(coords)

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((vi.mocked(fetch).mock.calls[1][1]?.headers as Record<string, string>).Authorization).toBe('Bearer new')
  })

  it('does not retry more than once when the retry also fails', async () => {
    auth.getSession.mockResolvedValue(session('old'))
    auth.refreshSession.mockResolvedValue(session('new'))
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 401 }))
    const { fetchMapTile } = await load()

    const response = await fetchMapTile(coords)

    expect(response.status).toBe(401)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('throws MapTilesAuthError when the refresh yields no session', async () => {
    auth.getSession.mockResolvedValue(session('old'))
    auth.refreshSession.mockResolvedValue(session(null))
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 403 }))
    const { fetchMapTile, MapTilesAuthError } = await load()

    await expect(fetchMapTile(coords)).rejects.toBeInstanceOf(MapTilesAuthError)
  })

  it('throws MapTilesAuthError when the refresh rejects', async () => {
    auth.getSession.mockResolvedValue(session('old'))
    auth.refreshSession.mockRejectedValue(new Error('network'))
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 401 }))
    const { fetchMapTile, MapTilesAuthError } = await load()

    await expect(fetchMapTile(coords)).rejects.toBeInstanceOf(MapTilesAuthError)
  })

  it('returns non-auth errors as-is without refreshing', async () => {
    auth.getSession.mockResolvedValue(session('tok'))
    vi.mocked(fetch).mockResolvedValue(new Response('', { status: 404 }))
    const { fetchMapTile } = await load()

    expect((await fetchMapTile(coords)).status).toBe(404)
    expect(auth.refreshSession).not.toHaveBeenCalled()
  })

  it('throws when the Supabase URL is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    const { fetchMapTile } = await load()

    await expect(fetchMapTile(coords)).rejects.toThrow('not configured')
  })
})
