/**
 * Input validation utilities for RPC calls and user data
 * Prevents injection and malformed inputs
 */

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
