import type { Ref } from 'vue'
import {
  removeCharacterArmor,
  removeCharacterWeapon,
  updateCharacterArmorEquipped,
  updateCharacterArmorQuality,
  updateCharacterWeaponEquipped,
  updateCharacterWeaponQuality,
} from '../services/characterLinksRepository'
import type { CharacterArmor, CharacterDetail, CharacterWeapon } from '../types/domain'
import {
  canEquipArmorStack,
  findConflictingWeapons,
  resolveWeaponEquipHand,
  type WeaponHand,
  type WeaponPreferredHand,
} from '../utils/equipmentSlots'
import { safeErrorMessage } from '../utils/errorMessages'
import { isInventoryQuality } from '../utils/inventoryQuality'
import type { CharacterFeedbackHelpers } from './useCharacterFeedback'
import type { useCharacterLinks } from './useCharacterLinks'

type CharacterLinks = ReturnType<typeof useCharacterLinks>

interface UseCharacterEquipmentOptions {
  character: Ref<CharacterDetail | null>
  canEdit: Readonly<Ref<boolean>>
  errorMessage: Ref<string | null>
  feedback: CharacterFeedbackHelpers
  links: Pick<
    CharacterLinks,
    | 'characterWeapons'
    | 'characterArmors'
    | 'loadCharacterLinks'
    | 'invalidateCurrentLinksCache'
    | 'reloadLinksAfterDelete'
  >
}

