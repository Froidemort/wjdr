import { supabase } from '../db/supabase'
import type {
  CareerRow,
  CharacterRow,
  CharacterStatRow,
  CharacterWithCareerRow,
  ProfileAvatarRow,
  StaticStatRow,
} from '../types/db'
import type { CreateCharacterPayload } from '../types/character'
import type { CharacterDetail, CharacterStatValue, CharacterSummary } from '../types/domain'
import { withRetry } from './shared/retry'

export type { CharacterGender, CharacterRace, CreateCharacterPayload } from '../types/character'

const DEFAULT_CHARACTER_CAREER_NAME = 'Serviteur'

function mapCharacter(
  row: CharacterRow,
  careerName: string | null = null,
  ownerAvatarUrl: string | null = null
): CharacterSummary {
  return {
    id: row.id,
    name: row.name,
    race: row.race,
    gender: row.gender === 'masculin' ? 'masculin' : 'féminin',
    campaignId: row.campaign_id,
    userId: row.user_id,
    careerId: row.career_id,
    careerName,
    pvCurrent: row.pv_current,
    pvMax: row.pv_max,
    fortuneCurrent: row.fortune_current,
    fortuneMax: row.fortune_max,
    destinyCurrent: row.destiny_current,
    xpTotal: row.xp_total,
    xpAvailable: row.xp_available,
    insanityPoints: row.insanity_points,
    moneyGold: row.money_gold,
    moneySilver: row.money_silver,
    moneyCopper: row.money_copper,
    ownerAvatarUrl,
  }
}

async function resolveCareerNames(careerIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(careerIds.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase.from('careers').select('id, name').in('id', uniqueIds)

  if (error) {
    throw error
  }

  const byId = new Map<string, string>()
  for (const row of (data ?? []) as CareerRow[]) {
    if (row.id && row.name) {
      byId.set(row.id, row.name)
    }
  }

  return byId
}

async function resolveOwnerAvatars(userIds: string[]): Promise<Map<string, string | null>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', uniqueIds)

  if (error) {
    throw error
  }

  const byId = new Map<string, string | null>()
  for (const row of (data ?? []) as ProfileAvatarRow[]) {
    byId.set(row.id, row.avatar_url ?? null)
  }

  return byId
}

function mapCharacterStat(row: CharacterStatRow): CharacterStatValue {
  return {
    statCode: row.stat_code,
    baseValue: row.base_value,
    currentAdvanced: row.current_advanced,
    totalAdvanced: row.total_advanced,
    isSecondary: false,
  }
}

async function assertCharacterCampaignWritable(characterId: string): Promise<void> {
  const { data: characterMeta, error: characterMetaError } = await supabase
    .from('characters')
    .select('campaign_id')
    .eq('id', characterId)
    .maybeSingle()

  if (characterMetaError) {
    throw characterMetaError
  }

  if (!characterMeta) {
    throw new Error('Personnage introuvable.')
  }

  const { data: campaignMeta, error: campaignMetaError } = await supabase
    .from('campaigns')
    .select('is_archived')
    .eq('id', characterMeta.campaign_id as string)
    .maybeSingle()

  if (campaignMetaError) {
    throw campaignMetaError
  }

  if (campaignMeta?.is_archived) {
    throw new Error('Campagne archivee: action interdite.')
  }
}

async function resolveDefaultCareerId(): Promise<string> {
  const { data, error } = await supabase
    .from('careers')
    .select('id')
    .eq('name', DEFAULT_CHARACTER_CAREER_NAME)
    .maybeSingle()

  if (error) {
    throw error
  }

  const career = data as CareerRow | null
  if (!career?.id) {
    throw new Error('Carriere par defaut introuvable.')
  }

  return career.id
}

async function createInitialStats(characterId: string): Promise<void> {
  const { data, error } = await supabase
    .from('static_stats')
    .select('code')
    .order('code', { ascending: true })

  if (error) {
    throw error
  }

  const rows = ((data ?? []) as StaticStatRow[]).map((stat) => ({
    character_id: characterId,
    stat_code: stat.code,
    base_value: 0,
    current_advanced: 0,
    total_advanced: 0,
  }))

  if (rows.length === 0) {
    return
  }

  const { error: insertError } = await supabase.from('character_stat_values').insert(rows)

  if (insertError) {
    throw insertError
  }
}

