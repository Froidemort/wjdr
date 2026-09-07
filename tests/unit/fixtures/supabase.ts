import { vi } from 'vitest'

export type SupabaseMockResult<Data> = {
  data: Data
  error: Error | null
  count?: number | null
}

export type SupabaseQueryBuilder<Data> = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  returns: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  then: PromiseLike<SupabaseMockResult<Data>>['then']
}

export function createSupabaseQueryBuilder<Data>(
  result: SupabaseMockResult<Data>
): SupabaseQueryBuilder<Data> {
  const builder = {} as SupabaseQueryBuilder<Data>
  const chainMethods: Array<Exclude<keyof SupabaseQueryBuilder<Data>, 'then'>> = [
    'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'in', 'ilike', 'or', 'order', 'limit', 'range',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder)
  }

  builder.returns = vi.fn().mockResolvedValue(result)
  builder.single = vi.fn().mockResolvedValue(result)
  builder.maybeSingle = vi.fn().mockResolvedValue(result)
  builder.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected)

  return builder
}