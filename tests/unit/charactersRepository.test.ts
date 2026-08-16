import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { replaceCharacterTotalAdvancedValues } from '../../src/services/charactersRepository'

describe('replaceCharacterTotalAdvancedValues', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('applies total_advanced values in one atomic upsert operation', async () => {
    const characterMetaBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    }
    characterMetaBuilder.select.mockReturnValue(characterMetaBuilder)
    characterMetaBuilder.eq.mockReturnValue(characterMetaBuilder)
    characterMetaBuilder.maybeSingle.mockResolvedValue({
      data: { campaign_id: 'campaign-1' },
      error: null,
    })

    const campaignMetaBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn(),
    }
    campaignMetaBuilder.select.mockReturnValue(campaignMetaBuilder)
    campaignMetaBuilder.eq.mockReturnValue(campaignMetaBuilder)
    campaignMetaBuilder.maybeSingle.mockResolvedValue({
      data: { is_archived: false },
      error: null,
    })

    const statValuesFilterBuilder: {
      eq: ReturnType<typeof vi.fn>
    } = {
      eq: vi.fn(),
    }

    const statValuesBuilder = {
      select: vi.fn(() => statValuesFilterBuilder),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }

    statValuesFilterBuilder.eq.mockResolvedValue({
      data: [
        { stat_code: 'CC', base_value: 10, current_advanced: 1, total_advanced: 2 },
        { stat_code: 'AG', base_value: 20, current_advanced: 3, total_advanced: 4 },
        { stat_code: 'INT', base_value: 30, current_advanced: 5, total_advanced: 6 },
      ],
      error: null,
    })

    fromMock.mockImplementation((table: string) => {
      if (table === 'characters') {
        return characterMetaBuilder
      }
      if (table === 'campaigns') {
        return campaignMetaBuilder
      }
      if (table === 'character_stat_values') {
        return statValuesBuilder
      }
      throw new Error(`Unexpected table ${table}`)
    })

    await replaceCharacterTotalAdvancedValues('character-1', {
      cc: 5,
      ag: 10,
    })

    expect(statValuesBuilder.select).toHaveBeenCalledWith(
      'stat_code, base_value, current_advanced, total_advanced'
    )
    expect(statValuesFilterBuilder.eq).toHaveBeenCalledWith('character_id', 'character-1')
    expect(statValuesBuilder.upsert).toHaveBeenCalledWith(
      [
        {
          character_id: 'character-1',
          stat_code: 'CC',
          base_value: 10,
          current_advanced: 1,
          total_advanced: 5,
        },
        {
          character_id: 'character-1',
          stat_code: 'AG',
          base_value: 20,
          current_advanced: 3,
          total_advanced: 10,
        },
        {
          character_id: 'character-1',
          stat_code: 'INT',
          base_value: 30,
          current_advanced: 5,
          total_advanced: 0,
        },
      ],
      { onConflict: 'character_id,stat_code' }
    )
  })
})
