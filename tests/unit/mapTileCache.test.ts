import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mapTileTable } from '../../src/db/mapTileDb'
import { createTileCache, TileRequestError, type TileCacheOptions } from '../../src/utils/mapTileCache'

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

const coords = { z: 3, x: 1, y: 2 }
const cacheUrl = 'https://map-tiles.invalid/v2/3/1/2'
const base = { version: 'v2', cachePrefix: 'p', maxEntries: 2 }

function build(overrides: Partial<TileCacheOptions> & Pick<TileCacheOptions, 'fetchTile'>) {
  return createTileCache({ ...base, table: mapTileTable, cacheStorage: null, ...overrides })
}

const okResponse = (body = 'net') => async () => new Response(new Blob([body], { type: 'image/jpeg' }))

beforeEach(async () => {
  await mapTileTable.clear()
})

describe('createTileCache.getTile with IndexedDB', () => {
  it('returns a stored tile without hitting the network', async () => {
    await mapTileTable.put({ key: 'v2/3/1/2', version: 'v2', blob: new Blob(['stored']), size: 6, lastAccess: Date.now() })
    const fetchTile = vi.fn(okResponse())

    const blob = await build({ fetchTile }).getTile(coords)

    expect(await blob.text()).toBe('stored')
    expect(fetchTile).not.toHaveBeenCalled()
  })

  it('fetches and persists on a miss', async () => {
    const fetchTile = vi.fn(okResponse('net'))
    const cache = build({ fetchTile })

    expect(await (await cache.getTile(coords)).text()).toBe('net')

    expect(await mapTileTable.get('v2/3/1/2')).toMatchObject({ version: 'v2', size: 3 })
    await cache.getTile(coords)
    expect(fetchTile).toHaveBeenCalledTimes(1)
  })

  it('shares one request between concurrent calls', async () => {
    const fetchTile = vi.fn(okResponse())
    const cache = build({ fetchTile })

    await Promise.all([cache.getTile(coords), cache.getTile(coords)])

    expect(fetchTile).toHaveBeenCalledTimes(1)
  })

  it('throws TileRequestError and stores nothing on a failed response', async () => {
    const cache = build({ fetchTile: async () => new Response('', { status: 404 }) })

    await expect(cache.getTile(coords)).rejects.toMatchObject({ name: 'TileRequestError', status: 404 })
    expect(await mapTileTable.count()).toBe(0)
  })

  it('does not cache an empty blob', async () => {
    const cache = build({ fetchTile: async () => new Response(new Blob([])) })

    await expect(cache.getTile(coords)).rejects.toBeInstanceOf(TileRequestError)
    expect(await mapTileTable.count()).toBe(0)
  })

  it('refetches when the stored record is empty', async () => {
    await mapTileTable.put({ key: 'v2/3/1/2', version: 'v2', blob: new Blob([]), size: 0, lastAccess: Date.now() })
    const fetchTile = vi.fn(okResponse())

    await build({ fetchTile }).getTile(coords)

    expect(fetchTile).toHaveBeenCalledTimes(1)
  })

  it('allows a retry after a failed request', async () => {
    const fetchTile = vi.fn().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(okResponse())
    const cache = build({ fetchTile })

    await expect(cache.getTile(coords)).rejects.toThrow('offline')
    expect(await (await cache.getTile(coords)).text()).toBe('net')
  })

  it('refreshes lastAccess only when stale', async () => {
    const now = 10_000_000
    await mapTileTable.put({ key: 'v2/3/1/2', version: 'v2', blob: new Blob(['s']), size: 1, lastAccess: 0 })

    await build({ fetchTile: okResponse(), now: () => now }).getTile(coords)

    await vi.waitFor(async () => expect((await mapTileTable.get('v2/3/1/2'))?.lastAccess).toBe(now))
  })

  it('evicts the least recently used tiles every trimEvery writes', async () => {
    const times = [1, 2, 3]
    let tick = 0
    const cache = build({ fetchTile: okResponse(), trimEvery: 3, now: () => times[Math.min(tick++, 2)] })

    await cache.getTile({ z: 2, x: 0, y: 0 })
    await cache.getTile({ z: 2, x: 0, y: 1 })
    await cache.getTile({ z: 2, x: 1, y: 0 })

    await vi.waitFor(async () => expect(await mapTileTable.count()).toBe(2))
    expect(await mapTileTable.get('v2/2/0/0')).toBeUndefined()
  })
})

