import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'
import { createCatalogItem, searchCatalog } from '../services/catalogRepository'
import {
  addCharacterArmors,
  addCharacterItems,
  addCharacterSkills,
  addCharacterTalents,
  addCharacterWeapons,
} from '../services/characterLinksRepository'
import type { CatalogItem } from '../types/domain'
import { formatNamedWithSpecialization } from '../utils/characterSheet'
import { safeErrorMessage } from '../utils/errorMessages'
import type { FeedbackSection } from './useCharacterFeedback'
import type { ITEM_QUALITY_OPTIONS } from '../utils/inventoryQuality'

export type CatalogSection = 'skills' | 'talents' | 'weapons' | 'armors' | 'items'
type ItemQuality = (typeof ITEM_QUALITY_OPTIONS)[number]

export interface NewItemForm {
  name: string
  description: string
  quality: ItemQuality
  encumbrance: number
  quantity: number
}

const CATALOG_LABELS: Record<CatalogSection, string> = {
  skills: 'compétences',
  talents: 'talents',
  weapons: 'armes',
  armors: 'armures',
  items: 'équipements',
}

const MAX_CATALOG_RESULTS = 8

interface UseCharacterCatalogActionsOptions {
  character: Ref<{ id: string } | null>
  canEditQuickSection: ComputedRef<boolean>
  invalidateCurrentLinksCache: () => void
  loadCharacterLinks: (characterId: string, options?: { force?: boolean }) => Promise<unknown>
  setSectionSuccess: (section: FeedbackSection, message: string) => void
  confirmDestructiveAction: (message: string) => Promise<boolean>
  catalogDialogRef: Ref<HTMLDialogElement | null>
}

export function formatCatalogOptionLabel(section: CatalogSection, option: CatalogItem): string {
  if (section === 'skills' || section === 'talents') {
    return formatNamedWithSpecialization(option.name, option.specialization ?? null)
  }

  const meta =
    typeof option.encumbrance === 'number' ? ` (enc. ${option.encumbrance})` : ''

  if (section === 'weapons') {
    const damage = option.damageFormula ? ` - ${option.damageFormula}` : ''
    return `${option.name}${meta}${damage}`
  }

  if (section === 'armors') {
    const armorPoints = typeof option.armorPoints === 'number' ? ` - PA ${option.armorPoints}` : ''
    return `${option.name}${meta}${armorPoints}`
  }

  return `${option.name}${meta}`
}

