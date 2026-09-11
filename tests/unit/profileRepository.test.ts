import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const supabaseMock = vi.hoisted(() => ({
  auth: { signInWithPassword: vi.fn(), updateUser: vi.fn() },
  from: vi.fn(),
  storage: { from: vi.fn() },
}))

vi.mock('../../src/db/supabase', () => ({ supabase: supabaseMock }))

import {
  getProfileSettings,
  reauthenticateWithPassword,
  updateAccountPassword,
  updateProfileEmail,
  updateProfileUsername,
  uploadProfileAvatar,
} from '../../src/services/profileRepository'

describe('profileRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    supabaseMock.auth.signInWithPassword.mockResolvedValue({ error: null })
    supabaseMock.auth.updateUser.mockResolvedValue({ error: null })
  })

  it('gets settings and rejects missing profiles', async () => {
    supabaseMock.from.mockReturnValue(createSupabaseQueryBuilder({
      data: { username: 'mj', email: 'mj@example.fr', avatar_url: null }, error: null,
    }))
    await expect(getProfileSettings('user-1')).resolves.toEqual({ username: 'mj', email: 'mj@example.fr', avatarUrl: null })

    supabaseMock.from.mockReturnValue(createSupabaseQueryBuilder({ data: null, error: null }))
    await expect(getProfileSettings('user-1')).rejects.toThrow('Profil introuvable.')
  })

  it('uploads an avatar and synchronizes its public URL', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    const storage = {
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.example/avatar.png' } }),
      upload: vi.fn().mockResolvedValue({ error: null }),
    }
    supabaseMock.storage.from.mockReturnValue(storage)
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    supabaseMock.from.mockReturnValue(builder)

    await expect(uploadProfileAvatar('user-1', { name: 'Avatar !.PNG', type: 'image/png' } as File))
      .resolves.toBe('https://cdn.example/avatar.png')

    expect(storage.upload).toHaveBeenCalledWith('user-1/1788782400000-avatar-.png', expect.anything(), {
      upsert: false, contentType: 'image/png',
    })
    expect(builder.update).toHaveBeenCalledWith({ avatar_url: 'https://cdn.example/avatar.png' })
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ data: { avatar_url: 'https://cdn.example/avatar.png' } })
    vi.useRealTimers()
  })

  it('normalizes usernames and reports validation or duplicate errors', async () => {
    const builder = createSupabaseQueryBuilder({ data: { username: 'mj_noir' }, error: null })
    supabaseMock.from.mockReturnValue(builder)

    await expect(updateProfileUsername('user-1', '  MJ_NOIR ')).resolves.toBe('mj_noir')
    expect(builder.update).toHaveBeenCalledWith({ username: 'mj_noir' })
    await expect(updateProfileUsername('user-1', 'no')).rejects.toThrow('Username invalide')

    builder.maybeSingle.mockResolvedValue({ data: null, error: Object.assign(new Error('duplicate'), { code: '23505' }) })
    await expect(updateProfileUsername('user-1', 'mj_noir')).rejects.toThrow('Ce username est deja utilise.')
  })

  it('validates reauthentication and password updates', async () => {
    await expect(reauthenticateWithPassword(' ', '')).rejects.toThrow('Email ou mot de passe manquant')
    await reauthenticateWithPassword('  MJ@EXEMPLE.FR ', 'secret')
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'mj@exemple.fr', password: 'secret' })
    await expect(updateAccountPassword('short')).rejects.toThrow('au moins 8 caracteres')
    await updateAccountPassword('long-password')
    expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({ password: 'long-password' })
  })

  it('updates email and reports invalid, duplicate, and auth failures', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    supabaseMock.from.mockReturnValue(builder)

    await expect(updateProfileEmail('user-1', 'bad')).rejects.toThrow('Adresse email invalide.')
    await expect(updateProfileEmail('user-1', ' MJ@EXEMPLE.FR ')).resolves.toBe('mj@exemple.fr')
    expect(builder.update).toHaveBeenCalledWith({ email: 'mj@exemple.fr' })

    builder.eq.mockResolvedValue({ error: Object.assign(new Error('duplicate'), { code: '23505' }) })
    await expect(updateProfileEmail('user-1', 'mj@example.fr')).rejects.toThrow('Cette adresse email est deja utilisee.')
    supabaseMock.auth.updateUser.mockResolvedValue({ error: new Error('auth failed') })
    await expect(updateProfileEmail('user-1', 'mj@example.fr')).rejects.toThrow('auth failed')
  })
})