import type { Session, User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '../db/supabase'

type AuthIdentifier = {
  email: string
}

async function resolveIdentifier(input: string): Promise<AuthIdentifier> {
  const identifier = input.trim().toLowerCase()
  if (identifier.includes('@')) {
    return { email: identifier }
  }

  // On appelle la fonction stockée PostgreSQL sécurisée
  const { data: email, error } = await supabase.rpc('get_email_by_username', {
    search_username: identifier,
  })

  if (error || !email) {
    throw new Error('Identifiant introuvable : ' + (error?.message ?? 'Aucun e-mail associé'))
  }

  return { email }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const displayName = ref<string>('')
  const avatarUrl = ref<string | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(user.value))

  function deriveFallbackDisplayName(currentUser: User | null): string {
    if (!currentUser) {
      return ''
    }

    const metadata = currentUser.user_metadata as
      | { username?: unknown; full_name?: unknown }
      | undefined
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : ''
    if (fullName) {
      return fullName
    }

    const username = typeof metadata?.username === 'string' ? metadata.username.trim() : ''
    if (username) {
      return username
    }

    return currentUser.email ?? ''
  }

  async function loadIdentity(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      displayName.value = deriveFallbackDisplayName(user.value)
      avatarUrl.value = null
      return
    }

    const fullName = data?.full_name?.trim() ?? ''
    const username = data?.username?.trim() ?? ''
    displayName.value = fullName || username || deriveFallbackDisplayName(user.value)
    avatarUrl.value = data?.avatar_url ?? null
  }

  async function initAuth(): Promise<void> {
    if (initialized.value) {
      return
    }

    loading.value = true
    authError.value = null
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }

      session.value = data.session
      user.value = data.session?.user ?? null
      if (user.value?.id) {
        await loadIdentity(user.value.id)
      }

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        session.value = nextSession
        user.value = nextSession?.user ?? null
        if (user.value?.id) {
          void loadIdentity(user.value.id)
        } else {
          displayName.value = ''
          avatarUrl.value = null
        }
      })

      initialized.value = true
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Erreur auth.'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function signIn(identifier: string, password: string): Promise<void> {
    loading.value = true
    authError.value = null

    try {
      const resolved = await resolveIdentifier(identifier)
      const { error } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      })

      if (error) {
        throw error
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Connexion impossible.'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function signUp(username: string, email: string, password: string): Promise<void> {
    loading.value = true
    authError.value = null

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const normalizedUsername = username.trim().toLowerCase()
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            username: normalizedUsername,
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Inscription impossible.'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    loading.value = true
    authError.value = null
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      displayName.value = ''
      avatarUrl.value = null
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Déconnexion impossible.'
      throw error
    } finally {
      loading.value = false
    }
  }

  async function refreshDisplayName(): Promise<void> {
    if (!user.value?.id) {
      displayName.value = ''
      avatarUrl.value = null
      return
    }

    await loadIdentity(user.value.id)
  }

  return {
    user,
    session,
    displayName,
    avatarUrl,
    loading,
    initialized,
    authError,
    isAuthenticated,
    initAuth,
    refreshDisplayName,
    signIn,
    signUp,
    signOut,
  }
})
