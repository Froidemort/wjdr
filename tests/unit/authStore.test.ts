import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const authApi = vi.hoisted(() => ({
  getSession: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: { auth: authApi, from: authApi.from, rpc: authApi.rpc },
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
    authApi.signInWithPassword.mockResolvedValue({ error: null })
    authApi.signUp.mockResolvedValue({ error: null })
    authApi.resetPasswordForEmail.mockResolvedValue({ error: null })
    authApi.updateUser.mockResolvedValue({ error: null })
    authApi.signOut.mockResolvedValue({ error: null })
    vi.stubGlobal('window', { location: { origin: 'https://grimorium.example' } })
  })

  it('initialise une session et charge son identite', async () => {
    authApi.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'joueur@example.fr' } } },
      error: null,
    })
    authApi.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: '  Karl Franz ', username: 'empereur', avatar_url: 'avatar.png' },
            error: null,
          }),
        }),
      }),
    })
    const store = useAuthStore()

    await store.initAuth()

    expect(store).toMatchObject({
      initialized: true,
      isAuthenticated: true,
      displayName: 'Karl Franz',
      avatarUrl: 'avatar.png',
    })
    expect(authApi.onAuthStateChange).toHaveBeenCalledOnce()
  })

  it('propage une erreur lors de l initialisation', async () => {
    authApi.getSession.mockResolvedValue({ data: { session: null }, error: new Error('Session indisponible') })
    const store = useAuthStore()

    await expect(store.initAuth()).rejects.toThrow('Session indisponible')

    expect(store).toMatchObject({ initialized: false, loading: false, authError: 'Session indisponible' })
  })

  it('connecte un e-mail normalise sans rechercher de pseudo', async () => {
    const store = useAuthStore()

    await store.signIn('  JOUEUR@EXEMPLE.FR ', 'secret')

    expect(authApi.signInWithPassword).toHaveBeenCalledWith({ email: 'joueur@exemple.fr', password: 'secret' })
    expect(authApi.rpc).not.toHaveBeenCalled()
  })

  it('resout un pseudo avant la connexion et expose une erreur de resolution', async () => {
    authApi.rpc.mockResolvedValueOnce({ data: 'joueur@example.fr', error: null })
    const store = useAuthStore()

    await store.signIn('  Joueur ', 'secret')
    expect(authApi.rpc).toHaveBeenCalledWith('get_email_by_username', { search_username: 'joueur' })
    expect(authApi.signInWithPassword).toHaveBeenLastCalledWith({ email: 'joueur@example.fr', password: 'secret' })

    authApi.rpc.mockResolvedValueOnce({ data: null, error: new Error('Pseudo absent') })
    await expect(store.signIn('inconnu', 'secret')).rejects.toThrow('Identifiant introuvable : Pseudo absent')
    expect(store).toMatchObject({ loading: false, authError: 'Identifiant introuvable : Pseudo absent' })
  })

  it('inscrit des identifiants normalises et propage les erreurs', async () => {
    const store = useAuthStore()

    await store.signUp('  Joueur ', ' JOUEUR@EXEMPLE.FR ', 'secret')
    expect(authApi.signUp).toHaveBeenCalledWith({
      email: 'joueur@exemple.fr',
      password: 'secret',
      options: { data: { username: 'joueur' } },
    })

    authApi.signUp.mockResolvedValueOnce({ error: new Error('E-mail deja utilise') })
    await expect(store.signUp('joueur', 'joueur@example.fr', 'secret')).rejects.toThrow('E-mail deja utilise')
    expect(store).toMatchObject({ loading: false, authError: 'E-mail deja utilise' })
  })

  it('reinitialise l identite apres deconnexion', async () => {
    const store = useAuthStore()
    await store.initAuth()
    const authStateListener = authApi.onAuthStateChange.mock.calls[0][0]
    authStateListener('SIGNED_IN', { user: { id: 'user-1', email: 'joueur@example.fr' } })

    await store.signOut()

    expect(authApi.signOut).toHaveBeenCalledOnce()
    expect(store).toMatchObject({ displayName: '', avatarUrl: null, authError: null, loading: false })
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

  it.each([
    ['connexion', (store: ReturnType<typeof useAuthStore>) => store.signIn('joueur@example.fr', 'secret'), 'signInWithPassword', 'Connexion impossible.'],
    ['inscription', (store: ReturnType<typeof useAuthStore>) => store.signUp('joueur', 'joueur@example.fr', 'secret'), 'signUp', 'Inscription impossible.'],
    ['reinitialisation', (store: ReturnType<typeof useAuthStore>) => store.requestPasswordReset('joueur@example.fr'), 'resetPasswordForEmail', 'Demande de reinitialisation impossible.'],
    ['mot de passe', (store: ReturnType<typeof useAuthStore>) => store.updatePassword('secret'), 'updateUser', 'Mise a jour du mot de passe impossible.'],
    ['deconnexion', (store: ReturnType<typeof useAuthStore>) => store.signOut(), 'signOut', 'Déconnexion impossible.'],
  ] as const)('utilise le message generique pour une erreur non Error de %s', async (_name, operation, method, message) => {
    authApi[method].mockResolvedValueOnce({ error: 'echec' })
    const store = useAuthStore()
    await expect(operation(store)).rejects.toBe('echec')
    expect(store).toMatchObject({ authError: message, loading: false })
  })

  it('utilise les metadonnees puis l e-mail si le profil est absent ou en erreur', async () => {
    authApi.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1', email: 'joueur@example.fr', user_metadata: { username: '  Karl ' } } } }, error: null })
    authApi.from.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) })
    const store = useAuthStore()
    await store.initAuth()
    expect(store.displayName).toBe('Karl')

    authApi.from.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('profil') }) }) }) })
    await store.refreshDisplayName()
    expect(store).toMatchObject({ displayName: 'Karl', avatarUrl: null })
  })

  it('reinitialise et recharge l identite selon les changements de session', async () => {
    const store = useAuthStore()
    await store.initAuth()
    const listener = authApi.onAuthStateChange.mock.calls[0][0]
    listener('SIGNED_OUT', null)
    expect(store).toMatchObject({ displayName: '', avatarUrl: null })
    listener('SIGNED_IN', { user: { id: 'user-2', email: 'nouveau@example.fr', user_metadata: { full_name: ' Nouveau ' } } })
    await Promise.resolve()
    expect(store.displayName).toBe('Nouveau')
  })

  it('ne relance pas l initialisation et vide l identite sans utilisateur', async () => {
    const store = useAuthStore()
    await store.initAuth()
    await store.initAuth()
    await store.refreshDisplayName()
    expect(authApi.getSession).toHaveBeenCalledOnce()
    expect(store).toMatchObject({ displayName: '', avatarUrl: null })
  })
})
