import { computed, type Ref, ref } from 'vue'
import {
  invalidateCharacterLinksCache,
  listCharacterLinksBundle,
  removeCharacterItem,
  removeCharacterSkill,
  removeCharacterTalent,
  updateCharacterItemQuality,
  updateCharacterItemQuantity,
  updateCharacterSkillMastery,
} from '../services/characterLinksRepository'
import type {
  CharacterArmor,
  CharacterDetail,
  CharacterItem,
  CharacterSkill,
  CharacterTalent,
  CharacterWeapon,
} from '../types/domain'
import { safeErrorMessage } from '../utils/errorMessages'
import { isInventoryQuality } from '../utils/inventoryQuality'
import type { CharacterFeedbackHelpers } from './useCharacterFeedback'

interface UseCharacterLinksOptions {
  character: Ref<CharacterDetail | null>
  getCharacterId: () => string
  canEdit: Readonly<Ref<boolean>>
  errorMessage: Ref<string | null>
  feedback: CharacterFeedbackHelpers
}

const LINKS_REFRESH_ERROR = 'Actualisation impossible, rechargez la page.'

function sortByName<T extends { name: string }>(entries: T[]): T[] {
  return [...entries].sort((left, right) =>
    left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
  )
}

export function useCharacterLinks({
  character,
  getCharacterId,
  canEdit,
  errorMessage,
  feedback,
}: UseCharacterLinksOptions) {
  const {
    actionBusyKey,
    setSectionSuccess,
    confirmDestructiveAction,
    beginAction,
    endAction,
    runWithBusyAction,
  } = feedback

  const characterSkills = ref<CharacterSkill[]>([])
  const characterTalents = ref<CharacterTalent[]>([])
  const characterWeapons = ref<CharacterWeapon[]>([])
  const characterArmors = ref<CharacterArmor[]>([])
  const characterItems = ref<CharacterItem[]>([])
  const linksCharacterId = ref<string | null>(null)
  const linksError = ref<string | null>(null)
  const linksLoading = ref(false)
  let linksRequestSeq = 0

  const sortedCharacterSkills = computed(() => sortByName(characterSkills.value))
  const sortedCharacterTalents = computed(() => sortByName(characterTalents.value))
  const sortedCharacterWeapons = computed(() => sortByName(characterWeapons.value))
  const sortedCharacterArmors = computed(() => sortByName(characterArmors.value))
  const sortedCharacterItems = computed(() => sortByName(characterItems.value))

  function invalidateCurrentLinksCache(): void {
    const currentCharacterId = getCharacterId()
    if (!currentCharacterId) {
      return
    }

    invalidateCharacterLinksCache(currentCharacterId)
  }

  async function loadCharacterLinks(
    characterId: string,
    options: { force?: boolean } = {}
  ): Promise<void> {
    const requestSeq = ++linksRequestSeq
    linksLoading.value = true
    try {
      const links = await listCharacterLinksBundle(characterId, options)
      if (requestSeq !== linksRequestSeq || characterId !== getCharacterId()) {
        return
      }
      characterSkills.value = links.skills
      characterTalents.value = links.talents
      characterWeapons.value = links.weapons
      characterArmors.value = links.armors
      characterItems.value = links.items
      linksCharacterId.value = characterId
      linksError.value = null
    } catch (error) {
      if (requestSeq === linksRequestSeq && characterId === getCharacterId()) {
        linksError.value = LINKS_REFRESH_ERROR
      }
      throw error
    } finally {
      if (requestSeq === linksRequestSeq) {
        linksLoading.value = false
      }
    }
  }

  function resetLinks(): void {
    linksRequestSeq++
    characterSkills.value = []
    characterTalents.value = []
    characterWeapons.value = []
    characterArmors.value = []
    characterItems.value = []
    linksCharacterId.value = null
    linksError.value = null
    linksLoading.value = false
  }

  async function retryLoadLinks(): Promise<void> {
    const currentCharacterId = getCharacterId()
    if (!currentCharacterId) {
      return
    }

    try {
      await loadCharacterLinks(currentCharacterId, { force: true })
    } catch {
      // linksError is already recorded by loadCharacterLinks.
    }
  }

  async function reloadLinksAfterDelete(id: string): Promise<void> {
    try {
      await loadCharacterLinks(id, { force: true })
    } catch {
      // linksError is already recorded by loadCharacterLinks.
    }
  }

  async function onChangeSkillMastery(skillId: string, level: 1 | 2 | 3): Promise<void> {
    if (!character.value || !canEdit.value) {
      return
    }

    const currentCharacterId = character.value.id

    const target = characterSkills.value.find((skill) => skill.skillId === skillId)
    if (target && target.masteryLevel === level) {
      return
    }

    await runWithBusyAction(`mastery-${skillId}`, async () => {
      try {
        await updateCharacterSkillMastery(currentCharacterId, skillId, level)
        if (target) {
          target.masteryLevel = level
        }
        invalidateCurrentLinksCache()
        setSectionSuccess('skills', 'Niveau de maîtrise mis à jour.')
      } catch (error) {
        errorMessage.value =
          safeErrorMessage(error, 'Modification du niveau de maîtrise impossible.')
      }
    })
  }

  async function onDeleteSkill(skillId: string): Promise<void> {
    if (!character.value || !canEdit.value || actionBusyKey.value) {
      return
    }

    const currentCharacterId = character.value.id

    beginAction(`skill-${skillId}`)
    try {
      await removeCharacterSkill(currentCharacterId, skillId)
      invalidateCurrentLinksCache()
      await reloadLinksAfterDelete(currentCharacterId)
      setSectionSuccess('skills', 'Compétence supprimée.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error, 'Suppression impossible.')
    } finally {
      endAction()
    }
  }

  async function onDeleteTalent(talentId: string): Promise<void> {
    if (!character.value || !canEdit.value || actionBusyKey.value) {
      return
    }

    const currentCharacterId = character.value.id

    beginAction(`talent-${talentId}`)
    try {
      await removeCharacterTalent(currentCharacterId, talentId)
      invalidateCurrentLinksCache()
      await reloadLinksAfterDelete(currentCharacterId)
      setSectionSuccess('talents', 'Talent supprimé.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error, 'Suppression impossible.')
    } finally {
      endAction()
    }
  }

  async function onDeleteItem(linkId: string): Promise<void> {
    if (!canEdit.value || !character.value || actionBusyKey.value) {
      return
    }

    const currentCharacterId = character.value.id

    if (!(await confirmDestructiveAction('Supprimer cet équipement ?'))) {
      return
    }

    beginAction(`item-${linkId}`)
    try {
      await removeCharacterItem(linkId)
      invalidateCurrentLinksCache()
      await reloadLinksAfterDelete(currentCharacterId)
      setSectionSuccess('items', 'Équipement supprimé.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error, 'Suppression impossible.')
    } finally {
      endAction()
    }
  }

  async function onChangeItemQuantity(item: CharacterItem, delta: number): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const nextQuantity = Math.max(1, item.quantity + delta)
    if (nextQuantity === item.quantity) {
      return
    }

    if (!beginAction(`item-qty-${item.id}`)) {
      return
    }

    try {
      await updateCharacterItemQuantity(item.id, nextQuantity)
      item.quantity = nextQuantity
      invalidateCurrentLinksCache()
      setSectionSuccess('items', 'Quantité mise à jour.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
    } finally {
      endAction()
    }
  }

  async function onItemQualityChange(
    item: CharacterItem,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    if (!isInventoryQuality(quality)) {
      return
    }

    if (quality === item.quality) {
      return
    }

    await runWithBusyAction(`item-quality-${item.id}`, async () => {
      try {
        await updateCharacterItemQuality(item.id, quality)
        item.quality = quality
        invalidateCurrentLinksCache()
        setSectionSuccess('items', 'Qualité de l\'équipement mise à jour.')
      } catch (error) {
        errorMessage.value = safeErrorMessage(error)
      }
    })
  }

  return {
    linksCharacterId,
    linksError,
    linksLoading,
    characterSkills,
    characterTalents,
    characterWeapons,
    characterArmors,
    characterItems,
    sortedCharacterSkills,
    sortedCharacterTalents,
    sortedCharacterWeapons,
    sortedCharacterArmors,
    sortedCharacterItems,
    loadCharacterLinks,
    resetLinks,
    retryLoadLinks,
    invalidateCurrentLinksCache,
    reloadLinksAfterDelete,
    onChangeSkillMastery,
    onDeleteSkill,
    onDeleteTalent,
    onDeleteItem,
    onChangeItemQuantity,
    onItemQualityChange,
  }
}
