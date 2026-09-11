import { describe, expect, it, vi } from 'vitest'
import { useMoneyCoercion } from '../../src/composables/useMoneyCoercion'

describe('useMoneyCoercion', () => {
  it.each([
    [0, 0, 0, { gold: 0, silver: 0, copper: 0 }],
    [1, 13, 21, { gold: 2, silver: 2, copper: 1 }],
    [-1, 2.9, 19.9, { gold: 0, silver: 2, copper: 19 }],
  ])('normalizes gold, silver, and copper values', (gold, silver, copper, expected) => {
    expect(useMoneyCoercion().coerceMoney(gold, silver, copper)).toEqual(expected)
  })

  it('locks concurrent coercion attempts until its virtual delay expires', async () => {
    vi.useFakeTimers()
    const money = useMoneyCoercion()
    const pending = money.applyCoercion(0, 12, 0, 50)

    expect(money.isMoneyLocked.value).toBe(true)
    await expect(money.applyCoercion(1, 2, 3)).resolves.toEqual({ gold: 1, silver: 2, copper: 3 })
    await vi.advanceTimersByTimeAsync(50)
    await expect(pending).resolves.toEqual({ gold: 1, silver: 0, copper: 0 })
    expect(money.isMoneyLocked.value).toBe(false)
    vi.useRealTimers()
  })
})