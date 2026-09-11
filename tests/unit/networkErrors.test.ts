import { describe, expect, it } from 'vitest'
import { isTransientError } from '../../src/services/shared/networkErrors'

describe('isTransientError', () => {
  it.each([
    [null, false],
    ['timeout', false],
    [{ status: 503 }, true],
    [{ status: 404 }, false],
    [{ message: 'Network timeout' }, true],
    [{ message: 'validation failed' }, false],
  ])('classifies %j as transient: %s', (error, expected) => {
    expect(isTransientError(error)).toBe(expected)
  })
})