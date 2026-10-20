import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MapMarker, MarkerDraft } from '../../src/types/map'

const repo = vi.hoisted(() => ({
  createCampaignMarker: vi.fn(),
  deleteCampaignMarker: vi.fn(),
  listBaseMarkers: vi.fn(),
  listCampaignMarkers: vi.fn(),
  listMarkerTypes: vi.fn(),
  updateCampaignMarker: vi.fn(),
}))

vi.mock('../../src/services/mapRepository', () => repo)

import { useMapStore } from '../../src/stores/map'

function marker(overrides: Partial<MapMarker> = {}): MapMarker {
  return {
    id: 'c1',
    source: 'campaign',
    typeId: 't1',
    name: 'Camp',
    description: null,
    lat: 0,
    lng: 0,
    campaignId: 'camp-1',
    visibility: 'players',
    createdBy: 'u1',
    createdAt: null,
    ...overrides,
  }
}

const draft: MarkerDraft = { typeId: 't1', name: 'Neuf', description: null, lat: 1, lng: 2, visibility: 'private' }

describe('map store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(repo).forEach((fn) => fn.mockReset())
  })

  describe('loading', () => {
    it('loads types and base markers once', async () => {
      repo.listMarkerTypes.mockResolvedValue([{ id: 't1' }])
      repo.listBaseMarkers.mockResolvedValue([marker({ id: 'b1', source: 'base' })])
      const store = useMapStore()

      await store.loadBase()
      await store.loadBase()

      expect(repo.listBaseMarkers).toHaveBeenCalledTimes(1)
      expect(store.baseMarkers).toHaveLength(1)
      expect(store.loading).toBe(false)
    })

    it('exposes an error when base loading fails', async () => {
      repo.listMarkerTypes.mockRejectedValue(new Error('x'))
      repo.listBaseMarkers.mockResolvedValue([])
      const store = useMapStore()

      await store.loadBase()

      expect(store.error).toContain('Impossible de charger la carte')
      expect(store.loading).toBe(false)
    })

    it('clears campaign markers when the campaign is null', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      await store.loadCampaign(null)

      expect(store.campaignMarkers).toEqual([])
    })

    it('ignores a stale campaign response', async () => {
      let resolveFirst: (rows: MapMarker[]) => void = () => {}
      repo.listCampaignMarkers
        .mockReturnValueOnce(new Promise((done) => { resolveFirst = done }))
        .mockResolvedValueOnce([marker({ id: 'second' })])
      const store = useMapStore()

      const first = store.loadCampaign('camp-1')
      await store.loadCampaign('camp-2')
      resolveFirst([marker({ id: 'first' })])
      await first

      expect(store.campaignMarkers.map((m) => m.id)).toEqual(['second'])
    })
  })

  describe('addMarker', () => {
    it('does nothing without a campaign', async () => {
      const store = useMapStore()

      expect(await store.addMarker(draft, 'u1')).toBeNull()
      expect(repo.createCampaignMarker).not.toHaveBeenCalled()
    })

    it('shows a pending marker then replaces it with the saved one', async () => {
      repo.listCampaignMarkers.mockResolvedValue([])
      let resolve: (value: MapMarker) => void = () => {}
      repo.createCampaignMarker.mockReturnValue(new Promise((done) => { resolve = done }))
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      const request = store.addMarker(draft, 'u1')
      expect(store.campaignMarkers).toHaveLength(1)
      expect(store.campaignMarkers[0]).toMatchObject({ pending: true, name: 'Neuf', createdBy: 'u1' })

      resolve(marker({ id: 'real', name: 'Neuf' }))
      await request

      expect(store.campaignMarkers.map((m) => m.id)).toEqual(['real'])
      expect(store.campaignMarkers[0].pending).toBeUndefined()
    })

    it('rolls back and reports an error on failure', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      repo.createCampaignMarker.mockRejectedValue(new Error('rls'))
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      expect(await store.addMarker(draft, 'u1')).toBeNull()

      expect(store.campaignMarkers.map((m) => m.id)).toEqual(['c1'])
      expect(store.writeError).not.toBeNull()
    })
  })

  describe('editMarker', () => {
    it('returns false for an unknown marker', async () => {
      const store = useMapStore()

      expect(await store.editMarker('nope', draft)).toBe(false)
    })

    it('applies the edit optimistically then stores the saved marker', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      let resolve: (value: MapMarker) => void = () => {}
      repo.updateCampaignMarker.mockReturnValue(new Promise((done) => { resolve = done }))
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      const request = store.editMarker('c1', draft)
      expect(store.campaignMarkers[0]).toMatchObject({ name: 'Neuf', pending: true })

      resolve(marker({ name: 'Neuf' }))
      expect(await request).toBe(true)
      expect(store.campaignMarkers[0].pending).toBeUndefined()
    })

    it('restores the previous marker on failure', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      repo.updateCampaignMarker.mockRejectedValue(new Error('rls'))
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      expect(await store.editMarker('c1', draft)).toBe(false)

      expect(store.campaignMarkers[0]).toMatchObject({ name: 'Camp' })
      expect(store.writeError).not.toBeNull()
    })
  })

  describe('removeMarker', () => {
    it('returns false for an unknown marker', async () => {
      const store = useMapStore()

      expect(await store.removeMarker('nope')).toBe(false)
    })

    it('removes optimistically and deselects', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      repo.deleteCampaignMarker.mockResolvedValue(undefined)
      const store = useMapStore()
      await store.loadCampaign('camp-1')
      store.select('c1')

      expect(await store.removeMarker('c1')).toBe(true)

      expect(store.campaignMarkers).toEqual([])
      expect(store.selectedId).toBeNull()
    })

    it('restores the marker on failure', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker()])
      repo.deleteCampaignMarker.mockRejectedValue(new Error('rls'))
      const store = useMapStore()
      await store.loadCampaign('camp-1')

      expect(await store.removeMarker('c1')).toBe(false)

      expect(store.campaignMarkers).toHaveLength(1)
      expect(store.writeError).not.toBeNull()
    })
  })

  describe('filters', () => {
    it('toggles a type in and out of the hidden list', () => {
      const store = useMapStore()

      store.toggleType('t1')
      expect(store.hiddenTypeIds).toEqual(['t1'])
      store.toggleType('t1')
      expect(store.hiddenTypeIds).toEqual([])
    })

    it('hides every base marker but keeps campaign markers when the POI switch is off', async () => {
      repo.listBaseMarkers.mockResolvedValue([marker({ id: 'b1', source: 'base', typeId: 't1' })])
      repo.listMarkerTypes.mockResolvedValue([])
      repo.listCampaignMarkers.mockResolvedValue([marker({ id: 'c1' })])
      const store = useMapStore()
      await store.loadBase()
      await store.loadCampaign('camp-1')

      store.showCities = false

      expect(store.visibleMarkers.map((m) => m.id)).toEqual(['c1'])
    })

    it('lists only the marker types actually used by base markers', async () => {
      repo.listMarkerTypes.mockResolvedValue([
        { id: 't1', code: 'town', label: 'Ville', icon: 'Castle', color: null },
        { id: 't2', code: 'note', label: 'Note', icon: 'StickyNote', color: null },
      ])
      repo.listBaseMarkers.mockResolvedValue([marker({ id: 'b1', source: 'base', typeId: 't1' })])
      const store = useMapStore()

      await store.loadBase()

      expect(store.poiTypes.map((type) => type.id)).toEqual(['t1'])
    })

    it('searches only visible markers', async () => {
      repo.listCampaignMarkers.mockResolvedValue([marker({ name: 'Taverne' })])
      const store = useMapStore()
      await store.loadCampaign('camp-1')
      store.query = 'tav'
      expect(store.searchResults).toHaveLength(1)

      store.showCampaign = false

      expect(store.searchResults).toEqual([])
    })

    it('also searches loaded cities, even with the cities layer hidden', () => {
      const store = useMapStore()
      store.showCities = false
      store.cities = [
        { id: 7, name: 'Altdorf', lat: 1, lng: 2, type: null, population: null, region: null, country: null, subregion: null, url: null, pending: false, hidden: false, source: null },
      ]
      store.query = 'ALTD'

      expect(store.searchResults).toEqual([{ kind: 'city', key: 'city-7', name: 'Altdorf', id: 7 }])
    })
  })
})
