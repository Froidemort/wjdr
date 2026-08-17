export function isTransientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as { status?: number; message?: string }
  if (typeof maybeError.status === 'number' && maybeError.status >= 500) {
    return true
  }

  const message = (maybeError.message ?? '').toLowerCase()
  const keywords = ['network', 'fetch', 'timeout', 'offline', 'failed to fetch']
  return keywords.some((keyword) => message.includes(keyword))
}
