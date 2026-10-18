import { supabase } from '../db/supabase'
import type { CareerCharacteristic, CareerPathCareer } from '../types/career'
import type { CareerCharacteristicRow, CareerPathRow, CareerRow } from '../types/db'

export type { CareerCharacteristic, CareerPathCareer } from '../types/career'

const FRENCH_SORT_OPTIONS: Intl.CollatorOptions = { sensitivity: 'base' }

function normalizeCareerId(careerId: string): string {
  const trimmedCareerId = careerId.trim()
  if (!trimmedCareerId) {
    throw new Error('Carrière invalide.')
  }

  return trimmedCareerId
}

function normalizeStatCode(value: string): string {
  return value.trim().toUpperCase()
}

function mapCareerPathCareer(row: CareerRow): CareerPathCareer | null {
  const id = String(row.id ?? '').trim()
  const name = String(row.name ?? '').trim()

  if (!id || !name) {
    return null
  }

  return { id, name }
}

export async function listCareerCharacteristicsByCareerId(
  careerId: string
): Promise<CareerCharacteristic[]> {
  const trimmedCareerId = normalizeCareerId(careerId)

  const { data, error } = await supabase
    .from('career_characteristics')
    .select('stat_code, value')
    .eq('career_id', trimmedCareerId)

  if (error) {
    throw error
  }

  const mapped = ((data ?? []) as CareerCharacteristicRow[])
    .map((row) => ({
      statCode: normalizeStatCode(String(row.stat_code ?? '')),
      value: Math.max(0, Number(row.value) || 0),
    }))
    .filter((row) => Boolean(row.statCode))

  mapped.sort((left, right) => left.statCode.localeCompare(right.statCode, 'fr', FRENCH_SORT_OPTIONS))
  return mapped
}

export async function listCareerPathCareersByFromCareerId(
  fromCareerId: string
): Promise<CareerPathCareer[]> {
  const trimmedCareerId = normalizeCareerId(fromCareerId)

  const { data: pathData, error: pathError } = await supabase
    .from('career_paths')
    .select('to_career_id')
    .eq('from_career_id', trimmedCareerId)

  if (pathError) {
    throw pathError
  }

  const targetCareerIds = Array.from(
    new Set(
      ((pathData ?? []) as CareerPathRow[])
        .map((row) => row.to_career_id)
        .filter((value): value is string => Boolean(value))
    )
  )

  if (targetCareerIds.length === 0) {
    return []
  }

  const { data: careersData, error: careersError } = await supabase
    .from('careers')
    .select('id, name')
    .in('id', targetCareerIds)

  if (careersError) {
    throw careersError
  }

  return ((careersData ?? []) as CareerRow[])
    .map(mapCareerPathCareer)
    .filter((row): row is CareerPathCareer => row !== null)
    .sort((left, right) => left.name.localeCompare(right.name, 'fr', FRENCH_SORT_OPTIONS))
}

const PAGE_SIZE = 1000

// PostgREST caps responses at 1000 rows, so page until a short page.
async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: Error | null }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    if (error) {
      throw error
    }
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) {
      return rows
    }
  }
}

export async function listAllCareers(): Promise<CareerPathCareer[]> {
  const rows = await fetchAllPages<CareerRow>((from, to) =>
    supabase.from('careers').select('id, name').order('id').range(from, to)
  )

  return rows
    .map(mapCareerPathCareer)
    .filter((row): row is CareerPathCareer => row !== null)
    .sort((left, right) => left.name.localeCompare(right.name, 'fr', FRENCH_SORT_OPTIONS))
}

export async function listAllCareerPaths(): Promise<CareerPathRow[]> {
  const rows = await fetchAllPages<CareerPathRow>((from, to) =>
    supabase
      .from('career_paths')
      .select('from_career_id, to_career_id')
      .order('from_career_id')
      .order('to_career_id')
      .range(from, to)
  )

  return rows.filter((row) => Boolean(row.from_career_id) && Boolean(row.to_career_id))
}
