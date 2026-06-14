import { createCharacter, isValidCharacter, type Character, type ResourcePatch } from '../domain/character'
import { db } from '../db/schema'

export const listCharacters = async (): Promise<Character[]> => {
  const rows = await db.characters.toArray()
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const getCharacterById = async (id: string): Promise<Character | undefined> =>
  db.characters.get(id)

export const createAndSaveCharacter = async (name: string): Promise<Character> => {
  const character = createCharacter(name)
  await db.characters.put(character)
  return character
}

export const saveCharacter = async (character: Character): Promise<void> => {
  if (!isValidCharacter(character)) {
    throw new Error('Character data is invalid.')
  }

  await db.characters.put(character)
}

export const patchCharacterResources = async (
  id: string,
  patch: ResourcePatch
): Promise<Character> => {
  const existing = await getCharacterById(id)
  if (!existing) {
    throw new Error('Character not found.')
  }

  const next: Character = {
    ...existing,
    wounds: {
      current:
        patch.woundsCurrent === undefined ? existing.wounds.current : patch.woundsCurrent,
      max: patch.woundsMax === undefined ? existing.wounds.max : patch.woundsMax
    },
    fortune: patch.fortune === undefined ? existing.fortune : patch.fortune,
    fate: patch.fate === undefined ? existing.fate : patch.fate,
    updatedAt: new Date().toISOString()
  }

  await saveCharacter(next)
  return next
}

export const deleteCharacter = async (id: string): Promise<void> => {
  await db.characters.delete(id)
}
