/**
 * Input validation utilities for RPC calls and user data
 * Prevents injection and malformed inputs
 */

import { passwordStrength } from 'check-password-strength'

/**
 * Validates UUID v4 format
 * @param value - Value to validate
 * @returns true if valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidPattern.test(value)
}

/**
 * Validates session code format (6 alphanumeric characters)
 * @param value - Value to validate
 * @returns true if valid code
 */
export function isValidSessionCode(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  const codePattern = /^[A-Z0-9]{6}$/
  return codePattern.test(value.trim().toUpperCase())
}

/**
 * Validates username format (3-20 chars, alphanumeric + underscore/dash)
 * @param value - Value to validate
 * @returns true if valid username
 */
export function isValidUsername(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }
  const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/
  return usernamePattern.test(value)
}

/**
 * Sanitize and validate input before sending to RPC
 * @param value - Raw input value
 * @param validator - Validation function
 * @param errorMessage - Custom error message
 * @throws Error if validation fails
 */
export function validateInput<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  errorMessage: string
): T {
  if (!validator(value)) {
    throw new Error(errorMessage)
  }
  return value
}

export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4

export type PasswordStrength = {
  level: PasswordStrengthLevel
  label: string
  barClass: string
}

const STRENGTH_UI = [
  { level: 1, label: 'Faible', barClass: 'bg-error' },
  { level: 2, label: 'Moyen', barClass: 'bg-warning' },
  { level: 3, label: 'Solide', barClass: 'bg-accent' },
  { level: 4, label: 'Excellent', barClass: 'bg-success' },
] as const satisfies ReadonlyArray<PasswordStrength>

/** Seuils plus souples que le défaut du package (Strong à 12+ chars). */
const STRENGTH_OPTIONS = [
  { id: 0, value: 'Too weak', minDiversity: 0, minLength: 0 },
  { id: 1, value: 'Weak', minDiversity: 2, minLength: 6 },
  { id: 2, value: 'Medium', minDiversity: 3, minLength: 8 },
  { id: 3, value: 'Strong', minDiversity: 3, minLength: 10 },
] as const

/**
 * Robustesse via check-password-strength (longueur + diversité des caractères).
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 0, label: '', barClass: 'bg-base-300' }
  }

  const { id } = passwordStrength(password, [...STRENGTH_OPTIONS])
  return STRENGTH_UI[id] ?? STRENGTH_UI[0]
}
