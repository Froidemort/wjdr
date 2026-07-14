export type UserRole = 'mj' | 'player'

export interface Profile {
  id: string
  username: string
  email: string
}

export interface SessionSummary {
  id: string
  name: string
  code: string
  description: string | null
  isArchived: boolean
  mjId: string
  createdAt: string | null
}

export interface CharacterSummary {
  id: string
  name: string
  race: string
  gender: 'masculin' | 'féminin'
  sessionId: string
  userId: string
  careerId: string
  careerName: string | null
  pvCurrent: number
  pvMax: number
  fortuneCurrent: number
  fortuneMax: number
  destinyCurrent: number
  xpTotal: number
  xpAvailable: number
  moneyGold: number
  moneySilver: number
  moneyCopper: number
}

export interface CharacterStatValue {
  statCode: string
  baseValue: number
  currentAdvanced: number
  totalAdvanced: number
  isSecondary: boolean
}

export interface CharacterDetail extends CharacterSummary {
  stats: CharacterStatValue[]
}

export interface CharacterSkill {
  skillId: string
  name: string
  specialization: string | null
  description: string | null
  masteryLevel: 1 | 2 | 3
}

export interface CharacterTalent {
  talentId: string
  name: string
  specialization: string | null
  description: string | null
}

export interface CharacterWeapon {
  id: string
  weaponId: string
  name: string
  description: string | null
  equipped: 'droite' | 'gauche' | 'd&g' | null
}

export interface CharacterArmor {
  id: string
  armorId: string
  name: string
  description: string | null
  isEquipped: boolean
  coveredLocations?: string[] | null
}

export interface CatalogItem {
  id: string
  name: string
  specialization?: string | null
  description: string | null
}
