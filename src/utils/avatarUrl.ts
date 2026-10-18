const STORAGE_PATH_PREFIX = '/storage/v1/'

function getSupabaseOrigin(): string | null {
  const rawUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
  if (!rawUrl) {
    return null
  }

  try {
    return new URL(rawUrl).origin
  } catch {
    return null
  }
}

/** Returns the URL only if it is https and served by the Supabase storage origin. */
export function sanitizeAvatarUrl(
  value: string | null | undefined,
  allowedOrigin: string | null = getSupabaseOrigin()
): string | null {
  if (!value || !allowedOrigin) {
    return null
  }

  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.origin !== allowedOrigin ||
      !url.pathname.startsWith(STORAGE_PATH_PREFIX)
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}
