import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { City } from '../../src/types/cities'

const repo = vi.hoisted(() => ({ listCities: vi.fn() }))

vi.mock('../../src/services/citiesRepository', () => repo)
vi.mock('../../src/services/mapRepository', () => ({}))

import { useMapStore } from '../../src/stores/map'

const city = { id: 1, name: 'Altdorf', lat: 1, lng: 2 } as City

describe('map store cities', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    repo.listCities.mockReset()
  })

  it('loads cities into the store', async () => {
    repo.listCities.mockResolvedValue([city])
    const store = useMapStore()

    await store.loadCities()

    expect(store.cities).toEqual([city])
  })

  it('does not refetch once cities are loaded', async () => {
    repo.listCities.mockResolvedValue([city])
    const store = useMapStore()

    await store.loadCities()
    await store.loadCities()

    expect(repo.listCities).toHaveBeenCalledTimes(1)
  })

  it('exposes an error and allows a retry when loading fails', async () => {
    repo.listCities.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce([city])
    const store = useMapStore()

    await store.loadCities()
    expect(store.error).toContain('Impossible de charger la carte')
    expect(store.cities).toEqual([])

    await store.loadCities()
    expect(store.cities).toEqual([city])
  })

  it('shows cities by default and can be toggled off', () => {
    const store = useMapStore()
    expect(store.showCities).toBe(true)

    store.showCities = false

    expect(store.showCities).toBe(false)
  })
})
