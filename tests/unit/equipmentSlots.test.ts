import { describe, expect, it } from 'vitest'
import type { CharacterArmor, CharacterWeapon } from '../../src/types/domain'
import {
  MAX_ARMORS_PER_LOCATION,
  armorCoversLocation,
  canEquipArmorStack,
  countEquippedArmorsForLocation,
  filterArmorsForSlot,
  findConflictingArmors,
  findConflictingWeapons,
  getArmorPointsForSlot,
  getArmorStackLimitLocations,
  getEquippedArmorsForSlot,
  getPrimaryArmorForSlot,
  getWeaponForHand,
  isTwoHandedWeapon,
  normalizeArmorLocation,
  resolveWeaponEquipHand,
} from '../../src/utils/equipmentSlots'

function makeArmor(partial: Partial<CharacterArmor> & Pick<CharacterArmor, 'id' | 'name'>): CharacterArmor {
  return {
    armorId: partial.armorId ?? partial.id,
    description: null,
    isEquipped: false,
    coveredLocations: null,
    quality: 'normal',
    encumbrance: 10,
    armorPoints: 1,
    ...partial,
  }
}

function makeWeapon(
  partial: Partial<CharacterWeapon> & Pick<CharacterWeapon, 'id' | 'name'>
): CharacterWeapon {
  return {
    weaponId: partial.weaponId ?? partial.id,
    description: null,
    equipped: null,
    quality: 'normal',
    encumbrance: 5,
    damageFormula: 'SB',
    ...partial,
  }
}

