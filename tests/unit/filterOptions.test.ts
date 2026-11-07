import { describe, expect, it } from 'vitest'
import { unavailableFilterValues } from '../../src/utils/filterOptions'

describe('unavailableFilterValues', () => {
  it('returns selected values absent from the current options', () => {
    expect(unavailableFilterValues(new Set(['Feu', 'Ciel']), ['Feu', 'Métal'])).toEqual(['Ciel'])
  })

  it('returns no warning when all selected values are available', () => {
    expect(unavailableFilterValues(['Int'], ['Int', 'Soc'])).toEqual([])
  })
})