export async function listCharactersForUser(userId: string): Promise<CharacterSummary[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('characters')
      .select(
        'id, name, race, gender, campaign_id, user_id, career_id, pv_current, pv_max, fortune_current, fortune_max, destiny_current, xp_total, xp_available, insanity_points, money_gold, money_silver, money_copper'
      )
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    const rows = (data ?? []) as CharacterRow[]
    const [careerNames, avatars] = await Promise.all([
      resolveCareerNames(rows.map((row) => row.career_id)),
      resolveOwnerAvatars(rows.map((row) => row.user_id)),
    ])
    return rows.map((row) =>
      mapCharacter(row, careerNames.get(row.career_id) ?? null, avatars.get(row.user_id) ?? null)
    )
  })
}

export async function listCharactersByCampaign(campaignId: string): Promise<CharacterSummary[]> {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('characters')
      .select(
        'id, name, race, gender, campaign_id, user_id, career_id, pv_current, pv_max, fortune_current, fortune_max, destiny_current, xp_total, xp_available, insanity_points, money_gold, money_silver, money_copper'
      )
      .eq('campaign_id', campaignId)
      .order('name', { ascending: true })

    if (error) {
      throw error
    }

    const rows = (data ?? []) as CharacterRow[]
    const [careerNames, avatars] = await Promise.all([
      resolveCareerNames(rows.map((row) => row.career_id)),
      resolveOwnerAvatars(rows.map((row) => row.user_id)),
    ])
    return rows.map((row) =>
      mapCharacter(row, careerNames.get(row.career_id) ?? null, avatars.get(row.user_id) ?? null)
    )
  })
}

export async function getCharacterById(characterId: string): Promise<CharacterDetail | null> {
  return withRetry(async () => {
    const [characterResult, statsResult, staticStatsResult] = await Promise.all([
      supabase
        .from('characters')
        .select(
          'id, name, race, gender, campaign_id, user_id, career_id, pv_current, pv_max, fortune_current, fortune_max, destiny_current, xp_total, xp_available, insanity_points, money_gold, money_silver, money_copper, career:careers!characters_career_id_fkey(name)'
        )
        .eq('id', characterId)
        .maybeSingle(),
      supabase
        .from('character_stat_values')
        .select('stat_code, base_value, current_advanced, total_advanced')
        .eq('character_id', characterId)
        .limit(32)
        .order('stat_code', { ascending: true }),
      supabase
        .from('static_stats')
        .select('code, is_secondary')
        .limit(32)
        .order('code', { ascending: true }),
    ])

    if (characterResult.error) {
      throw characterResult.error
    }

    if (statsResult.error) {
      throw statsResult.error
    }

    if (staticStatsResult.error) {
      throw staticStatsResult.error
    }

    if (!characterResult.data) {
      return null
    }

    const characterRow = characterResult.data as CharacterWithCareerRow
    const secondaryByCode = new Map<string, boolean>(
      ((staticStatsResult.data ?? []) as StaticStatRow[]).map((row) => [
        row.code,
        Boolean(row.is_secondary),
      ])
    )

    return {
      ...mapCharacter(characterRow, characterRow.career?.name ?? null, null),
      stats: ((statsResult.data ?? []) as CharacterStatRow[]).map((row) => ({
        ...mapCharacterStat(row),
        isSecondary: secondaryByCode.get(row.stat_code) ?? false,
      })),
    }
  })
}

export async function updateCharacterCore(
  characterId: string,
  payload: Partial<{
    pv_max: number
    pv_current: number
    fortune_max: number
    fortune_current: number
    destiny_current: number
    xp_total: number
    xp_available: number
    insanity_points: number
    money_gold: number
    money_silver: number
    money_copper: number
  }>
): Promise<void> {
  await assertCharacterCampaignWritable(characterId)

  const { error } = await supabase.from('characters').update(payload).eq('id', characterId)

  if (error) {
    throw error
  }
}

