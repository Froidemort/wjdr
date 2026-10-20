import { describe, expect, it } from 'vitest'

import type { MapMarker } from '../../src/types/map'
import {
  allowedVisibilities,
  canEditMarker,
  filterMarkers,
  mergeMarkers,
  searchMarkers,
} from '../../src/utils/mapMarkers'

function marker(overrides: Partial<MapMarker> = {}): MapMarker {
  return {
    id: 'm1',
    source: 'base',
    typeId: 't1',
    name: 'Altdorf',
    description: null,
    lat: 0,
    lng: 0,
    campaignId: null,
    visibility: null,
    createdBy: null,
    createdAt: null,
    ...overrides,
  }
}

describe('mergeMarkers', () => {
  it('lets a campaign marker replace a base one with the same id', () => {
    const merged = mergeMarkers([marker({ id: 'a', name: 'Base' })], [marker({ id: 'a', name: 'Camp', source: 'campaign' })])
    expect(merged).toHaveLength(1)
    expect(merged[0].name).toBe('Camp')
  })

  it('keeps distinct ids from both lists', () => {
    expect(mergeMarkers([marker({ id: 'a' })], [marker({ id: 'b', source: 'campaign' })]).map((m) => m.id)).toEqual(['a', 'b'])
  })
})

describe('filterMarkers', () => {
  const base = marker({ id: 'b', source: 'base', typeId: 't1' })
  const camp = marker({ id: 'c', source: 'campaign', typeId: 't2' })

  it('keeps base and campaign markers by default', () => {
    expect(filterMarkers([base, camp], { showCampaign: true, showPois: true, hiddenTypeIds: [] })).toEqual([base, camp])
  })

  it('hides campaign markers when showCampaign is false', () => {
    expect(filterMarkers([base, camp], { showCampaign: false, showPois: true, hiddenTypeIds: [] })).toEqual([base])
  })

  it('hides every base marker when showPois is false', () => {
    expect(filterMarkers([base, camp], { showCampaign: true, showPois: false, hiddenTypeIds: [] })).toEqual([camp])
  })

  it('hides base markers of hidden types only', () => {
    expect(filterMarkers([base, camp], { showCampaign: true, showPois: true, hiddenTypeIds: ['t1', 't2'] })).toEqual([camp])
  })
})

describe('searchMarkers', () => {
  const markers = [
    marker({ id: '1', name: 'Port de Marienburg' }),
    marker({ id: '2', name: 'Marienburg' }),
    marker({ id: '3', name: 'Étang' }),
    marker({ id: '4', name: 'Altdorf' }),
  ]

  it('returns nothing for a blank query', () => {
    expect(searchMarkers(markers, '   ')).toEqual([])
  })

  it('ranks prefix matches before contains matches', () => {
    expect(searchMarkers(markers, 'marien').map((m) => m.id)).toEqual(['2', '1'])
  })

  it('ignores case and accents', () => {
    expect(searchMarkers(markers, 'etang').map((m) => m.id)).toEqual(['3'])
  })

  it('respects the limit', () => {
    expect(searchMarkers(markers, 'a', 2)).toHaveLength(2)
  })
})

describe('canEditMarker', () => {
  const own = marker({ source: 'campaign', createdBy: 'u1', visibility: 'private' })

  it('refuses base markers', () => {
    expect(canEditMarker(marker({ createdBy: 'u1' }), 'u1', 'mj')).toBe(false)
  })

  it('refuses anonymous users', () => {
    expect(canEditMarker(own, null, 'mj')).toBe(false)
  })

  it('allows the creator', () => {
    expect(canEditMarker(own, 'u1', 'player')).toBe(true)
  })

  it('allows the MJ on non-private markers of others', () => {
    expect(canEditMarker(marker({ source: 'campaign', createdBy: 'u2', visibility: 'players' }), 'u1', 'mj')).toBe(true)
  })

  it('refuses the MJ on private markers of others', () => {
    expect(canEditMarker(marker({ source: 'campaign', createdBy: 'u2', visibility: 'private' }), 'u1', 'mj')).toBe(false)
  })

  it('refuses a player on markers of others', () => {
    expect(canEditMarker(marker({ source: 'campaign', createdBy: 'u2', visibility: 'players' }), 'u1', 'player')).toBe(false)
  })
})

describe('allowedVisibilities', () => {
  it('gives the MJ every visibility', () => {
    expect(allowedVisibilities('mj')).toEqual(['private', 'mj', 'players'])
  })

  it('limits players to private', () => {
    expect(allowedVisibilities('player')).toEqual(['private'])
  })

  it('gives nothing without role', () => {
    expect(allowedVisibilities(null)).toEqual([])
  })
})
