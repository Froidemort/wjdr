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

export type WeaponPreferredHand = 'droite' | 'gauche'

export type WeaponHand = WeaponPreferredHand | 'd&g'

export type ArmorSlotDefinition = {
  id: ArmorSlotId
  label: string
  dataLocation: ArmorDataLocation
  hitRange: string
}

export type WeaponSlotDefinition = {
  id: WeaponSlotId
  label: string
  hand: WeaponPreferredHand
}

export type ArmorByLocation = {
  tete: number
  corps: number
  bras: number
  jambes: number
}
