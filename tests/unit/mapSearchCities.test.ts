import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/services/mapRepository', () => ({}))

import { useMapStore } from '../../src/stores/map'

const rows = JSON.parse(readFileSync('public/data/cities.json', 'utf8')) as Array<{ id: number; name: string }>
const altdorf = rows.find((row) => row.name === 'Altdorf')
const withNulls = rows.filter((row) => Object.values(row).includes(null)).slice(0, 5)

describe('map search over real cities rows', () => {
  beforeEach(() => {
    vi.resetModules()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json([altdorf, ...withNulls])))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('finds Altdorf through the store after loadCities', async () => {
    const store = useMapStore()
    await store.loadCities()
    store.query = 'Altdorf'

    expect(store.error).toBeNull()
    expect(store.searchResults.map((result) => result.name)).toContain('Altdorf')
  })

  it('keeps rows with null fields', async () => {
    const store = useMapStore()
    await store.loadCities()

    expect(store.cities).toHaveLength(1 + withNulls.length)
  })
})
