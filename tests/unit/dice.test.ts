import { describe, expect, it } from 'vitest'

import { evaluateBonusExpression, resolvePercentileCheck, rollPercentile } from '../../src/services/dice'

describe('dice service', () => {
  it('resolves a successful percentile check with modifiers', () => {
    const result = resolvePercentileCheck({
      baseTarget: 42,
      difficulty: 10,
      modifier: 5,
      roll: 37
    })

    expect(result).toEqual({
      roll: 37,
      baseTarget: 42,
      effectiveTarget: 57,
      success: true,
      margin: 20,
      tensMargin: 2,
      isDouble: false
    })
  })

  it('resolves a failed percentile check and detects doubles', () => {
    const result = resolvePercentileCheck({
      baseTarget: 48,
      difficulty: -10,
      roll: 66
    })

    expect(result).toEqual({
      roll: 66,
      baseTarget: 48,
      effectiveTarget: 38,
      success: false,
      margin: -28,
      tensMargin: 2,
      isDouble: true
    })
  })

  it('clamps the effective target to percentile bounds', () => {
    const result = resolvePercentileCheck({
      baseTarget: 120,
      modifier: 15,
      roll: 99
    })

    expect(result.effectiveTarget).toBe(99)
  })

  it('evaluates bonus expressions from characteristic values', () => {
    expect(evaluateBonusExpression('BF+1', { BF: 3 })).toBe(4)
    expect(evaluateBonusExpression('tb-2', { TB: 5 })).toBe(3)
  })

  it('rolls a percentile value from a deterministic random source', () => {
    expect(rollPercentile(() => 0)).toBe(1)
    expect(rollPercentile(() => 0.98)).toBe(99)
  })
})
