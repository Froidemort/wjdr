import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { CharacterArmor, CharacterDetail, CharacterStatValue } from '../../src/types/domain'

const deps = vi.hoisted(() => ({
  getCharacterById: vi.fn(),
  updateCharacterCore: vi.fn(),
  updateCharacterStatValues: vi.fn(),
  listCharacterLinksBundle: vi.fn(),
  updateCharacterArmorEquipped: vi.fn(),
  enqueueOfflineUpdate: vi.fn(),
  setCharacter: vi.fn(),
  setCampaign: vi.fn(),
  userId: { value: 'me' },
}))

vi.mock('@vueuse/router', () => ({ useRouteParams: () => ref('char-1') }))
vi.mock('../../src/composables/useRealtimeChannels', () => ({
  useRealtimeChannels: () => ({ subscribe: vi.fn(), unsubscribe: vi.fn() }),
}))
vi.mock('../../src/composables/useConfirmAction', () => ({
  useConfirmAction: () => ({ confirmAction: vi.fn().mockResolvedValue(true) }),
}))
vi.mock('../../src/stores/auth', () => ({
  useAuthStore: () => ({
    get user() {
      return { id: deps.userId.value }
    },
  }),
}))
vi.mock('../../src/stores/lastActive', () => ({
  useLastActiveStore: () => ({ setCharacter: deps.setCharacter, setCampaign: deps.setCampaign }),
}))
vi.mock('../../src/services/charactersRepository', () => ({
  getCharacterById: deps.getCharacterById,
  updateCharacterCore: deps.updateCharacterCore,
  updateCharacterStatValues: deps.updateCharacterStatValues,
}))
vi.mock('../../src/services/offlineQueueRepository', () => ({
  enqueueOfflineUpdate: deps.enqueueOfflineUpdate,
}))
vi.mock('../../src/services/characterLinksRepository', () => ({
  invalidateCharacterLinksCache: vi.fn(),
  listCharacterLinksBundle: deps.listCharacterLinksBundle,
  updateCharacterArmorEquipped: deps.updateCharacterArmorEquipped,
  removeCharacterArmor: vi.fn(),
  removeCharacterItem: vi.fn(),
  removeCharacterSkill: vi.fn(),
  removeCharacterTalent: vi.fn(),
  removeCharacterWeapon: vi.fn(),
  updateCharacterArmorQuality: vi.fn(),
  updateCharacterItemQuality: vi.fn(),
  updateCharacterItemQuantity: vi.fn(),
  updateCharacterSkillMastery: vi.fn(),
  updateCharacterWeaponEquipped: vi.fn(),
  updateCharacterWeaponQuality: vi.fn(),
}))

import { useCharacterSheet } from '../../src/composables/useCharacterSheet'

const stat = (statCode: string, baseValue: number, currentAdvanced = 0): CharacterStatValue => ({
  statCode,
  baseValue,
  currentAdvanced,
  totalAdvanced: 0,
  isSecondary: false,
})

function makeCharacter(overrides: Partial<CharacterDetail> = {}): CharacterDetail {
  return {
    id: 'char-1',
    name: 'Gunther',
    race: 'humain',
    gender: 'masculin',
    campaignId: 'camp-1',
    userId: 'me',
    careerId: 'career-1',
    pvCurrent: 8,
    pvMax: 99,
    fortuneCurrent: 2,
    fortuneMax: 3,
    destinyCurrent: 1,
    destinyMax: 2,
    xpTotal: 100,
    xpAvailable: 40,
    insanityPoints: 0,
    moneyGold: 0,
    moneySilver: 0,
    moneyCopper: 0,
    careerName: null,
    ownerAvatarUrl: null,
    stats: [stat('B', 10, 2), stat('F', 30)],
    ...overrides,
  }
}

async function setup(overrides: Partial<CharacterDetail> = {}) {
  deps.getCharacterById.mockResolvedValue(makeCharacter(overrides))
  const sheet = useCharacterSheet()
  await vi.waitFor(() => expect(sheet.loading.value).toBe(false))
  await vi.waitFor(() => expect(sheet.character.value).not.toBeNull())
  return sheet
}

