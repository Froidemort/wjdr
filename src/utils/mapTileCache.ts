import type { Table } from 'dexie'
import type { TileRecord } from '../db/mapTileDb'

export interface TileCoords {
  z: number
  x: number
  y: number
}

export class TileRequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Tile request failed (${status}).`)
    this.name = 'TileRequestError'
    this.status = status
  }
}

export interface TileCacheOptions {
  version: string
  maxEntries: number
  /** Cache API name is `${cachePrefix}-${version}`; other names with the prefix are purged. */
  cachePrefix: string
  fetchTile: (coords: TileCoords) => Promise<Response>
  /** Known-absent tiles are rejected as 404 without any request or negative-cache entry. */
  isAvailable?: (coords: TileCoords) => boolean
  /** Primary store (IndexedDB); null or failing falls back to the Cache API. */
  table?: Table<TileRecord, string> | null
  cacheStorage?: CacheStorage | null
  /** Trim is amortised: it runs every `trimEvery` writes. */
  trimEvery?: number
  /** lastAccess is only rewritten when older than this, to avoid a write per read. */
  touchAfterMs?: number
  /** Session-level memory of 400/404 tiles so they are not re-requested; defaults to 5 min. */
  missingTtlMs?: number
  now?: () => number
}

export interface TileCache {
  /** Cache-first; a tile is downloaded at most once per version, concurrent calls share one request. */
  getTile(coords: TileCoords): Promise<Blob>
  has(coords: TileCoords): Promise<boolean>
  purgeOldVersions(): Promise<void>
}

let persistRequested = false

/** Best effort, once per page load: asks the browser not to evict the tile store. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (persistRequested || typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false
  }

  persistRequested = true
  try {
    return (await navigator.storage.persisted?.()) || (await navigator.storage.persist())
  } catch {
    return false
  }
}

export function createTileCache(options: TileCacheOptions): TileCache {
  const { version, maxEntries, cachePrefix, fetchTile } = options
  const table = options.table ?? null
  const trimEvery = options.trimEvery ?? 50
  const touchAfterMs = options.touchAfterMs ?? 60 * 60 * 1000
  const now = options.now ?? (() => Date.now())
  const missingTtlMs = options.missingTtlMs ?? 5 * 60 * 1000
  const missing = new Map<string, { status: number; until: number }>()
  const storage = options.cacheStorage === undefined ? (typeof caches === 'undefined' ? null : caches) : options.cacheStorage
  const cacheName = `${cachePrefix}-${version}`
  const inflight = new Map<string, Promise<Blob>>()
  let writesSinceTrim = 0

  const keyOf = (coords: TileCoords): string => `${version}/${coords.z}/${coords.x}/${coords.y}`
  const cacheUrlOf = (key: string): string => `https://map-tiles.invalid/${key}`

  async function attempt<T>(operation: () => Promise<T>): Promise<T | undefined> {
    try {
      return await operation()
    } catch {
      return undefined
    }
  }

  const openCache = (): Promise<Cache | undefined> => (storage ? attempt(() => storage.open(cacheName)) : Promise.resolve(undefined))

  async function read(key: string): Promise<Blob | null> {
    if (table) {
      const record = await attempt(() => table.get(key))
      if (record && record.size > 0) {
        if (now() - record.lastAccess > touchAfterMs) {
          void attempt(() => table.update(key, { lastAccess: now() }))
        }
        return record.blob
      }
    }

    const cache = await openCache()
    const hit = cache ? await attempt(() => cache.match(cacheUrlOf(key))) : undefined
    return hit ? hit.blob() : null
  }

  async function trim(): Promise<void> {
    if (table) {
      await attempt(async () => {
        const overflow = (await table.count()) - maxEntries
        if (overflow > 0) {
          await table.bulkDelete(await table.orderBy('lastAccess').limit(overflow).primaryKeys())
        }
      })
    }

    const cache = await openCache()
    if (cache) {
      await attempt(async () => {
        const keys = await cache.keys()
        // Cache.keys() returns entries in insertion order, so the oldest go first.
        for (const request of keys.slice(0, Math.max(0, keys.length - maxEntries))) {
          await cache.delete(request)
        }
      })
    }
  }

  async function write(key: string, blob: Blob): Promise<void> {
    const stored = table
      ? await attempt(async () => {
          await table.put({ key, version, blob, size: blob.size, lastAccess: now() })
          return true
        })
      : undefined

    if (!stored) {
      const cache = await openCache()
      if (cache) {
        await attempt(() => cache.put(cacheUrlOf(key), new Response(blob, { headers: { 'Content-Type': blob.type } })))
      }
    }

    writesSinceTrim += 1
    if (writesSinceTrim >= trimEvery) {
      writesSinceTrim = 0
      void trim()
    }
  }

  async function load(coords: TileCoords): Promise<Blob> {
    const key = keyOf(coords)
    const cached = await read(key)
    if (cached) {
      return cached
    }

    if (options.isAvailable && !options.isAvailable(coords)) {
      throw new TileRequestError(404)
    }

    const known = missing.get(key)
    if (known) {
      if (known.until > now()) {
        throw new TileRequestError(known.status)
      }
      missing.delete(key)
    }

    const response = await fetchTile(coords)
    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        missing.set(key, { status: response.status, until: now() + missingTtlMs })
      }
      throw new TileRequestError(response.status)
    }

    const blob = await response.blob()
    if (blob.size === 0) {
      throw new TileRequestError(204)
    }

    await write(key, blob)
    return blob
  }

  function getTile(coords: TileCoords): Promise<Blob> {
    const key = keyOf(coords)
    const pending = inflight.get(key)
    if (pending) {
      return pending
    }

    const request = load(coords).finally(() => inflight.delete(key))
    inflight.set(key, request)
    return request
  }

  async function has(coords: TileCoords): Promise<boolean> {
    const key = keyOf(coords)
    if (table) {
      const record = await attempt(() => table.get(key))
      if (record && record.size > 0) {
        return true
      }
    }

    const cache = await openCache()
    return cache ? Boolean(await attempt(() => cache.match(cacheUrlOf(key)))) : false
  }

  async function purgeOldVersions(): Promise<void> {
    if (table) {
      await attempt(() => table.where('version').notEqual(version).delete())
    }

    if (storage) {
      const names = (await attempt(() => storage.keys())) ?? []
      await Promise.all(names.filter((name) => name.startsWith(cachePrefix) && name !== cacheName).map((name) => attempt(() => storage.delete(name))))
    }
  }

  return { getTile, has, purgeOldVersions }
}
