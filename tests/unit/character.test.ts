import {
  createCharacter,
  getCharacteristicTotal,
  isValidCharacter,
  parseCharacterImportJson,
  patchInventory,
  patchMoney,
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
    expect(character.money).toEqual({ co: 0, pa: 0, s: 0 })
    expect(character.careerIds).toEqual([])
    expect(character.inventory).toEqual([])
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

  it('patches inventory and drops invalid item names', () => {
    const character = createCharacter('A')

    const patched = patchInventory(character, [
      { id: '1', name: '  Epee  ', quantity: 2, weight: 1, equipped: true },
      { id: '2', name: '   ', quantity: 5, weight: 0, equipped: false }
    ])

    expect(patched.inventory).toHaveLength(1)
    expect(patched.inventory[0]).toEqual({
      id: '1',
      name: 'Epee',
      quantity: 2,
      weight: 1,
      equipped: true
    })
  })

  it('coerces money conversion for silver and copper', () => {
    const character = createCharacter('A')

    const fromSilver = patchMoney(character, { pa: 40 })
    expect(fromSilver.money).toEqual({ co: 2, pa: 0, s: 0 })

    const fromCopper = patchMoney(character, { s: 15 })
    expect(fromCopper.money).toEqual({ co: 0, pa: 1, s: 3 })
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
    source.money = { co: 0, pa: 40, s: 15 }
    source.inventory = [
      { id: 'obj-1', name: 'Bouclier', quantity: 1, weight: 3, equipped: true }
    ]
    const json = toCharacterExportJson(source)

    const parsed = parseCharacterImportJson(json)

    expect(parsed.id).toBe(source.id)
    expect(parsed.name).toBe('Felix')
    expect(parsed.money).toEqual({ co: 2, pa: 1, s: 3 })
    expect(parsed.inventory[0]?.name).toBe('Bouclier')
  })

  it('rejects invalid imported json payload', () => {
    expect(() => parseCharacterImportJson('{"foo":true}')).toThrow(
      'Character import is invalid.'
    )
  })
})
