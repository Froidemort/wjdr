import type { CharacterArmor, CharacterWeapon } from '../types/domain'
import type {
  ArmorByLocation,
  ArmorDataLocation,
  ArmorSlotDefinition,
  ArmorSlotId,
  WeaponHand,
  WeaponPreferredHand,
  WeaponSlotDefinition,
  WeaponSlotId,
} from '../types/equipment'

export type {
  ArmorByLocation,
  ArmorDataLocation,
  ArmorSlotDefinition,
  ArmorSlotId,
  EquipmentSlotId,
  WeaponHand,
  WeaponPreferredHand,
  WeaponSlotDefinition,
  WeaponSlotId,
} from '../types/equipment'

export const ARMOR_SLOTS: readonly ArmorSlotDefinition[] = [
  {
    id: 'tete',
    label: 'Tête',
    dataLocation: 'tête',
    hitRange: '01-15',
  },
  {
    id: 'bras_droit',
    label: 'Bras droit',
    dataLocation: 'bras',
    hitRange: '16-35',
  },
  {
    id: 'jambe_droite',
    label: 'Jambe droite',
    dataLocation: 'jambes',
    hitRange: '81-90',
  },
  {
    id: 'corps',
    label: 'Corps',
    dataLocation: 'corps',
    hitRange: '56-80',
  },
  {
    id: 'bras_gauche',
    label: 'Bras gauche',
    dataLocation: 'bras',
    hitRange: '36-55',
  },
  {
    id: 'jambe_gauche',
    label: 'Jambe gauche',
    dataLocation: 'jambes',
    hitRange: '91-00',
  },
]

const WEAPON_SLOTS: readonly WeaponSlotDefinition[] = [
  {
    id: 'main_droite',
    label: 'Main droite',
    hand: 'droite',
  },
  {
    id: 'main_gauche',
    label: 'Main gauche',
    hand: 'gauche',
  },
]

const ARMOR_SLOT_BY_ID = new Map(ARMOR_SLOTS.map((slot) => [slot.id, slot]))
const WEAPON_SLOT_BY_ID = new Map(WEAPON_SLOTS.map((slot) => [slot.id, slot]))

export function getArmorSlot(id: ArmorSlotId): ArmorSlotDefinition {
  const slot = ARMOR_SLOT_BY_ID.get(id)
  if (!slot) {
    throw new Error(`Unknown armor slot: ${id}`)
  }
  return slot
}

export function getWeaponSlot(id: WeaponSlotId): WeaponSlotDefinition {
  const slot = WEAPON_SLOT_BY_ID.get(id)
  if (!slot) {
    throw new Error(`Unknown weapon slot: ${id}`)
  }
  return slot
}

export function isArmorSlotId(id: string): id is ArmorSlotId {
  return ARMOR_SLOT_BY_ID.has(id as ArmorSlotId)
}

export function isWeaponSlotId(id: string): id is WeaponSlotId {
  return WEAPON_SLOT_BY_ID.has(id as WeaponSlotId)
}

export function getArmorCoveredLocations(armor: CharacterArmor): ArmorDataLocation[] {
  // covered_locations is guaranteed by a DB CHECK constraint to only contain valid ArmorDataLocation values
  return (armor.coveredLocations ?? []) as ArmorDataLocation[]
}

export function armorCoversLocation(armor: CharacterArmor, location: ArmorDataLocation): boolean {
  return getArmorCoveredLocations(armor).includes(location)
}

export function locationsOverlap(
  left: readonly ArmorDataLocation[],
  right: readonly ArmorDataLocation[]
): boolean {
  return left.some((location) => right.includes(location))
}

export function filterArmorsForSlot(
  armors: readonly CharacterArmor[],
  slotId: ArmorSlotId
): CharacterArmor[] {
  const slot = getArmorSlot(slotId)
  return armors.filter((armor) => armorCoversLocation(armor, slot.dataLocation))
}

/** Soft + mail + plate (WFRP-style layering). */
export const MAX_ARMORS_PER_LOCATION = 3

export function getEquippedArmorsForSlot(
  armors: readonly CharacterArmor[],
  slotId: ArmorSlotId
): CharacterArmor[] {
  return filterArmorsForSlot(armors, slotId)
    .filter((armor) => armor.isEquipped)
    .sort((left, right) => {
      if (right.armorPoints !== left.armorPoints) {
        return right.armorPoints - left.armorPoints
      }
      return left.name.localeCompare(right.name, 'fr')
    })
}

/** Primary display piece for a slot (highest PA covering that location). */
export function getPrimaryArmorForSlot(
  armors: readonly CharacterArmor[],
  slotId: ArmorSlotId
): CharacterArmor | null {
  return getEquippedArmorsForSlot(armors, slotId)[0] ?? null
}

export function countEquippedArmorsForLocation(
  armors: readonly CharacterArmor[],
  location: ArmorDataLocation
): number {
  return armors.filter(
    (armor) => armor.isEquipped && armorCoversLocation(armor, location)
  ).length
}

