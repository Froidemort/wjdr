import type { Ref } from 'vue'
import type { CharacterDetail } from '../types/domain'
import { normalizeStatCode } from '../utils/characterSheet'
import type { EditableCharacterState, StatPatch } from './useCharacterQuickSave'

interface UseCharacterStatsOptions {
  character: Ref<CharacterDetail | null>
  editable: Ref<EditableCharacterState>
  canEdit: Readonly<Ref<boolean>>
  triggerStatSave: (patch: { stats: Record<string, StatPatch> }) => void
}

export function useCharacterStats({
  character,
  editable,
  canEdit,
  triggerStatSave,
}: UseCharacterStatsOptions) {
  function findStat(statCode: string) {
    const normalized = normalizeStatCode(statCode)
    return character.value?.stats.find((stat) => normalizeStatCode(stat.statCode) === normalized)
  }

  function queueStatSave(statCode: string, patch: StatPatch): void {
    triggerStatSave({ stats: { [normalizeStatCode(statCode)]: patch } })
  }

  function getWoundsValueFromCharacterStats(): number {
    if (!character.value) {
      return 0
    }

    const woundsStat = character.value.stats.find(
      (stat) => normalizeStatCode(stat.statCode) === 'B'
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

  function onStatTick(statCode: string, step: number): void {
    if (!character.value || !canEdit.value) {
      return
    }

    const target = findStat(statCode)
    if (!target) {
      return
    }

    const nextAdvanced = Math.max(0, target.currentAdvanced + step)
    target.currentAdvanced = nextAdvanced

    if (normalizeStatCode(statCode) === 'B') {
      syncEditablePvFromWoundsValue()
    }

    queueStatSave(statCode, { currentAdvanced: nextAdvanced })
  }

  function onStatBaseChange(statCode: string, baseValue: number): void {
    if (!character.value || !canEdit.value) {
      return
    }

    const target = findStat(statCode)
    if (!target) {
      return
    }

    const nextBase = Math.max(0, baseValue)
    if (nextBase === target.baseValue) {
      return
    }

    target.baseValue = nextBase

    if (normalizeStatCode(statCode) === 'B') {
      syncEditablePvFromWoundsValue()
    }

    queueStatSave(statCode, { baseValue: nextBase })
  }

  function onStatTotalAdvancedChange(statCode: string, totalAdvanced: number): void {
    if (!character.value || !canEdit.value) {
      return
    }

    const target = findStat(statCode)
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

  return {
    syncEditablePvFromWoundsValue,
    onStatTick,
    onStatBaseChange,
    onStatTotalAdvancedChange,
  }
}
