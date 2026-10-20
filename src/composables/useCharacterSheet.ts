import { useDebounceFn, useTimeoutFn } from '@vueuse/core'
import { useRouteParams } from '@vueuse/router'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  invalidateCharacterLinksCache,
  listCharacterLinksBundle,
  removeCharacterArmor,
  removeCharacterItem,
  removeCharacterSkill,
  removeCharacterTalent,
  removeCharacterWeapon,
  updateCharacterArmorEquipped,
  updateCharacterArmorQuality,
  updateCharacterItemQuality,
  updateCharacterItemQuantity,
  updateCharacterSkillMastery,
  updateCharacterWeaponEquipped,
  updateCharacterWeaponQuality,
} from '../services/characterLinksRepository'
import { getCharacterById, updateCharacterCore, updateCharacterStatValues } from '../services/charactersRepository'
import { enqueueOfflineUpdate } from '../services/offlineQueueRepository'
import { isTransientError } from '../services/shared/networkErrors'
import { useAuthStore } from '../stores/auth'
import { useLastActiveStore } from '../stores/lastActive'
import type { CharacterQuickField } from '../types/characterSheet'
import type {
  CharacterArmor,
  CharacterDetail,
  CharacterItem,
  CharacterSkill,
  CharacterTalent,
  CharacterWeapon,
} from '../types/domain'
import {
  canEquipArmorStack,
  findConflictingWeapons,
  resolveWeaponEquipHand,
  type WeaponHand,
  type WeaponPreferredHand,
} from '../utils/equipmentSlots'
import { normalizeStatCode } from '../utils/characterSheet'
import { isInventoryQuality } from '../utils/inventoryQuality'
import { useConfirmAction } from './useConfirmAction'
import { useMoneyCoercion } from './useMoneyCoercion'
import { useOptimisticUpdate } from './useOptimisticUpdate'
import { type RealtimeUpdatePayload, useRealtimeChannels } from './useRealtimeChannels'

export type FeedbackSection =
  | 'skills'
  | 'talents'
  | 'weapons'
  | 'armors'
  | 'items'
  | 'stats'
  | 'career'
  | 'catalog'

interface StatPatch {
  currentAdvanced?: number
  baseValue?: number
  totalAdvanced?: number
}

