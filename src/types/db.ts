import type { CharacterGender } from './character'

export interface CharacterRow {
  id: string
  name: string
  race: string
  gender: CharacterGender | string
  campaign_id: string
  user_id: string
  career_id: string
  pv_current: number
  pv_max: number
  fortune_current: number
  fortune_max: number
  destiny_current: number
  xp_total: number
  xp_available: number
  insanity_points: number
  money_gold: number
  money_silver: number
  money_copper: number
}

export interface CharacterWithCareerRow extends CharacterRow {
  career?: {
    name?: string
  } | null
}

export interface CharacterStatRow {
  stat_code: string
  base_value: number
  current_advanced: number
  total_advanced: number
}

export interface CareerRow {
  id: string
  name?: string
}

export interface CareerCharacteristicRow {
  stat_code: string
  value: number
}

export interface CareerPathRow {
  from_career_id: string
  to_career_id: string
}

export interface ProfileAvatarRow {
  id: string
  avatar_url?: string | null
}

export interface StaticStatRow {
  code: string
  is_secondary?: boolean
}

export interface CampaignRow {
  id: string
  name: string
  code: string
  description: string | null
  is_archived: boolean
  mj_id: string
  created_at: string | null
}

export interface SessionRow {
  id: string
  campaign_id: string
  date: string
  name: string | null
  description: string | null
  created_at: string | null
  updated_at: string | null
}

export interface BasicProfileRow {
  id: string
  username: string
  email: string
}

export interface ProfileSettingsRow {
  username: string
  email: string
  avatar_url: string | null
}
