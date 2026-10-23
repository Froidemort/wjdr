import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CharacterDetail } from '../../src/types/domain'

const deps = vi.hoisted(() => ({
  updateCharacterCore: vi.fn(),
  updateCharacterStatValues: vi.fn(),
  enqueueOfflineUpdate: vi.fn(),
}))

vi.mock('../../src/services/charactersRepository', () => ({
  updateCharacterCore: deps.updateCharacterCore,
  updateCharacterStatValues: deps.updateCharacterStatValues,
}))
vi.mock('../../src/services/offlineQueueRepository', () => ({
  enqueueOfflineUpdate: deps.enqueueOfflineUpdate,
}))

import { useCharacterQuickSave } from '../../src/composables/useCharacterQuickSave'

function setup(options: { canEdit?: boolean } = {}) {
  const character = ref({ id: 'char-1' } as CharacterDetail)
  const canEdit = ref(options.canEdit ?? true)
  const errorMessage = ref<string | null>(null)

  const quickSave = useCharacterQuickSave({ character, canEdit, errorMessage })

  return { quickSave, character, canEdit, errorMessage }
}

describe('useCharacterQuickSave', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deps.updateCharacterCore.mockResolvedValue(undefined)
    deps.updateCharacterStatValues.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('onMoneySubtract', () => {
    it('subtracts copper across denominations and saves immediately', async () => {
      const { quickSave } = setup()
      quickSave.editable.value.moneyGold = 1
      quickSave.editable.value.moneySilver = 5
      quickSave.editable.value.moneyCopper = 10

      quickSave.onMoneySubtract({ silver: 2, copper: 5 })

      await vi.waitFor(() => expect(deps.updateCharacterCore).toHaveBeenCalled())
      expect(quickSave.editable.value.moneyGold).toBe(1)
      expect(quickSave.editable.value.moneySilver).toBe(3)
      expect(quickSave.editable.value.moneyCopper).toBe(5)
      expect(quickSave.isMoneyEditing.value).toBe(false)
    })

    it('never goes below zero copper', () => {
      const { quickSave } = setup()
      quickSave.editable.value.moneyGold = 0
      quickSave.editable.value.moneySilver = 0
      quickSave.editable.value.moneyCopper = 5

      quickSave.onMoneySubtract({ silver: 1, copper: 0 })

      expect(quickSave.editable.value.moneyGold).toBe(0)
      expect(quickSave.editable.value.moneySilver).toBe(0)
      expect(quickSave.editable.value.moneyCopper).toBe(0)
    })

    it('does nothing when canEdit is false', () => {
      const { quickSave } = setup({ canEdit: false })
      quickSave.editable.value.moneyCopper = 10

      quickSave.onMoneySubtract({ silver: 0, copper: 5 })

      expect(deps.updateCharacterCore).not.toHaveBeenCalled()
      expect(quickSave.editable.value.moneyCopper).toBe(10)
    })
  })

  describe('retrySave', () => {
    it('clears the error and returns to ok after a successful retry', async () => {
      deps.updateCharacterCore.mockRejectedValue(new Error('forbidden'))
      const { quickSave, errorMessage } = setup()

      quickSave.onQuickValueChange('insanityPoints', 3)
      await vi.waitFor(() => expect(quickSave.globalState.value).toBe('error'))

      deps.updateCharacterCore.mockResolvedValue(undefined)
      await quickSave.retrySave()

      expect(quickSave.globalState.value).toBe('ok')
      expect(errorMessage.value).toBeNull()
    })

    it('reports the failing reason when a retry fails again', async () => {
      deps.updateCharacterStatValues.mockRejectedValue(new Error('forbidden'))
      const { quickSave, errorMessage } = setup()

      quickSave.triggerStatSave({ stats: { B: { currentAdvanced: 1 } } })
      await vi.waitFor(() => expect(quickSave.globalState.value).toBe('error'))

      await quickSave.retrySave()

      expect(errorMessage.value).toBe('forbidden')
      expect(quickSave.globalState.value).toBe('error')
    })

    it('does not replay an already saved stat when the second stat failed', async () => {
      deps.updateCharacterStatValues.mockImplementation(async (_id: string, statCode: string) => {
        if (statCode === 'CC') {
          throw new Error('forbidden')
        }
      })
      const { quickSave } = setup()

      quickSave.triggerStatSave({ stats: { B: { currentAdvanced: 1 }, CC: { baseValue: 5 } } })
      await vi.waitFor(() => expect(quickSave.globalState.value).toBe('error'))
      expect(deps.updateCharacterStatValues).toHaveBeenCalledTimes(2)

      deps.updateCharacterStatValues.mockResolvedValue(undefined)
      await quickSave.retrySave()

      const savedCodes = deps.updateCharacterStatValues.mock.calls.map((call) => call[1])
      expect(savedCodes).toEqual(['B', 'CC', 'CC'])
      expect(quickSave.globalState.value).toBe('ok')
    })
  })

  describe('globalState', () => {
    it('is ok when nothing is pending', () => {
      const { quickSave } = setup()

      expect(quickSave.globalState.value).toBe('ok')
      expect(quickSave.globalStateLabel.value).toBe('')
    })

    it('becomes loading while a save is pending', async () => {
      const { quickSave } = setup()

      quickSave.onQuickValueChange('insanityPoints', 3)

      expect(quickSave.globalState.value).toBe('loading')
      expect(quickSave.globalStateLabel.value).toBe('Mise à jour...')

      await vi.waitFor(() => expect(deps.updateCharacterCore).toHaveBeenCalled())
    })

    it('becomes error when a save fails and overrides the loading state', async () => {
      deps.updateCharacterCore.mockRejectedValue(new Error('down'))
      const { quickSave } = setup()

      quickSave.onQuickValueChange('insanityPoints', 3)
      await vi.waitFor(() => expect(quickSave.globalState.value).toBe('error'))

      expect(quickSave.globalStateLabel.value).toBe('Erreur de sauvegarde')
    })
  })

  it('does not save when canEdit is false', async () => {
    const { quickSave } = setup({ canEdit: false })

    quickSave.onQuickValueChange('insanityPoints', 3)
    await Promise.resolve()

    expect(quickSave.editable.value.insanityPoints).toBe(3)
    expect(deps.updateCharacterCore).not.toHaveBeenCalled()
  })

  it('onMoneyCommit no-ops when canEdit is false', async () => {
    const { quickSave } = setup({ canEdit: false })

    await quickSave.onMoneyCommit()

    expect(deps.updateCharacterCore).not.toHaveBeenCalled()
  })

  it('clears isMoneyEditing even when the commit fails', async () => {
    deps.updateCharacterCore.mockRejectedValue(new Error('forbidden'))
    const { quickSave, errorMessage } = setup()

    quickSave.onQuickValueChange('moneyGold', 5)
    expect(quickSave.isMoneyEditing.value).toBe(true)

    await quickSave.onMoneyCommit()

    expect(quickSave.isMoneyEditing.value).toBe(false)
    expect(errorMessage.value).toBe('forbidden')
  })

  describe('offline fallback', () => {
    it('queues an offline update when the core save fails transiently', async () => {
      deps.updateCharacterCore.mockRejectedValue(new Error('network error'))
      const { quickSave } = setup()
      quickSave.editable.value.insanityPoints = 3

      await quickSave.saveQuickFields({ immediate: true })

      expect(deps.enqueueOfflineUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'character', entityId: 'char-1' })
      )
      expect(quickSave.globalState.value).toBe('ok')
    })

    it('queues an offline update when the stat save fails transiently', async () => {
      deps.updateCharacterStatValues.mockRejectedValue(new Error('network error'))
      const { quickSave } = setup()

      quickSave.triggerStatSave({ stats: { B: { currentAdvanced: 1 } } })

      await vi.waitFor(() => expect(deps.enqueueOfflineUpdate).toHaveBeenCalled())
      expect(quickSave.globalState.value).toBe('ok')
    })

    it('rethrows a non-transient core save error', async () => {
      deps.updateCharacterCore.mockRejectedValue(new Error('forbidden'))
      const { quickSave } = setup()
      quickSave.editable.value.insanityPoints = 3

      await expect(quickSave.saveQuickFields({ immediate: true })).rejects.toThrow('forbidden')
      expect(deps.enqueueOfflineUpdate).not.toHaveBeenCalled()
    })
  })

  it('merges a pending stat patch for the same stat code', async () => {
    const { quickSave } = setup()

    quickSave.triggerStatSave({ stats: { B: { currentAdvanced: 1 } } })
    quickSave.triggerStatSave({ stats: { B: { baseValue: 5 } } })

    await vi.waitFor(() =>
      expect(deps.updateCharacterStatValues).toHaveBeenCalledWith(
        'char-1',
        'B',
        expect.objectContaining({ current_advanced: 1, base_value: 5 })
      )
    )
  })

  it('clamps xpAvailable to xpTotal when saving', async () => {
    const { quickSave } = setup()
    quickSave.editable.value.xpTotal = 5

    quickSave.onQuickValueChange('xpAvailable', 20)

    await vi.waitFor(() => expect(deps.updateCharacterCore).toHaveBeenCalled())
    expect(deps.updateCharacterCore).toHaveBeenCalledWith(
      'char-1',
      expect.objectContaining({ xp_available: 5 })
    )
  })

  it('saveQuickFields clamps current resources down to their max before saving', async () => {
    const { quickSave } = setup()
    quickSave.editable.value.pvMax = 3
    quickSave.editable.value.pvCurrent = 9
    quickSave.editable.value.fortuneMax = 2
    quickSave.editable.value.fortuneCurrent = 5
    quickSave.editable.value.destinyMax = 1
    quickSave.editable.value.destinyCurrent = 4

    await quickSave.saveQuickFields({ immediate: true })

    expect(quickSave.editable.value.pvCurrent).toBe(3)
    expect(quickSave.editable.value.fortuneCurrent).toBe(2)
    expect(quickSave.editable.value.destinyCurrent).toBe(1)
  })

  it('onQuickValueChange clamps current values to their max (pv, fortune, destiny)', () => {
    const { quickSave } = setup()
    quickSave.editable.value.pvMax = 5
    quickSave.editable.value.fortuneMax = 3
    quickSave.editable.value.destinyMax = 2

    quickSave.onQuickValueChange('pvCurrent', 20)
    quickSave.onQuickValueChange('fortuneCurrent', 20)
    quickSave.onQuickValueChange('destinyCurrent', 20)

    expect(quickSave.editable.value.pvCurrent).toBe(5)
    expect(quickSave.editable.value.fortuneCurrent).toBe(3)
    expect(quickSave.editable.value.destinyCurrent).toBe(2)
  })

  it('onQuickValueChange lowers fortuneCurrent when fortuneMax shrinks', () => {
    const { quickSave } = setup()
    quickSave.editable.value.fortuneCurrent = 5

    quickSave.onQuickValueChange('fortuneMax', 2)

    expect(quickSave.editable.value.fortuneCurrent).toBe(2)
  })

  it('onQuickValueChange lowers destinyCurrent when destinyMax shrinks', () => {
    const { quickSave } = setup()
    quickSave.editable.value.destinyCurrent = 5

    quickSave.onQuickValueChange('destinyMax', 1)

    expect(quickSave.editable.value.destinyCurrent).toBe(1)
  })

  it('does not trigger a save when onQuickValueChange gets the same value', () => {
    const { quickSave } = setup()

    quickSave.onQuickValueChange('insanityPoints', 0)

    expect(deps.updateCharacterCore).not.toHaveBeenCalled()
  })

  it('isSavingInProgress reflects the pending save status', () => {
    const { quickSave } = setup()
    expect(quickSave.isSavingInProgress()).toBe(false)

    quickSave.onQuickValueChange('insanityPoints', 3)

    expect(quickSave.isSavingInProgress()).toBe(true)
  })

  it('swallows a rejected save triggered by onMoneySubtract', async () => {
    deps.updateCharacterCore.mockRejectedValue(new Error('forbidden'))
    const { quickSave } = setup()
    quickSave.editable.value.moneyCopper = 10

    expect(() => quickSave.onMoneySubtract({ silver: 0, copper: 5 })).not.toThrow()

    await vi.waitFor(() => expect(quickSave.globalState.value).toBe('error'))
  })
})
