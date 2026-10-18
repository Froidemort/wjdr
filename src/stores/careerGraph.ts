import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listAllCareerPaths, listAllCareers } from '../services/careersRepository'
import type { CareerPathCareer } from '../types/career'
import type { CareerPathRow } from '../types/db'

const ERROR_MESSAGE = 'Impossible de charger les carrières. Réessaie dans un instant.'

export const useCareerGraphStore = defineStore('careerGraph', () => {
  const careers = ref<CareerPathCareer[]>([])
  const paths = ref<CareerPathRow[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  let pending: Promise<void> | null = null

  function load(force = false): Promise<void> {
    if (!force && loaded.value) return Promise.resolve()
    if (pending) return pending

    loading.value = true
    error.value = null

    pending = Promise.all([listAllCareers(), listAllCareerPaths()])
      .then(([careerRows, pathRows]) => {
        careers.value = careerRows
        paths.value = pathRows
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

  return { careers, paths, loading, loaded, error, load }
})
