export interface TileCacheOptions {
  cacheName: string
  prefix: string
  maxEntries: number
  /** Trim is amortised: it runs every `trimEvery` writes. */
  trimEvery?: number
  cacheStorage?: CacheStorage | null
  fetchFn?: typeof fetch
}

export interface TileCache {
  /** Cache-first lookup; falls back to the network and stores successful responses. */
  getTile(url: string): Promise<Blob>
  /** Deletes caches of older versions that share the prefix. */
  purgeOldVersions(): Promise<void>
}

export function createTileCache(options: TileCacheOptions): TileCache {
  const { cacheName, prefix, maxEntries } = options
  const trimEvery = options.trimEvery ?? 50
  const storage = options.cacheStorage === undefined ? (typeof caches === 'undefined' ? null : caches) : options.cacheStorage
  const fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init))
  let writesSinceTrim = 0

  async function trim(cache: Cache): Promise<void> {
    const keys = await cache.keys()
    // Cache.keys() returns entries in insertion order, so the oldest go first.
    const overflow = keys.length - maxEntries
    for (let index = 0; index < overflow; index += 1) {
      await cache.delete(keys[index])
    }
  }

  async function getTile(url: string): Promise<Blob> {
    const cache = storage ? await storage.open(cacheName).catch(() => null) : null

    if (cache) {
      const hit = await cache.match(url)
      if (hit) {
        return hit.blob()
      }
    }

    const response = await fetchFn(url, { mode: 'cors' })
    if (!response.ok) {
      throw new Error(`Tile request failed (${response.status}).`)
    }

    if (cache) {
      await cache.put(url, response.clone()).catch(() => undefined)
      writesSinceTrim += 1
      if (writesSinceTrim >= trimEvery) {
        writesSinceTrim = 0
        void trim(cache).catch(() => undefined)
      }
    }

    return response.blob()
  }

  async function purgeOldVersions(): Promise<void> {
    if (!storage) {
      return
    }

    const names = await storage.keys()
    await Promise.all(names.filter((name) => name.startsWith(prefix) && name !== cacheName).map((name) => storage.delete(name)))
  }

  return { getTile, purgeOldVersions }
}
