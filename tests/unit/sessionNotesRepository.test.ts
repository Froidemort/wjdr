import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({ supabase: { from: fromMock } }))

import {
  buildSessionNotesChannelName,
  buildSessionNotesRealtimeSubscriptions,
  createSessionNote,
  deleteSessionNote,
  listSessionNotesForCampaign,
  toggleSessionNoteArchivedState,
  toggleSessionNoteVisibility,
  updateSessionNote,
} from '../../src/services/sessionNotesRepository'

const noteRow = {
  id: 'note-1', campaign_id: 'campaign-1', session_id: null, author_user_id: 'user-1',
  title: 'Titre', content_text: 'Contenu', is_visible: true, is_archived: false,
  created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z',
}

describe('sessionNotesRepository', () => {
  beforeEach(() => fromMock.mockReset())

  it('builds stable realtime channel metadata', () => {
    expect(buildSessionNotesChannelName('campaign-1')).toBe('session-notes-campaign-1')
    expect(buildSessionNotesRealtimeSubscriptions('campaign-1')).toEqual([
      { table: 'session_notes', filter: 'campaign_id=eq.campaign-1' },
    ])
  })

  it('lists mapped notes with optional filters', async () => {
    const builder = createSupabaseQueryBuilder({ data: [noteRow], error: null })
    fromMock.mockReturnValue(builder)

    await expect(listSessionNotesForCampaign('campaign-1', { sessionId: 'session-1', visibleOnly: true }))
      .resolves.toEqual([expect.objectContaining({ campaignId: 'campaign-1', isVisible: true })])

    expect(builder.eq).toHaveBeenNthCalledWith(1, 'campaign_id', 'campaign-1')
    expect(builder.eq).toHaveBeenNthCalledWith(2, 'session_id', 'session-1')
    expect(builder.eq).toHaveBeenNthCalledWith(3, 'is_visible', true)
  })

  it('validates note creation before querying Supabase', async () => {
    await expect(createSessionNote({ campaignId: 'campaign-1', title: ' ', contentText: 'Texte' }))
      .rejects.toThrow('Le titre de la note est requis.')
    await expect(createSessionNote({ campaignId: 'campaign-1', title: 'Titre', contentText: '  ' }))
      .rejects.toThrow('Ajoutez un contenu texte')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('creates trimmed notes and maps write permission errors', async () => {
    const builder = createSupabaseQueryBuilder({ data: { id: 'note-1' }, error: null })
    fromMock.mockReturnValue(builder)

    await expect(createSessionNote({
      campaignId: 'campaign-1', sessionId: '', title: ' Titre ', contentText: ' Contenu ', isVisible: true,
    })).resolves.toBe('note-1')
    expect(builder.insert).toHaveBeenCalledWith({
      campaign_id: 'campaign-1', session_id: null, title: 'Titre', content_text: 'Contenu', is_visible: true,
    })

    builder.single.mockResolvedValue({ data: null, error: new Error('permission denied') })
    await expect(createSessionNote({ campaignId: 'campaign-1', title: 'Titre', contentText: 'Contenu' }))
      .rejects.toThrow('Acces refuse pour les notes de session.')
  })

  it('updates supplied fields and validates their text content', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00.000Z'))
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await updateSessionNote('note-1', {
      title: ' Titre ', contentText: ' Contenu ', sessionId: '', isVisible: true, isArchived: true,
    })
    expect(builder.update).toHaveBeenCalledWith({
      title: 'Titre', content_text: 'Contenu', session_id: null, is_visible: true, is_archived: true,
      updated_at: '2026-09-07T12:00:00.000Z',
    })
    await expect(updateSessionNote('note-1', { title: ' ' })).rejects.toThrow('Le titre de la note est requis.')
    await expect(updateSessionNote('note-1', { contentText: ' ' })).rejects.toThrow('Ajoutez un contenu texte')
    vi.useRealTimers()
  })

  it('toggles note flags and deletes notes through the same write boundary', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await toggleSessionNoteVisibility('note-1', true)
    await toggleSessionNoteArchivedState('note-1', true)
    await deleteSessionNote('note-1')

    expect(builder.update).toHaveBeenCalledTimes(2)
    expect(builder.delete).toHaveBeenCalledOnce()
  })
})