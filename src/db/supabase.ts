import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(value: string | undefined, variableName: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${variableName}`)
  }

  return value
}

const supabaseUrl = getRequiredEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
const supabasePublicKey = getRequiredEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
  'VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)'
)

export const supabase = createClient(supabaseUrl, supabasePublicKey)
