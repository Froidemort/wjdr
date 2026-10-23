import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { updateCharacterCore, updateCharacterStatValues } from '../services/charactersRepository'
import { enqueueOfflineUpdate } from '../services/offlineQueueRepository'
import { isTransientError } from '../services/shared/networkErrors'
import type { CharacterQuickField } from '../types/characterSheet'
import type { CharacterDetail } from '../types/domain'
import { safeErrorMessage } from '../utils/errorMessages'
import { useMoneyCoercion } from './useMoneyCoercion'
import { useOptimisticUpdate } from './useOptimisticUpdate'

export interface StatPatch {
  currentAdvanced?: number
  baseValue?: number
  totalAdvanced?: number
}

export interface EditableCharacterState {
  pvMax: number
  pvCurrent: number
  fortuneMax: number
  fortuneCurrent: number
  destinyCurrent: number
  destinyMax: number
  xpTotal: number
  xpAvailable: number
  insanityPoints: number
  moneyGold: number
  moneySilver: number
  moneyCopper: number
}

type CoreColumns = Parameters<typeof updateCharacterCore>[1]

// pvMax is derived from the wounds stat (no DB column), so it is never saved
const CORE_COLUMNS = {
  pvCurrent: 'pv_current',
  fortuneMax: 'fortune_max',
  fortuneCurrent: 'fortune_current',
  destinyCurrent: 'destiny_current',
  destinyMax: 'destiny_max',
  xpTotal: 'xp_total',
  xpAvailable: 'xp_available',
  insanityPoints: 'insanity_points',
  moneyGold: 'money_gold',
  moneySilver: 'money_silver',
  moneyCopper: 'money_copper',
} as const satisfies Record<string, keyof CoreColumns>

type CoreField = keyof typeof CORE_COLUMNS
type CorePatch = Partial<Record<CoreField, number>>

const CORE_FIELDS = Object.keys(CORE_COLUMNS) as CoreField[]

function emptyEditable(): EditableCharacterState {
  return {
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
  }
}

interface UseCharacterQuickSaveOptions {
  character: Ref<CharacterDetail | null>
  canEdit: Readonly<Ref<boolean>>
  errorMessage: Ref<string | null>
}

export function useCharacterQuickSave({
  character,
  canEdit,
  errorMessage,
}: UseCharacterQuickSaveOptions) {
  const { coerceMoney } = useMoneyCoercion()
  const isMoneyEditing = ref(false)
  const editable = ref<EditableCharacterState>(emptyEditable())
  const lastSavedEditable = ref<EditableCharacterState>(emptyEditable())

  const { status, update: triggerSave, flush: triggerSaveNow } = useOptimisticUpdate<CorePatch>({
    onSave: async (payload) => {
      if (!character.value) {
        return
      }

      const columns: CoreColumns = {}
      for (const field of CORE_FIELDS) {
        const value = payload[field]
        if (typeof value === 'number') {
          columns[CORE_COLUMNS[field]] = value
        }
      }

      if (Object.keys(columns).length === 0) {
        return
      }

      try {
        await updateCharacterCore(character.value.id, columns)
        markSavedEditable(payload)
      } catch (error) {
        if (!isTransientError(error)) {
          throw error
        }

        await enqueueOfflineUpdate({
          entityType: 'character',
          entityId: character.value.id,
          payload: {
            kind: 'character-core',
            patch: payload,
          },
          baseUpdatedAt: null,
          localUpdatedAt: Date.now(),
        })
        markSavedEditable(payload)
      }
    },
    debounceMs: 500,
  })

  const {
    status: statSaveStatus,
    update: triggerStatSave,
    flush: triggerStatSaveNow,
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

        // On a later failure the retry must not replay stats already saved or queued
        delete payload.stats?.[statCode]
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

  function collectDirtyFields(): CorePatch {
    const dirty: CorePatch = {}
    for (const field of CORE_FIELDS) {
      if (editable.value[field] !== lastSavedEditable.value[field]) {
        dirty[field] = editable.value[field]
      }
    }

    if (dirty.xpAvailable !== undefined) {
      dirty.xpAvailable = Math.min(dirty.xpAvailable, editable.value.xpTotal)
    }

    return dirty
  }

  function markSavedEditable(snapshot: Partial<EditableCharacterState>): void {
    lastSavedEditable.value = { ...lastSavedEditable.value, ...snapshot }
  }

  function isSavingInProgress(): boolean {
    return (
      status.value === 'pending' ||
      status.value === 'saving' ||
      status.value === 'error' ||
      statSaveStatus.value === 'pending' ||
      statSaveStatus.value === 'saving' ||
      statSaveStatus.value === 'error'
    )
  }

  async function saveQuickFields(options: { immediate?: boolean } = {}): Promise<void> {
    if (!canEdit.value) {
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

    const dirtyFields = collectDirtyFields()
    if (Object.keys(dirtyFields).length === 0) {
      return
    }

    if (options.immediate) {
      await triggerSaveNow(dirtyFields)
      return
    }

    triggerSave(dirtyFields)
  }

  async function retrySave(): Promise<void> {
    errorMessage.value = null
    const results = await Promise.allSettled([triggerSaveNow(), triggerStatSaveNow()])
    const failed = results.find((result) => result.status === 'rejected')
    if (failed) {
      errorMessage.value = safeErrorMessage(failed.reason)
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
      void saveQuickFields()
    }
  }

  async function onMoneyCommit(): Promise<void> {
    if (!canEdit.value) {
      return
    }

    try {
      await saveQuickFields({ immediate: true })
    } catch (error) {
      errorMessage.value = safeErrorMessage(error)
    } finally {
      isMoneyEditing.value = false
    }
  }

  function onMoneySubtract(value: { silver: number; copper: number }): void {
    if (!canEdit.value) {
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

    void saveQuickFields({ immediate: true }).catch(() => undefined)
  }

  return {
    editable,
    lastSavedEditable,
    isMoneyEditing,
    globalState,
    globalStateLabel,
    triggerStatSave,
    markSavedEditable,
    isSavingInProgress,
    saveQuickFields,
    retrySave,
    onQuickValueChange,
    onMoneyCommit,
    onMoneySubtract,
  }
}
