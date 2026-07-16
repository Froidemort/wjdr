import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(value: string | undefined, variableName: string): string {
	if (!value || value.trim().length === 0) {
		throw new Error(`Missing required environment variable: ${variableName}`)
	}

	return value
}

const supabaseUrl = getRequiredEnv(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
const supabaseAnonKey = getRequiredEnv(import.meta.env.VITE_SUPABASE_ANON_KEY, 'VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)