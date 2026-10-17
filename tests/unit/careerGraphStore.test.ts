import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { listAllCareersMock, listAllCareerPathsMock } = vi.hoisted(() => ({
  listAllCareersMock: vi.fn(),
  listAllCareerPathsMock: vi.fn(),
}))

vi.mock('../../src/services/careersRepository', () => ({
  listAllCareers: listAllCareersMock,
  listAllCareerPaths: listAllCareerPathsMock,
}))

import { useCareerGraphStore } from '../../src/stores/careerGraph'

const careers = [{ id: 'a', name: 'Agitateur' }]
const paths = [{ from_career_id: 'a', to_career_id: 'b' }]

describe('careerGraph store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    listAllCareersMock.mockReset().mockResolvedValue(careers)
    listAllCareerPathsMock.mockReset().mockResolvedValue(paths)
  })

  it('loads careers and paths', async () => {
    const store = useCareerGraphStore()

    await store.load()

    expect(store.careers).toEqual(careers)
    expect(store.paths).toEqual(paths)
    expect(store.loaded).toBe(true)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('does not reload once loaded', async () => {
    const store = useCareerGraphStore()

    await store.load()
    await store.load()

    expect(listAllCareersMock).toHaveBeenCalledTimes(1)
    expect(listAllCareerPathsMock).toHaveBeenCalledTimes(1)
  })

  it('dedupes concurrent loads', async () => {
    const store = useCareerGraphStore()

    await Promise.all([store.load(), store.load()])

    expect(listAllCareersMock).toHaveBeenCalledTimes(1)
    expect(listAllCareerPathsMock).toHaveBeenCalledTimes(1)
  })

  it('sets an error message when loading fails', async () => {
    listAllCareersMock.mockRejectedValue(new Error('boom'))
    const store = useCareerGraphStore()

    await store.load()

    expect(store.error).toBe('Impossible de charger les carrières. Réessaie dans un instant.')
    expect(store.loaded).toBe(false)
    expect(store.loading).toBe(false)
  })

  it('forces a reload with load(true)', async () => {
    const store = useCareerGraphStore()

    await store.load()
    await store.load(true)

    expect(listAllCareersMock).toHaveBeenCalledTimes(2)
  })
})
