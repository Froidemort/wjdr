import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { fetchSkills, fetchTalents } = vi.hoisted(() => ({
  fetchSkills: vi.fn(),
  fetchTalents: vi.fn(),
}))

vi.mock('../../src/services/compendiumRepository', () => ({
  fetchCompendiumSkills: fetchSkills,
  fetchCompendiumTalents: fetchTalents,
}))

import { useCompendiumSkillsTalentsStore } from '../../src/stores/compendiumSkillsTalents'

describe('compendiumSkillsTalents store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    fetchSkills.mockReset()
    fetchTalents.mockReset()
  })

  it('fetches once and exposes loading state while pending', async () => {
    let resolve: (rows: unknown[]) => void = () => {}
    fetchSkills.mockReturnValue(new Promise((done) => { resolve = done }))
    const store = useCompendiumSkillsTalentsStore()

    const request = store.loadSkills()
    expect(store.loading.skills).toBe(true)

    resolve([{ id: 's1' }])
    await request
    await store.loadSkills()

    expect(fetchSkills).toHaveBeenCalledTimes(1)
    expect(store.skills).toEqual([{ id: 's1' }])
    expect(store.loading.skills).toBe(false)
    expect(store.loaded.skills).toBe(true)
  })

  it('shares an in-flight request between concurrent callers', async () => {
    fetchTalents.mockResolvedValue([])
    const store = useCompendiumSkillsTalentsStore()

    await Promise.all([store.loadTalents(), store.loadTalents()])

    expect(fetchTalents).toHaveBeenCalledTimes(1)
  })

  it('records an error and recovers on forced retry', async () => {
    fetchTalents.mockRejectedValueOnce(new Error('network'))
    const store = useCompendiumSkillsTalentsStore()

    await store.loadTalents()
    expect(store.errors.talents).not.toBeNull()
    expect(store.loaded.talents).toBe(false)
    expect(store.loading.talents).toBe(false)

    fetchTalents.mockResolvedValueOnce([{ id: 't1' }])
    await store.loadTalents(true)

    expect(store.errors.talents).toBeNull()
    expect(store.talents).toEqual([{ id: 't1' }])
  })

  it('keeps skills and talents state independent', async () => {
    fetchSkills.mockRejectedValue(new Error('x'))
    fetchTalents.mockResolvedValue([])
    const store = useCompendiumSkillsTalentsStore()

    await Promise.all([store.loadSkills(), store.loadTalents()])

    expect(store.errors.skills).not.toBeNull()
    expect(store.errors.talents).toBeNull()
    expect(store.loaded.talents).toBe(true)
  })
})
