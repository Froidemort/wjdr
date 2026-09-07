import { describe, expect, it } from 'vitest'
import {
  getPasswordStrength,
  isUuidLike,
  isValidSessionCode,
  isValidUsername,
  isValidUUID,
  validateInput,
} from '../../src/utils/validation'

describe('validation', () => {
  it.each([
    ['isValidUUID', isValidUUID, '550e8400-e29b-41d4-a716-446655440000', true],
    ['isValidUUID', isValidUUID, '550e8400-e29b-31d4-a716-446655440000', false],
    ['isValidSessionCode', isValidSessionCode, ' ab12cd ', true],
    ['isValidSessionCode', isValidSessionCode, 'ABCDE', false],
    ['isValidUsername', isValidUsername, 'mj_noir-2', true],
    ['isValidUsername', isValidUsername, 'no', false],
  ])('%s validates supported input', (_name, validator, value, expected) => {
    expect(validator(value)).toBe(expected)
  })

  it('rejects non-string identifiers and malformed UUID-like values', () => {
    expect(isValidUUID(null)).toBe(false)
    expect(isValidSessionCode(123)).toBe(false)
    expect(isValidUsername({})).toBe(false)
    expect(isUuidLike('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isUuidLike('not-an-id')).toBe(false)
  })

  it('returns password UI states and preserves validated values', () => {
    expect(getPasswordStrength('')).toEqual({ level: 0, label: '', barClass: 'bg-base-300' })
    expect(getPasswordStrength('Abcdef123!').level).toBeGreaterThan(0)
    expect(validateInput('ABC123', isValidSessionCode, 'Invalid code')).toBe('ABC123')
    expect(() => validateInput('bad', isValidSessionCode, 'Invalid code')).toThrow('Invalid code')
  })
})