export async function updateCharacterCareer(characterId: string, careerId: string): Promise<void> {
  const trimmedCareerId = careerId.trim()
  if (!trimmedCareerId) {
    throw new Error('Carriere invalide.')
  }

  await assertCharacterCampaignWritable(characterId)

  const { error } = await supabase
    .from('characters')
    .update({ career_id: trimmedCareerId })
    .eq('id', characterId)

  if (error) {
    throw error
  }
}

export async function updateCharacterStatCurrentAdvanced(
  characterId: string,
  statCode: string,
  currentAdvanced: number
): Promise<void> {
  await updateCharacterStatValues(characterId, statCode, { current_advanced: currentAdvanced })
}

export async function updateCharacterStatValues(
  characterId: string,
  statCode: string,
  payload: Partial<{
    base_value: number
    current_advanced: number
    total_advanced: number
  }>
): Promise<void> {
  const trimmedStatCode = statCode.trim()
  if (!trimmedStatCode) {
    throw new Error('Caracteristique invalide.')
  }

  await assertCharacterCampaignWritable(characterId)

  const updatePayload: { base_value?: number; current_advanced?: number; total_advanced?: number } =
    {}
  if (typeof payload.base_value === 'number') {
    updatePayload.base_value = Math.max(0, payload.base_value)
  }
  if (typeof payload.current_advanced === 'number') {
    updatePayload.current_advanced = Math.max(0, payload.current_advanced)
  }
  if (typeof payload.total_advanced === 'number') {
    updatePayload.total_advanced = Math.max(0, payload.total_advanced)
  }

  if (Object.keys(updatePayload).length === 0) {
    return
  }

  const { error } = await supabase
    .from('character_stat_values')
    .update(updatePayload)
    .eq('character_id', characterId)
    .eq('stat_code', trimmedStatCode)

  if (error) {
    throw error
  }
}

export async function replaceCharacterTotalAdvancedValues(
  characterId: string,
  totalAdvancedByStatCode: Record<string, number>
): Promise<void> {
  const trimmedCharacterId = characterId.trim()
  if (!trimmedCharacterId) {
    throw new Error('Personnage invalide.')
  }

  await assertCharacterCampaignWritable(trimmedCharacterId)

  const { error: resetError } = await supabase
    .from('character_stat_values')
    .update({ total_advanced: 0 })
    .eq('character_id', trimmedCharacterId)

  if (resetError) {
    throw resetError
  }

  const entries = Object.entries(totalAdvancedByStatCode)
    .map(([statCode, value]) => ({
      statCode: statCode.trim().toUpperCase(),
      value: Math.max(0, Math.floor(value)),
    }))
    .filter(({ statCode }) => Boolean(statCode))

  for (const entry of entries) {
    const { error } = await supabase
      .from('character_stat_values')
      .update({ total_advanced: entry.value })
      .eq('character_id', trimmedCharacterId)
      .eq('stat_code', entry.statCode)

    if (error) {
      throw error
    }
  }
}

export async function createCharacterForCampaign(payload: CreateCharacterPayload): Promise<string> {
  const trimmedName = payload.name.trim()
  if (!trimmedName) {
    throw new Error('Nom de personnage obligatoire.')
  }

  const { data: existingCharacter, error: existingError } = await supabase
    .from('characters')
    .select('id')
    .eq('campaign_id', payload.campaignId)
    .eq('user_id', payload.userId)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existingCharacter) {
    throw new Error('Vous avez deja un personnage dans cette campagne.')
  }

  const careerId = await resolveDefaultCareerId()

  const { data, error } = await supabase
    .from('characters')
    .insert({
      user_id: payload.userId,
      campaign_id: payload.campaignId,
      name: trimmedName,
      race: payload.race,
      career_id: careerId,
      pv_max: 10,
      pv_current: 10,
      destiny_current: 2,
      fortune_max: 2,
      fortune_current: 2,
      xp_total: 0,
      xp_available: 0,
      insanity_points: 0,
      money_gold: 0,
      money_silver: 0,
      money_copper: 0,
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  const characterId = String((data as { id: string }).id)
  await createInitialStats(characterId)
  return characterId
}
