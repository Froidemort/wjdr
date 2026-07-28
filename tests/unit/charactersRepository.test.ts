import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import { replaceCharacterTotalAdvancedValues } from '../../src/repositories/charactersRepository'

describe('replaceCharacterTotalAdvancedValues', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('resets all total_advanced and applies provided values by stat code', async () => {
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

    const eqCalls: Array<{ payload: { total_advanced: number }; column: string; value: string }> = []
    let currentPayload = { total_advanced: 0 }
    const updateFilterBuilder: {
      eq: ReturnType<typeof vi.fn>
      error: null
    } = {
      eq: vi.fn(),
      error: null,
    }

    updateFilterBuilder.eq.mockImplementation((column: string, value: string) => {
      eqCalls.push({ payload: currentPayload, column, value })
      return updateFilterBuilder
    })

    const statValuesBuilder = {
      update: vi.fn((payload: { total_advanced: number }) => {
        currentPayload = payload
        return updateFilterBuilder
      }),
    }

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

    expect(statValuesBuilder.update).toHaveBeenNthCalledWith(1, { total_advanced: 0 })
    expect(statValuesBuilder.update).toHaveBeenNthCalledWith(2, { total_advanced: 5 })
    expect(statValuesBuilder.update).toHaveBeenNthCalledWith(3, { total_advanced: 10 })
    expect(eqCalls).toEqual([
      { payload: { total_advanced: 0 }, column: 'character_id', value: 'character-1' },
      { payload: { total_advanced: 5 }, column: 'character_id', value: 'character-1' },
      { payload: { total_advanced: 5 }, column: 'stat_code', value: 'CC' },
      { payload: { total_advanced: 10 }, column: 'character_id', value: 'character-1' },
      { payload: { total_advanced: 10 }, column: 'stat_code', value: 'AG' },
    ])
  })
})