export function useCharacterSheet() {
  const authStore = useAuthStore()
  const lastActive = useLastActiveStore()
  const { confirmAction } = useConfirmAction()
  const { coerceMoney } = useMoneyCoercion()
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const character = ref<CharacterDetail | null>(null)
  const characterId = useRouteParams('id', '', {
    transform: (value) => String(value ?? ''),
  })
  const isMoneyEditing = ref(false)

  const characterSkills = ref<CharacterSkill[]>([])
  const characterTalents = ref<CharacterTalent[]>([])
  const characterWeapons = ref<CharacterWeapon[]>([])
  const characterArmors = ref<CharacterArmor[]>([])
  const characterItems = ref<CharacterItem[]>([])
  const actionSuccessMessage = ref<string | null>(null)
  const sectionSuccess = ref<{ section: FeedbackSection; message: string } | null>(null)

  const actionBusyKey = ref<string | null>(null)

  const editable = ref({
    pvMax: 0,
    pvCurrent: 0,
    fortuneMax: 0,
    fortuneCurrent: 0,
    destinyCurrent: 0,
    destinyMax: 0,
    xpTotal: 0,
    xpAvailable: 0,
    insanityPoints: 0,
    moneyGold: 0,
    moneySilver: 0,
    moneyCopper: 0,
  })

  const lastSavedEditable = ref({
    pvMax: 0,
    pvCurrent: 0,
    fortuneMax: 0,
    fortuneCurrent: 0,
    destinyCurrent: 0,
    destinyMax: 0,
    xpTotal: 0,
    xpAvailable: 0,
    insanityPoints: 0,
    moneyGold: 0,
    moneySilver: 0,
    moneyCopper: 0,
  })

  const canEditQuickSection = computed(() =>
    Boolean(character.value && authStore.user?.id === character.value.userId)
  )

  const scheduleDeferredLinksReload = useDebounceFn((currentCharacterId: string) => {
    void loadCharacterLinks(currentCharacterId, { force: true })
  }, 700)
  const scheduleDeferredRealtimeReload = useDebounceFn(() => {
    void loadCharacter({ background: true })
  }, 700)

  const { start: startActionSuccessReset, stop: stopActionSuccessReset } = useTimeoutFn(
    () => {
      actionSuccessMessage.value = null
    },
    4000,
    { immediate: false }
  )
  const { start: startSectionSuccessReset, stop: stopSectionSuccessReset } = useTimeoutFn(
    () => {
      sectionSuccess.value = null
    },
    4500,
    { immediate: false }
  )

  function sortByName<T extends { name: string }>(entries: T[]): T[] {
    return [...entries].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' })
    )
  }

  const sortedCharacterSkills = computed(() => sortByName(characterSkills.value))
  const sortedCharacterTalents = computed(() => sortByName(characterTalents.value))
  const sortedCharacterWeapons = computed(() => sortByName(characterWeapons.value))
  const sortedCharacterArmors = computed(() => sortByName(characterArmors.value))
  const sortedCharacterItems = computed(() => sortByName(characterItems.value))

  const { status, update: triggerSave, flush: triggerSaveNow } = useOptimisticUpdate<
    typeof editable.value
  >({
    onSave: async (payload) => {
      if (!character.value) {
        return
      }

      const normalizedPayload = {
        ...editable.value,
        ...payload,
      }

      try {
        await updateCharacterCore(character.value.id, {
          pv_current: normalizedPayload.pvCurrent,
          fortune_max: normalizedPayload.fortuneMax,
          fortune_current: normalizedPayload.fortuneCurrent,
          destiny_current: normalizedPayload.destinyCurrent,
          destiny_max: normalizedPayload.destinyMax,
          xp_total: normalizedPayload.xpTotal,
          xp_available: Math.min(normalizedPayload.xpAvailable, normalizedPayload.xpTotal),
          insanity_points: Math.max(0, normalizedPayload.insanityPoints),
          money_gold: normalizedPayload.moneyGold,
          money_silver: normalizedPayload.moneySilver,
          money_copper: normalizedPayload.moneyCopper,
        })
        markSavedEditable(normalizedPayload)
      } catch (error) {
        if (!isTransientError(error)) {
          throw error
        }

        // pvMax is derived (no DB column); queue only the changed fields
        const { pvMax: _derivedPvMax, ...queuedPatch } = payload

        await enqueueOfflineUpdate({
          entityType: 'character',
          entityId: character.value.id,
          payload: {
            kind: 'character-core',
            patch: queuedPatch,
          },
          baseUpdatedAt: null,
          localUpdatedAt: Date.now(),
        })
        markSavedEditable(normalizedPayload)
      }
    },
    debounceMs: 500,
  })

  const {
    status: statSaveStatus,
    update: triggerStatSave,
  } = useOptimisticUpdate<{ stats: Record<string, StatPatch> }>({
    onSave: async (payload) => {
      if (!character.value) {
        return
      }

      for (const [statCode, patch] of Object.entries(payload.stats ?? {})) {
        try {
          await updateCharacterStatValues(character.value.id, statCode, {
            current_advanced: patch.currentAdvanced,
            base_value: patch.baseValue,
            total_advanced: patch.totalAdvanced,
          })
        } catch (error) {
          if (!isTransientError(error)) {
            throw error
          }

          await enqueueOfflineUpdate({
            entityType: 'character',
            entityId: character.value.id,
            payload: {
              kind: 'character-stat',
              statCode,
              patch: {
                currentAdvanced: patch.currentAdvanced,
                baseValue: patch.baseValue,
                totalAdvanced: patch.totalAdvanced,
              },
            },
            baseUpdatedAt: null,
            localUpdatedAt: Date.now(),
          })
        }
      }
    },
    // Pending saves are keyed per stat so ticking another stat never drops a save
    mergePatch: (current, next) => {
      const stats = { ...current.stats }
      for (const [code, patch] of Object.entries(next.stats ?? {})) {
        stats[code] = { ...stats[code], ...patch }
      }
      return { stats }
    },
    debounceMs: 350,
  })

  function queueStatSave(statCode: string, patch: StatPatch): void {
    triggerStatSave({ stats: { [normalizeStatCode(statCode)]: patch } })
  }

  const globalState = computed<'ok' | 'loading' | 'error'>(() => {
    if (status.value === 'error' || statSaveStatus.value === 'error') {
      return 'error'
    }
    if (
      status.value === 'saving' ||
      status.value === 'pending' ||
      statSaveStatus.value === 'saving' ||
      statSaveStatus.value === 'pending'
    ) {
      return 'loading'
    }

    return 'ok'
  })

  const globalStateLabel = computed(() => {
    if (globalState.value === 'error') {
      return 'Erreur de sauvegarde'
    }
    if (globalState.value === 'loading') {
      return 'Mise à jour...'
    }

    return ''
  })

  function isEditableEqual(
    left: typeof editable.value,
    right: typeof lastSavedEditable.value
  ): boolean {
    return (
      left.pvMax === right.pvMax &&
      left.pvCurrent === right.pvCurrent &&
      left.fortuneMax === right.fortuneMax &&
      left.fortuneCurrent === right.fortuneCurrent &&
      left.destinyCurrent === right.destinyCurrent &&
      left.destinyMax === right.destinyMax &&
      left.xpTotal === right.xpTotal &&
      left.xpAvailable === right.xpAvailable &&
      left.insanityPoints === right.insanityPoints &&
      left.moneyGold === right.moneyGold &&
      left.moneySilver === right.moneySilver &&
      left.moneyCopper === right.moneyCopper
    )
  }

  function markSavedEditable(snapshot: typeof editable.value): void {
    lastSavedEditable.value = { ...snapshot }
  }

  function isSavingInProgress(): boolean {
    return (
      status.value === 'pending' ||
      status.value === 'saving' ||
      statSaveStatus.value === 'pending' ||
      statSaveStatus.value === 'saving'
    )
  }

  function getWoundsValueFromCharacterStats(): number {
    if (!character.value) {
      return 0
    }

    const woundsStat = character.value.stats.find(
      (stat) => stat.statCode.trim().toUpperCase() === 'B'
    )

    return Math.max(
      0,
      Math.floor((woundsStat?.baseValue ?? 0) + (woundsStat?.currentAdvanced ?? 0))
    )
  }

  function syncEditablePvFromWoundsValue(): void {
    const woundsMax = getWoundsValueFromCharacterStats()
    editable.value.pvMax = woundsMax
    if (editable.value.pvCurrent > woundsMax) {
      editable.value.pvCurrent = woundsMax
    }
  }

  function invalidateCurrentLinksCache(): void {
    const currentCharacterId = character.value?.id ?? characterId.value
    if (!currentCharacterId) {
      return
    }

    invalidateCharacterLinksCache(currentCharacterId)
  }

  const LINK_TABLES = new Set([
    'character_skills',
    'character_talents',
    'character_weapons',
    'character_armors',
    'character_items',
  ])

  function requestExternalCharacterRefresh(update?: RealtimeUpdatePayload): void {
    const table = update?.table
    const currentCharacterId = character.value?.id ?? characterId.value
    if (!currentCharacterId) {
      return
    }

    if (table && LINK_TABLES.has(table)) {
      invalidateCharacterLinksCache(currentCharacterId)

      if (isSavingInProgress()) {
        void scheduleDeferredLinksReload(currentCharacterId)
        return
      }

      void loadCharacterLinks(currentCharacterId, { force: true })
      return
    }

    if (isSavingInProgress()) {
      void scheduleDeferredRealtimeReload()
      return
    }

    void loadCharacter({ background: true })
  }

  const { subscribe: subscribeRealtime, unsubscribe: unsubscribeRealtime } = useRealtimeChannels(
    (update) => {
      requestExternalCharacterRefresh(update)
    },
    { debounceMs: 450 }
  )

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
          error instanceof Error ? error.message : 'Impossible de charger le personnage.'
      }
    } finally {
      if (!isBackgroundRefresh) {
        loading.value = false
      }
    }
  }

  function onQuickValueChange(field: CharacterQuickField, value: number): void {
    const previousValue = editable.value[field]
    const newValue = Math.max(0, value)
    const isMoneyField = field === 'moneyGold' || field === 'moneySilver' || field === 'moneyCopper'

    // Constraint: current <= max for resource types
    if (field === 'pvCurrent' && editable.value.pvMax !== undefined) {
      editable.value[field] = Math.min(newValue, editable.value.pvMax) as never
    } else if (field === 'fortuneCurrent' && editable.value.fortuneMax !== undefined) {
      editable.value[field] = Math.min(newValue, editable.value.fortuneMax) as never
    } else if (field === 'destinyCurrent' && editable.value.destinyMax !== undefined) {
      editable.value[field] = Math.min(newValue, editable.value.destinyMax) as never
    } else if (field === 'fortuneMax') {
      editable.value[field] = newValue as never
      editable.value.fortuneCurrent = Math.min(editable.value.fortuneCurrent, newValue)
    } else if (field === 'destinyMax') {
      editable.value[field] = newValue as never
      editable.value.destinyCurrent = Math.min(editable.value.destinyCurrent, newValue)
    } else {
      editable.value[field] = newValue as never
    }

    if (editable.value[field] === previousValue) {
      return
    }

    if (isMoneyField) {
      isMoneyEditing.value = true
    }

    if (!isMoneyField) {
      saveQuickFields()
    }
  }

  async function onMoneyCommit(): Promise<void> {
    if (!canEditQuickSection.value) {
      return
    }

    await saveQuickFields({ immediate: true })
    isMoneyEditing.value = false
  }

  function onMoneySubtract(value: { silver: number; copper: number }): void {
    if (!canEditQuickSection.value) {
      return
    }

    const currentCopper =
      Math.max(0, Math.floor(editable.value.moneyGold)) * 240 +
      Math.max(0, Math.floor(editable.value.moneySilver)) * 20 +
      Math.max(0, Math.floor(editable.value.moneyCopper))

    const subtractCopper =
      Math.max(0, Math.floor(value.silver)) * 20 + Math.max(0, Math.floor(value.copper))

    const remainingCopper = Math.max(0, currentCopper - subtractCopper)
    const normalized = coerceMoney(0, 0, remainingCopper)

    editable.value.moneyGold = normalized.gold
    editable.value.moneySilver = normalized.silver
    editable.value.moneyCopper = normalized.copper
    isMoneyEditing.value = false

    void saveQuickFields({ immediate: true })
  }

  function onStatTick(statCode: string, step: number): void {
    if (!character.value || !canEditQuickSection.value) {
      return
    }

    const target = character.value.stats.find(
      (stat) => normalizeStatCode(stat.statCode) === normalizeStatCode(statCode)
    )
    if (!target) {
      return
    }

    const nextAdvanced = Math.max(0, target.currentAdvanced + step)
    target.currentAdvanced = nextAdvanced

    if (statCode.trim().toUpperCase() === 'B') {
      syncEditablePvFromWoundsValue()
    }

    queueStatSave(statCode, { currentAdvanced: nextAdvanced })
  }

  function onStatBaseChange(statCode: string, baseValue: number): void {
    if (!character.value || !canEditQuickSection.value) {
      return
    }

    const target = character.value.stats.find(
      (stat) => normalizeStatCode(stat.statCode) === normalizeStatCode(statCode)
    )
    if (!target) {
      return
    }

    const nextBase = Math.max(0, baseValue)
    if (nextBase === target.baseValue) {
      return
    }

    target.baseValue = nextBase

    if (statCode.trim().toUpperCase() === 'B') {
      syncEditablePvFromWoundsValue()
    }

    queueStatSave(statCode, { baseValue: nextBase })
  }

  function onStatTotalAdvancedChange(statCode: string, totalAdvanced: number): void {
    if (!character.value || !canEditQuickSection.value) {
      return
    }

    const target = character.value.stats.find(
      (stat) => normalizeStatCode(stat.statCode) === normalizeStatCode(statCode)
    )
    if (!target) {
      return
    }

    const nextTotalAdvanced = Math.max(0, totalAdvanced)
    if (nextTotalAdvanced === target.totalAdvanced) {
      return
    }

    target.totalAdvanced = nextTotalAdvanced

    queueStatSave(statCode, { totalAdvanced: nextTotalAdvanced })
  }

  async function onChangeSkillMastery(skillId: string, level: 1 | 2 | 3): Promise<void> {
    if (!character.value || !canEditQuickSection.value) {
      return
    }

    const currentCharacter = character.value

    const target = characterSkills.value.find((skill) => skill.skillId === skillId)
    if (target && target.masteryLevel === level) {
      return
    }

    await runWithBusyAction(`mastery-${skillId}`, async () => {
      try {
        await updateCharacterSkillMastery(currentCharacter.id, skillId, level)
        if (target) {
          target.masteryLevel = level
        }
        invalidateCurrentLinksCache()
        setSectionSuccess('skills', 'Niveau de maitrise mis a jour.')
      } catch (error) {
        errorMessage.value =
          error instanceof Error ? error.message : 'Modification du niveau de maitrise impossible.'
      }
    })
  }

  async function onDeleteSkill(skillId: string): Promise<void> {
    if (!character.value || !canEditQuickSection.value || actionBusyKey.value) {
      return
    }

    if (!(await confirmDestructiveAction('Supprimer cette competence ?'))) {
      return
    }

    actionBusyKey.value = `skill-${skillId}`
    try {
      await removeCharacterSkill(character.value.id, skillId)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
      setSectionSuccess('skills', 'Competence supprimee.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
    } finally {
      endAction()
    }
  }

  async function onDeleteTalent(talentId: string): Promise<void> {
    if (!character.value || !canEditQuickSection.value || actionBusyKey.value) {
      return
    }

    if (!(await confirmDestructiveAction('Supprimer ce talent ?'))) {
      return
    }

    actionBusyKey.value = `talent-${talentId}`
    try {
      await removeCharacterTalent(character.value.id, talentId)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
      setSectionSuccess('talents', 'Talent supprime.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
    } finally {
      endAction()
    }
  }

  async function onDeleteWeapon(linkId: string): Promise<void> {
    if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
      return
    }

    if (!(await confirmDestructiveAction('Supprimer cette arme ?'))) {
      return
    }

    actionBusyKey.value = `weapon-${linkId}`
    try {
      await removeCharacterWeapon(linkId)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
      setSectionSuccess('weapons', 'Arme supprimee.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
    } finally {
      endAction()
    }
  }

  async function onWeaponQualityChange(
    weapon: CharacterWeapon,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
      return
    }

    const currentCharacter = character.value

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
        await loadCharacterLinks(currentCharacter.id, { force: true })
        setSectionSuccess('weapons', 'Qualite de l arme mise a jour.')
      } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      }
    })
  }

  async function onDeleteArmor(linkId: string): Promise<void> {
    if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
      return
    }

    if (!(await confirmDestructiveAction('Supprimer cette armure ?'))) {
      return
    }

    actionBusyKey.value = `armor-${linkId}`
    try {
      await removeCharacterArmor(linkId)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
      setSectionSuccess('armors', 'Armure supprimee.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
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
    if (!canEditQuickSection.value || !character.value) {
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

    try {
      await updateCharacterArmorEquipped(armor.id, true)
      armor.isEquipped = true
      invalidateCurrentLinksCache()
      setSectionSuccess('armors', 'Armure équipée (couche ajoutée).')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
    } finally {
      endAction()
    }
  }

  async function onUnequipArmorFromDoll(armorId: string): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
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
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    } finally {
      endAction()
    }
  }

  async function onUnequipArmorsFromDoll(armorIds: string[]): Promise<void> {
    if (!canEditQuickSection.value || !character.value || armorIds.length === 0) {
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
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
    } finally {
      endAction()
    }
  }

  async function onEquipWeaponFromDoll(
    weaponId: string,
    hand: WeaponHand
  ): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
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
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
    } finally {
      endAction()
    }
  }

  async function onUnequipWeaponFromDoll(weaponId: string): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
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
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    } finally {
      endAction()
    }
  }

  async function onArmorQualityChange(
    armor: CharacterArmor,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
      return
    }

    const currentCharacter = character.value

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
        await loadCharacterLinks(currentCharacter.id, { force: true })
        setSectionSuccess('armors', 'Qualite de l armure mise a jour.')
      } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      }
    })
  }


  async function onDeleteItem(linkId: string): Promise<void> {
    if (!canEditQuickSection.value || !character.value || actionBusyKey.value) {
      return
    }

    if (!(await confirmDestructiveAction('Supprimer cet equipement ?'))) {
      return
    }

    actionBusyKey.value = `item-${linkId}`
    try {
      await removeCharacterItem(linkId)
      invalidateCurrentLinksCache()
      await loadCharacterLinks(character.value.id, { force: true })
      setSectionSuccess('items', 'Equipement supprime.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Suppression impossible.'
    } finally {
      endAction()
    }
  }

  async function onChangeItemQuantity(item: CharacterItem, delta: number): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
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
      setSectionSuccess('items', 'Quantite mise a jour.')
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
    } finally {
      endAction()
    }
  }

  async function onItemQualityChange(
    item: CharacterItem,
    quality: string | boolean | null
  ): Promise<void> {
    if (!canEditQuickSection.value || !character.value) {
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
        setSectionSuccess('items', 'Qualite de l equipement mise a jour.')
      } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Modification impossible.'
      }
    })
  }

  async function saveQuickFields(options: { immediate?: boolean } = {}): Promise<void> {
    if (!canEditQuickSection.value) {
      return
    }

    if (editable.value.pvCurrent > editable.value.pvMax) {
      editable.value.pvCurrent = editable.value.pvMax
    }

    if (editable.value.fortuneCurrent > editable.value.fortuneMax) {
      editable.value.fortuneCurrent = editable.value.fortuneMax
    }

    if (editable.value.destinyCurrent > editable.value.destinyMax) {
      editable.value.destinyCurrent = editable.value.destinyMax
    }

    if (editable.value.xpAvailable > editable.value.xpTotal) {
      editable.value.xpAvailable = editable.value.xpTotal
    }

    // Apply money coercion before save with lock mechanism
    const coercedMoney = coerceMoney(
      editable.value.moneyGold,
      editable.value.moneySilver,
      editable.value.moneyCopper
    )
    editable.value.moneyGold = coercedMoney.gold
    editable.value.moneySilver = coercedMoney.silver
    editable.value.moneyCopper = coercedMoney.copper

    if (isEditableEqual(editable.value, lastSavedEditable.value)) {
      return
    }

    if (options.immediate) {
      await triggerSaveNow({ ...editable.value })
      return
    }

    triggerSave({ ...editable.value })
  }

  function setActionSuccess(message: string): void {
    actionSuccessMessage.value = message
    stopActionSuccessReset()
    startActionSuccessReset()
  }

  function setSectionSuccess(section: FeedbackSection, message: string): void {
    sectionSuccess.value = { section, message }
    stopSectionSuccessReset()
    startSectionSuccessReset()

    setActionSuccess(message)
  }

  function getSectionSuccessMessage(section: FeedbackSection): string | null {
    if (!sectionSuccess.value || sectionSuccess.value.section !== section) {
      return null
    }

    return sectionSuccess.value.message
  }

  async function confirmDestructiveAction(message: string): Promise<boolean> {
    return confirmAction(message)
  }

  function beginAction(key: string): boolean {
    if (actionBusyKey.value) {
      return false
    }

    actionBusyKey.value = key
    return true
  }

  function endAction(): void {
    actionBusyKey.value = null
  }

  async function runWithBusyAction(key: string, operation: () => Promise<void>): Promise<void> {
    if (!beginAction(key)) {
      return
    }

    try {
      await operation()
    } finally {
      endAction()
    }
  }

  watch(
    () => characterId.value,
    (value) => {
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

  onBeforeUnmount(() => {
    scheduleDeferredRealtimeReload.cancel()
    scheduleDeferredLinksReload.cancel()
    stopSectionSuccessReset()
    stopActionSuccessReset()
  })

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