export function useCharacterCatalogActions({
  character,
  canEditQuickSection,
  invalidateCurrentLinksCache,
  loadCharacterLinks,
  setSectionSuccess,
  confirmDestructiveAction,
  catalogDialogRef,
}: UseCharacterCatalogActionsOptions) {
  const catalogSection = ref<CatalogSection>('skills')
  const catalogQuery = ref('')
  const catalogOptions = ref<CatalogItem[]>([])
  const selectedCatalogIds = ref<string[]>([])
  const selectedCatalogLabels = ref<Record<string, string>>({})
  const catalogError = ref<string | null>(null)
  const addingCatalog = ref(false)
  const itemCatalogMode = ref<'search' | 'create'>('search')
  const creatingItem = ref(false)
  const catalogSearchLoading = ref(false)
  const catalogSearchFailed = ref(false)
  // Created catalog item kept so a retry after a failed link does not duplicate it
  let createdItemId: string | null = null
  const selectedItemsQuality = ref<ItemQuality>('normal')
  const selectedItemsQuantity = ref(1)
  const newItemForm = ref<NewItemForm>({
    name: '',
    description: '',
    quality: 'normal',
    encumbrance: 0,
    quantity: 1,
  })
  let catalogSearchSequence = 0

  const modalSectionLabel = computed(() => CATALOG_LABELS[catalogSection.value])
  const displayedCatalogOptions = computed(() => catalogOptions.value.slice(0, MAX_CATALOG_RESULTS))

  const scheduleCatalogSearch = useDebounceFn(
    async (trimmed: string, requestId: number, section: CatalogSection) => {
      catalogSearchLoading.value = true
      catalogSearchFailed.value = false
      try {
        const results = await searchCatalog(section, trimmed)
        if (requestId !== catalogSearchSequence) {
          return
        }

        catalogOptions.value = results
      } catch (error) {
        if (requestId !== catalogSearchSequence) {
          return
        }

        catalogOptions.value = []
        catalogSearchFailed.value = true
        catalogError.value = safeErrorMessage(error, 'Recherche impossible. Réessayez.')
      } finally {
        if (requestId === catalogSearchSequence) {
          catalogSearchLoading.value = false
        }
      }
    },
    180
  )

  function labelFor(option: CatalogItem): string {
    return formatCatalogOptionLabel(catalogSection.value, option)
  }

  function resetNewItemForm(): void {
    createdItemId = null
    newItemForm.value = {
      name: '',
      description: '',
      quality: 'normal',
      encumbrance: 0,
      quantity: 1,
    }
  }

  function resetSelectedItemsSettings(): void {
    selectedItemsQuality.value = 'normal'
    selectedItemsQuantity.value = 1
  }

  function openCatalogModal(section: CatalogSection): void {
    catalogSection.value = section
    catalogQuery.value = ''
    catalogOptions.value = []
    selectedCatalogIds.value = []
    selectedCatalogLabels.value = {}
    catalogError.value = null
    catalogSearchLoading.value = false
    catalogSearchFailed.value = false
    itemCatalogMode.value = 'search'
    creatingItem.value = false
    resetSelectedItemsSettings()
    resetNewItemForm()
    catalogDialogRef.value?.showModal()
  }

  function resetCatalogModalState(): void {
    selectedCatalogIds.value = []
    selectedCatalogLabels.value = {}
    catalogError.value = null
    catalogSearchLoading.value = false
    catalogSearchFailed.value = false
    itemCatalogMode.value = 'search'
    creatingItem.value = false
    resetSelectedItemsSettings()
    resetNewItemForm()
  }

  function closeCatalogModal(): void {
    if (catalogDialogRef.value?.open) {
      catalogDialogRef.value.close()
      return
    }
    resetCatalogModalState()
  }

  function onCatalogDialogClosed(): void {
    resetCatalogModalState()
  }

  function removeCatalogSelection(id: string): void {
    selectedCatalogIds.value = selectedCatalogIds.value.filter((selectedId) => selectedId !== id)
    const nextLabels = { ...selectedCatalogLabels.value }
    delete nextLabels[id]
    selectedCatalogLabels.value = nextLabels
  }

  function toggleCatalogSelection(id: string): void {
    if (selectedCatalogIds.value.includes(id)) {
      removeCatalogSelection(id)
      return
    }

    const option = catalogOptions.value.find((candidate) => candidate.id === id)
    if (option) {
      selectedCatalogLabels.value = {
        ...selectedCatalogLabels.value,
        [id]: labelFor(option),
      }
    }

    selectedCatalogIds.value = [...selectedCatalogIds.value, id]
    catalogQuery.value = ''
    catalogOptions.value = []
  }

  async function refreshAfterAdd(characterId: string, successMessage: string): Promise<void> {
    invalidateCurrentLinksCache()
    try {
      await loadCharacterLinks(characterId, { force: true })
    } catch {
      // The write already succeeded: clear the selection so it cannot be added twice
      selectedCatalogIds.value = []
      selectedCatalogLabels.value = {}
      resetNewItemForm()
      catalogError.value = 'Ajout effectué, mais actualisation impossible. Rechargez la fiche.'
      return
    }

    setSectionSuccess('catalog', successMessage)
    closeCatalogModal()
  }

  async function confirmCatalogAdd(): Promise<void> {
    if (!character.value || !canEditQuickSection.value || addingCatalog.value) {
      return
    }

    if (selectedCatalogIds.value.length === 0) {
      catalogError.value = 'Veuillez sélectionner au moins un élément.'
      return
    }

    if (
      !(await confirmDestructiveAction(
        `Ajouter ${selectedCatalogIds.value.length} élément(s) à la fiche ?`
      ))
    ) {
      return
    }

    addingCatalog.value = true
    catalogError.value = null
    try {
      if (catalogSection.value === 'skills') {
        await addCharacterSkills(character.value.id, selectedCatalogIds.value)
      } else if (catalogSection.value === 'talents') {
        await addCharacterTalents(character.value.id, selectedCatalogIds.value)
      } else if (catalogSection.value === 'weapons') {
        await addCharacterWeapons(character.value.id, selectedCatalogIds.value)
      } else if (catalogSection.value === 'armors') {
        await addCharacterArmors(character.value.id, selectedCatalogIds.value)
      } else if (catalogSection.value === 'items') {
        await addCharacterItems(
          character.value.id,
          selectedCatalogIds.value,
          Math.max(1, Math.floor(selectedItemsQuantity.value || 1)),
          selectedItemsQuality.value
        )
      }

      await refreshAfterAdd(
        character.value.id,
        `${selectedCatalogIds.value.length} élément(s) ajouté(s).`
      )
    } catch (error) {
      catalogError.value = safeErrorMessage(error, 'Ajout impossible.')
    } finally {
      addingCatalog.value = false
    }
  }

  async function confirmItemCreate(): Promise<void> {
    if (!character.value || !canEditQuickSection.value || creatingItem.value) {
      return
    }

    const trimmedName = newItemForm.value.name.trim()
    if (!trimmedName) {
      catalogError.value = 'Le nom de l\'équipement est obligatoire.'
      return
    }

    const normalizedEncumbrance = Math.max(0, Math.floor(newItemForm.value.encumbrance || 0))
    const normalizedQuantity = Math.max(1, Math.floor(newItemForm.value.quantity || 1))

    if (!(await confirmDestructiveAction('Créer puis ajouter cet équipement à la fiche ?'))) {
      return
    }

    creatingItem.value = true
    catalogError.value = null
    try {
      if (!createdItemId) {
        const createdItem = await createCatalogItem({
          name: trimmedName,
          description: newItemForm.value.description || null,
          encumbrance: normalizedEncumbrance,
        })
        createdItemId = createdItem.id
      }

      await addCharacterItems(
        character.value.id,
        [createdItemId],
        normalizedQuantity,
        newItemForm.value.quality
      )
      await refreshAfterAdd(character.value.id, 'Équipement créé et ajouté.')
    } catch (error) {
      catalogError.value = safeErrorMessage(error, 'Création impossible.')
    } finally {
      creatingItem.value = false
    }
  }

  // Editing the identity fields makes the created item stale
  watch(
    () => [newItemForm.value.name, newItemForm.value.description, newItemForm.value.encumbrance],
    () => {
      createdItemId = null
    }
  )

  watch(catalogQuery, async (value) => {
    scheduleCatalogSearch.cancel()
    catalogSearchFailed.value = false
    catalogError.value = null

    if (catalogSection.value === 'items' && itemCatalogMode.value === 'create') {
      catalogOptions.value = []
      catalogSearchLoading.value = false
      return
    }

    const trimmed = value.trim()
    if (trimmed.length < 2) {
      catalogOptions.value = []
      catalogSearchLoading.value = false
      return
    }

    const requestId = ++catalogSearchSequence
    void scheduleCatalogSearch(trimmed, requestId, catalogSection.value)
  })

  onBeforeUnmount(() => {
    scheduleCatalogSearch.cancel()
  })

  return {
    catalogSection,
    catalogQuery,
    catalogOptions,
    displayedCatalogOptions,
    selectedCatalogIds,
    selectedCatalogLabels,
    catalogError,
    addingCatalog,
    itemCatalogMode,
    creatingItem,
    catalogSearchLoading,
    catalogSearchFailed,
    selectedItemsQuality,
    selectedItemsQuantity,
    newItemForm,
    modalSectionLabel,
    formatCatalogOptionLabel: labelFor,
    openCatalogModal,
    closeCatalogModal,
    onCatalogDialogClosed,
    toggleCatalogSelection,
    removeCatalogSelection,
    confirmCatalogAdd,
    confirmItemCreate,
  }
}