describe('createTileCache with Cache API fallback', () => {
  it('reads from the Cache API when IndexedDB misses', async () => {
    const fetchTile = vi.fn(okResponse())
    const cache = build({ fetchTile, cacheStorage: fakeStorage(fakeCache({ [cacheUrl]: 'cached' })) })

    expect(await (await cache.getTile(coords)).text()).toBe('cached')
    expect(fetchTile).not.toHaveBeenCalled()
  })

  it('writes to the Cache API when there is no table', async () => {
    const backing = fakeCache()
    const cache = build({ fetchTile: okResponse(), table: null, cacheStorage: fakeStorage(backing) })

    await cache.getTile(coords)

    expect(backing.put).toHaveBeenCalledWith(cacheUrl, expect.any(Response))
  })

  it('falls back to the Cache API when the table write fails', async () => {
    const backing = fakeCache()
    const table = { get: vi.fn(async () => undefined), put: vi.fn().mockRejectedValue(new Error('quota')) }
    const cache = build({ fetchTile: okResponse(), table: table as unknown as TileCacheOptions['table'], cacheStorage: fakeStorage(backing) })

    await cache.getTile(coords)

    expect(backing.put).toHaveBeenCalledTimes(1)
  })

  it('still serves the network when opening the Cache API fails', async () => {
    const storage = { open: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as CacheStorage
    const cache = build({ fetchTile: okResponse(), table: null, cacheStorage: storage })

    expect(await (await cache.getTile(coords)).text()).toBe('net')
  })

  it('trims the oldest Cache API entries', async () => {
    const backing = fakeCache({ a: '1', b: '2' })
    const cache = build({ fetchTile: okResponse(), table: null, trimEvery: 1, cacheStorage: fakeStorage(backing) })

    await cache.getTile(coords)

    await vi.waitFor(() => expect(backing.delete).toHaveBeenCalledTimes(1))
    expect(backing.delete.mock.calls[0][0].url).toBe('a')
  })
})

describe('createTileCache negative cache', () => {
  it('does not refetch a 404 tile within the TTL', async () => {
    const fetchTile = vi.fn(async () => new Response('', { status: 404 }))
    const cache = build({ fetchTile, missingTtlMs: 1000, now: () => 100 })

    await expect(cache.getTile(coords)).rejects.toMatchObject({ status: 404 })
    await expect(cache.getTile(coords)).rejects.toMatchObject({ status: 404 })

    expect(fetchTile).toHaveBeenCalledTimes(1)
  })

  it('refetches a 404 tile after the TTL', async () => {
    let time = 0
    const fetchTile = vi.fn(async () => new Response('', { status: 404 }))
    const cache = build({ fetchTile, missingTtlMs: 1000, now: () => time })

    await expect(cache.getTile(coords)).rejects.toBeInstanceOf(TileRequestError)
    time = 1001
    await expect(cache.getTile(coords)).rejects.toBeInstanceOf(TileRequestError)

    expect(fetchTile).toHaveBeenCalledTimes(2)
  })

  it.each([401, 403, 500, 503])('does not negative-cache status %i', async (status) => {
    const fetchTile = vi.fn(async () => new Response('', { status }))
    const cache = build({ fetchTile, now: () => 100 })

    await expect(cache.getTile(coords)).rejects.toMatchObject({ status })
    await expect(cache.getTile(coords)).rejects.toMatchObject({ status })

    expect(fetchTile).toHaveBeenCalledTimes(2)
  })
})

it('rejects tiles known to be absent without any request or negative-cache entry', async () => {
  const fetchTile = vi.fn(okResponse())
  const isAvailable = vi.fn(() => false)
  const cache = build({ fetchTile, isAvailable })

  await expect(cache.getTile(coords)).rejects.toMatchObject({ status: 404 })

  expect(fetchTile).not.toHaveBeenCalled()
  isAvailable.mockReturnValue(true)
  expect(await (await cache.getTile(coords)).text()).toBe('net')
})

describe('createTileCache.has', () => {
  it('is false for a zero-size record', async () => {
    await mapTileTable.put({ key: 'v2/3/1/2', version: 'v2', blob: new Blob([]), size: 0, lastAccess: Date.now() })

    expect(await build({ fetchTile: okResponse() }).has(coords)).toBe(false)
  })

  it('is true for a stored tile and false otherwise', async () => {
    const cache = build({ fetchTile: okResponse() })
    expect(await cache.has(coords)).toBe(false)

    await cache.getTile(coords)

    expect(await cache.has(coords)).toBe(true)
  })

  it('checks the Cache API as a fallback', async () => {
    const cache = build({ fetchTile: okResponse(), cacheStorage: fakeStorage(fakeCache({ [cacheUrl]: 'x' })) })

    expect(await cache.has(coords)).toBe(true)
  })
})

describe('createTileCache.purgeOldVersions', () => {
  it('deletes tiles of other versions only', async () => {
    const record = (key: string, version: string) => ({ key, version, blob: new Blob(['x']), size: 1, lastAccess: 1 })
    await mapTileTable.bulkPut([record('v1/2/0/0', 'v1'), record('v2/2/0/0', 'v2')])

    await build({ fetchTile: okResponse() }).purgeOldVersions()

    expect(await mapTileTable.toCollection().primaryKeys()).toEqual(['v2/2/0/0'])
  })

  it('deletes only older caches sharing the prefix', async () => {
    const storage = fakeStorage(fakeCache(), ['p-v1', 'p-v2', 'other'])

    await build({ fetchTile: okResponse(), cacheStorage: storage }).purgeOldVersions()

    expect(storage.delete).toHaveBeenCalledTimes(1)
    expect(storage.delete).toHaveBeenCalledWith('p-v1')
  })

  it('is a no-op without any store', async () => {
    await expect(build({ fetchTile: okResponse(), table: null }).purgeOldVersions()).resolves.toBeUndefined()
  })
})
