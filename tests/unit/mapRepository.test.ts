import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseQueryBuilder } from './fixtures/supabase'

const { fromMock, getUserMock } = vi.hoisted(() => ({ fromMock: vi.fn(), getUserMock: vi.fn() }))

vi.mock('../../src/db/supabase', () => ({
  supabase: { from: fromMock, auth: { getUser: getUserMock } },
}))

import {
  createCampaignMarker,
  deleteCampaignMarker,
  listBaseMarkers,
  listCampaignMarkers,
  listMarkerTypes,
  mapBaseMarker,
  mapCampaignMarker,
  mapMarkerType,
  updateCampaignMarker,
} from '../../src/services/mapRepository'

const baseRow = { id: 'b1', type_id: 't1', name: 'Altdorf', description: 'Capitale', lat: 1, lng: 2, external_ref: 'x' }
const campaignRow = {
  id: 'c1',
  campaign_id: 'camp-1',
  type_id: 't1',
  name: 'Camp',
  description: null,
  lat: 3,
  lng: 4,
  visibility: 'players' as const,
  created_by: 'u1',
  created_at: '2026-09-01T00:00:00.000Z',
}

describe('mapRepository mapping', () => {
  it('maps a marker type', () => {
    expect(mapMarkerType({ id: 't1', code: 'city', label: 'Ville', icon: 'i', color: '#fff' })).toEqual({
      id: 't1',
      code: 'city',
      label: 'Ville',
      icon: 'i',
      color: '#fff',
    })
  })

  it('maps a base marker without campaign data', () => {
    expect(mapBaseMarker(baseRow)).toEqual({
      id: 'b1',
      source: 'base',
      typeId: 't1',
      name: 'Altdorf',
      description: 'Capitale',
      lat: 1,
      lng: 2,
      campaignId: null,
      visibility: null,
      createdBy: null,
      createdAt: null,
    })
  })

  it('maps a campaign marker with ownership data', () => {
    expect(mapCampaignMarker(campaignRow)).toMatchObject({
      source: 'campaign',
      campaignId: 'camp-1',
      visibility: 'players',
      createdBy: 'u1',
      createdAt: '2026-09-01T00:00:00.000Z',
    })
  })
})

describe('mapRepository queries', () => {
  beforeEach(() => {
    fromMock.mockReset()
    getUserMock.mockReset()
  })

  it('lists marker types ordered by label', async () => {
    const builder = createSupabaseQueryBuilder({ data: [{ id: 't1', code: 'c', label: 'L', icon: null, color: null }], error: null })
    fromMock.mockReturnValue(builder)

    await expect(listMarkerTypes()).resolves.toEqual([expect.objectContaining({ id: 't1', label: 'L' })])
    expect(fromMock).toHaveBeenCalledWith('map_marker_types')
    expect(builder.order).toHaveBeenCalledWith('label')
  })

  it('pages base markers until a short page', async () => {
    const full = Array.from({ length: 1000 }, (_, index) => ({ ...baseRow, id: `b${index}` }))
    const builders = [
      createSupabaseQueryBuilder({ data: full, error: null }),
      createSupabaseQueryBuilder({ data: [baseRow], error: null }),
    ]
    fromMock.mockReturnValueOnce(builders[0]).mockReturnValueOnce(builders[1])

    const markers = await listBaseMarkers()

    expect(markers).toHaveLength(1001)
    expect(builders[0].range).toHaveBeenCalledWith(0, 999)
    expect(builders[1].range).toHaveBeenCalledWith(1000, 1999)
  })

  it('lists campaign markers filtered by campaign', async () => {
    const builder = createSupabaseQueryBuilder({ data: [campaignRow], error: null })
    fromMock.mockReturnValue(builder)

    await expect(listCampaignMarkers('camp-1')).resolves.toEqual([expect.objectContaining({ id: 'c1' })])
    expect(builder.eq).toHaveBeenCalledWith('campaign_id', 'camp-1')
  })

  it('throws a non-transient list error', async () => {
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error: new Error('denied') }))

    await expect(listCampaignMarkers('camp-1')).rejects.toThrow('denied')
  })

  it('creates a marker owned by the current user', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    const builder = createSupabaseQueryBuilder({ data: campaignRow, error: null })
    fromMock.mockReturnValue(builder)

    const created = await createCampaignMarker('camp-1', {
      typeId: 't1',
      name: 'Camp',
      description: null,
      lat: 3,
      lng: 4,
      visibility: 'players',
    })

    expect(builder.insert).toHaveBeenCalledWith({
      campaign_id: 'camp-1',
      type_id: 't1',
      name: 'Camp',
      description: null,
      lat: 3,
      lng: 4,
      visibility: 'players',
      created_by: 'u1',
    })
    expect(created.id).toBe('c1')
  })

  it('refuses to create a marker when signed out', async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })

    await expect(
      createCampaignMarker('camp-1', { typeId: 't', name: 'n', description: null, lat: 0, lng: 0, visibility: 'private' })
    ).rejects.toThrow('Connexion requise')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('sends only the provided fields on update', async () => {
    const builder = createSupabaseQueryBuilder({ data: campaignRow, error: null })
    fromMock.mockReturnValue(builder)

    await updateCampaignMarker('c1', { name: 'New', description: null })

    expect(builder.update).toHaveBeenCalledWith({ name: 'New', description: null })
    expect(builder.eq).toHaveBeenCalledWith('id', 'c1')
  })

  it('deletes a marker by id', async () => {
    const builder = createSupabaseQueryBuilder({ data: null, error: null })
    fromMock.mockReturnValue(builder)

    await deleteCampaignMarker('c1')

    expect(builder.eq).toHaveBeenCalledWith('id', 'c1')
  })

  it('throws when delete fails', async () => {
    fromMock.mockReturnValue(createSupabaseQueryBuilder({ data: null, error: new Error('rls') }))

    await expect(deleteCampaignMarker('c1')).rejects.toThrow('rls')
  })
})
