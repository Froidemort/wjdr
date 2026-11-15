import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readSpellShortcut, saveSpellShortcut, spellShortcutKey } from '../services/spellShortcutPreferencesRepository'

export interface SpellShortcutPreference {
  categories: string[] | null
  temporary: boolean
  error: string | null
}

export const useSpellShortcutPreferencesStore = defineStore('spellShortcutPreferences', () => {
  const entries = reactive<Record<string, SpellShortcutPreference>>({})

  function get(userId: string, characterId: string): SpellShortcutPreference {
    const key = spellShortcutKey(userId, characterId)
    if (!entries[key]) {
      try {
        entries[key] = { categories: readSpellShortcut(userId, characterId), temporary: false, error: null }
      } catch {
        entries[key] = { categories: null, temporary: false, error: 'Lecture des préférences impossible sur cet appareil.' }
      }
    }
    return entries[key]
  }

  function save(userId: string, characterId: string, categories: string[]): boolean {
    const entry = get(userId, characterId)
    try {
      saveSpellShortcut(userId, characterId, categories)
      entry.categories = [...categories]
      entry.temporary = false
      entry.error = null
      return true
    } catch {
      entry.error = 'Enregistrement impossible sur cet appareil. Tu peux utiliser cette sélection temporairement.'
      return false
    }
  }

  function useTemporarily(userId: string, characterId: string, categories: string[]): void {
    const entry = get(userId, characterId)
    entry.categories = [...categories]
    entry.temporary = true
    entry.error = 'Sélection temporaire : elle ne sera pas conservée après rechargement de la page.'
  }

  return { get, save, useTemporarily }
})
