import Dexie, { type Table } from 'dexie'
import type { Character } from '../domain/character'

export class WarhammerDatabase extends Dexie {
  characters!: Table<Character, string>

  constructor() {
    super('warhammer-sheet-db')

    this.version(1).stores({
      characters: 'id, name, updatedAt, createdAt'
    })
  }
}

export const db = new WarhammerDatabase()
