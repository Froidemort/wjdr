import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const authApi = vi.hoisted(() => ({
  getSession: vi.fn(),
  from: vi.fn(),
  onAuthStateChange: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: { auth: authApi, from: authApi.from },
}))

import { useAuthStore } from '../../src/stores/auth'

describe('auth store password recovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    authApi.getSession.mockResolvedValue({ data: { session: null }, error: null })
    authApi.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    authApi.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
    authApi.resetPasswordForEmail.mockResolvedValue({ error: null })
    authApi.updateUser.mockResolvedValue({ error: null })
    vi.stubGlobal('window', { location: { origin: 'https://grimorium.example' } })
  })

  it('demande un lien avec email normalise et redirect URL', async () => {
    const store = useAuthStore()

    await store.requestPasswordReset('  JOUEUR@EXEMPLE.FR ')

    expect(authApi.resetPasswordForEmail).toHaveBeenCalledWith('joueur@exemple.fr', {
      redirectTo: 'https://grimorium.example/reset-password',
    })
    expect(store.loading).toBe(false)
    expect(store.authError).toBeNull()
  })

  it('expose une erreur Supabase lors de la demande', async () => {
    authApi.resetPasswordForEmail.mockResolvedValue({ error: new Error('Email indisponible') })
    const store = useAuthStore()

    await expect(store.requestPasswordReset('joueur@example.fr')).rejects.toThrow('Email indisponible')

    expect(store.authError).toBe('Email indisponible')
    expect(store.loading).toBe(false)
  })

  it('marque la session comme session de recuperation', async () => {
    const store = useAuthStore()
    await store.initAuth()
    const authStateListener = authApi.onAuthStateChange.mock.calls[0][0]

    authStateListener('PASSWORD_RECOVERY', { user: { id: 'user-1' } })

    expect(store.isRecoverySession).toBe(true)
  })

  it('met a jour le mot de passe et quitte le mode recuperation', async () => {
    const store = useAuthStore()
    await store.initAuth()
    const authStateListener = authApi.onAuthStateChange.mock.calls[0][0]
    authStateListener('PASSWORD_RECOVERY', { user: { id: 'user-1' } })

    await store.updatePassword('motdepasse-solide')

    expect(authApi.updateUser).toHaveBeenCalledWith({ password: 'motdepasse-solide' })
    expect(store.isRecoverySession).toBe(false)
    expect(store.loading).toBe(false)
  })
})
