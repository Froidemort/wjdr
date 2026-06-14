import {
  CAREER_CATALOG,
  SKILL_CATALOG,
  TALENT_CATALOG,
  createCharacter,
  formatNameWithSpecialization,
  getRaceIcon,
  getRaceLabel,
  formatSkillLabel,
  getActionsTotal,
  getCharacteristicTotal,
  getWoundsStatus,
  getBonusForce,
  getBonusEndurance,
  getMagicTotal,
  isValidCharacter,
  normalizeExperience,
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
    expect(character.fortune).toEqual({ current: 2, max: 2 })
    expect(character.fate).toEqual({ current: 1, max: 1 })
    expect(character.race).toBe('human')
    expect(character.money).toEqual({ co: 0, pa: 0, s: 0 })
    expect(character.experience).toEqual({ total: 0, spent: 0, available: 0 })
    expect(character.skills).toEqual([])
    expect(character.talents).toEqual([])
    expect(character.careers).toEqual({ current: null, previous: [] })
    expect(character.inventory).toEqual([])
    expect(character.characteristics.cc).toEqual({ base: 30, advance: 0, ticks: 0 })
    expect(character.actionsTicks).toBe(0)
    expect(character.magicTicks).toBe(0)
    expect(character.bonusForceTicks).toBe(0)
  })

  it('computes characteristic total from base + advance', () => {
    const character = createCharacter('A')
    character.characteristics.cc.base = 34
    character.characteristics.cc.ticks = 2

    expect(getCharacteristicTotal(character, 'cc')).toBe(44)
  })

  it('patches resources and clamps values', () => {
    const character = createCharacter('A')

    const patched = patchResources(character, {
      woundsCurrent: 999,
      woundsMax: 12,
      fortuneCurrent: -2,
      fateCurrent: 3.9,
      fateMax: 5.8
    })

    expect(patched.wounds).toEqual({ current: 12, max: 12 })
    expect(patched.fortune).toEqual({ current: 0, max: 2 })
    expect(patched.fate).toEqual({ current: 3, max: 5 })
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

  it('calculates bonus force as tens digit of F characteristic', () => {
    const character = createCharacter('A')
    character.characteristics.f = { base: 35, advance: 0, ticks: 0 }

    expect(getBonusForce(character)).toBe(3)
  })

  it('calculates bonus force with ticks and secondary bonus tick', () => {
    const character = createCharacter('A')
    character.characteristics.f = { base: 30, advance: 15, ticks: 3 }
    character.bonusForceTicks = 1

    expect(getBonusForce(character)).toBe(5)
  })

  it('calculates bonus endurance as tens digit of E characteristic', () => {
    const character = createCharacter('A')
    character.characteristics.e = { base: 53, advance: 0, ticks: 0 }

    expect(getBonusEndurance(character)).toBe(5)
  })

  it('calculates actions and magic totals with ticks', () => {
    const character = createCharacter('A')
    character.actions = 2
    character.actionsTicks = 1
    character.magic = 3
    character.magicTicks = 2

    expect(getActionsTotal(character)).toBe(3)
    expect(getMagicTotal(character)).toBe(5)
  })

  it('initializes secondary characteristics with defaults', () => {
    const character = createCharacter('A')

    expect(character.actions).toBe(1)
    expect(character.movement).toBe(4)
    expect(character.magic).toBe(0)
    expect(character.insanity).toBe(0)
  })

  it('imports character with backward compatibility for secondary stats', () => {
    const source = createCharacter('Konrad')
    source.magic = 5
    source.insanity = 2
    const json = toCharacterExportJson(source)

    const parsed = parseCharacterImportJson(json)

    expect(parsed.actions).toBe(1)
    expect(parsed.movement).toBe(4)
    expect(parsed.magic).toBe(5)
    expect(parsed.insanity).toBe(2)
  })

  it('imports character with default race and abilities when missing', () => {
    const source = createCharacter('Otto')
    const exported = JSON.parse(toCharacterExportJson(source)) as Record<string, unknown>
    delete exported.race
    delete exported.skills
    delete exported.talents
    delete exported.careers

    const parsed = parseCharacterImportJson(JSON.stringify(exported))

    expect(parsed.race).toBe('human')
    expect(parsed.skills).toEqual([])
    expect(parsed.talents).toEqual([])
    expect(parsed.careers).toEqual({ current: null, previous: [] })
  })

  it('imports legacy numeric fortune and fate as current/max', () => {
    const source = createCharacter('Legacy Resources')
    const exported = JSON.parse(toCharacterExportJson(source)) as Record<string, unknown>
    exported.fortune = 4
    exported.fate = 2

    const parsed = parseCharacterImportJson(JSON.stringify(exported))

    expect(parsed.fortune).toEqual({ current: 4, max: 4 })
    expect(parsed.fate).toEqual({ current: 2, max: 2 })
  })

  it('imports legacy careerIds into previous careers', () => {
    const source = createCharacter('Legacy')
    const exported = JSON.parse(toCharacterExportJson(source)) as Record<string, unknown>
    delete exported.careers
    exported.careerIds = [CAREER_CATALOG[0], CAREER_CATALOG[1], 'Invalid Career']

    const parsed = parseCharacterImportJson(JSON.stringify(exported))

    expect(parsed.careers.current).toBeNull()
    expect(parsed.careers.previous).toEqual([CAREER_CATALOG[0], CAREER_CATALOG[1]])
  })

  it('rejects invalid race', () => {
    const character = createCharacter('A')
    ;(character as unknown as { race: string }).race = 'orc'

    expect(isValidCharacter(character)).toBe(false)
  })

  it('maps race to display label and icon', () => {
    expect(getRaceLabel('human')).toBe('Humain')
    expect(getRaceLabel('dwarf')).toBe('Nain')
    expect(getRaceLabel('halfling')).toBe('Halfling')
    expect(getRaceLabel('elf')).toBe('Elfe')

    expect(getRaceIcon('human')).toBe('🧑')
    expect(getRaceIcon('dwarf')).toBe('⛏️')
    expect(getRaceIcon('halfling')).toBe('🍃')
    expect(getRaceIcon('elf')).toBe('🏹')
  })

  it('computes wounds status thresholds for UI colors', () => {
    expect(getWoundsStatus({ current: 3, max: 12 })).toBe('critical')
    expect(getWoundsStatus({ current: 6, max: 12 })).toBe('warning')
    expect(getWoundsStatus({ current: 7, max: 12 })).toBe('healthy')
  })

  it('rejects unknown skills and talents', () => {
    const character = createCharacter('A')
    character.skills = [{ id: 's1', skillId: 'unknown-skill', mastery: 0 }]

    expect(isValidCharacter(character)).toBe(false)

    character.skills = [{ id: 's1', skillId: SKILL_CATALOG[0].id, mastery: 0 }]
    character.talents = [{ id: 't1', talentId: 'unknown-talent' }]

    expect(isValidCharacter(character)).toBe(false)
  })

  it('formats name with specialization', () => {
    expect(formatNameWithSpecialization('Langue', 'reikspiel')).toBe('Langue (reikspiel)')
    expect(formatNameWithSpecialization('Perception')).toBe('Perception')
  })

  it('formats skill label from catalog', () => {
    const firstSkill = SKILL_CATALOG.find((entry) => entry.specialization)
    expect(firstSkill).toBeDefined()

    const label = formatSkillLabel({
      id: 'skill-1',
      skillId: firstSkill!.id,
      specialization: firstSkill!.specialization,
      mastery: 10
    })

    expect(label).toContain(firstSkill!.name)
    expect(label).toContain(`(${firstSkill!.specialization})`)
    expect(label).toContain('+10%')
  })

  it('imports skills with default mastery when missing', () => {
    const source = createCharacter('Skill Legacy')
    const exported = JSON.parse(toCharacterExportJson(source)) as Record<string, unknown>
    exported.skills = [
      {
        id: 'skill-legacy',
        skillId: SKILL_CATALOG[0].id,
        specialization: SKILL_CATALOG[0].specialization
      }
    ]

    const parsed = parseCharacterImportJson(JSON.stringify(exported))

    expect(parsed.skills).toEqual([
      {
        id: 'skill-legacy',
        skillId: SKILL_CATALOG[0].id,
        specialization: SKILL_CATALOG[0].specialization,
        mastery: 0
      }
    ])
  })

  it('rejects invalid skill mastery values', () => {
    const character = createCharacter('A')
    character.skills = [
      {
        id: 's1',
        skillId: SKILL_CATALOG[0].id,
        mastery: 15
      } as unknown as (typeof character.skills)[number]
    ]

    expect(isValidCharacter(character)).toBe(false)
  })

  it('validates careers current not duplicated in previous', () => {
    const character = createCharacter('A')
    character.careers.current = CAREER_CATALOG[0]
    character.careers.previous = [CAREER_CATALOG[0]]

    expect(isValidCharacter(character)).toBe(false)
  })

  it('keeps known talent ids valid', () => {
    const character = createCharacter('A')
    character.talents = [{ id: 'tal-1', talentId: TALENT_CATALOG[0].id }]

    expect(isValidCharacter(character)).toBe(true)
  })

  it('validates character with secondary stats constraints', () => {
    const character = createCharacter('A')

    expect(isValidCharacter(character)).toBe(true)

    character.actions = 0
    expect(isValidCharacter(character)).toBe(false)

    character.actions = 1
    character.movement = 0
    expect(isValidCharacter(character)).toBe(false)

    character.movement = 4
    character.magic = -1
    expect(isValidCharacter(character)).toBe(false)

    character.magic = 0
    character.insanity = -1
    expect(isValidCharacter(character)).toBe(false)
  })

  it('normalizes experience with invariant total = spent + available', () => {
    const normalized = normalizeExperience({ total: 999, spent: 120.8, available: 45.1 })

    expect(normalized).toEqual({
      total: 165,
      spent: 120,
      available: 45
    })
  })

  it('imports character with default experience when missing', () => {
    const source = createCharacter('Otto')
    const exported = JSON.parse(toCharacterExportJson(source)) as Record<string, unknown>
    delete exported.experience

    const parsed = parseCharacterImportJson(JSON.stringify(exported))

    expect(parsed.experience).toEqual({ total: 0, spent: 0, available: 0 })
  })

  it('rejects character when experience invariant is invalid', () => {
    const character = createCharacter('A')
    character.experience = { total: 10, spent: 8, available: 1 }

    expect(isValidCharacter(character)).toBe(false)
  })
})
