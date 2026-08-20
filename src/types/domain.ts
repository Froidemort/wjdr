import type { CharacterCore } from './character'

export type UserRole = 'mj' | 'player'

export interface Profile {
  id: string
  username: string
  email: string
  avatarUrl?: string | null
}

export interface CampaignSummary {
  id: string
  name: string
  code: string
  description: string | null
  isArchived: boolean
  mjId: string
  createdAt: string | null
}

export interface SessionSummary {
  id: string
  campaignId: string
  date: string
  name: string | null
  description: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface SessionNote {
  id: string
  campaignId: string
  sessionId?: string | null
  authorUserId: string | null
  title: string
  contentText: string | null
  isVisible: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSessionNoteInput {
  campaignId: string
  sessionId?: string | null
  title: string
  contentText?: string | null
  isVisible?: boolean
}

export interface CreateSessionInput {
  campaignId: string
  date: string
  name?: string | null
  description?: string | null
}

export interface UpdateSessionNoteInput {
  title?: string
  contentText?: string | null
  sessionId?: string | null
  isVisible?: boolean
  isArchived?: boolean
}

export interface CharacterSummary extends CharacterCore {
  careerName: string | null
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

export type InventoryQuality = 'médiocre' | 'normal' | 'bonne' | 'exceptionelle'

export interface CharacterSkill {
  skillId: string
  name: string
  statCode: string
  specialization: string | null
  description: string | null
  masteryLevel: 1 | 2 | 3
  isBasic: boolean
  linkedTalents?: CharacterTalent[]
}

export interface CharacterTalent {
  talentId: string
  name: string
  specialization: string | null
  description: string | null
}

export interface WeaponAttribute {
  id: string
  name: string
  description: string | null
}

export interface CharacterWeapon {
  id: string
  weaponId: string
  name: string
  description: string | null
  equipped: 'droite' | 'gauche' | 'd&g' | null
  quality: InventoryQuality
  encumbrance: number
  damageFormula: string | null
  attributes: WeaponAttribute[]
}

export interface CharacterArmor {
  id: string
  armorId: string
  name: string
  description: string | null
  isEquipped: boolean
  coveredLocations?: string[] | null
  quality: InventoryQuality
  encumbrance: number
  armorPoints: number
}

export interface CharacterItem {
  id: string
  itemId: string
  name: string
  description: string | null
  quality: InventoryQuality
  encumbrance: number
  quantity: number
}

export type { CatalogItem } from './catalog'
