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
    const links = await listCharacterLinksBundle(characterId, options)
    characterSkills.value = links.skills
    characterTalents.value = links.talents
    characterWeapons.value = links.weapons
    characterArmors.value = links.armors
    characterItems.value = links.items
  }

  async function reloadLinksAfterDelete(id: string): Promise<void> {
    try {
      await loadCharacterLinks(id, { force: true })
    } catch {
      errorMessage.value = 'Actualisation impossible, rechargez la page.'
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

    if (!(await confirmDestructiveAction('Supprimer cette compétence ?'))) {
      return
    }

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

    if (!(await confirmDestructiveAction('Supprimer ce talent ?'))) {
      return
    }

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
