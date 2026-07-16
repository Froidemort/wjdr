export type UserRole = 'mj' | 'player'

export interface Profile {
  id: string
  username: string
  email: string
  avatarUrl?: string | null
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

export interface SessionNote {
  id: string
  sessionId: string
  authorUserId: string | null
  title: string
  contentText: string | null
  contentCharacterNote: string | null
  contentImagePath: string | null
  isVisible: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSessionNoteInput {
  sessionId: string
  title: string
  contentText?: string | null
  contentCharacterNote?: string | null
  contentImagePath?: string | null
  isVisible?: boolean
}

export interface UpdateSessionNoteInput {
  title?: string
  contentText?: string | null
  contentCharacterNote?: string | null
  contentImagePath?: string | null
  isVisible?: boolean
  isArchived?: boolean
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
  ownerAvatarUrl: string | null
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
  statCode: string
  specialization: string | null
  description: string | null
  masteryLevel: 1 | 2 | 3
  isBasic: boolean
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
  quality: string | null
  encumbrance: number
  damageFormula: string | null
}

export interface CharacterArmor {
  id: string
  armorId: string
  name: string
  description: string | null
  isEquipped: boolean
  coveredLocations?: string[] | null
  quality: string | null
  encumbrance: number
  armorPoints: number
}

export interface CharacterItem {
  id: string
  itemId: string
  name: string
  description: string | null
  quality: string | null
  encumbrance: number
  quantity: number
}

export interface CatalogItem {
  id: string
  name: string
  specialization?: string | null
  description: string | null
  quality?: string | null
  encumbrance?: number | null
  damageFormula?: string | null
  armorPoints?: number | null
}
