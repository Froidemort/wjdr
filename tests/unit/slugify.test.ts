import { describe, expect, it } from 'vitest'
import { slugify } from '../../src/utils/slugify'

describe('slugify', () => {
  it('strips accents, lowercases and collapses separators', () => {
    expect(slugify('Athlétisme (Course)')).toBe('athletisme-course')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify('  --Être--  ')).toBe('etre')
  })
})
