import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { searchCatalog } from '../services/catalogRepository'
import {
  listCareerCharacteristicsByCareerId,
  listCareerPathCareersByFromCareerId,
  type CareerCharacteristic,
} from '../services/careersRepository'
import {
  replaceCharacterTotalAdvancedValues,
  updateCharacterCareer,
} from '../services/charactersRepository'
import type { CatalogItem } from '../types/domain'
import { sortStatsByCharacteristicOrder } from '../utils/characterSheet'
import type { FeedbackSection } from './useCharacterSheet'

interface CareerCharacter {
  id: string
  careerId?: string | null
  stats: Parameters<typeof sortStatsByCharacteristicOrder>[0]
}

interface UseCharacterCareerOptions {
  character: Ref<CareerCharacter | null>
  canEditQuickSection: ComputedRef<boolean>
  loadCharacter: () => Promise<unknown>
  setSectionSuccess: (section: FeedbackSection, message: string) => void
  careerDialogRef: Ref<HTMLDialogElement | null>
  careerConfirmDialogRef: Ref<HTMLDialogElement | null>
}

export function useCharacterCareer({
  character,
  canEditQuickSection,
  loadCharacter,
  setSectionSuccess,
  careerDialogRef,
  careerConfirmDialogRef,
}: UseCharacterCareerOptions) {
  const careerQuery = ref('')
  const careerOptions = ref<CatalogItem[]>([])
  const careerPathOptions = ref<CatalogItem[]>([])
  const careerFilterMode = ref<'paths' | 'all'>('paths')
  const selectedCareerId = ref<string | null>(null)
  const selectedCareerName = ref<string | null>(null)
  const pendingCareerId = ref<string | null>(null)
  const pendingCareerName = ref<string | null>(null)
  const pendingCareerCharacteristics = ref<CareerCharacteristic[]>([])
  const careerError = ref<string | null>(null)
  const careerConfirmError = ref<string | null>(null)
  const changingCareer = ref(false)
  const careerSearchLoading = ref(false)
  const careerPathLoading = ref(false)
  const careerCharacteristicsLoading = ref(false)

  const pendingCareerCharacteristicRows = computed(() => {
    const allStatsSorted = character.value ? sortStatsByCharacteristicOrder(character.value.stats) : []
    const valuesByCode = new Map(
      pendingCareerCharacteristics.value.map((entry) => [entry.statCode.toUpperCase(), entry.value])
    )
    const orderedCodes = allStatsSorted.map((entry) => entry.statCode.toUpperCase())
    const unknownCodes = Array.from(valuesByCode.keys()).filter((code) => !orderedCodes.includes(code))
    unknownCodes.sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }))

    return [...orderedCodes, ...unknownCodes].map((statCode) => ({
      statCode,
      value: valuesByCode.get(statCode) ?? 0,
    }))
  })

  async function refreshCareerOptions(): Promise<void> {
    const trimmed = careerQuery.value.trim()

    if (careerFilterMode.value === 'paths') {
      careerSearchLoading.value = false
      const normalizedQuery = trimmed.toLocaleLowerCase('fr')
      if (!normalizedQuery) {
        careerOptions.value = [...careerPathOptions.value]
        return
      }

      careerOptions.value = careerPathOptions.value.filter((option) =>
        option.name.toLocaleLowerCase('fr').includes(normalizedQuery)
      )
      return
    }

    if (trimmed.length < 2) {
      careerSearchLoading.value = false
      careerOptions.value = []
      return
    }

    careerSearchLoading.value = true
    try {
      careerOptions.value = await searchCatalog('careers', trimmed)
    } catch {
      careerOptions.value = []
    } finally {
      careerSearchLoading.value = false
    }
  }

  async function loadCareerPathOptions(): Promise<void> {
    if (!character.value?.careerId) {
      careerPathOptions.value = []
      return
    }

    careerPathLoading.value = true
    try {
      const paths = await listCareerPathCareersByFromCareerId(character.value.careerId)
      careerPathOptions.value = paths.map((path) => ({
        id: path.id,
        name: path.name,
        description: null,
        specialization: null,
        encumbrance: null,
        damageFormula: null,
        armorPoints: null,
      }))
    } finally {
      careerPathLoading.value = false
    }
  }

  async function openCareerModal(): Promise<void> {
    careerError.value = null
    careerConfirmError.value = null
    selectedCareerId.value = null
    selectedCareerName.value = null
    careerFilterMode.value = 'paths'
    careerQuery.value = ''
    careerOptions.value = []
    careerPathOptions.value = []
    careerSearchLoading.value = false
    careerPathLoading.value = false
    careerCharacteristicsLoading.value = false

    try {
      await loadCareerPathOptions()
      await refreshCareerOptions()
    } catch (error) {
      careerError.value =
        error instanceof Error ? error.message : 'Chargement des débouchés impossible.'
    }

    if (!careerDialogRef.value) {
      return
    }

    careerDialogRef.value.showModal()
  }

  function resetCareerModalState(): void {
    selectedCareerId.value = null
    selectedCareerName.value = null
    careerError.value = null
    careerSearchLoading.value = false
    careerPathLoading.value = false
  }

  function closeCareerModal(): void {
    if (careerDialogRef.value?.open) {
      careerDialogRef.value.close()
      return
    }
    resetCareerModalState()
  }

  function onCareerDialogClosed(): void {
    resetCareerModalState()
  }

  function selectCareer(id: string, name: string): void {
    selectedCareerId.value = id
    selectedCareerName.value = name
    careerError.value = null
  }

  function resetPendingCareerChange(): void {
    pendingCareerId.value = null
    pendingCareerName.value = null
    pendingCareerCharacteristics.value = []
    careerConfirmError.value = null
  }

  function closeCareerConfirmModal(): void {
    if (careerConfirmDialogRef.value?.open) {
      careerConfirmDialogRef.value.close()
      return
    }
    careerCharacteristicsLoading.value = false
    resetPendingCareerChange()
  }

  function onCareerConfirmDialogClosed(): void {
    careerCharacteristicsLoading.value = false
    resetPendingCareerChange()
  }

  async function confirmCareerChange(): Promise<void> {
    if (!character.value || !canEditQuickSection.value || changingCareer.value) {
      return
    }

    if (!selectedCareerId.value) {
      careerError.value = 'Veuillez sélectionner une carrière.'
      return
    }

    if (selectedCareerId.value === character.value.careerId) {
      closeCareerModal()
      return
    }

    careerError.value = null
    careerConfirmError.value = null
    careerCharacteristicsLoading.value = true
    try {
      pendingCareerId.value = selectedCareerId.value
      pendingCareerName.value = selectedCareerName.value
      pendingCareerCharacteristics.value = await listCareerCharacteristicsByCareerId(selectedCareerId.value)
      closeCareerModal()
      careerConfirmDialogRef.value?.showModal()
    } catch (error) {
      careerError.value =
        error instanceof Error ? error.message : 'Modification de carrière impossible.'
    } finally {
      careerCharacteristicsLoading.value = false
    }
  }

  async function applyCareerChange(applyCareerCharacteristics: boolean): Promise<void> {
    if (!character.value || !pendingCareerId.value || changingCareer.value) {
      return
    }

    changingCareer.value = true
    careerConfirmError.value = null
    let careerUpdated = false

    try {
      await updateCharacterCareer(character.value.id, pendingCareerId.value)
      careerUpdated = true

      if (applyCareerCharacteristics) {
        const totalAdvancedByStatCode = pendingCareerCharacteristics.value.reduce<
          Record<string, number>
        >((accumulator, entry) => {
          accumulator[entry.statCode] = entry.value
          return accumulator
        }, {})
        await replaceCharacterTotalAdvancedValues(character.value.id, totalAdvancedByStatCode)
      }

      await loadCharacter()
      setSectionSuccess(
        'career',
        applyCareerCharacteristics
          ? 'Carrière et caractéristiques mises à jour.'
          : 'Carrière mise à jour.'
      )
      closeCareerConfirmModal()
    } catch (error) {
      if (careerUpdated) {
        await loadCharacter().catch(() => undefined)
        careerConfirmError.value =
          error instanceof Error
            ? `Carrière mise à jour, mais profil de carrière non appliqué : ${error.message}`
            : 'Carrière mise à jour, mais profil de carrière non appliqué.'
        return
      }

      careerConfirmError.value =
        error instanceof Error ? error.message : 'Modification de carrière impossible.'
    } finally {
      changingCareer.value = false
    }
  }

  watch(careerQuery, async () => {
    await refreshCareerOptions()
  })

  watch(careerFilterMode, async () => {
    careerError.value = null
    selectedCareerId.value = null
    selectedCareerName.value = null
    await refreshCareerOptions()
  })

  return {
    careerQuery,
    careerOptions,
    careerPathOptions,
    careerFilterMode,
    selectedCareerId,
    selectedCareerName,
    pendingCareerName,
    pendingCareerCharacteristicRows,
    careerError,
    careerConfirmError,
    changingCareer,
    careerSearchLoading,
    careerPathLoading,
    careerCharacteristicsLoading,
    openCareerModal,
    closeCareerModal,
    onCareerDialogClosed,
    selectCareer,
    closeCareerConfirmModal,
    onCareerConfirmDialogClosed,
    confirmCareerChange,
    applyCareerChange,
  }
}
