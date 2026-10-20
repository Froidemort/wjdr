import { describe, expect, it } from 'vitest'
import { safeErrorMessage } from '../../src/utils/errorMessages'

describe('safeErrorMessage', () => {
  it('uses the fallback for coded backend errors with schema details', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "characters_private_email_key"',
      details: 'Key (email)=(secret@example.com) already exists.',
    }

    expect(safeErrorMessage(error)).toBe('Modification impossible.')
    expect(safeErrorMessage(error)).not.toContain('characters_private_email_key')
  })

  it('maps TypeError to the connection fallback', () => {
    expect(safeErrorMessage(new TypeError('fetch failed'))).toBe('Connexion indisponible.')
  })

  it('preserves a useful application Error message', () => {
    expect(safeErrorMessage(new Error('La fiche est verrouillée.'))).toBe('La fiche est verrouillée.')
  })
})
