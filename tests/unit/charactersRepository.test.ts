import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({
  supabase: { from: fromMock },
}))

import {
  createCharacterForCampaign,
  getCharacterById,
  listCharactersByCampaign,
  listCharactersForUser,
  replaceCharacterTotalAdvancedValues,
  updateCharacterCareer,
  updateCharacterCore,
  updateCharacterStatCurrentAdvanced,
  updateCharacterStatValues,
} from '../../src/services/charactersRepository'

type Builder = ReturnType<typeof createSupabaseQueryBuilder>

function builder(data: unknown = null, error: Error | null = null): Builder {
  return createSupabaseQueryBuilder({ data, error })
}

function mockTables(tables: Record<string, Builder[]>, sequence = Object.values(tables).flat()): void {
  fromMock.mockImplementation((table?: string) => {
    const next = table ? tables[table]?.shift() : sequence.shift()
    if (!next) throw new Error(`Unexpected table ${table ?? 'call'}`)
    return next
  })
}

function writableCampaign(): Record<string, Builder[]> {
  return {
    characters: [builder({ campaign_id: 'campaign-1' })],
    campaigns: [builder({ is_archived: false })],
  }
}

describe('charactersRepository', () => {
  beforeEach(() => fromMock.mockReset())

  it('maps character lists with resolved careers, avatars, wounds, and fallback values', async () => {
    const characters = builder([
      { id: 'one', name: 'Ada', race: 'human', gender: 'masculin', campaign_id: 'c', user_id: 'u', career_id: 'career', pv_current: 7, fortune_current: 1, fortune_max: 2, destiny_current: 1, destiny_max: 2, xp_total: 5, xp_available: 3, insanity_points: 0, money_gold: 1, money_silver: 2, money_copper: 3 },
      { id: 'two', name: 'Bea', race: 'elf', gender: 'other', campaign_id: 'c', user_id: 'u', career_id: 'missing', pv_current: 4, fortune_current: 0, fortune_max: 0, destiny_current: 0, destiny_max: 0, xp_total: 0, xp_available: 0, insanity_points: 2, money_gold: 0, money_silver: 0, money_copper: 0 },
    ])
    const careers = builder([{ id: 'career', name: 'Soldat' }])
    const profiles = builder([{ id: 'u', avatar_url: 'avatar.png' }])
    const wounds = builder([{ character_id: 'one', base_value: 5, current_advanced: 3 }])
    mockTables({ characters: [characters], careers: [careers], profiles: [profiles], character_stat_values: [wounds] })

    await expect(listCharactersByCampaign('c')).resolves.toMatchObject([
      { id: 'one', gender: 'masculin', careerName: 'Soldat', pvMax: 8, ownerAvatarUrl: 'avatar.png' },
      { id: 'two', gender: 'féminin', careerName: null, pvMax: 4, ownerAvatarUrl: 'avatar.png' },
    ])
    expect(characters.eq).toHaveBeenCalledWith('campaign_id', 'c')
    expect(careers.in).toHaveBeenCalledWith('id', ['career', 'missing'])
    expect(profiles.in).toHaveBeenCalledWith('id', ['u'])
  })

  it('returns an empty list without resolving related entities', async () => {
    const characters = builder([])
    mockTables({ characters: [characters] })

    await expect(listCharactersForUser('u')).resolves.toEqual([])
    expect(characters.eq).toHaveBeenCalledWith('user_id', 'u')
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('maps a character detail, including secondary stats and normalized wounds', async () => {
    mockTables({
      characters: [builder({ id: 'one', name: 'Ada', race: 'human', gender: 'masculin', campaign_id: 'c', user_id: 'u', career_id: 'career', pv_current: 9, fortune_current: 1, fortune_max: 2, destiny_current: 1, destiny_max: 2, xp_total: 0, xp_available: 0, insanity_points: 0, money_gold: 0, money_silver: 0, money_copper: 0, career: { name: 'Soldat' } })],
      character_stat_values: [builder([{ stat_code: 'B', base_value: -2, current_advanced: 5, total_advanced: 4 }, { stat_code: 'CC', base_value: 30, current_advanced: 2, total_advanced: 3 }])],
      static_stats: [builder([{ code: 'B', is_secondary: true }, { code: 'CC', is_secondary: false }])],
    })

    await expect(getCharacterById('one')).resolves.toMatchObject({
      careerName: 'Soldat', pvMax: 5,
      stats: [{ statCode: 'B', isSecondary: true }, { statCode: 'CC', isSecondary: false }],
    })
  })

  it('returns null when the character does not exist', async () => {
    mockTables({ characters: [builder(null)], character_stat_values: [builder([])], static_stats: [builder([])] })
    await expect(getCharacterById('missing')).resolves.toBeNull()
  })

  it.each([
    ['career', () => updateCharacterCareer('character-1', '   '), 'Carriere invalide.'],
    ['stat', () => updateCharacterStatValues('character-1', ' ', {}), 'Caracteristique invalide.'],
    ['character', () => replaceCharacterTotalAdvancedValues(' ', {}), 'Personnage invalide.'],
    ['name', () => createCharacterForCampaign({ name: ' ', campaignId: 'c', userId: 'u', race: 'human', gender: 'masculin' }), 'Nom de personnage obligatoire.'],
  ])('rejects an invalid %s before querying Supabase', async (_field, operation, message) => {
    await expect(operation()).rejects.toThrow(message)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('rejects writes when the campaign is archived', async () => {
    mockTables({ characters: [builder({ campaign_id: 'campaign-1' })], campaigns: [builder({ is_archived: true })] })
    await expect(updateCharacterCareer('character-1', 'career-2')).rejects.toThrow('Campagne archivee')
    expect(fromMock).toHaveBeenCalledTimes(2)
  })

  it('clamps core wounds to the configured stat maximum', async () => {
    const tables = writableCampaign()
    const wounds = builder({ base_value: 5, current_advanced: 3 })
    const update = builder()
    tables.character_stat_values = [wounds]
    tables.characters.push(update)
    mockTables(tables, [tables.characters[0], tables.campaigns[0], wounds, update])

    await updateCharacterCore('character-1', { pv_current: 12, xp_total: 8 })
    expect(update.update).toHaveBeenCalledWith({ pv_current: 8, xp_total: 8 })
    expect(update.eq).toHaveBeenCalledWith('id', 'character-1')
  })

  it('normalizes wound updates and synchronizes current health', async () => {
    const tables = writableCampaign()
    const statUpdate = builder()
    const wounds = builder({ base_value: 3, current_advanced: 4 })
    const characterRead = builder({ pv_current: 12 })
    const characterUpdate = builder()
    tables.character_stat_values = [statUpdate, wounds]
    tables.characters.push(characterRead, characterUpdate)
    mockTables(tables, [tables.characters[0], tables.campaigns[0], statUpdate, wounds, characterRead, characterUpdate])

    await updateCharacterStatValues('character-1', ' b ', { base_value: -2, current_advanced: 4 })
    expect(statUpdate.update).toHaveBeenCalledWith({ base_value: 0, current_advanced: 4 })
    expect(characterUpdate.update).toHaveBeenCalledWith({ pv_current: 7 })
  })

  it('does not query a stat row when no writable stat values were supplied', async () => {
    mockTables(writableCampaign())
    await updateCharacterStatValues('character-1', 'CC', {})
    expect(fromMock).toHaveBeenCalledTimes(2)
  })

  it('replaces totals atomically and sanitizes table-driven values', async () => {
    const tables = writableCampaign()
    const existing = builder([{ stat_code: 'CC', base_value: 10, current_advanced: 1, total_advanced: 2 }, { stat_code: 'AG', base_value: 20, current_advanced: 3, total_advanced: 4 }])
    const upsert = builder()
    tables.character_stat_values = [existing, upsert]
    mockTables(tables, [tables.characters[0], tables.campaigns[0], existing, upsert])

    await replaceCharacterTotalAdvancedValues(' character-1 ', { cc: 5.9, AG: -1, ' ': 99 })
    expect(upsert.upsert).toHaveBeenCalledWith([
      { character_id: 'character-1', stat_code: 'CC', base_value: 10, current_advanced: 1, total_advanced: 5 },
      { character_id: 'character-1', stat_code: 'AG', base_value: 20, current_advanced: 3, total_advanced: 0 },
    ], { onConflict: 'character_id,stat_code' })
  })

  it('creates a character, initializes static stats, and initializes wounds', async () => {
    const existing = builder(null)
    const career = builder({ id: 'career-1' })
    const characterInsert = builder({ id: 'character-1' })
    const staticStats = builder([{ code: 'CC' }, { code: 'B' }])
    const statInsert = builder()
    const woundsRead = builder({ base_value: 2, current_advanced: 0 })
    const woundsUpsert = builder()
    mockTables(
      { characters: [existing, characterInsert], careers: [career], static_stats: [staticStats], character_stat_values: [statInsert, woundsRead, woundsUpsert] },
      [existing, career, characterInsert, staticStats, statInsert, woundsRead, woundsUpsert]
    )

    await expect(createCharacterForCampaign({ name: ' Ada ', campaignId: 'campaign-1', userId: 'user-1', race: 'human', gender: 'féminin' })).resolves.toBe('character-1')
    expect(characterInsert.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada', career_id: 'career-1', pv_current: 10 }))
    expect(statInsert.insert).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ stat_code: 'CC' })]))
    expect(woundsUpsert.upsert).toHaveBeenCalledWith([expect.objectContaining({ stat_code: 'B', base_value: 2, current_advanced: 10, total_advanced: 10 })], { onConflict: 'character_id,stat_code' })
  })

  it.each([
    ['liste', () => listCharactersByCampaign('campaign-1'), { characters: [builder([], new Error('liste'))] }],
    ['personnage', () => getCharacterById('character-1'), { characters: [builder(null, new Error('personnage'))], character_stat_values: [builder([])], static_stats: [builder([])] }],
    ['statistiques', () => getCharacterById('character-1'), { characters: [builder({})], character_stat_values: [builder([], new Error('statistiques'))], static_stats: [builder([])] }],
    ['statistiques statiques', () => getCharacterById('character-1'), { characters: [builder({})], character_stat_values: [builder([])], static_stats: [builder([], new Error('statiques'))] }],
  ] as const)('propage les erreurs de lecture %s', async (_name, operation, tables) => {
    mockTables(tables)
    await expect(operation()).rejects.toThrow()
  })

  it.each([
    ['carriere', () => updateCharacterCareer('character-1', ' career-2 '), 'characters', { career_id: 'career-2' }],
    ['avancee', () => updateCharacterStatCurrentAdvanced('character-1', 'CC', 3), 'character_stat_values', { current_advanced: 3 }],
    ['noyau sans blessure', () => updateCharacterCore('character-1', { xp_available: 4 }), 'characters', { xp_available: 4 }],
  ] as const)('met a jour %s sans chemin de blessures', async (_name, operation, table, payload) => {
    const tables = writableCampaign()
    const update = builder()
    if (table === 'characters') {
      tables.characters.push(update)
    } else {
      tables[table] = [update]
    }
    mockTables(tables, [tables.characters[0], tables.campaigns[0], update])
    await expect(operation()).resolves.toBeUndefined()
    expect(update.update).toHaveBeenCalledWith(payload)
  })

  it('utilise les valeurs de blessures par defaut et ignore les totaux sans statistiques', async () => {
    const coreTables = writableCampaign()
    const wounds = builder(null)
    const update = builder()
    coreTables.character_stat_values = [wounds]
    coreTables.characters.push(update)
    mockTables(coreTables, [coreTables.characters[0], coreTables.campaigns[0], wounds, update])
    await updateCharacterCore('character-1', { pv_current: -2 })
    expect(update.update).toHaveBeenCalledWith({ pv_current: 0 })

    const totalTables = writableCampaign()
    const existing = builder([])
    totalTables.character_stat_values = [existing]
    mockTables(totalTables, [totalTables.characters[0], totalTables.campaigns[0], existing])
    await replaceCharacterTotalAdvancedValues('character-1', { CC: 3 })
    expect(existing.select).toHaveBeenCalledOnce()
    expect(existing.upsert).not.toHaveBeenCalled()
  })

  it.each([
    ['personnage existant', [builder({ id: 'existing' })], 'Vous avez deja un personnage dans cette campagne.'],
    ['carriere absente', [builder(null), builder(null)], 'Carriere par defaut introuvable.'],
    ['statique vide', [builder(null), builder({ id: 'career-1' }), builder({ id: 'character-1' }), builder([]), builder(null), builder()], null],
  ] as const)('gere la creation avec %s', async (_name, characterBuilders, message) => {
    const tables: Record<string, Builder[]> = message
      ? { characters: [characterBuilders[0]!], careers: [characterBuilders[1]!] }
      : {
          characters: [characterBuilders[0]!, characterBuilders[2]!],
          careers: [characterBuilders[1]!],
          static_stats: [characterBuilders[3]!],
          character_stat_values: [characterBuilders[4]!, characterBuilders[5]!],
        }
    const sequence = message === 'Vous avez deja un personnage dans cette campagne.' ? [characterBuilders[0]] : message ? [characterBuilders[0]!, characterBuilders[1]!] : characterBuilders
    mockTables(tables, sequence)
    const operation = createCharacterForCampaign({ name: 'Ada', campaignId: 'campaign-1', userId: 'user-1', race: 'human', gender: 'féminin' })
    if (message) {
      await expect(operation).rejects.toThrow(message)
    } else {
      await expect(operation).resolves.toBe('character-1')
    }
  })
})
