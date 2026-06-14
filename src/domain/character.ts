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
