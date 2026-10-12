import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { fetchWeapons, fetchArmors, fetchItems } = vi.hoisted(() => ({
  fetchWeapons: vi.fn(),
  fetchArmors: vi.fn(),
  fetchItems: vi.fn(),
}))

vi.mock('../../src/services/compendiumRepository', () => ({
  fetchCompendiumWeapons: fetchWeapons,
  fetchCompendiumArmors: fetchArmors,
  fetchCompendiumItems: fetchItems,
}))

import { useCompendiumInventoryStore } from '../../src/stores/compendiumInventory'

describe('compendiumInventory store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchWeapons.mockReset()
    fetchArmors.mockReset()
    fetchItems.mockReset()
  })

  it('loads once and skips refetch when already loaded', async () => {
    fetchWeapons.mockResolvedValue([{ id: 'w1' }])
    const store = useCompendiumInventoryStore()

    await store.loadWeapons()
    await store.loadWeapons()

    expect(fetchWeapons).toHaveBeenCalledTimes(1)
    expect(store.weapons).toEqual([{ id: 'w1' }])
    expect(store.loaded.weapons).toBe(true)
  })

  it('shares an in-flight request between concurrent callers', async () => {
    fetchArmors.mockResolvedValue([])
    const store = useCompendiumInventoryStore()

    await Promise.all([store.loadArmors(), store.loadArmors()])

    expect(fetchArmors).toHaveBeenCalledTimes(1)
  })

  it('records an error and allows retry with force', async () => {
    fetchItems.mockRejectedValueOnce(new Error('network'))
    const store = useCompendiumInventoryStore()

    await store.loadTab('items')
    expect(store.errors.items).not.toBeNull()
    expect(store.loaded.items).toBe(false)

    fetchItems.mockResolvedValueOnce([{ id: 'i1' }])
    await store.loadTab('items', true)

    expect(store.errors.items).toBeNull()
    expect(store.items).toEqual([{ id: 'i1' }])
    expect(store.loading.items).toBe(false)
  })
})
