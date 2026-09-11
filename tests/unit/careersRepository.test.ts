import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

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
    const characteristicBuilder = createSupabaseQueryBuilder({
      data: [
        { stat_code: 'ag', value: 10 },
        { stat_code: 'CC', value: 5 },
        { stat_code: ' ', value: 1 },
        { stat_code: 'bf', value: -5 },
        { stat_code: 'end', value: 'invalid' },
      ],
      error: null,
    })

    fromMock.mockReturnValue(characteristicBuilder)

    const result = await listCareerCharacteristicsByCareerId('career-1')

    expect(fromMock).toHaveBeenCalledWith('career_characteristics')
    expect(characteristicBuilder.eq).toHaveBeenCalledWith('career_id', 'career-1')
    expect(result).toEqual([
      { statCode: 'AG', value: 10 },
      { statCode: 'BF', value: 0 },
      { statCode: 'CC', value: 5 },
      { statCode: 'END', value: 0 },
    ])
  })

  it('returns sorted debouches careers from career_paths', async () => {
    const pathBuilder = createSupabaseQueryBuilder({
      data: [{ to_career_id: 'b' }, { to_career_id: 'a' }, { to_career_id: 'a' }], error: null,
    })
    const careersBuilder = createSupabaseQueryBuilder({
      data: [
        { id: 'a', name: 'Aubergiste' },
        { id: 'b', name: 'Agitateur' },
        { id: '', name: 'Ignoree' },
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

  it('rejects blank career identifiers before querying', async () => {
    await expect(listCareerCharacteristicsByCareerId('  ')).rejects.toThrow('Carrière invalide.')
    await expect(listCareerPathCareersByFromCareerId('  ')).rejects.toThrow('Carrière invalide.')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('propagates career characteristic query errors', async () => {
    const error = new Error('Indisponible')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error }))

    await expect(listCareerCharacteristicsByCareerId('career-1')).rejects.toThrow(error)
  })

  it('does not query careers when a career has no paths', async () => {
    const pathBuilder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(pathBuilder)

    await expect(listCareerPathCareersByFromCareerId(' career-1 ')).resolves.toEqual([])
    expect(pathBuilder.eq).toHaveBeenCalledWith('from_career_id', 'career-1')
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it('propagates errors from path and target career queries', async () => {
    const pathError = new Error('Chemins indisponibles')
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error: pathError }))
    await expect(listCareerPathCareersByFromCareerId('career-1')).rejects.toThrow(pathError)

    const pathBuilder = createSupabaseQueryBuilder({ data: [{ to_career_id: 'career-2' }], error: null })
    const careersError = new Error('Carrieres indisponibles')
    const careersBuilder = createSupabaseQueryBuilder({ data: null, error: careersError })
    fromMock.mockReturnValueOnce(pathBuilder).mockReturnValueOnce(careersBuilder)

    await expect(listCareerPathCareersByFromCareerId('career-1')).rejects.toThrow(careersError)
  })
})
