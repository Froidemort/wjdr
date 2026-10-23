import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import type { CharacterArmor, CharacterDetail, CharacterWeapon } from '../../src/types/domain'

const deps = vi.hoisted(() => ({
  removeCharacterArmor: vi.fn(),
  removeCharacterWeapon: vi.fn(),
  updateCharacterArmorEquipped: vi.fn(),
  updateCharacterArmorQuality: vi.fn(),
  updateCharacterWeaponEquipped: vi.fn(),
  updateCharacterWeaponQuality: vi.fn(),
  confirmAction: vi.fn(),
}))

vi.mock('../../src/services/characterLinksRepository', () => deps)
vi.mock('../../src/composables/useConfirmAction', () => ({
  useConfirmAction: () => ({ confirmAction: deps.confirmAction }),
}))

import { useCharacterEquipment } from '../../src/composables/useCharacterEquipment'
import { useCharacterFeedback } from '../../src/composables/useCharacterFeedback'

const armor = (overrides: Partial<CharacterArmor> = {}): CharacterArmor => ({
  id: 'a1',
  armorId: 'armor-1',
  name: 'Cotte',
  description: null,
  isEquipped: false,
  coveredLocations: ['corps'],
  quality: 'normal',
  encumbrance: 2,
  armorPoints: 1,
  ...overrides,
})

const weapon = (overrides: Partial<CharacterWeapon> = {}): CharacterWeapon => ({
  id: 'w1',
  weaponId: 'weapon-1',
  name: 'Épée',
  description: null,
  equipped: null,
  quality: 'normal',
  encumbrance: 1,
  damageFormula: null,
  attributes: [],
  ...overrides,
})

function setup(options: { canEdit?: boolean } = {}) {
  const errorMessage = ref<string | null>(null)
  const feedback = useCharacterFeedback({ errorMessage })
  const character = ref({ id: 'char-1' } as CharacterDetail)
  const canEdit = computed(() => options.canEdit ?? true)
  const characterWeapons = ref<CharacterWeapon[]>([])
  const characterArmors = ref<CharacterArmor[]>([])
  const loadCharacterLinks = vi.fn().mockResolvedValue(undefined)
  const invalidateCurrentLinksCache = vi.fn()
  const reloadLinksAfterDelete = vi.fn().mockResolvedValue(undefined)

  const equipment = useCharacterEquipment({
    character,
    canEdit,
    errorMessage,
    feedback,
    links: {
      characterWeapons,
      characterArmors,
      loadCharacterLinks,
      invalidateCurrentLinksCache,
      reloadLinksAfterDelete,
    },
  })

  return {
    equipment,
    errorMessage,
    feedback,
    characterWeapons,
    characterArmors,
    loadCharacterLinks,
    reloadLinksAfterDelete,
  }
}

