import { ref } from 'vue'
import { createCatalogService, type Catalogs, type CatalogService } from '../../services/catalogProvider.js'

let catalogService: CatalogService | undefined

const catalogs = ref<Catalogs | undefined>()
const isLoading = ref(false)
const error = ref<string | undefined>()

export const useCatalogs = () => {
  const initialize = async (remoteUrl?: string): Promise<void> => {
    if (!catalogService) {
      catalogService = createCatalogService(remoteUrl)
    }

    isLoading.value = true
    error.value = undefined

    try {
      catalogs.value = await catalogService.getCatalogs()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoading.value = false
    }
  }

  const getSkills = () => catalogs.value?.skills ?? []
  const getTalents = () => catalogs.value?.talents ?? []
  const getCareers = () => catalogs.value?.careers ?? []
  const getCareerTransitions = () => catalogs.value?.careerTransitions ?? []

  return {
    initialize,
    catalogs,
    isLoading,
    error,
    getSkills,
    getTalents,
    getCareers,
    getCareerTransitions
  }
}
