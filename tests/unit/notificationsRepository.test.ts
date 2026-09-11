import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const supabaseMock = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: supabaseMock }))

import {
  countUnreadNotifications,
  deleteNotification,
  extractNotificationSessionId,
  getNotificationDisplayMessage,
  getNotificationDisplayTitle,
  listNotificationsForUser,
  listNotificationsForUserPaginated,
  listPendingJoinRequestsForCampaign,
  markAllNotificationsRead,
  markNotificationRead,
  notifyJoinRequestAccepted,
  notifyJoinRequestRejected,
  requestJoinCampaign,
} from '../../src/services/notificationsRepository'

const campaignId = '550e8400-e29b-41d4-a716-446655440000'
const userId = '550e8400-e29b-41d4-a716-446655440001'

describe('notificationsRepository display helpers', () => {
  it.each([
    ['INVITATION_SESSION_x', 'Convocation a la table'],
    ['Invitation a une session', 'Convocation a la table'],
    ['Demande de rejoindre une session', 'Demande d audience'],
    ['Demande de session acceptee', 'Demande acceptee'],
    ['Demande de session refusee', 'Demande refusee'],
    ['Autre', 'Autre'],
  ])('formats notification title %s', (rawTitle, expected) => {
    expect(getNotificationDisplayTitle(rawTitle)).toBe(expected)
  })

  it('cleans display messages and extracts session identifiers from every supported form', () => {
    expect(getNotificationDisplayMessage(` Texte  [session:${campaignId}]\n\nhttps://example.fr `)).toBe('Texte')
    expect(getNotificationDisplayMessage(' [session:x] ')).toBe('Un nouvel evenement requiert votre attention.')
    expect(extractNotificationSessionId({ title: `INVITATION_SESSION_${campaignId}`, message: '' })).toBe(campaignId)
    expect(extractNotificationSessionId({ title: '', message: `[session:${campaignId}]` })).toBe(campaignId)
    expect(extractNotificationSessionId({ title: '', message: `[join-request-session:${campaignId}]` })).toBe(campaignId)
    expect(extractNotificationSessionId({ title: '', message: `/sessions/${campaignId}` })).toBe(campaignId)
    expect(extractNotificationSessionId({ title: '', message: 'sans identifiant' })).toBeNull()
  })
})

describe('notificationsRepository queries', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lists a clamped notification page and exposes its total', async () => {
    const builder = createSupabaseQueryBuilder({
      data: [{ id: 'notification-1', sender_user_id: null, receiver_user_id: userId, title: 'Titre', message: 'Texte', is_read: false, created_at: '2026-09-01' }],
      count: 3, error: null,
    })
    supabaseMock.from.mockReturnValue(builder)

    await expect(listNotificationsForUserPaginated(userId, 0, 99)).resolves.toEqual({
      items: [expect.objectContaining({ id: 'notification-1', isRead: false })], total: 3,
    })
    expect(builder.range).toHaveBeenCalledWith(0, 49)
    await expect(listNotificationsForUser(userId)).resolves.toHaveLength(1)
  })

  it('marks, counts, and deletes notifications', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, count: 2, error: null })
    supabaseMock.from.mockReturnValue(builder)

    await markNotificationRead('notification-1')
    await markAllNotificationsRead(userId)
    await expect(countUnreadNotifications(userId)).resolves.toBe(2)
    await deleteNotification('notification-1')

    expect(builder.update).toHaveBeenCalledTimes(2)
    expect(builder.delete).toHaveBeenCalledOnce()
  })

  it('maps pending join requests and sends decisions', async () => {
    const pending = createSupabaseQueryBuilder({
      data: [{ id: 'request-1', sender_user_id: userId, message: `[join-request-session:${campaignId}]`, is_read: false, created_at: '2026-09-01', requester: [] }],
      error: null,
    })
    const accepted = createSupabaseQueryBuilder({ data: null, error: null })
    const rejected = createSupabaseQueryBuilder({ data: null, error: null })
    supabaseMock.from.mockReturnValueOnce(pending).mockReturnValueOnce(accepted).mockReturnValueOnce(rejected)

    await expect(listPendingJoinRequestsForCampaign(campaignId, 'mj-1')).resolves.toEqual([
      expect.objectContaining({ requesterId: userId, username: `Joueur ${userId.slice(0, 8)}` }),
    ])
    await notifyJoinRequestAccepted(campaignId, userId, 'mj-1')
    await notifyJoinRequestRejected(campaignId, userId, 'mj-1')
    expect(accepted.insert).toHaveBeenCalledOnce()
    expect(rejected.insert).toHaveBeenCalledOnce()
  })

  it('creates only absent join requests after validating callers', async () => {
    const existing = createSupabaseQueryBuilder({ data: [], error: null })
    const profile = createSupabaseQueryBuilder({ data: { username: 'Kurt' }, error: null })
    const insert = createSupabaseQueryBuilder({ data: null, error: null })
    supabaseMock.rpc.mockResolvedValue({ data: 'mj-1', error: null })
    supabaseMock.from.mockReturnValueOnce(existing).mockReturnValueOnce(profile).mockReturnValueOnce(insert)

    await requestJoinCampaign(campaignId, userId)

    expect(existing.ilike).toHaveBeenCalledWith('message', `%[join-request-session:${campaignId}]%`)
    expect(insert.insert).toHaveBeenCalledWith(expect.objectContaining({ sender_user_id: userId, receiver_user_id: 'mj-1' }))
    await expect(requestJoinCampaign('invalid', userId)).rejects.toThrow('L\'ID de la campagne est invalide.')
  })
})