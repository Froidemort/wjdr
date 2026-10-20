import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCompendiumSpells } from '../services/compendiumRepository'
import type { CompendiumSpell } from '../types/compendium'

const ERROR_MESSAGE = 'Impossible de charger les sorts. Réessaie dans un instant.'

export const useCompendiumSpellsStore = defineStore('compendiumSpells', () => {
  const spells = ref<CompendiumSpell[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  let pending: Promise<void> | null = null

  function loadSpells(force = false): Promise<void> {
    if (!force && loaded.value) return Promise.resolve()
    if (pending) return pending

    loading.value = true
    error.value = null

    pending = fetchCompendiumSpells()
      .then((rows) => {
        spells.value = rows
        loaded.value = true
      })
      .catch(() => {
        error.value = ERROR_MESSAGE
      })
      .finally(() => {
        loading.value = false
        pending = null
      })

    return pending
  }

  return { spells, loading, loaded, error, loadSpells }
})
