import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/stores/auth', () => ({ useAuthStore: vi.fn() }))
vi.mock('../../src/stores/lastActive', () => ({ useLastActiveStore: vi.fn() }))
vi.mock('../../src/stores/userContext', () => ({ useUserContextStore: vi.fn() }))

import { resolveCurrentContext } from '../../src/composables/useCurrentContext'
import type { CampaignSummary, CharacterSummary, SessionSummary } from '../../src/types/domain'

const campaign = (id: string, mjId = 'mj'): CampaignSummary => ({
  id,
  name: id,
  code: id.toUpperCase(),
  description: null,
  isArchived: false,
  mjId,
  createdAt: null,
})
const character = (id: string, campaignId: string, userId = 'me'): CharacterSummary =>
  ({ id, name: id, campaignId, userId }) as CharacterSummary
const session = (id: string, campaignId: string, date: string): SessionSummary => ({
  id,
  campaignId,
  date,
  name: null,
  description: null,
  createdAt: null,
  updatedAt: null,
})
const none = { campaignId: null, sessionId: null, characterId: null }

describe('resolveCurrentContext', () => {
  it('returns nothing without a user or campaigns', () => {
    const empty = { campaign: null, role: null, character: null, session: null }

    expect(resolveCurrentContext({ userId: null, campaigns: [campaign('c1')], characters: [], sessions: [], lastActive: none })).toEqual(empty)
    expect(resolveCurrentContext({ userId: 'me', campaigns: [], characters: [], sessions: [], lastActive: none })).toEqual(empty)
  })

  it('prefers the last active campaign, else the single campaign, else null', () => {
    const campaigns = [campaign('c1'), campaign('c2')]

    expect(resolveCurrentContext({ userId: 'me', campaigns, characters: [], sessions: [], lastActive: { ...none, campaignId: 'c2' } }).campaign?.id).toBe('c2')
    expect(resolveCurrentContext({ userId: 'me', campaigns: [campaign('c1')], characters: [], sessions: [], lastActive: { ...none, campaignId: 'gone' } }).campaign?.id).toBe('c1')
    expect(resolveCurrentContext({ userId: 'me', campaigns, characters: [], sessions: [], lastActive: { ...none, campaignId: 'gone' } }).campaign).toBeNull()
  })

  it('resolves the MJ role and the own character', () => {
    const asMj = resolveCurrentContext({ userId: 'mj', campaigns: [campaign('c1')], characters: [character('x', 'c1', 'other')], sessions: [], lastActive: none })
    const asPlayer = resolveCurrentContext({ userId: 'me', campaigns: [campaign('c1')], characters: [character('x', 'c1', 'other'), character('k', 'c1')], sessions: [], lastActive: none })

    expect(asMj).toMatchObject({ role: 'mj', character: null })
    expect(asPlayer).toMatchObject({ role: 'player', character: { id: 'k' } })
  })

  it('lets the player role win when the MJ also owns a character', () => {
    const result = resolveCurrentContext({ userId: 'mj', campaigns: [campaign('c1')], characters: [character('k', 'c1', 'mj')], sessions: [], lastActive: none })

    expect(result.role).toBe('player')
  })

  it('does not guess among several own characters without a last active one', () => {
    const characters = [character('a', 'c1'), character('b', 'c1')]
    const campaigns = [campaign('c1')]

    expect(resolveCurrentContext({ userId: 'me', campaigns, characters, sessions: [], lastActive: none }).character).toBeNull()
    expect(resolveCurrentContext({ userId: 'me', campaigns, characters, sessions: [], lastActive: { ...none, characterId: 'b' } }).character?.id).toBe('b')
  })

  it('picks the last viewed session, else the most recent one of the campaign', () => {
    const sessions = [session('s1', 'c1', '2026-01-01'), session('s2', 'c1', '2026-03-01'), session('s3', 'c2', '2026-09-01')]
    const campaigns = [campaign('c1')]

    expect(resolveCurrentContext({ userId: 'me', campaigns, characters: [], sessions, lastActive: none }).session?.id).toBe('s2')
    expect(resolveCurrentContext({ userId: 'me', campaigns, characters: [], sessions, lastActive: { ...none, sessionId: 's1' } }).session?.id).toBe('s1')
    expect(resolveCurrentContext({ userId: 'me', campaigns, characters: [], sessions, lastActive: { ...none, sessionId: 's3' } }).session?.id).toBe('s2')
  })
})