export function useCharacterEquipment({
  character,
  canEdit,
  errorMessage,
  feedback,
  links,
}: UseCharacterEquipmentOptions) {
  const {
    actionBusyKey,
    setSectionSuccess,
    confirmDestructiveAction,
    beginAction,
    endAction,
    runWithBusyAction,
  } = feedback
  const {
    characterWeapons,
    characterArmors,
    loadCharacterLinks,
    invalidateCurrentLinksCache,
    reloadLinksAfterDelete,
  } = links

  async function reloadAfterFailure(id: string): Promise<void> {
    invalidateCurrentLinksCache()
    try {
      await loadCharacterLinks(id, { force: true })
    } catch {
      // Keep the original action error message
    }
  }

  async function onDeleteWeapon(linkId: string): Promise<void> {
    if (!canEdit.value || !character.value || actionBusyKey.value) {
      return
    }

    const currentCharacterId = character.value.id

    if (!(await confirmDestructiveAction('Supprimer cette arme ?'))) {
      return
    }

    beginAction(`weapon-${linkId}`)
    try {
      await removeCharacterWeapon(linkId)
      invalidateCurrentLinksCache()
      await reloadLinksAfterDelete(currentCharacterId)
      setSectionSuccess('weapons', 'Arme supprimée.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error, 'Suppression impossible.')
    } finally {
      endAction()
    }
  }

  async function onWeaponQualityChange(
    weapon: CharacterWeapon,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const currentCharacterId = character.value.id

    if (!isInventoryQuality(quality)) {
      return
    }

    if (quality === weapon.quality) {
      return
    }

    await runWithBusyAction(`weapon-quality-${weapon.id}`, async () => {
      try {
        await updateCharacterWeaponQuality(weapon.id, quality)
        invalidateCurrentLinksCache()
        await loadCharacterLinks(currentCharacterId, { force: true })
        setSectionSuccess('weapons', 'Qualité de l\'arme mise à jour.')
      } catch (error) {
        errorMessage.value = safeErrorMessage(error)
      }
    })
  }

  async function onDeleteArmor(linkId: string): Promise<void> {
    if (!canEdit.value || !character.value || actionBusyKey.value) {
      return
    }

    const currentCharacterId = character.value.id

    if (!(await confirmDestructiveAction('Supprimer cette armure ?'))) {
      return
    }

    beginAction(`armor-${linkId}`)
    try {
      await removeCharacterArmor(linkId)
      invalidateCurrentLinksCache()
      await reloadLinksAfterDelete(currentCharacterId)
      setSectionSuccess('armors', 'Armure supprimée.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error, 'Suppression impossible.')
    } finally {
      endAction()
    }
  }

  function ensureArmorCanBeEquipped(armor: CharacterArmor): boolean {
    if (canEquipArmorStack(characterArmors.value, armor)) {
      return true
    }
    errorMessage.value = 'Maximum 3 couches d’armure atteint sur une localisation couverte.'
    return false
  }

  async function onEquipArmorFromDoll(armorId: string): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const armor = characterArmors.value.find((item) => item.id === armorId)
    if (!armor || armor.isEquipped) {
      return
    }

    if (!ensureArmorCanBeEquipped(armor)) {
      return
    }

    if (!beginAction(`armor-equip-doll-${armor.id}`)) {
      return
    }

    const currentCharacterId = character.value.id

    try {
      await updateCharacterArmorEquipped(armor.id, true)
      armor.isEquipped = true
      invalidateCurrentLinksCache()
      setSectionSuccess('armors', 'Armure équipée (couche ajoutée).')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
      await reloadAfterFailure(currentCharacterId)
    } finally {
      endAction()
    }
  }

  async function onUnequipArmorFromDoll(armorId: string): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const armor = characterArmors.value.find((item) => item.id === armorId)
    if (!armor || !armor.isEquipped) {
      return
    }

    if (!beginAction(`armor-unequip-doll-${armor.id}`)) {
      return
    }

    try {
      await updateCharacterArmorEquipped(armor.id, false)
      armor.isEquipped = false
      invalidateCurrentLinksCache()
      setSectionSuccess('armors', 'Armure déséquipée.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
    } finally {
      endAction()
    }
  }

  async function onUnequipArmorsFromDoll(armorIds: string[]): Promise<void> {
    if (!canEdit.value || !character.value || armorIds.length === 0) {
      return
    }

    const armorsToUnequip = armorIds
      .map((id) => characterArmors.value.find((item) => item.id === id))
      .filter((armor): armor is CharacterArmor => Boolean(armor?.isEquipped))

    if (armorsToUnequip.length === 0) {
      return
    }

    if (!beginAction('armor-unequip-doll-batch')) {
      return
    }

    const currentCharacterId = character.value.id

    try {
      for (const armor of armorsToUnequip) {
        await updateCharacterArmorEquipped(armor.id, false)
        armor.isEquipped = false
      }
      invalidateCurrentLinksCache()
      setSectionSuccess(
        'armors',
        armorsToUnequip.length > 1 ? 'Couches d’armure déséquipées.' : 'Armure déséquipée.'
      )
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
      await reloadAfterFailure(currentCharacterId)
    } finally {
      endAction()
    }
  }

  async function onEquipWeaponFromDoll(
    weaponId: string,
    hand: WeaponHand
  ): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const weapon = characterWeapons.value.find((item) => item.id === weaponId)
    if (!weapon) {
      return
    }

    const preferredHand: WeaponPreferredHand = hand === 'gauche' ? 'gauche' : 'droite'
    const resolvedHand = resolveWeaponEquipHand(weapon, preferredHand)

    if (weapon.equipped === resolvedHand) {
      return
    }

    if (!beginAction(`weapon-equip-doll-${weapon.id}`)) {
      return
    }

    const currentCharacterId = character.value.id
    const conflicts = findConflictingWeapons(characterWeapons.value, weapon.id, resolvedHand)

    try {
      for (const conflict of conflicts) {
        await updateCharacterWeaponEquipped(conflict.id, null)
        conflict.equipped = null
      }

      await updateCharacterWeaponEquipped(weapon.id, resolvedHand)
      weapon.equipped = resolvedHand
      invalidateCurrentLinksCache()
      setSectionSuccess(
        'weapons',
        conflicts.length > 0 ? 'Arme équipée (remplacement).' : 'Arme équipée.'
      )
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
      await reloadAfterFailure(currentCharacterId)
    } finally {
      endAction()
    }
  }

  async function onUnequipWeaponFromDoll(weaponId: string): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const weapon = characterWeapons.value.find((item) => item.id === weaponId)
    if (!weapon || weapon.equipped === null) {
      return
    }

    if (!beginAction(`weapon-unequip-doll-${weapon.id}`)) {
      return
    }

    try {
      await updateCharacterWeaponEquipped(weapon.id, null)
      weapon.equipped = null
      invalidateCurrentLinksCache()
      setSectionSuccess('weapons', 'Arme déséquipée.')
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
    } finally {
      endAction()
    }
  }

  async function onArmorQualityChange(
    armor: CharacterArmor,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEdit.value || !character.value) {
      return
    }

    const currentCharacterId = character.value.id

    if (!isInventoryQuality(quality)) {
      return
    }

    if (quality === armor.quality) {
      return
    }

    await runWithBusyAction(`armor-quality-${armor.id}`, async () => {
      try {
        await updateCharacterArmorQuality(armor.id, quality)
        invalidateCurrentLinksCache()
        await loadCharacterLinks(currentCharacterId, { force: true })
        setSectionSuccess('armors', 'Qualité de l\'armure mise à jour.')
      } catch (error) {
        errorMessage.value = safeErrorMessage(error)
      }
    })
  }

  return {
    onDeleteWeapon,
    onDeleteArmor,
    onWeaponQualityChange,
    onArmorQualityChange,
    onEquipArmorFromDoll,
    onUnequipArmorFromDoll,
    onUnequipArmorsFromDoll,
    onEquipWeaponFromDoll,
    onUnequipWeaponFromDoll,
  }
}
