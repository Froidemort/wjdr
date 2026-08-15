import { supabase } from '../db/supabase'
import type { ProfileSettingsRow } from '../types/db'
import { isValidUsername } from '../utils/validation'

export interface ProfileSettings {
  username: string
  email: string
  avatarUrl: string | null
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function getProfileSettings(userId: string): Promise<ProfileSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, email, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('Profil introuvable.')
  }

  const row = data as ProfileSettingsRow
  return {
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
  }
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFileName = sanitizeFileName(file.name)
  const path = `${userId}/${Date.now()}-${safeFileName || `avatar.${extension}`}`

  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
    upsert: false,
    contentType: file.type,
  })

  if (uploadError) {
    throw uploadError
  }

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)

  const avatarUrl = publicUrlData.publicUrl

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (profileError) {
    throw profileError
  }

  await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  })

  return avatarUrl
}

export async function updateProfileUsername(userId: string, rawUsername: string): Promise<string> {
  const username = normalizeUsername(rawUsername)

  if (!isValidUsername(username)) {
    throw new Error('Username invalide (3-20 caracteres, lettres/chiffres/_/-).')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ username })
    .eq('id', userId)
    .select('username')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ce username est deja utilise.')
    }
    throw error
  }

  if (!data) {
    throw new Error('Impossible de mettre a jour le username.')
  }

  // Keep auth metadata aligned for future token refreshes.
  await supabase.auth.updateUser({
    data: {
      username,
    },
  })

  return (data as { username: string }).username
}

export async function reauthenticateWithPassword(
  email: string,
  currentPassword: string
): Promise<void> {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !currentPassword) {
    throw new Error('Email ou mot de passe manquant pour la verification.')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: currentPassword,
  })

  if (error) {
    throw new Error('Verification du mot de passe impossible.')
  }
}

export async function updateProfileEmail(userId: string, rawEmail: string): Promise<string> {
  const email = normalizeEmail(rawEmail)
  if (!isValidEmail(email)) {
    throw new Error('Adresse email invalide.')
  }

  const { error: authError } = await supabase.auth.updateUser({ email })
  if (authError) {
    throw authError
  }

  const { error: profileError } = await supabase.from('profiles').update({ email }).eq('id', userId)

  if (profileError) {
    if (profileError.code === '23505') {
      throw new Error('Cette adresse email est deja utilisee.')
    }
    throw profileError
  }

  return email
}

export async function updateAccountPassword(newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error('Le mot de passe doit contenir au moins 8 caracteres.')
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    throw error
  }
}
