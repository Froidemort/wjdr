import type { CharacterArmor, CharacterWeapon } from '../types/domain'

export type ArmorDataLocation = 'tête' | 'corps' | 'bras' | 'jambes'

export type ArmorSlotId =
  | 'tete'
  | 'bras_droit'
  | 'bras_gauche'
  | 'corps'
  | 'jambe_droite'
  | 'jambe_gauche'

export type WeaponSlotId = 'main_droite' | 'main_gauche'

export type EquipmentSlotId = ArmorSlotId | WeaponSlotId

export type WeaponHand = 'droite' | 'gauche' | 'd&g'

export type ArmorSlotDefinition = {
  id: ArmorSlotId
  kind: 'armor'
  label: string
  shortLabel: string
  dataLocation: ArmorDataLocation
  hitRange: string
  column: 'left' | 'right'
  row: 0 | 1 | 2
}

export type WeaponSlotDefinition = {
  id: WeaponSlotId
  kind: 'weapon'
  label: string
  shortLabel: string
  hand: 'droite' | 'gauche'
  column: 'left' | 'right'
}

export const ARMOR_SLOTS: readonly ArmorSlotDefinition[] = [
  {
    id: 'tete',
    kind: 'armor',
    label: 'Tête',
    shortLabel: 'Tête',
    dataLocation: 'tête',
    hitRange: '01-15',
    column: 'left',
    row: 0,
  },
  {
    id: 'bras_droit',
    kind: 'armor',
    label: 'Bras droit',
    shortLabel: 'Bras D',
    dataLocation: 'bras',
    hitRange: '16-35',
    column: 'left',
    row: 1,
  },
  {
    id: 'jambe_droite',
    kind: 'armor',
    label: 'Jambe droite',
    shortLabel: 'Jambe D',
    dataLocation: 'jambes',
    hitRange: '81-90',
    column: 'left',
    row: 2,
  },
  {
    id: 'corps',
    kind: 'armor',
    label: 'Corps',
    shortLabel: 'Corps',
    dataLocation: 'corps',
    hitRange: '56-80',
    column: 'right',
    row: 0,
  },
  {
    id: 'bras_gauche',
    kind: 'armor',
    label: 'Bras gauche',
    shortLabel: 'Bras G',
    dataLocation: 'bras',
    hitRange: '36-55',
    column: 'right',
    row: 1,
  },
  {
    id: 'jambe_gauche',
    kind: 'armor',
    label: 'Jambe gauche',
    shortLabel: 'Jambe G',
    dataLocation: 'jambes',
    hitRange: '91-00',
    column: 'right',
    row: 2,
  },
] as const

export const WEAPON_SLOTS: readonly WeaponSlotDefinition[] = [
  {
    id: 'main_droite',
    kind: 'weapon',
    label: 'Main droite',
    shortLabel: 'MD',
    hand: 'droite',
    column: 'left',
  },
  {
    id: 'main_gauche',
    kind: 'weapon',
    label: 'Main gauche',
    shortLabel: 'MG',
    hand: 'gauche',
    column: 'right',
  },
] as const

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

export function normalizeArmorLocation(location: string): ArmorDataLocation | null {
  const normalized = location.trim().toLowerCase()
  if (normalized === 'tête' || normalized === 'tete') {
    return 'tête'
  }
  if (normalized === 'corps') {
    return 'corps'
  }
  if (normalized === 'bras') {
    return 'bras'
  }
  if (normalized === 'jambes') {
    return 'jambes'
  }
  return null
}

export function getArmorCoveredLocations(armor: CharacterArmor): ArmorDataLocation[] {
  if (!armor.coveredLocations?.length) {
    return []
  }

  const locations: ArmorDataLocation[] = []
  for (const location of armor.coveredLocations) {
    const normalized = normalizeArmorLocation(location)
    if (normalized && !locations.includes(normalized)) {
      locations.push(normalized)
    }
  }
  return locations
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

/** Equip hand is derived from the weapon: 2H → both hands, else the preferred hand. */
export function resolveWeaponEquipHand(
  weapon: Pick<CharacterWeapon, 'name'>,
  preferredHand: 'droite' | 'gauche'
): WeaponHand {
  return isTwoHandedWeapon(weapon) ? 'd&g' : preferredHand
}

export function getWeaponForHand(
  weapons: readonly CharacterWeapon[],
  hand: 'droite' | 'gauche'
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

export type ArmorByLocation = {
  tete: number
  corps: number
  bras: number
  jambes: number
}

export function getArmorPointsForSlot(
  armorByLocation: ArmorByLocation,
  slotId: ArmorSlotId
): number {
  const slot = getArmorSlot(slotId)
  switch (slot.dataLocation) {
    case 'tête':
      return armorByLocation.tete
    case 'corps':
      return armorByLocation.corps
    case 'bras':
      return armorByLocation.bras
    case 'jambes':
      return armorByLocation.jambes
  }
}
