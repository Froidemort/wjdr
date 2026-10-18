import { describe, expect, it, vi } from 'vitest'

import { createTileCache } from '../../src/utils/mapTileCache'

function fakeCache(initial: Record<string, string> = {}) {
  const store = new Map<string, Response>(Object.entries(initial).map(([k, v]) => [k, new Response(v)]))
  return {
    store,
    match: vi.fn(async (url: string) => store.get(url)?.clone()),
    put: vi.fn(async (url: string, response: Response) => {
      store.set(url, response)
    }),
    keys: vi.fn(async () => [...store.keys()].map((url) => ({ url }) as Request)),
    delete: vi.fn(async (request: Request) => store.delete(request.url)),
  }
}

function fakeStorage(cache: ReturnType<typeof fakeCache>, names: string[] = []) {
  return {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => names),
    delete: vi.fn(async () => true),
  } as unknown as CacheStorage
}

const options = { cacheName: 'p-v2', prefix: 'p-', maxEntries: 2 }

describe('createTileCache.getTile', () => {
  it('returns the cached tile without hitting the network', async () => {
    const cache = fakeCache({ 'u1': 'cached' })
    const fetchFn = vi.fn<typeof fetch>()
    const tile = createTileCache({ ...options, cacheStorage: fakeStorage(cache), fetchFn })

    expect(await (await tile.getTile('u1')).text()).toBe('cached')
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('fetches and stores on a miss', async () => {
    const cache = fakeCache()
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('net'))
    const tile = createTileCache({ ...options, cacheStorage: fakeStorage(cache), fetchFn })

    expect(await (await tile.getTile('u1')).text()).toBe('net')
    expect(cache.put).toHaveBeenCalledWith('u1', expect.any(Response))
  })

  it('throws and stores nothing on a failed response', async () => {
    const cache = fakeCache()
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('', { status: 404 }))
    const tile = createTileCache({ ...options, cacheStorage: fakeStorage(cache), fetchFn })

    await expect(tile.getTile('u1')).rejects.toThrow('404')
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('works without Cache API', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('net'))
    const tile = createTileCache({ ...options, cacheStorage: null, fetchFn })

    expect(await (await tile.getTile('u1')).text()).toBe('net')
  })

  it('falls back to the network when opening the cache fails', async () => {
    const storage = { open: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as CacheStorage
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('net'))
    const tile = createTileCache({ ...options, cacheStorage: storage, fetchFn })

    expect(await (await tile.getTile('u1')).text()).toBe('net')
  })

  it('trims the oldest entries every trimEvery writes', async () => {
    const cache = fakeCache({ a: '1', b: '2' })
    const fetchFn = vi.fn<typeof fetch>(async () => new Response('net'))
    const tile = createTileCache({ ...options, trimEvery: 1, cacheStorage: fakeStorage(cache), fetchFn })

    await tile.getTile('c')
    await vi.waitFor(() => expect(cache.delete).toHaveBeenCalledTimes(1))
    expect(cache.delete.mock.calls[0][0].url).toBe('a')
  })
})

describe('createTileCache.purgeOldVersions', () => {
  it('deletes only older caches sharing the prefix', async () => {
    const storage = fakeStorage(fakeCache(), ['p-v1', 'p-v2', 'other'])
    await createTileCache({ ...options, cacheStorage: storage }).purgeOldVersions()

    expect(storage.delete).toHaveBeenCalledTimes(1)
    expect(storage.delete).toHaveBeenCalledWith('p-v1')
  })

  it('is a no-op without Cache API', async () => {
    await expect(createTileCache({ ...options, cacheStorage: null }).purgeOldVersions()).resolves.toBeUndefined()
  })
})