describe('equipmentSlots', () => {
  it('normalizes head location accents', () => {
    expect(normalizeArmorLocation('tête')).toBe('tête')
    expect(normalizeArmorLocation('Tete')).toBe('tête')
    expect(normalizeArmorLocation('corps')).toBe('corps')
  })

  it('filters armors by slot location including multi-cover pieces', () => {
    const armors = [
      makeArmor({ id: '1', name: 'Casque', coveredLocations: ['tête'] }),
      makeArmor({ id: '2', name: 'Veste', coveredLocations: ['corps', 'bras'] }),
      makeArmor({ id: '3', name: 'Jambières', coveredLocations: ['jambes'] }),
    ]

    expect(filterArmorsForSlot(armors, 'tete').map((a) => a.id)).toEqual(['1'])
    expect(filterArmorsForSlot(armors, 'bras_droit').map((a) => a.id)).toEqual(['2'])
    expect(filterArmorsForSlot(armors, 'bras_gauche').map((a) => a.id)).toEqual(['2'])
    expect(filterArmorsForSlot(armors, 'corps').map((a) => a.id)).toEqual(['2'])
  })

  it('lists overlapping equipped armors without blocking stacks', () => {
    const candidate = makeArmor({
      id: 'new',
      name: 'Chemise',
      coveredLocations: ['corps', 'bras'],
    })
    const armors = [
      makeArmor({
        id: 'helm',
        name: 'Casque',
        isEquipped: true,
        coveredLocations: ['tête'],
      }),
      makeArmor({
        id: 'vest',
        name: 'Gilet',
        isEquipped: true,
        coveredLocations: ['corps'],
      }),
      makeArmor({
        id: 'arms',
        name: 'Brassards',
        isEquipped: true,
        coveredLocations: ['bras'],
      }),
      candidate,
    ]

    expect(findConflictingArmors(armors, candidate).map((a) => a.id).sort()).toEqual([
      'arms',
      'vest',
    ])
    expect(canEquipArmorStack(armors, candidate)).toBe(true)
  })

  it('allows stacking up to three layers then blocks', () => {
    const armors = [
      makeArmor({
        id: 'soft',
        name: 'Chemise',
        isEquipped: true,
        coveredLocations: ['corps'],
        armorPoints: 1,
      }),
      makeArmor({
        id: 'mail',
        name: 'Maille',
        isEquipped: true,
        coveredLocations: ['corps'],
        armorPoints: 2,
      }),
      makeArmor({
        id: 'plate',
        name: 'Plastron',
        isEquipped: true,
        coveredLocations: ['corps'],
        armorPoints: 3,
      }),
      makeArmor({
        id: 'extra',
        name: 'Surcot',
        coveredLocations: ['corps'],
        armorPoints: 1,
      }),
    ]

    expect(countEquippedArmorsForLocation(armors, 'corps')).toBe(MAX_ARMORS_PER_LOCATION)
    expect(getEquippedArmorsForSlot(armors, 'corps').map((a) => a.id)).toEqual([
      'plate',
      'mail',
      'soft',
    ])
    expect(getArmorStackLimitLocations(armors, armors[3])).toEqual(['corps'])
    expect(canEquipArmorStack(armors, armors[3])).toBe(false)
  })

  it('blocks multi-cover pieces when any shared location is full', () => {
    const armors = [
      makeArmor({
        id: 'a1',
        name: 'A1',
        isEquipped: true,
        coveredLocations: ['bras'],
      }),
      makeArmor({
        id: 'a2',
        name: 'A2',
        isEquipped: true,
        coveredLocations: ['bras'],
      }),
      makeArmor({
        id: 'a3',
        name: 'A3',
        isEquipped: true,
        coveredLocations: ['bras'],
      }),
      makeArmor({
        id: 'veste',
        name: 'Veste',
        coveredLocations: ['corps', 'bras'],
      }),
    ]

    expect(canEquipArmorStack(armors, armors[3])).toBe(false)
    expect(getArmorStackLimitLocations(armors, armors[3])).toEqual(['bras'])
  })

  it('shares the same primary armor across left/right arm slots', () => {
    const armors = [
      makeArmor({
        id: 'veste',
        name: 'Veste de cuir',
        isEquipped: true,
        coveredLocations: ['corps', 'bras'],
        armorPoints: 1,
      }),
    ]

    expect(getPrimaryArmorForSlot(armors, 'bras_droit')?.id).toBe('veste')
    expect(getPrimaryArmorForSlot(armors, 'bras_gauche')?.id).toBe('veste')
    expect(armorCoversLocation(armors[0], 'bras')).toBe(true)
    expect(
      getArmorPointsForSlot({ tete: 0, corps: 1, bras: 1, jambes: 0 }, 'bras_droit')
    ).toBe(1)
  })

  it('treats two-handed weapons as occupying both hands', () => {
    const weapons = [
      makeWeapon({ id: 'spear', name: 'Lance', equipped: 'd&g' }),
      makeWeapon({ id: 'sword', name: 'Épée', equipped: null }),
    ]

    expect(getWeaponForHand(weapons, 'droite')?.id).toBe('spear')
    expect(getWeaponForHand(weapons, 'gauche')?.id).toBe('spear')
    expect(findConflictingWeapons(weapons, 'sword', 'droite').map((w) => w.id)).toEqual(['spear'])
    expect(findConflictingWeapons(weapons, 'sword', 'd&g').map((w) => w.id)).toEqual(['spear'])
  })

  it('derives equip hand from weapon type without player choice', () => {
    expect(isTwoHandedWeapon({ name: 'Marteau à deux mains' })).toBe(true)
    expect(isTwoHandedWeapon({ name: 'Hallebarde' })).toBe(true)
    expect(isTwoHandedWeapon({ name: 'Arc long' })).toBe(true)
    expect(isTwoHandedWeapon({ name: 'Marteau à une main' })).toBe(false)
    expect(isTwoHandedWeapon({ name: 'Arbalète de poing' })).toBe(false)
    expect(isTwoHandedWeapon({ name: 'Bouclier' })).toBe(false)

    expect(resolveWeaponEquipHand({ name: 'Épée à deux mains' }, 'gauche')).toBe('d&g')
    expect(resolveWeaponEquipHand({ name: 'Dague' }, 'gauche')).toBe('gauche')
    expect(resolveWeaponEquipHand({ name: 'Bouclier' }, 'droite')).toBe('droite')
  })
})
