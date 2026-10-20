import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { fetchSpells } = vi.hoisted(() => ({ fetchSpells: vi.fn() }))

vi.mock('../../src/services/compendiumRepository', () => ({
  fetchCompendiumSpells: fetchSpells,
}))

import { useCompendiumSpellsStore } from '../../src/stores/compendiumSpells'

describe('compendiumSpells store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchSpells.mockReset()
  })

  it('fetches once and exposes loading state while pending', async () => {
    let resolve: (rows: unknown[]) => void = () => {}
    fetchSpells.mockReturnValue(new Promise((done) => { resolve = done }))
    const store = useCompendiumSpellsStore()

    const request = store.loadSpells()
    expect(store.loading).toBe(true)

    resolve([{ id: '1' }])
    await request
    await store.loadSpells()

    expect(fetchSpells).toHaveBeenCalledTimes(1)
    expect(store.spells).toEqual([{ id: '1' }])
    expect(store.loading).toBe(false)
    expect(store.loaded).toBe(true)
  })

  it('shares an in-flight request between concurrent callers', async () => {
    fetchSpells.mockResolvedValue([])
    const store = useCompendiumSpellsStore()

    await Promise.all([store.loadSpells(), store.loadSpells()])

    expect(fetchSpells).toHaveBeenCalledTimes(1)
  })

  it('records an error and recovers on forced retry', async () => {
    fetchSpells.mockRejectedValueOnce(new Error('network'))
    const store = useCompendiumSpellsStore()

    await store.loadSpells()
    expect(store.error).not.toBeNull()
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)

    fetchSpells.mockResolvedValueOnce([{ id: '2' }])
    await store.loadSpells(true)

    expect(store.error).toBeNull()
    expect(store.spells).toEqual([{ id: '2' }])
  })

  it('reuses the in-flight request when forced while pending', async () => {
    fetchSpells.mockResolvedValue([])
    const store = useCompendiumSpellsStore()

    await Promise.all([store.loadSpells(), store.loadSpells(true)])

    expect(fetchSpells).toHaveBeenCalledTimes(1)
  })

  it('refetches when forced even if already loaded', async () => {
    fetchSpells.mockResolvedValue([])
    const store = useCompendiumSpellsStore()

    await store.loadSpells()
    await store.loadSpells(true)

    expect(fetchSpells).toHaveBeenCalledTimes(2)
  })
})
