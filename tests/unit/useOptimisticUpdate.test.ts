import { describe, expect, it, vi } from 'vitest'
import { useOptimisticUpdate } from '../../src/composables/useOptimisticUpdate'

describe('useOptimisticUpdate', () => {
  it('merges patches and saves once after debounce', async () => {
    vi.useFakeTimers()

    const onSave = vi.fn().mockResolvedValue(undefined)
    const { update } = useOptimisticUpdate<{ name: string; value: number }>({
      onSave,
      debounceMs: 100,
      flushOnUnmount: false,
    })

    update({ name: 'alpha' })
    update({ value: 42 })

    await vi.advanceTimersByTimeAsync(100)
    await vi.runAllTicks()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ name: 'alpha', value: 42 })

    vi.useRealTimers()
  })

  it('flush saves immediately and bypasses debounce window', async () => {
    vi.useFakeTimers()

    const onSave = vi.fn().mockResolvedValue(undefined)
    const { update, flush, status } = useOptimisticUpdate<{ amount: number }>({
      onSave,
      debounceMs: 400,
      flushOnUnmount: false,
    })

    update({ amount: 5 })
    await flush({ amount: 8 })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({ amount: 8 })
    expect(status.value).toBe('idle')

    vi.useRealTimers()
  })

  it('cancel drops pending patch', async () => {
    vi.useFakeTimers()

    const onSave = vi.fn().mockResolvedValue(undefined)
    const { update, cancel, status } = useOptimisticUpdate<{ code: string }>({
      onSave,
      debounceMs: 100,
      flushOnUnmount: false,
    })

    update({ code: 'A' })
    cancel()

    await vi.advanceTimersByTimeAsync(200)
    await vi.runAllTicks()

    expect(onSave).not.toHaveBeenCalled()
    expect(status.value).toBe('idle')

    vi.useRealTimers()
  })

  it('sets error status and invokes onError on save failure', async () => {
    vi.useFakeTimers()

    const failure = new Error('boom')
    const onError = vi.fn()
    const onSave = vi.fn().mockRejectedValue(failure)

    const { update, status, error } = useOptimisticUpdate<{ qty: number }>({
      onSave,
      onError,
      debounceMs: 50,
      flushOnUnmount: false,
    })

    update({ qty: 1 })
    await vi.advanceTimersByTimeAsync(50)
    await vi.runAllTicks()

    expect(status.value).toBe('error')
    expect(error.value).toBe(failure)
    expect(onError).toHaveBeenCalledWith(failure)

    vi.useRealTimers()
  })
})
