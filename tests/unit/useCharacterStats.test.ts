import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useCharacterStats } from '../../src/composables/useCharacterStats'
import type { EditableCharacterState, StatPatch } from '../../src/composables/useCharacterQuickSave'
import type { CharacterDetail, CharacterStatValue } from '../../src/types/domain'

const stat = (statCode: string, baseValue: number, currentAdvanced = 0): CharacterStatValue => ({
  statCode,
  baseValue,
  currentAdvanced,
  totalAdvanced: 0,
  isSecondary: false,
})

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

function setup(options: { canEdit?: boolean; character?: CharacterDetail | null } = {}) {
  const character = ref<CharacterDetail | null>(
    options.character === undefined
      ? ({ id: 'char-1', stats: [stat('B', 10, 2), stat('F', 20, 1)] } as CharacterDetail)
      : options.character
  )
  const editable = ref<EditableCharacterState>(emptyEditable())
  const canEdit = ref(options.canEdit ?? true)
  const triggerStatSave = vi.fn<(patch: { stats: Record<string, StatPatch> }) => void>()

  const stats = useCharacterStats({ character, editable, canEdit, triggerStatSave })

  return { stats, character, editable, canEdit, triggerStatSave }
}

describe('useCharacterStats', () => {
  it('ticks a non-B stat without touching pvMax', () => {
    const { stats, character, editable, triggerStatSave } = setup()

    stats.onStatTick('F', 2)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.currentAdvanced).toBe(3)
    expect(editable.value.pvMax).toBe(0)
    expect(triggerStatSave).toHaveBeenCalledWith({ stats: { F: { currentAdvanced: 3 } } })
  })

  it('ticks the B stat and recomputes pvMax, clamping pvCurrent down', () => {
    const { stats, editable } = setup()
    editable.value.pvCurrent = 12

    stats.onStatTick('B', 1)
    expect(editable.value.pvMax).toBe(13)

    stats.onStatTick('B', -10)
    expect(editable.value.pvMax).toBe(10)
    expect(editable.value.pvCurrent).toBe(10)
  })

  it('never lets an advance go below 0', () => {
    const { stats, character } = setup()

    stats.onStatTick('F', -10)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.currentAdvanced).toBe(0)
  })

  it('ignores stat ticks when canEdit is false', () => {
    const { stats, character, triggerStatSave } = setup({ canEdit: false })

    stats.onStatTick('F', 2)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.currentAdvanced).toBe(1)
    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('ignores stat ticks when there is no character', () => {
    const { stats, triggerStatSave } = setup({ character: null })

    stats.onStatTick('F', 2)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('ignores a tick for an unknown stat code', () => {
    const { stats, triggerStatSave } = setup()

    stats.onStatTick('X', 2)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('changes the base value of the B stat and recomputes pvMax', () => {
    const { stats, editable, triggerStatSave } = setup()

    stats.onStatBaseChange('B', 20)

    expect(editable.value.pvMax).toBe(22)
    expect(triggerStatSave).toHaveBeenCalledWith({ stats: { B: { baseValue: 20 } } })
  })

  it('does not save when the base value is unchanged', () => {
    const { stats, triggerStatSave } = setup()

    stats.onStatBaseChange('B', 10)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('floors a negative base value at 0', () => {
    const { stats, character } = setup()

    stats.onStatBaseChange('F', -5)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.baseValue).toBe(0)
  })

  it('updates totalAdvanced and saves the patch', () => {
    const { stats, character, triggerStatSave } = setup()

    stats.onStatTotalAdvancedChange('F', 5)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.totalAdvanced).toBe(5)
    expect(triggerStatSave).toHaveBeenCalledWith({ stats: { F: { totalAdvanced: 5 } } })
  })

  it('does not save totalAdvanced when unchanged', () => {
    const { stats, triggerStatSave } = setup()

    stats.onStatTotalAdvancedChange('F', 0)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('syncEditablePvFromWoundsValue uses 0 when the B stat is missing', () => {
    const { stats, editable } = setup({
      character: { id: 'char-1', stats: [stat('F', 20)] } as CharacterDetail,
    })
    editable.value.pvCurrent = 5

    stats.syncEditablePvFromWoundsValue()

    expect(editable.value.pvMax).toBe(0)
    expect(editable.value.pvCurrent).toBe(0)
  })

  it('syncEditablePvFromWoundsValue resets pvMax to 0 when there is no character', () => {
    const { stats, editable } = setup({ character: null })
    editable.value.pvCurrent = 5

    stats.syncEditablePvFromWoundsValue()

    expect(editable.value.pvMax).toBe(0)
    expect(editable.value.pvCurrent).toBe(0)
  })

  it('ignores onStatBaseChange when canEdit is false', () => {
    const { stats, character, triggerStatSave } = setup({ canEdit: false })

    stats.onStatBaseChange('F', 50)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.baseValue).toBe(20)
    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('ignores onStatBaseChange for an unknown stat code', () => {
    const { stats, triggerStatSave } = setup()

    stats.onStatBaseChange('X', 50)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('ignores onStatTotalAdvancedChange when canEdit is false', () => {
    const { stats, character, triggerStatSave } = setup({ canEdit: false })

    stats.onStatTotalAdvancedChange('F', 5)

    expect(character.value?.stats.find((s) => s.statCode === 'F')?.totalAdvanced).toBe(0)
    expect(triggerStatSave).not.toHaveBeenCalled()
  })

  it('ignores onStatTotalAdvancedChange for an unknown stat code', () => {
    const { stats, triggerStatSave } = setup()

    stats.onStatTotalAdvancedChange('X', 5)

    expect(triggerStatSave).not.toHaveBeenCalled()
  })
})
