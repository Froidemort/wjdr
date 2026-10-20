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

  it('recovers after a failed save so a later flush runs', async () => {
    const failure = new Error('boom')
    const onSave = vi.fn().mockRejectedValueOnce(failure).mockResolvedValue(undefined)
    const { flush, status } = useOptimisticUpdate<{ qty: number }>({
      onSave,
      debounceMs: 50,
      flushOnUnmount: false,
    })

    await expect(flush({ qty: 1 })).rejects.toBe(failure)
    expect(status.value).toBe('error')

    await flush({ qty: 2 })

    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onSave).toHaveBeenLastCalledWith({ qty: 2 })
    expect(status.value).toBe('idle')
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

  it('keeps patches added during a failing save, newer edits winning', async () => {
    vi.useFakeTimers()

    let rejectSave: (reason: Error) => void = () => undefined
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((_resolve, reject) => { rejectSave = reject })
      )
      .mockResolvedValue(undefined)

    const { update, flush } = useOptimisticUpdate<{ a: number; b: number }>({
      onSave,
      debounceMs: 50,
      flushOnUnmount: false,
    })

    update({ a: 1, b: 1 })
    await vi.advanceTimersByTimeAsync(50)
    update({ b: 2 })
    rejectSave(new Error('boom'))
    await vi.advanceTimersByTimeAsync(0)

    await flush()

    expect(onSave).toHaveBeenLastCalledWith({ a: 1, b: 2 })

    vi.useRealTimers()
  })
})
