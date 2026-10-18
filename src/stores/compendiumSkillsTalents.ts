import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCompendiumSkills, fetchCompendiumTalents } from '../services/compendiumRepository'
import type { CompendiumKind, CompendiumSkill, CompendiumTalent } from '../types/compendium'

const ERROR_MESSAGE = 'Impossible de charger le compendium. Réessaie dans un instant.'

export const useCompendiumSkillsTalentsStore = defineStore('compendiumSkillsTalents', () => {
  const skills = ref<CompendiumSkill[]>([])
  const talents = ref<CompendiumTalent[]>([])

  const loading = ref<Record<CompendiumKind, boolean>>({ skills: false, talents: false })
  const loaded = ref<Record<CompendiumKind, boolean>>({ skills: false, talents: false })
  const errors = ref<Record<CompendiumKind, string | null>>({ skills: null, talents: null })

  const pending = new Map<CompendiumKind, Promise<void>>()

  function run<T>(
    kind: CompendiumKind,
    fetcher: () => Promise<T[]>,
    assign: (rows: T[]) => void,
    force: boolean
  ): Promise<void> {
    if (!force && loaded.value[kind]) return Promise.resolve()

    const inFlight = pending.get(kind)
    if (inFlight) return inFlight

    loading.value[kind] = true
    errors.value[kind] = null

    const request = fetcher()
      .then((rows) => {
        assign(rows)
        loaded.value[kind] = true
      })
      .catch(() => {
        errors.value[kind] = ERROR_MESSAGE
      })
      .finally(() => {
        loading.value[kind] = false
        pending.delete(kind)
      })

    pending.set(kind, request)
    return request
  }

  function loadSkills(force = false): Promise<void> {
    return run('skills', fetchCompendiumSkills, (rows) => { skills.value = rows }, force)
  }

  function loadTalents(force = false): Promise<void> {
    return run('talents', fetchCompendiumTalents, (rows) => { talents.value = rows }, force)
  }

  return { skills, talents, loading, loaded, errors, loadSkills, loadTalents }
})
