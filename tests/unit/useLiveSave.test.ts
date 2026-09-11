import { beforeEach, describe, expect, it, vi } from 'vitest'

const optimistic = vi.hoisted(() => ({
  flush: vi.fn(),
  status: { value: 'idle' },
  update: vi.fn(),
  useOptimisticUpdate: vi.fn(),
}))

vi.mock('../../src/composables/useOptimisticUpdate', () => ({
  useOptimisticUpdate: optimistic.useOptimisticUpdate,
}))

import { useLiveSave } from '../../src/composables/useLiveSave'

describe('useLiveSave', () => {
  beforeEach(() => {
    optimistic.flush.mockReset()
    optimistic.update.mockReset()
    optimistic.useOptimisticUpdate.mockReset().mockReturnValue(optimistic)
  })

  it('forwards delayed saves to the optimistic updater', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const liveSave = useLiveSave(save, 100)

    liveSave.triggerSave({ name: 'Kurt' })
    await optimistic.useOptimisticUpdate.mock.calls[0][0].onSave({ name: 'Kurt' })

    expect(optimistic.update).toHaveBeenCalledWith({ name: 'Kurt' })
    expect(save).toHaveBeenCalledWith({ name: 'Kurt' })
    expect(optimistic.useOptimisticUpdate).toHaveBeenCalledWith(expect.objectContaining({ debounceMs: 100 }))
  })

  it('flushes an immediate save', async () => {
    optimistic.flush.mockResolvedValue(undefined)
    const liveSave = useLiveSave(vi.fn())

    await liveSave.triggerSaveNow({ name: 'Kurt' })

    expect(optimistic.flush).toHaveBeenCalledWith({ name: 'Kurt' })
    expect(liveSave.status).toBe(optimistic.status)
  })
})