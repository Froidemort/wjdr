import { nanoid } from 'nanoid'

export type CharacteristicKey = 'cc' | 'ct' | 'f' | 'e' | 'ag' | 'int' | 'fm' | 'soc'

export interface CharacteristicValue {
  base: number
  advance: number
}

export type Characteristics = Record<CharacteristicKey, CharacteristicValue>

export interface InventoryItem {
  id: string
  name: string
  quantity: number
  weight: number
  equipped: boolean
}

export interface Money {
  co: number
  pa: number
  s: number
}

export interface Character {
  id: string
  name: string
  wounds: {
    current: number
    max: number
  }
  fortune: number
  fate: number
  money: Money
  characteristics: Characteristics
  careerIds: string[]
  inventory: InventoryItem[]
  createdAt: string
  updatedAt: string
}

const defaultCharacteristics = (): Characteristics => ({
  cc: { base: 30, advance: 0 },
  ct: { base: 30, advance: 0 },
  f: { base: 30, advance: 0 },
  e: { base: 30, advance: 0 },
  ag: { base: 30, advance: 0 },
  int: { base: 30, advance: 0 },
  fm: { base: 30, advance: 0 },
  soc: { base: 30, advance: 0 }
})

const defaultMoney = (): Money => ({
  co: 0,
  pa: 0,
  s: 0
})

const toUnit = (value: number): number => Math.max(0, Math.trunc(value))

const moneyToSous = (money: Money): number =>
  toUnit(money.co) * 240 + toUnit(money.pa) * 12 + toUnit(money.s)

export const sousToMoney = (totalSous: number): Money => {
  const sous = clampAtZero(totalSous)
  const co = Math.floor(sous / 240)
  const remainderAfterCo = sous % 240
  const pa = Math.floor(remainderAfterCo / 12)
  const s = remainderAfterCo % 12

  return { co, pa, s }
}

export const normalizeMoney = (money: Money): Money => sousToMoney(moneyToSous(money))

export const createCharacter = (name: string): Character => {
  const now = new Date().toISOString()

  return {
    id: nanoid(10),
    name: name.trim(),
    wounds: {
      current: 10,
      max: 10
    },
    fortune: 2,
    fate: 1,
    money: defaultMoney(),
    characteristics: defaultCharacteristics(),
    careerIds: [],
    inventory: [],
    createdAt: now,
    updatedAt: now
  }
}

export const getCharacteristicTotal = (
  character: Character,
  key: CharacteristicKey
): number => character.characteristics[key].base + character.characteristics[key].advance

const clampAtZero = (value: number): number => Math.max(0, Math.trunc(value))

export interface ResourcePatch {
  woundsCurrent?: number
  woundsMax?: number
  fortune?: number
  fate?: number
}

export interface MoneyPatch {
  co?: number
  pa?: number
  s?: number
}

export const patchResources = (
  character: Character,
  patch: ResourcePatch
): Character => {
  const woundsMax = patch.woundsMax ?? character.wounds.max
  const woundsCurrentRaw = patch.woundsCurrent ?? character.wounds.current
  const woundsCurrent = Math.min(clampAtZero(woundsCurrentRaw), clampAtZero(woundsMax))

  return {
    ...character,
    wounds: {
      current: woundsCurrent,
      max: clampAtZero(woundsMax)
    },
    fortune: clampAtZero(patch.fortune ?? character.fortune),
    fate: clampAtZero(patch.fate ?? character.fate),
    updatedAt: new Date().toISOString()
  }
}

export const patchMoney = (character: Character, patch: MoneyPatch): Character => {
  const nextMoney = normalizeMoney({
    co: patch.co ?? character.money.co,
    pa: patch.pa ?? character.money.pa,
    s: patch.s ?? character.money.s
  })

  return {
    ...character,
    money: nextMoney,
    updatedAt: new Date().toISOString()
  }
}

export const renameCharacter = (character: Character, name: string): Character => ({
  ...character,
  name: name.trim(),
  updatedAt: new Date().toISOString()
})

const normalizeInventoryItem = (item: InventoryItem): InventoryItem => ({
  ...item,
  name: item.name.trim(),
  quantity: clampAtZero(item.quantity),
  weight: clampAtZero(item.weight),
  equipped: Boolean(item.equipped)
})

export const patchInventory = (
  character: Character,
  inventory: InventoryItem[]
): Character => ({
  ...character,
  inventory: inventory
    .map(normalizeInventoryItem)
    .filter((item) => item.name.length > 0),
  updatedAt: new Date().toISOString()
})

export const isValidCharacter = (character: Character): boolean => {
  if (!character.id || !character.name.trim()) {
    return false
  }

  if (character.wounds.max < 0 || character.wounds.current < 0) {
    return false
  }

  if (character.wounds.current > character.wounds.max) {
    return false
  }

  if (character.fortune < 0 || character.fate < 0) {
    return false
  }

  if (character.inventory.some((item) => !item.name.trim() || item.quantity < 0 || item.weight < 0)) {
    return false
  }

  if (character.money.co < 0 || character.money.pa < 0 || character.money.s < 0) {
    return false
  }

  if (character.money.pa >= 20 || character.money.s >= 12) {
    return false
  }

  return true
}

export const toCharacterExportJson = (character: Character): string =>
  JSON.stringify(character, null, 2)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const asFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return value
}

const asIsoDate = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback
  }

  return Number.isNaN(Date.parse(value)) ? fallback : value
}

