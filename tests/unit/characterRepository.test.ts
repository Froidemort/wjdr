import { db } from '../../src/db/schema'
import type { Character } from '../../src/domain/character'
import {
  createAndSaveCharacter,
  deleteCharacter,
  getCharacterById,
  listCharacters,
  patchCharacterResources,
  saveCharacter
} from '../../src/repositories/characterRepository'

describe('characterRepository', () => {
  beforeEach(async () => {
    if (!db.isOpen()) {
      await db.open()
    }
    await db.characters.clear()
  })

  afterAll(async () => {
    await db.delete()
  })

  it('creates and reads a character', async () => {
    const created = await createAndSaveCharacter('Gotrek')

    const byId = await getCharacterById(created.id)
    expect(byId?.name).toBe('Gotrek')

    const list = await listCharacters()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(created.id)
  })

  it('sorts list by most recent updatedAt', async () => {
    const older = await createAndSaveCharacter('Older')
    const newer = await createAndSaveCharacter('Newer')

    const olderUpdated: Character = {
      ...older,
      updatedAt: '2025-01-01T00:00:00.000Z'
    }

    const newerUpdated: Character = {
      ...newer,
      updatedAt: '2026-01-01T00:00:00.000Z'
    }

    await saveCharacter(olderUpdated)
    await saveCharacter(newerUpdated)

    const list = await listCharacters()
    expect(list[0].name).toBe('Newer')
    expect(list[1].name).toBe('Older')
  })

  it('patches resources for an existing character', async () => {
    const created = await createAndSaveCharacter('Felix')

    const patched = await patchCharacterResources(created.id, {
      woundsCurrent: 7,
      fortune: 4,
      fate: 2
    })

    expect(patched.wounds.current).toBe(7)
    expect(patched.fortune).toBe(4)
    expect(patched.fate).toBe(2)

    const stored = await getCharacterById(created.id)
    expect(stored?.wounds.current).toBe(7)
  })

  it('throws on invalid save payload', async () => {
    const created = await createAndSaveCharacter('Invalid')

    const invalid: Character = {
      ...created,
      wounds: {
        current: 99,
        max: 1
      }
    }

    await expect(saveCharacter(invalid)).rejects.toThrow('Character data is invalid.')
  })

  it('deletes a character', async () => {
    const created = await createAndSaveCharacter('Delete me')

    await deleteCharacter(created.id)

    const byId = await getCharacterById(created.id)
    expect(byId).toBeUndefined()
  })

  it('throws when patch target does not exist', async () => {
    await expect(
      patchCharacterResources('missing-id', { fortune: 1 })
    ).rejects.toThrow('Character not found.')
  })
})
