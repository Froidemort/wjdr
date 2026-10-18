import { createClient } from '@supabase/supabase-js'

const rawUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const rawKey: string | undefined =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

const missing = [
  !rawUrl?.trim() && 'VITE_SUPABASE_URL',
  !rawKey?.trim() && 'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)',
].filter(Boolean)

// Report every missing variable at once so a CI misconfiguration is obvious.
if (missing.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
}

export const supabase = createClient(rawUrl as string, rawKey as string)
