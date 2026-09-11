import { describe, expect, it, vi } from 'vitest'
import { withRetry } from '../../src/services/shared/retry'

describe('withRetry', () => {
  it('retries a transient failure and returns the successful result', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce('done')

    await expect(withRetry(operation)).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it.each([
    [new Error('validation failed'), {}, 1],
    [Object.assign(new Error('custom outage'), { status: 500 }), {}, 2],
    [new Error('temporary backend'), { maxAttempts: 1 }, 1],
  ])('stops when retries are not applicable', async (error, options, expectedCalls) => {
    const operation = vi.fn().mockRejectedValue(error)

    await expect(withRetry(operation, options)).rejects.toBe(error)
    expect(operation).toHaveBeenCalledTimes(expectedCalls)
  })

  it('uses configured transient keywords', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('gateway overloaded'))
      .mockResolvedValueOnce('done')

    await expect(withRetry(operation, { extraTransientKeywords: ['overloaded'] })).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(2)
  })
})