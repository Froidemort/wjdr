import { throwIfError } from './supabase'

const PAGE_SIZE = 1000

interface PageResult<T> {
  data: T[] | null
  error: unknown
}

// PostgREST caps responses at 1000 rows, so page until a short page.
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1)
    throwIfError(error)
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) {
      return rows
    }
  }
}