const normalizeImportedMoney = (value: unknown): Money => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Backward compatibility with previous numeric money representation.
    return sousToMoney(value)
  }

  if (!isRecord(value)) {
    return defaultMoney()
  }

  return normalizeMoney({
    co: asFiniteNumber(value.co, 0),
    pa: asFiniteNumber(value.pa, 0),
    s: asFiniteNumber(value.s, 0)
  })
}

const normalizeInventory = (value: unknown): InventoryItem[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isRecord)
    .map((item): InventoryItem => ({
      id: typeof item.id === 'string' && item.id ? item.id : nanoid(10),
      name: typeof item.name === 'string' ? item.name.trim() : '',
      quantity: clampAtZero(asFiniteNumber(item.quantity, 1)),
      weight: clampAtZero(asFiniteNumber(item.weight, 0)),
      equipped: Boolean(item.equipped)
    }))
    .filter((item) => item.name.length > 0)
}

const normalizeCharacteristics = (value: unknown): Characteristics => {
  const fallback = defaultCharacteristics()
  if (!isRecord(value)) {
    return fallback
  }

  return {
    cc: {
      base: clampAtZero(asFiniteNumber(value.cc && isRecord(value.cc) ? value.cc.base : undefined, fallback.cc.base)),
      advance: clampAtZero(asFiniteNumber(value.cc && isRecord(value.cc) ? value.cc.advance : undefined, fallback.cc.advance))
    },
    ct: {
      base: clampAtZero(asFiniteNumber(value.ct && isRecord(value.ct) ? value.ct.base : undefined, fallback.ct.base)),
      advance: clampAtZero(asFiniteNumber(value.ct && isRecord(value.ct) ? value.ct.advance : undefined, fallback.ct.advance))
    },
    f: {
      base: clampAtZero(asFiniteNumber(value.f && isRecord(value.f) ? value.f.base : undefined, fallback.f.base)),
      advance: clampAtZero(asFiniteNumber(value.f && isRecord(value.f) ? value.f.advance : undefined, fallback.f.advance))
    },
    e: {
      base: clampAtZero(asFiniteNumber(value.e && isRecord(value.e) ? value.e.base : undefined, fallback.e.base)),
      advance: clampAtZero(asFiniteNumber(value.e && isRecord(value.e) ? value.e.advance : undefined, fallback.e.advance))
    },
    ag: {
      base: clampAtZero(asFiniteNumber(value.ag && isRecord(value.ag) ? value.ag.base : undefined, fallback.ag.base)),
      advance: clampAtZero(asFiniteNumber(value.ag && isRecord(value.ag) ? value.ag.advance : undefined, fallback.ag.advance))
    },
    int: {
      base: clampAtZero(asFiniteNumber(value.int && isRecord(value.int) ? value.int.base : undefined, fallback.int.base)),
      advance: clampAtZero(asFiniteNumber(value.int && isRecord(value.int) ? value.int.advance : undefined, fallback.int.advance))
    },
    fm: {
      base: clampAtZero(asFiniteNumber(value.fm && isRecord(value.fm) ? value.fm.base : undefined, fallback.fm.base)),
      advance: clampAtZero(asFiniteNumber(value.fm && isRecord(value.fm) ? value.fm.advance : undefined, fallback.fm.advance))
    },
    soc: {
      base: clampAtZero(asFiniteNumber(value.soc && isRecord(value.soc) ? value.soc.base : undefined, fallback.soc.base)),
      advance: clampAtZero(asFiniteNumber(value.soc && isRecord(value.soc) ? value.soc.advance : undefined, fallback.soc.advance))
    }
  }
}

export const parseCharacterImportJson = (json: string): Character => {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Character import is invalid.')
  }

  if (!isRecord(raw)) {
    throw new Error('Character import is invalid.')
  }

  const now = new Date().toISOString()
  const importedName = typeof raw.name === 'string' ? raw.name.trim() : ''

  const character: Character = {
    id: typeof raw.id === 'string' && raw.id ? raw.id : nanoid(10),
    name: importedName,
    wounds: {
      current: clampAtZero(
        asFiniteNumber(isRecord(raw.wounds) ? raw.wounds.current : undefined, 10)
      ),
      max: clampAtZero(
        asFiniteNumber(isRecord(raw.wounds) ? raw.wounds.max : undefined, 10)
      )
    },
    fortune: clampAtZero(asFiniteNumber(raw.fortune, 2)),
    fate: clampAtZero(asFiniteNumber(raw.fate, 1)),
    money: normalizeImportedMoney(raw.money),
    characteristics: normalizeCharacteristics(raw.characteristics),
    careerIds: Array.isArray(raw.careerIds)
      ? raw.careerIds.filter((careerId): careerId is string => typeof careerId === 'string')
      : [],
    inventory: normalizeInventory(raw.inventory),
    createdAt: asIsoDate(raw.createdAt, now),
    updatedAt: asIsoDate(raw.updatedAt, now)
  }

  const normalized = patchResources(character, {
    woundsCurrent: character.wounds.current,
    woundsMax: character.wounds.max,
    fortune: character.fortune,
    fate: character.fate
  })

  const nextCharacter: Character = {
    ...normalized,
    money: character.money,
    inventory: character.inventory,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt
  }

  if (!isValidCharacter(nextCharacter)) {
    throw new Error('Character import is invalid.')
  }

  return nextCharacter
}
