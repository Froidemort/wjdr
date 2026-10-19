import { effectScope } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class MapTilesAuthError extends Error {}
  return { MapTilesAuthError, cache: { has: vi.fn(), getTile: vi.fn() } }
})

vi.mock('../../src/services/mapTilesRepository', () => ({ MapTilesAuthError: mocks.MapTilesAuthError }))
vi.mock('../../src/composables/useMapTileCache', () => ({ useMapTileCache: () => mocks.cache }))

import { MAP_PREFETCH_CONCURRENCY } from '../../src/config/map'
import { TileRequestError } from '../../src/utils/mapTileCache'
import { useMapTilePrefetch } from '../../src/composables/useMapTilePrefetch'

// z2..5 pyramid
const TOTAL = 16 + 64 + 256 + 1024

function setup() {
  return effectScope().run(() => useMapTilePrefetch())!
}

describe('useMapTilePrefetch', () => {
  beforeEach(() => {
    mocks.cache.has.mockReset().mockResolvedValue(false)
    mocks.cache.getTile.mockReset().mockResolvedValue(new Blob(['x']))
  })

  it('downloads every missing tile and reports completion', async () => {
    const { state, start } = setup()

    await start()

    expect(mocks.cache.getTile).toHaveBeenCalledTimes(TOTAL)
    expect(state.value).toMatchObject({ running: false, done: TOTAL, total: TOTAL, failed: 0, message: 'Carte préchargée.' })
  })

  it('skips tiles that are already cached', async () => {
    mocks.cache.has.mockImplementation(async ({ z }: { z: number }) => z < 5)
    const { state, start } = setup()

    await start()

    expect(mocks.cache.getTile).toHaveBeenCalledTimes(1024)
    expect(state.value.done).toBe(TOTAL)
  })

  it('counts failed tiles and asks to retry', async () => {
    mocks.cache.getTile.mockImplementation(async ({ z, x, y }: { z: number; x: number; y: number }) => {
      if (z === 2 && x === 0 && y === 0) throw new Error('boom')
      return new Blob(['x'])
    })
    const { state, start } = setup()

    await start()

    expect(state.value.failed).toBe(1)
    expect(state.value.done).toBe(TOTAL)
    expect(state.value.message).toContain('1 tuile(s)')
  })

  it('stops on an auth failure and asks to sign in', async () => {
    mocks.cache.getTile.mockRejectedValue(new mocks.MapTilesAuthError())
    const { state, start } = setup()

    await start()

    expect(state.value.running).toBe(false)
    expect(state.value.done).toBeLessThan(TOTAL)
    expect(mocks.cache.getTile.mock.calls.length).toBeLessThan(TOTAL)
    expect(state.value.message).toBe('Connecte-toi pour précharger la carte.')
  })

  it('stops when cancelled', async () => {
    const holder: { cancel?: () => void } = {}
    mocks.cache.has.mockImplementation(async () => {
      holder.cancel?.()
      return false
    })
    const prefetch = setup()
    holder.cancel = prefetch.cancel

    await prefetch.start()

    expect(prefetch.state.value.done).toBeLessThan(TOTAL)
    expect(prefetch.state.value.message).toBe('Préchargement annulé.')
  })

  it('ignores start while already running', async () => {
    const { start } = setup()

    await Promise.all([start(), start()])

    expect(mocks.cache.getTile).toHaveBeenCalledTimes(TOTAL)
  })

  it('aborts after 5 consecutive failures', async () => {
    mocks.cache.getTile.mockRejectedValue(new Error('boom'))
    const { state, start } = setup()

    await start()

    expect(state.value.running).toBe(false)
    expect(state.value.failed).toBeGreaterThanOrEqual(5)
    expect(mocks.cache.getTile.mock.calls.length).toBeLessThan(5 + MAP_PREFETCH_CONCURRENCY)
    expect(state.value.message).toContain('interrompu')
  })

  it('does not abort on non-consecutive failures', async () => {
    let calls = 0
    mocks.cache.getTile.mockImplementation(async () => {
      calls += 1
      if (calls % 2 === 0) throw new Error('boom')
      return new Blob(['x'])
    })
    const { state, start } = setup()

    await start()

    expect(mocks.cache.getTile).toHaveBeenCalledTimes(TOTAL)
    expect(state.value.message).not.toContain('interrompu')
  })

  it.each([
    ['429', () => new TileRequestError(429)],
    ['500', () => new TileRequestError(500)],
    ['503', () => new TileRequestError(503)],
    ['TypeError', () => new TypeError('Failed to fetch')],
  ])('aborts immediately on %s', async (_label, makeError) => {
    mocks.cache.getTile.mockRejectedValue(makeError())
    const { state, start } = setup()

    await start()

    expect(mocks.cache.getTile.mock.calls.length).toBeLessThanOrEqual(MAP_PREFETCH_CONCURRENCY)
    expect(state.value.message).toContain('interrompu')
  })

  it('leaves no old workers after cancel then start', async () => {
    const releases: Array<() => void> = []
    mocks.cache.getTile.mockImplementationOnce(() => new Promise<Blob>((resolve) => releases.push(() => resolve(new Blob(['x'])))))
    for (let i = 1; i < MAP_PREFETCH_CONCURRENCY; i += 1) {
      mocks.cache.getTile.mockImplementationOnce(() => new Promise<Blob>((resolve) => releases.push(() => resolve(new Blob(['x'])))))
    }
    const { state, start, cancel } = setup()

    const first = start()
    await vi.waitFor(() => expect(releases).toHaveLength(MAP_PREFETCH_CONCURRENCY))
    cancel()
    const second = start()
    releases.forEach((release) => release())
    await Promise.all([first, second])

    expect(mocks.cache.getTile).toHaveBeenCalledTimes(MAP_PREFETCH_CONCURRENCY + TOTAL)
    expect(state.value).toMatchObject({ running: false, done: TOTAL, message: 'Carte préchargée.' })
  })
})
