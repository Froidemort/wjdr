import { describe, expect, it } from 'vitest'
import { deriveNoteTitle } from '../../src/utils/sessionNoteTitle'

describe('deriveNoteTitle', () => {
  it('uses the first non-empty line', () => {
    expect(deriveNoteTitle('\n\n  Rencontre au pont\nsuite')).toBe('Rencontre au pont')
  })

  it.each([
    ['## Titre', 'Titre'],
    ['> Citation', 'Citation'],
    ['- Puce', 'Puce'],
    ['3. Item', 'Item'],
    ['**Gras** et *italique*', 'Gras et italique'],
    ['Voir [la carte](https://example.com)', 'Voir la carte'],
    ['`code` ~~barré~~', 'code barré'],
    ['_souligné_ snake_case', 'souligné snake_case'],
  ])('strips markdown markers from %j', (body, expected) => {
    expect(deriveNoteTitle(body, '2026-09-12')).toBe(expected)
  })

  it('skips lines that only contain markers', () => {
    expect(deriveNoteTitle('**\n> \n# Vrai titre')).toBe('Vrai titre')
  })

  it('truncates to 60 characters with an ellipsis', () => {
    const title = deriveNoteTitle('a'.repeat(80))
    expect(title).toHaveLength(60)
    expect(title.endsWith('…')).toBe(true)
  })

  it('keeps a 60-character title untouched', () => {
    expect(deriveNoteTitle('b'.repeat(60))).toBe('b'.repeat(60))
  })

  it('falls back to the session date when the body is blank', () => {
    expect(deriveNoteTitle('  \n ', '2026-09-05')).toBe('Note du 05/09')
    expect(deriveNoteTitle('**', '2026-12-31')).toBe('Note du 31/12')
  })

  it('falls back to today when the session date is missing', () => {
    expect(deriveNoteTitle('')).toMatch(/^Note du \d{2}\/\d{2}$/)
  })
})
