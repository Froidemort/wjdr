import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}))

import {
  listCareerCharacteristicsByCareerId,
  listCareerPathCareersByFromCareerId,
} from '../../src/services/careersRepository'

describe('careersRepository', () => {
  beforeEach(() => {
    fromMock.mockReset()
  })

  it('returns normalized career characteristics by career id', async () => {
    const characteristicBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
    }

    characteristicBuilder.select.mockReturnValue(characteristicBuilder)
    characteristicBuilder.eq.mockResolvedValue({
      data: [
        { stat_code: 'ag', value: 10 },
        { stat_code: 'CC', value: 5 },
      ],
      error: null,
    })

    fromMock.mockReturnValue(characteristicBuilder)

    const result = await listCareerCharacteristicsByCareerId('career-1')

    expect(fromMock).toHaveBeenCalledWith('career_characteristics')
    expect(characteristicBuilder.eq).toHaveBeenCalledWith('career_id', 'career-1')
    expect(result).toEqual([
      { statCode: 'AG', value: 10 },
      { statCode: 'CC', value: 5 },
    ])
  })

  it('returns sorted debouches careers from career_paths', async () => {
    const pathBuilder = {
      select: vi.fn(),
      eq: vi.fn(),
    }
    pathBuilder.select.mockReturnValue(pathBuilder)
    pathBuilder.eq.mockResolvedValue({
      data: [{ to_career_id: 'b' }, { to_career_id: 'a' }],
      error: null,
    })

    const careersBuilder = {
      select: vi.fn(),
      in: vi.fn(),
    }
    careersBuilder.select.mockReturnValue(careersBuilder)
    careersBuilder.in.mockResolvedValue({
      data: [
        { id: 'a', name: 'Aubergiste' },
        { id: 'b', name: 'Agitateur' },
      ],
      error: null,
    })

    fromMock.mockImplementation((table: string) => {
      if (table === 'career_paths') {
        return pathBuilder
      }
      if (table === 'careers') {
        return careersBuilder
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const result = await listCareerPathCareersByFromCareerId('career-2')

    expect(pathBuilder.eq).toHaveBeenCalledWith('from_career_id', 'career-2')
    expect(careersBuilder.in).toHaveBeenCalledWith('id', ['b', 'a'])
    expect(result).toEqual([
      { id: 'b', name: 'Agitateur' },
      { id: 'a', name: 'Aubergiste' },
    ])
  })
})
