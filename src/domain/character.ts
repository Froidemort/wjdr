import { nanoid } from 'nanoid'

export type CharacteristicKey = 'cc' | 'ct' | 'f' | 'e' | 'ag' | 'int' | 'fm' | 'soc'

export interface CharacteristicValue {
  base: number
  advance: number
}

export type Characteristics = Record<CharacteristicKey, CharacteristicValue>

export interface Character {
  id: string
  name: string
  wounds: {
    current: number
    max: number
  }
  fortune: number
  fate: number
  money: number
  characteristics: Characteristics
  careerIds: string[]
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
    money: 0,
    characteristics: defaultCharacteristics(),
    careerIds: [],
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

export const renameCharacter = (character: Character, name: string): Character => ({
  ...character,
  name: name.trim(),
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
    money: clampAtZero(asFiniteNumber(raw.money, 0)),
    characteristics: normalizeCharacteristics(raw.characteristics),
    careerIds: Array.isArray(raw.careerIds)
      ? raw.careerIds.filter((careerId): careerId is string => typeof careerId === 'string')
      : [],
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
    createdAt: character.createdAt,
    updatedAt: character.updatedAt
  }

  if (!isValidCharacter(nextCharacter)) {
    throw new Error('Character import is invalid.')
  }

  return nextCharacter
}