/**
 * Locations where equipping `candidate` would exceed the stack limit.
 * Empty array means the piece can be stacked.
 */
export function getArmorStackLimitLocations(
  armors: readonly CharacterArmor[],
  candidate: CharacterArmor
): ArmorDataLocation[] {
  const candidateLocations = getArmorCoveredLocations(candidate)
  if (candidateLocations.length === 0) {
    return []
  }

  return candidateLocations.filter(
    (location) => countEquippedArmorsForLocation(armors, location) >= MAX_ARMORS_PER_LOCATION
  )
}

export function canEquipArmorStack(
  armors: readonly CharacterArmor[],
  candidate: CharacterArmor
): boolean {
  if (candidate.isEquipped) {
    return true
  }
  return getArmorStackLimitLocations(armors, candidate).length === 0
}

/**
 * Equipped pieces that share at least one location with the candidate.
 * Useful for UI context; stacking is allowed up to MAX_ARMORS_PER_LOCATION.
 */
export function findConflictingArmors(
  armors: readonly CharacterArmor[],
  candidate: CharacterArmor
): CharacterArmor[] {
  const candidateLocations = getArmorCoveredLocations(candidate)
  if (candidateLocations.length === 0) {
    return []
  }

  return armors.filter(
    (armor) =>
      armor.id !== candidate.id &&
      armor.isEquipped &&
      locationsOverlap(getArmorCoveredLocations(armor), candidateLocations)
  )
}

/** Normalize weapon names for handedness heuristics (catalog has no dedicated column). */
function normalizeWeaponName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

const TWO_HANDED_WEAPON_NAMES = new Set([
  'hallebarde',
  'baton',
  'arc',
  'arc court',
  'arc long',
  'arc elfique',
  'arbalete',
  'arbalete a repetition',
  'arquebuse',
  'arquebuse a repetition',
  "long fusil d'hochland",
  'tromblon',
])

/** True when the weapon requires both hands (no player choice). */
export function isTwoHandedWeapon(weapon: Pick<CharacterWeapon, 'name'>): boolean {
  const name = normalizeWeaponName(weapon.name)
  if (name.includes('deux mains')) {
    return true
  }
  if (name.includes('une main') || name.includes('de poing')) {
    return false
  }
  return TWO_HANDED_WEAPON_NAMES.has(name)
}

/** Type guard : vérifie qu'une valeur est un WeaponHand valide. */
export function isWeaponHand(value: string | boolean | null): value is WeaponHand {
  return value === 'droite' || value === 'gauche' || value === 'd&g'
}

/** Equip hand is derived from the weapon: 2H → both hands, else the preferred hand. */
export function resolveWeaponEquipHand(
  weapon: Pick<CharacterWeapon, 'name'>,
  preferredHand: WeaponPreferredHand
): WeaponHand {
  return isTwoHandedWeapon(weapon) ? 'd&g' : preferredHand
}

export function getWeaponForHand(
  weapons: readonly CharacterWeapon[],
  hand: WeaponPreferredHand
): CharacterWeapon | null {
  const twoHanded = weapons.find((weapon) => weapon.equipped === 'd&g')
  if (twoHanded) {
    return twoHanded
  }

  return weapons.find((weapon) => weapon.equipped === hand) ?? null
}

export function getWeaponForSlot(
  weapons: readonly CharacterWeapon[],
  slotId: WeaponSlotId
): CharacterWeapon | null {
  const slot = getWeaponSlot(slotId)
  return getWeaponForHand(weapons, slot.hand)
}

export function findConflictingWeapons(
  weapons: readonly CharacterWeapon[],
  candidateId: string,
  target: WeaponHand
): CharacterWeapon[] {
  return weapons.filter((weapon) => {
    if (weapon.id === candidateId || weapon.equipped === null) {
      return false
    }

    if (target === 'd&g') {
      return true
    }

    return weapon.equipped === target || weapon.equipped === 'd&g'
  })
}

const ARMOR_LOCATION_KEYS = {
  tête: 'tete',
  corps: 'corps',
  bras: 'bras',
  jambes: 'jambes',
} as const satisfies Record<ArmorDataLocation, keyof ArmorByLocation>

export function computeArmorByLocation(armors: readonly CharacterArmor[]): ArmorByLocation {
  const totals: ArmorByLocation = {
    tete: 0,
    corps: 0,
    bras: 0,
    jambes: 0,
  }

  for (const armor of armors) {
    if (!armor.isEquipped) {
      continue
    }

    for (const location of getArmorCoveredLocations(armor)) {
      totals[ARMOR_LOCATION_KEYS[location]] += armor.armorPoints
    }
  }

  return totals
}

export function getArmorPointsForSlot(
  armorByLocation: ArmorByLocation,
  slotId: ArmorSlotId
): number {
  return armorByLocation[ARMOR_LOCATION_KEYS[getArmorSlot(slotId).dataLocation]]
}
