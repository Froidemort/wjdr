import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const valid = { id: 1, name: 'Altdorf', lat: 10, lng: 20, hidden: false }

async function load() {
  vi.resetModules()
  return import('../../src/services/citiesRepository')
}

describe('listCities', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('drops hidden towns and malformed rows', async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json([valid, { ...valid, id: 2, hidden: true }, { id: 3, name: 'NoCoords' }, null, { ...valid, id: 'x' }])
    )
    const { listCities } = await load()

    expect((await listCities()).map((c) => c.id)).toEqual([1])
  })

  it('returns an empty list when the payload is not an array', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ cities: [] }))
    const { listCities } = await load()

    expect(await listCities()).toEqual([])
  })

  it('fetches once and shares the result', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json([valid]))
    const { listCities } = await load()

    await Promise.all([listCities(), listCities()])
    await listCities()

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/data/cities.json')
  })

  it('rejects on an HTTP error and retries on the next call', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 500 })).mockResolvedValueOnce(Response.json([valid]))
    const { listCities } = await load()

    await expect(listCities()).rejects.toThrow('500')
    expect(await listCities()).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('retries after a network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(Response.json([valid]))
    const { listCities } = await load()

    await expect(listCities()).rejects.toThrow('offline')
    expect(await listCities()).toHaveLength(1)
  })

  it('accepts the real public/data/cities.json and only drops hidden towns', async () => {
    const raw = JSON.parse(readFileSync('public/data/cities.json', 'utf8')) as Array<{ hidden: boolean }>
    vi.mocked(fetch).mockResolvedValue(Response.json(raw))
    const { listCities } = await load()

    const cities = await listCities()

    expect(cities).toHaveLength(raw.filter((row) => !row.hidden).length)
    expect(cities.length).toBeGreaterThan(100)
  })
})
