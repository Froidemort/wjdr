import { describe, expect, it } from 'vitest'
import { compareByName, compareFr } from '../../src/utils/compare'

describe('compareFr', () => {
  it('orders accented strings using French collation', () => {
    expect(['é', 'e', 'è'].sort(compareFr)).toEqual(['e', 'é', 'è'])
  })

  it('orders plain strings alphabetically', () => {
    expect(compareFr('abc', 'abd')).toBeLessThan(0)
    expect(compareFr('abd', 'abc')).toBeGreaterThan(0)
  })
})

describe('compareByName', () => {
  it('sorts objects by their name field using French collation', () => {
    const items = [{ name: 'Épée' }, { name: 'Dague' }]
    expect([...items].sort(compareByName)).toEqual([{ name: 'Dague' }, { name: 'Épée' }])
  })

  it('returns 0 when names are equal', () => {
    expect(compareByName({ name: 'Dague' }, { name: 'Dague' })).toBe(0)
  })
})
