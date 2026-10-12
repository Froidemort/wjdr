import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  fetchCompendiumArmors,
  fetchCompendiumItems,
  fetchCompendiumWeapons,
} from '../services/compendiumRepository'
import type {
  CompendiumArmor,
  CompendiumItem,
  CompendiumTab,
  CompendiumWeapon,
} from '../types/compendium'

const ERROR_MESSAGE = 'Impossible de charger le compendium. Réessaie dans un instant.'

export const useCompendiumInventoryStore = defineStore('compendiumInventory', () => {
  const weapons = ref<CompendiumWeapon[]>([])
  const armors = ref<CompendiumArmor[]>([])
  const items = ref<CompendiumItem[]>([])

  const loading = ref<Record<CompendiumTab, boolean>>({ weapons: false, armors: false, items: false })
  const loaded = ref<Record<CompendiumTab, boolean>>({ weapons: false, armors: false, items: false })
  const errors = ref<Record<CompendiumTab, string | null>>({ weapons: null, armors: null, items: null })

  const pending = new Map<CompendiumTab, Promise<void>>()

  function run<T>(tab: CompendiumTab, fetcher: () => Promise<T[]>, assign: (rows: T[]) => void, force: boolean): Promise<void> {
    if (!force && loaded.value[tab]) return Promise.resolve()

    const inFlight = pending.get(tab)
    if (inFlight) return inFlight

    loading.value[tab] = true
    errors.value[tab] = null

    const request = fetcher()
      .then((rows) => {
        assign(rows)
        loaded.value[tab] = true
      })
      .catch(() => {
        errors.value[tab] = ERROR_MESSAGE
      })
      .finally(() => {
        loading.value[tab] = false
        pending.delete(tab)
      })

    pending.set(tab, request)
    return request
  }

  function loadWeapons(force = false): Promise<void> {
    return run('weapons', fetchCompendiumWeapons, (rows) => { weapons.value = rows }, force)
  }

  function loadArmors(force = false): Promise<void> {
    return run('armors', fetchCompendiumArmors, (rows) => { armors.value = rows }, force)
  }

  function loadItems(force = false): Promise<void> {
    return run('items', fetchCompendiumItems, (rows) => { items.value = rows }, force)
  }

  function loadTab(tab: CompendiumTab, force = false): Promise<void> {
    if (tab === 'weapons') return loadWeapons(force)
    if (tab === 'armors') return loadArmors(force)
    return loadItems(force)
  }

  return { weapons, armors, items, loading, loaded, errors, loadWeapons, loadArmors, loadItems, loadTab }
})
