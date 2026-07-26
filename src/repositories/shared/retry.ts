interface RetryableError {
  status?: number
  message?: string
}

interface RetryOptions {
  maxAttempts?: number
  extraTransientKeywords?: string[]
}

const DEFAULT_TRANSIENT_KEYWORDS = ['fetch', 'network', 'timeout']

function isTransientError(error: unknown, extraKeywords: string[]): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as RetryableError
  if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
    return true
  }

  const message = (maybeError.message ?? '').toLowerCase()
  return [...DEFAULT_TRANSIENT_KEYWORDS, ...extraKeywords].some((keyword) =>
    message.includes(keyword.toLowerCase())
  )
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2)
  const extraKeywords = options.extraTransientKeywords ?? []
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt >= maxAttempts || !isTransientError(error, extraKeywords)) {
        throw error
      }
    }
  }

  throw lastError
}