describe('useCharacterSheet', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deps.userId.value = 'me'
    deps.listCharacterLinksBundle.mockResolvedValue({
      skills: [],
      talents: [],
      weapons: [],
      armors: [],
      items: [],
    })
    deps.updateCharacterCore.mockResolvedValue(undefined)
    deps.updateCharacterStatValues.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('derived stats', () => {
    it('derives pvMax from base + advanced of the B stat, ignoring stored pvMax', async () => {
      const sheet = await setup()

      expect(sheet.editable.value.pvMax).toBe(12)
    })

    it('clamps pvCurrent down to pvMax on load', async () => {
      const sheet = await setup({ pvCurrent: 20 })

      expect(sheet.editable.value.pvCurrent).toBe(12)
    })

    it('uses 0 pvMax when B is missing', async () => {
      const sheet = await setup({ stats: [stat('F', 30)], pvCurrent: 5 })

      expect(sheet.editable.value.pvMax).toBe(0)
      expect(sheet.editable.value.pvCurrent).toBe(0)
    })

    it('matches the B stat code case-insensitively', async () => {
      const sheet = await setup({ stats: [stat(' b ', 7)] })

      expect(sheet.editable.value.pvMax).toBe(7)
    })

    it('recomputes pvMax when B advances are ticked and clamps pvCurrent', async () => {
      const sheet = await setup({ pvCurrent: 12 })

      sheet.onStatTick('B', 1)
      expect(sheet.editable.value.pvMax).toBe(13)

      sheet.onStatTick('B', -5)
      expect(sheet.editable.value.pvMax).toBe(10)
      expect(sheet.editable.value.pvCurrent).toBe(10)
    })

    it('recomputes pvMax when B base value changes', async () => {
      const sheet = await setup()

      sheet.onStatBaseChange('B', 20)

      expect(sheet.editable.value.pvMax).toBe(22)
    })

    it('does not touch pvMax when another stat changes', async () => {
      const sheet = await setup()

      sheet.onStatTick('F', 3)

      expect(sheet.editable.value.pvMax).toBe(12)
      expect(sheet.character.value?.stats.find((s) => s.statCode === 'F')?.currentAdvanced).toBe(3)
    })

    it('never lets an advance go below 0', async () => {
      const sheet = await setup()

      sheet.onStatTick('F', -4)

      expect(sheet.character.value?.stats.find((s) => s.statCode === 'F')?.currentAdvanced).toBe(0)
    })
  })

  describe('quick edit', () => {
    it('caps pvCurrent at pvMax', async () => {
      const sheet = await setup()

      sheet.onQuickValueChange('pvCurrent', 50)

      expect(sheet.editable.value.pvCurrent).toBe(12)
    })

    it('floors values at 0', async () => {
      const sheet = await setup()

      sheet.onQuickValueChange('pvCurrent', -3)

      expect(sheet.editable.value.pvCurrent).toBe(0)
    })

    it('caps fortune and destiny current at their max', async () => {
      const sheet = await setup()

      sheet.onQuickValueChange('fortuneCurrent', 9)
      sheet.onQuickValueChange('destinyCurrent', 9)

      expect(sheet.editable.value.fortuneCurrent).toBe(3)
      expect(sheet.editable.value.destinyCurrent).toBe(2)
    })

    it('lowers fortune current when fortune max shrinks', async () => {
      const sheet = await setup({ fortuneCurrent: 3 })

      sheet.onQuickValueChange('fortuneMax', 1)

      expect(sheet.editable.value.fortuneMax).toBe(1)
      expect(sheet.editable.value.fortuneCurrent).toBe(1)
    })

    it('lowers destiny current when destiny max shrinks', async () => {
      const sheet = await setup({ destinyCurrent: 2 })

      sheet.onQuickValueChange('destinyMax', 0)

      expect(sheet.editable.value.destinyCurrent).toBe(0)
    })

    it('saves the edited vitals after the debounce', async () => {
      const sheet = await setup()
      vi.useFakeTimers()

      sheet.onQuickValueChange('pvCurrent', 5)
      sheet.onQuickValueChange('fortuneCurrent', 1)
      expect(deps.updateCharacterCore).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(600)

      expect(deps.updateCharacterCore).toHaveBeenCalledTimes(1)
      expect(deps.updateCharacterCore).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ pv_current: 5, fortune_current: 1, destiny_current: 1 })
      )
    })

    it('does not save when the value is unchanged', async () => {
      const sheet = await setup()
      vi.useFakeTimers()

      sheet.onQuickValueChange('pvCurrent', 8)
      await vi.advanceTimersByTimeAsync(600)

      expect(deps.updateCharacterCore).not.toHaveBeenCalled()
    })

    it('clamps available XP to total XP when saving', async () => {
      const sheet = await setup()
      vi.useFakeTimers()

      sheet.onQuickValueChange('xpAvailable', 500)
      await vi.advanceTimersByTimeAsync(600)

      expect(deps.updateCharacterCore).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ xp_total: 100, xp_available: 100 })
      )
    })

    it('does not save when the user does not own the character', async () => {
      deps.userId.value = 'someone-else'
      const sheet = await setup()
      vi.useFakeTimers()

      sheet.onQuickValueChange('pvCurrent', 5)
      sheet.onStatTick('F', 1)
      await vi.advanceTimersByTimeAsync(1000)

      expect(sheet.canEditQuickSection.value).toBe(false)
      expect(deps.updateCharacterCore).not.toHaveBeenCalled()
      expect(deps.updateCharacterStatValues).not.toHaveBeenCalled()
    })

    it('saves stat advances through the stat repository', async () => {
      const sheet = await setup()
      vi.useFakeTimers()

      sheet.onStatTick('B', 2)
      await vi.advanceTimersByTimeAsync(500)

      expect(deps.updateCharacterStatValues).toHaveBeenCalledWith('char-1', 'B', {
        current_advanced: 4,
        base_value: undefined,
        total_advanced: undefined,
      })
    })
  })

  describe('last active store', () => {
    it('remembers own character', async () => {
      await setup()

      expect(deps.setCharacter).toHaveBeenCalledWith('camp-1', 'char-1')
    })

    it('only remembers the campaign for another player sheet', async () => {
      deps.userId.value = 'mj'
      await setup()

      expect(deps.setCampaign).toHaveBeenCalledWith('camp-1')
      expect(deps.setCharacter).not.toHaveBeenCalled()
    })
  })

  describe('equipment from the doll', () => {
    const armor = (overrides: Partial<CharacterArmor> = {}): CharacterArmor => ({
      id: 'a1',
      armorId: 'arm-1',
      name: 'Cotte',
      description: null,
      isEquipped: false,
      quality: 'normal',
      encumbrance: 2,
      armorPoints: 1,
      ...overrides,
    })

    it('equips an armor and exposes a success message', async () => {
      deps.listCharacterLinksBundle.mockResolvedValue({
        skills: [],
        talents: [],
        weapons: [],
        armors: [armor()],
        items: [],
      })
      deps.updateCharacterArmorEquipped.mockResolvedValue(undefined)
      const sheet = await setup()

      await sheet.onEquipArmorFromDoll('a1')

      expect(deps.updateCharacterArmorEquipped).toHaveBeenCalledWith('a1', true)
      expect(sheet.characterArmors.value[0].isEquipped).toBe(true)
      expect(sheet.getSectionSuccessMessage('armors')).toBe('Armure équipée (couche ajoutée).')
    })

    it('ignores equipping an already equipped armor', async () => {
      deps.listCharacterLinksBundle.mockResolvedValue({
        skills: [],
        talents: [],
        weapons: [],
        armors: [armor({ isEquipped: true })],
        items: [],
      })
      const sheet = await setup()

      await sheet.onEquipArmorFromDoll('a1')

      expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
    })

    it('unequips an armor', async () => {
      deps.listCharacterLinksBundle.mockResolvedValue({
        skills: [],
        talents: [],
        weapons: [],
        armors: [armor({ isEquipped: true })],
        items: [],
      })
      deps.updateCharacterArmorEquipped.mockResolvedValue(undefined)
      const sheet = await setup()

      await sheet.onUnequipArmorFromDoll('a1')

      expect(deps.updateCharacterArmorEquipped).toHaveBeenCalledWith('a1', false)
      expect(sheet.characterArmors.value[0].isEquipped).toBe(false)
    })
  })
})