describe('useCharacterEquipment', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    deps.confirmAction.mockResolvedValue(true)
  })

  it('deletes a weapon and reports success', async () => {
    deps.removeCharacterWeapon.mockResolvedValue(undefined)
    const { equipment, feedback, reloadLinksAfterDelete } = setup()

    await equipment.onDeleteWeapon('w1')

    expect(deps.removeCharacterWeapon).toHaveBeenCalledWith('w1')
    expect(reloadLinksAfterDelete).toHaveBeenCalledWith('char-1')
    expect(feedback.getSectionSuccessMessage('weapons')).toBe('Arme supprimée.')
  })

  it('deletes an armor and reports success', async () => {
    deps.removeCharacterArmor.mockResolvedValue(undefined)
    const { equipment, feedback } = setup()

    await equipment.onDeleteArmor('a1')

    expect(deps.removeCharacterArmor).toHaveBeenCalledWith('a1')
    expect(feedback.getSectionSuccessMessage('armors')).toBe('Armure supprimée.')
  })

  it('refuses to delete a weapon while another action is busy', async () => {
    const { equipment, feedback } = setup()
    feedback.beginAction('busy')

    await equipment.onDeleteWeapon('w1')

    expect(deps.removeCharacterWeapon).not.toHaveBeenCalled()
  })

  it('cancels weapon deletion when the confirmation is dismissed', async () => {
    deps.confirmAction.mockResolvedValue(false)
    const { equipment } = setup()

    await equipment.onDeleteWeapon('w1')

    expect(deps.removeCharacterWeapon).not.toHaveBeenCalled()
  })

  it('reports an error when deleting a weapon fails', async () => {
    deps.removeCharacterWeapon.mockRejectedValue(new Error('down'))
    const { equipment, errorMessage } = setup()

    await equipment.onDeleteWeapon('w1')

    expect(errorMessage.value).toBe('down')
  })

  it('refuses to delete an armor while another action is busy', async () => {
    const { equipment, feedback } = setup()
    feedback.beginAction('busy')

    await equipment.onDeleteArmor('a1')

    expect(deps.removeCharacterArmor).not.toHaveBeenCalled()
  })

  it('cancels armor deletion when the confirmation is dismissed', async () => {
    deps.confirmAction.mockResolvedValue(false)
    const { equipment } = setup()

    await equipment.onDeleteArmor('a1')

    expect(deps.removeCharacterArmor).not.toHaveBeenCalled()
  })

  it('reports an error when deleting an armor fails', async () => {
    deps.removeCharacterArmor.mockRejectedValue(new Error('down'))
    const { equipment, errorMessage } = setup()

    await equipment.onDeleteArmor('a1')

    expect(errorMessage.value).toBe('down')
  })

  it('ignores weapon quality changes when canEdit is false', async () => {
    const { equipment, characterWeapons } = setup({ canEdit: false })
    characterWeapons.value = [weapon()]

    await equipment.onWeaponQualityChange(characterWeapons.value[0], 'bonne')

    expect(deps.updateCharacterWeaponQuality).not.toHaveBeenCalled()
  })

  it('ignores an invalid weapon quality value', async () => {
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon()]

    await equipment.onWeaponQualityChange(characterWeapons.value[0], true)

    expect(deps.updateCharacterWeaponQuality).not.toHaveBeenCalled()
  })

  it('does not call the repository when the weapon quality does not change', async () => {
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon({ quality: 'normal' })]

    await equipment.onWeaponQualityChange(characterWeapons.value[0], 'normal')

    expect(deps.updateCharacterWeaponQuality).not.toHaveBeenCalled()
  })

  it('reports an error when updating the weapon quality fails', async () => {
    deps.updateCharacterWeaponQuality.mockRejectedValue(new Error('down'))
    const { equipment, characterWeapons, errorMessage } = setup()
    characterWeapons.value = [weapon()]

    await equipment.onWeaponQualityChange(characterWeapons.value[0], 'bonne')

    expect(errorMessage.value).toBe('down')
  })

  it('ignores armor quality changes when canEdit is false', async () => {
    const { equipment, characterArmors } = setup({ canEdit: false })
    characterArmors.value = [armor()]

    await equipment.onArmorQualityChange(characterArmors.value[0], 'bonne')

    expect(deps.updateCharacterArmorQuality).not.toHaveBeenCalled()
  })

  it('does not call the repository when the armor quality does not change', async () => {
    const { equipment, characterArmors } = setup()
    characterArmors.value = [armor({ quality: 'normal' })]

    await equipment.onArmorQualityChange(characterArmors.value[0], 'normal')

    expect(deps.updateCharacterArmorQuality).not.toHaveBeenCalled()
  })

  it('updates the armor quality and reloads the links', async () => {
    deps.updateCharacterArmorQuality.mockResolvedValue(undefined)
    const { equipment, characterArmors, feedback, loadCharacterLinks } = setup()
    characterArmors.value = [armor()]

    await equipment.onArmorQualityChange(characterArmors.value[0], 'bonne')

    expect(deps.updateCharacterArmorQuality).toHaveBeenCalledWith('a1', 'bonne')
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
    expect(feedback.getSectionSuccessMessage('armors')).toBe('Qualité de l\'armure mise à jour.')
  })

  it('reports an error when updating the armor quality fails', async () => {
    deps.updateCharacterArmorQuality.mockRejectedValue(new Error('down'))
    const { equipment, characterArmors, errorMessage } = setup()
    characterArmors.value = [armor()]

    await equipment.onArmorQualityChange(characterArmors.value[0], 'bonne')

    expect(errorMessage.value).toBe('down')
  })

  it('ignores armor equip from doll when canEdit is false', async () => {
    const { equipment, characterArmors } = setup({ canEdit: false })
    characterArmors.value = [armor()]

    await equipment.onEquipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('does nothing when equipping an unknown or already equipped armor', async () => {
    const { equipment, characterArmors } = setup()
    characterArmors.value = [armor({ isEquipped: true })]

    await equipment.onEquipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('refuses to equip an armor from the doll while another action is busy', async () => {
    const { equipment, characterArmors, feedback } = setup()
    characterArmors.value = [armor()]
    feedback.beginAction('busy')

    await equipment.onEquipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('ignores an unequip request when canEdit is false', async () => {
    const { equipment, characterArmors } = setup({ canEdit: false })
    characterArmors.value = [armor({ isEquipped: true })]

    await equipment.onUnequipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('does nothing when unequipping an unknown or already unequipped armor', async () => {
    const { equipment, characterArmors } = setup()
    characterArmors.value = [armor({ isEquipped: false })]

    await equipment.onUnequipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('refuses to unequip an armor from the doll while another action is busy', async () => {
    const { equipment, characterArmors, feedback } = setup()
    characterArmors.value = [armor({ isEquipped: true })]
    feedback.beginAction('busy')

    await equipment.onUnequipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('reports an error when unequipping an armor fails', async () => {
    deps.updateCharacterArmorEquipped.mockRejectedValue(new Error('down'))
    const { equipment, characterArmors, errorMessage } = setup()
    characterArmors.value = [armor({ isEquipped: true })]

    await equipment.onUnequipArmorFromDoll('a1')

    expect(errorMessage.value).toBe('down')
  })

  it('does nothing when none of the given armor ids are equipped', async () => {
    const { equipment, characterArmors } = setup()
    characterArmors.value = [armor({ isEquipped: false })]

    await equipment.onUnequipArmorsFromDoll(['a1'])

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('refuses to unequip a batch of armors while another action is busy', async () => {
    const { equipment, characterArmors, feedback } = setup()
    characterArmors.value = [armor({ isEquipped: true })]
    feedback.beginAction('busy')

    await equipment.onUnequipArmorsFromDoll(['a1'])

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('reloads links and reports the error when unequipping a batch of armors fails', async () => {
    deps.updateCharacterArmorEquipped.mockRejectedValue(new Error('down'))
    const { equipment, characterArmors, errorMessage, loadCharacterLinks } = setup()
    characterArmors.value = [armor({ isEquipped: true })]

    await equipment.onUnequipArmorsFromDoll(['a1'])

    expect(errorMessage.value).toBe('down')
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
  })

  it('does nothing when unequipping an empty armor batch', async () => {
    const { equipment } = setup()

    await equipment.onUnequipArmorsFromDoll([])

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
  })

  it('refuses to equip an armor beyond the stack limit', async () => {
    const { equipment, characterArmors, errorMessage } = setup()
    characterArmors.value = [
      armor({ id: 'a1', isEquipped: true }),
      armor({ id: 'a2', isEquipped: true }),
      armor({ id: 'a3', isEquipped: true }),
      armor({ id: 'a4', isEquipped: false }),
    ]

    await equipment.onEquipArmorFromDoll('a4')

    expect(deps.updateCharacterArmorEquipped).not.toHaveBeenCalled()
    expect(errorMessage.value).toBe('Maximum 3 couches d’armure atteint sur une localisation couverte.')
  })

  it('equips an armor from the doll', async () => {
    deps.updateCharacterArmorEquipped.mockResolvedValue(undefined)
    const { equipment, characterArmors, feedback } = setup()
    characterArmors.value = [armor()]

    await equipment.onEquipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).toHaveBeenCalledWith('a1', true)
    expect(characterArmors.value[0].isEquipped).toBe(true)
    expect(feedback.getSectionSuccessMessage('armors')).toBe('Armure équipée (couche ajoutée).')
  })

  it('reloads links and reports the error when equipping an armor fails', async () => {
    deps.updateCharacterArmorEquipped.mockRejectedValue(new Error('down'))
    const { equipment, characterArmors, errorMessage, loadCharacterLinks } = setup()
    characterArmors.value = [armor()]

    await equipment.onEquipArmorFromDoll('a1')

    expect(errorMessage.value).toBe('down')
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
  })

  it('unequips a single armor from the doll', async () => {
    deps.updateCharacterArmorEquipped.mockResolvedValue(undefined)
    const { equipment, characterArmors } = setup()
    characterArmors.value = [armor({ isEquipped: true })]

    await equipment.onUnequipArmorFromDoll('a1')

    expect(deps.updateCharacterArmorEquipped).toHaveBeenCalledWith('a1', false)
    expect(characterArmors.value[0].isEquipped).toBe(false)
  })

  it('unequips a batch of armors with a plural success message', async () => {
    deps.updateCharacterArmorEquipped.mockResolvedValue(undefined)
    const { equipment, characterArmors, feedback } = setup()
    characterArmors.value = [
      armor({ id: 'a1', isEquipped: true }),
      armor({ id: 'a2', isEquipped: true }),
    ]

    await equipment.onUnequipArmorsFromDoll(['a1', 'a2'])

    expect(deps.updateCharacterArmorEquipped).toHaveBeenCalledTimes(2)
    expect(feedback.getSectionSuccessMessage('armors')).toBe('Couches d’armure déséquipées.')
  })

  it('equips a weapon to a free hand', async () => {
    deps.updateCharacterWeaponEquipped.mockResolvedValue(undefined)
    const { equipment, characterWeapons, feedback } = setup()
    characterWeapons.value = [weapon()]

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(deps.updateCharacterWeaponEquipped).toHaveBeenCalledWith('w1', 'droite')
    expect(characterWeapons.value[0].equipped).toBe('droite')
    expect(feedback.getSectionSuccessMessage('weapons')).toBe('Arme équipée.')
  })

  it('ignores weapon equip from doll when canEdit is false', async () => {
    const { equipment, characterWeapons } = setup({ canEdit: false })
    characterWeapons.value = [weapon()]

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('does nothing when equipping an unknown weapon', async () => {
    const { equipment } = setup()

    await equipment.onEquipWeaponFromDoll('unknown', 'droite')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('does nothing when the weapon is already equipped in the resolved hand', async () => {
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon({ equipped: 'droite' })]

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('refuses to equip a weapon from the doll while another action is busy', async () => {
    const { equipment, characterWeapons, feedback } = setup()
    characterWeapons.value = [weapon()]
    feedback.beginAction('busy')

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('replaces the conflicting weapon already in the same hand', async () => {
    deps.updateCharacterWeaponEquipped.mockResolvedValue(undefined)
    const { equipment, characterWeapons, feedback } = setup()
    characterWeapons.value = [
      weapon({ id: 'w1', equipped: 'droite' }),
      weapon({ id: 'w2', equipped: null }),
    ]

    await equipment.onEquipWeaponFromDoll('w2', 'droite')

    expect(deps.updateCharacterWeaponEquipped).toHaveBeenCalledWith('w1', null)
    expect(deps.updateCharacterWeaponEquipped).toHaveBeenCalledWith('w2', 'droite')
    expect(characterWeapons.value.find((w) => w.id === 'w1')?.equipped).toBeNull()
    expect(feedback.getSectionSuccessMessage('weapons')).toBe('Arme équipée (remplacement).')
  })

  it('equips a two-handed weapon to both hands', async () => {
    deps.updateCharacterWeaponEquipped.mockResolvedValue(undefined)
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon({ name: 'Épée à deux mains' })]

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(deps.updateCharacterWeaponEquipped).toHaveBeenCalledWith('w1', 'd&g')
  })

  it('unequips a weapon from the doll', async () => {
    deps.updateCharacterWeaponEquipped.mockResolvedValue(undefined)
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon({ equipped: 'droite' })]

    await equipment.onUnequipWeaponFromDoll('w1')

    expect(deps.updateCharacterWeaponEquipped).toHaveBeenCalledWith('w1', null)
    expect(characterWeapons.value[0].equipped).toBeNull()
  })

  it('ignores weapon unequip from doll when canEdit is false', async () => {
    const { equipment, characterWeapons } = setup({ canEdit: false })
    characterWeapons.value = [weapon({ equipped: 'droite' })]

    await equipment.onUnequipWeaponFromDoll('w1')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('does nothing when unequipping an unknown or already unequipped weapon', async () => {
    const { equipment, characterWeapons } = setup()
    characterWeapons.value = [weapon({ equipped: null })]

    await equipment.onUnequipWeaponFromDoll('w1')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('refuses to unequip a weapon from the doll while another action is busy', async () => {
    const { equipment, characterWeapons, feedback } = setup()
    characterWeapons.value = [weapon({ equipped: 'droite' })]
    feedback.beginAction('busy')

    await equipment.onUnequipWeaponFromDoll('w1')

    expect(deps.updateCharacterWeaponEquipped).not.toHaveBeenCalled()
  })

  it('reports an error when unequipping a weapon fails', async () => {
    deps.updateCharacterWeaponEquipped.mockRejectedValue(new Error('down'))
    const { equipment, characterWeapons, errorMessage } = setup()
    characterWeapons.value = [weapon({ equipped: 'droite' })]

    await equipment.onUnequipWeaponFromDoll('w1')

    expect(errorMessage.value).toBe('down')
  })

  it('reloads links and reports the error when equipping a weapon fails', async () => {
    deps.updateCharacterWeaponEquipped.mockRejectedValue(new Error('down'))
    const { equipment, characterWeapons, errorMessage, loadCharacterLinks } = setup()
    characterWeapons.value = [weapon()]

    await equipment.onEquipWeaponFromDoll('w1', 'droite')

    expect(errorMessage.value).toBe('down')
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
  })
})
