import { useRouteParams } from '@vueuse/router'
import { computed, ref, watch } from 'vue'
import { getCharacterById } from '../services/charactersRepository'
import { useAuthStore } from '../stores/auth'
import { useLastActiveStore } from '../stores/lastActive'
import type { CharacterDetail } from '../types/domain'
import { safeErrorMessage } from '../utils/errorMessages'
import { useCharacterEquipment } from './useCharacterEquipment'
import { type FeedbackSection, useCharacterFeedback } from './useCharacterFeedback'
import { useCharacterLinks } from './useCharacterLinks'
import { useCharacterQuickSave } from './useCharacterQuickSave'
import { useCharacterRealtime } from './useCharacterRealtime'
import { useCharacterStats } from './useCharacterStats'

export type { FeedbackSection }

export function useCharacterSheet() {
  const authStore = useAuthStore()
  const lastActive = useLastActiveStore()
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const {
    actionSuccessMessage,
    actionBusyKey,
    setSectionSuccess,
    getSectionSuccessMessage,
    confirmDestructiveAction,
    beginAction,
    endAction,
    runWithBusyAction,
  } = useCharacterFeedback({ errorMessage })
  const character = ref<CharacterDetail | null>(null)
  const characterId = useRouteParams('id', '', {
    transform: (value) => String(value ?? ''),
  })

  const canEditQuickSection = computed(() =>
    Boolean(character.value && authStore.user?.id === character.value.userId)
  )

  const feedback = {
    actionBusyKey,
    setSectionSuccess,
    confirmDestructiveAction,
    beginAction,
    endAction,
    runWithBusyAction,
  }
  const links = useCharacterLinks({
    character,
    getCharacterId: () => character.value?.id ?? characterId.value,
    canEdit: canEditQuickSection,
    errorMessage,
    feedback,
  })
  const {
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
    onChangeSkillMastery,
    onDeleteSkill,
    onDeleteTalent,
    onDeleteItem,
    onChangeItemQuantity,
    onItemQualityChange,
  } = links
  const {
    onDeleteWeapon,
    onDeleteArmor,
    onWeaponQualityChange,
    onArmorQualityChange,
    onEquipArmorFromDoll,
    onUnequipArmorFromDoll,
    onUnequipArmorsFromDoll,
    onEquipWeaponFromDoll,
    onUnequipWeaponFromDoll,
  } = useCharacterEquipment({
    character,
    canEdit: canEditQuickSection,
    errorMessage,
    feedback,
    links,
  })

  const {
    editable,
    isMoneyEditing,
    globalState,
    globalStateLabel,
    triggerStatSave,
    markSavedEditable,
    isSavingInProgress,
    retrySave,
    onQuickValueChange,
    onMoneyCommit,
    onMoneySubtract,
  } = useCharacterQuickSave({
    character,
    canEdit: canEditQuickSection,
    errorMessage,
  })
  const { syncEditablePvFromWoundsValue, onStatTick, onStatBaseChange, onStatTotalAdvancedChange } =
    useCharacterStats({
      character,
      editable,
      canEdit: canEditQuickSection,
      triggerStatSave,
    })

  const { subscribeRealtime, unsubscribeRealtime, cancelDeferred } = useCharacterRealtime({
    getCharacterId: () => character.value?.id ?? characterId.value,
    isSavingInProgress,
    loadCharacter,
    loadCharacterLinks,
  })

  async function loadCharacter(options: { background?: boolean } = {}): Promise<void> {
    const currentCharacterId = characterId.value
    if (!currentCharacterId) {
      errorMessage.value = 'Personnage invalide.'
      return
    }

    const isBackgroundRefresh = Boolean(options.background && character.value)
    if (!isBackgroundRefresh) {
      loading.value = true
      errorMessage.value = null
    }
    try {
      const data = await getCharacterById(currentCharacterId)
      character.value = data

      if (!data) {
        errorMessage.value = 'Personnage introuvable.'
        return
      }

      // Another player's sheet only refreshes the campaign, never the "own character" shortcut.
      if (data.userId === authStore.user?.id) {
        lastActive.setCharacter(data.campaignId, data.id)
      } else {
        lastActive.setCampaign(data.campaignId)
      }

      const nextEditable = {
        pvMax: data.pvMax,
        pvCurrent: data.pvCurrent,
        fortuneMax: data.fortuneMax,
        fortuneCurrent: data.fortuneCurrent,
        destinyCurrent: data.destinyCurrent,
        destinyMax: data.destinyMax,
        xpTotal: data.xpTotal,
        xpAvailable: data.xpAvailable,
        insanityPoints: data.insanityPoints,
        moneyGold: data.moneyGold,
        moneySilver: data.moneySilver,
        moneyCopper: data.moneyCopper,
      }

      if (isBackgroundRefresh && isMoneyEditing.value) {
        nextEditable.moneyGold = editable.value.moneyGold
        nextEditable.moneySilver = editable.value.moneySilver
        nextEditable.moneyCopper = editable.value.moneyCopper
      }

      editable.value = nextEditable
      syncEditablePvFromWoundsValue()
      markSavedEditable({ ...editable.value })

      await loadCharacterLinks(data.id)
    } catch (error) {
      if (!isBackgroundRefresh || !character.value) {
        errorMessage.value =
          safeErrorMessage(error, 'Impossible de charger le personnage.')
      }
    } finally {
      if (!isBackgroundRefresh) {
        loading.value = false
      }
    }
  }

  watch(
    () => characterId.value,
    (value) => {
      cancelDeferred()
      if (!value) {
        unsubscribeRealtime()
        character.value = null
        errorMessage.value = 'Personnage invalide.'
        return
      }

      errorMessage.value = null
      void loadCharacter()
      subscribeRealtime(`character-detail-${value}`, [
        { table: 'characters', filter: `id=eq.${value}` },
        { table: 'character_stat_values', filter: `character_id=eq.${value}` },
        { table: 'character_skills', filter: `character_id=eq.${value}` },
        { table: 'character_talents', filter: `character_id=eq.${value}` },
        { table: 'character_weapons', filter: `character_id=eq.${value}` },
        { table: 'character_armors', filter: `character_id=eq.${value}` },
        { table: 'character_items', filter: `character_id=eq.${value}` },
      ])
    },
    { immediate: true }
  )

  return {
    character,
    loading,
    errorMessage,
    characterId,
    editable,
    canEditQuickSection,
    actionBusyKey,
    actionSuccessMessage,
    globalState,
    globalStateLabel,
    retrySave,
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
    loadCharacter,
    loadCharacterLinks,
    invalidateCurrentLinksCache,
    onQuickValueChange,
    onMoneyCommit,
    onMoneySubtract,
    onStatTick,
    onStatBaseChange,
    onStatTotalAdvancedChange,
    onChangeSkillMastery,
    onDeleteSkill,
    onDeleteTalent,
    onDeleteWeapon,
    onDeleteArmor,
    onDeleteItem,
    onWeaponQualityChange,
    onArmorQualityChange,
    onItemQualityChange,
    onChangeItemQuantity,
    onEquipArmorFromDoll,
    onUnequipArmorFromDoll,
    onUnequipArmorsFromDoll,
    onEquipWeaponFromDoll,
    onUnequipWeaponFromDoll,
    setSectionSuccess,
    getSectionSuccessMessage,
    confirmDestructiveAction,
  }
}
