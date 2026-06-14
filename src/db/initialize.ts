import { db } from './schema'

let initialized = false

export const initializeDatabase = async (): Promise<void> => {
  if (initialized) {
    return
  }

  await db.open()
  initialized = true
}
