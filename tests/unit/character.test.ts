import {
  createCharacter,
  getCharacteristicTotal,
  isValidCharacter,
  parseCharacterImportJson,
  patchResources,
  renameCharacter,
  toCharacterExportJson
} from '../../src/domain/character'

describe('character domain', () => {
  it('creates a character with defaults and trimmed name', () => {
    const character = createCharacter('  Konrad  ')

    expect(character.id).toHaveLength(10)
    expect(character.name).toBe('Konrad')
    expect(character.wounds).toEqual({ current: 10, max: 10 })
    expect(character.fortune).toBe(2)
    expect(character.fate).toBe(1)
    expect(character.careerIds).toEqual([])
    expect(character.characteristics.cc).toEqual({ base: 30, advance: 0 })
  })

  it('computes characteristic total from base + advance', () => {
    const character = createCharacter('A')
    character.characteristics.cc.base = 34
    character.characteristics.cc.advance = 10

    expect(getCharacteristicTotal(character, 'cc')).toBe(44)
  })

  it('patches resources and clamps values', () => {
    const character = createCharacter('A')

    const patched = patchResources(character, {
      woundsCurrent: 999,
      woundsMax: 12,
      fortune: -2,
      fate: 3.9
    })

    expect(patched.wounds).toEqual({ current: 12, max: 12 })
    expect(patched.fortune).toBe(0)
    expect(patched.fate).toBe(3)
  })

  it('renames character with trimmed value', () => {
    const character = createCharacter('A')
    const renamed = renameCharacter(character, '  Elsa  ')

    expect(renamed.name).toBe('Elsa')
  })

  it('validates character integrity', () => {
    const character = createCharacter('A')

    expect(isValidCharacter(character)).toBe(true)

    const broken = {
      ...character,
      wounds: { current: 12, max: 10 }
    }

    expect(isValidCharacter(broken)).toBe(false)
  })

  it('exports stable json payload', () => {
    const character = createCharacter('A')
    const json = toCharacterExportJson(character)
    const parsed = JSON.parse(json) as { id: string; name: string }

    expect(parsed.id).toBe(character.id)
    expect(parsed.name).toBe('A')
  })

  it('parses an exported character json payload', () => {
    const source = createCharacter('Felix')
    source.money = 42
    const json = toCharacterExportJson(source)

    const parsed = parseCharacterImportJson(json)

    expect(parsed.id).toBe(source.id)
    expect(parsed.name).toBe('Felix')
    expect(parsed.money).toBe(42)
  })

  it('rejects invalid imported json payload', () => {
    expect(() => parseCharacterImportJson('{"foo":true}')).toThrow(
      'Character import is invalid.'
    )
  })
})
