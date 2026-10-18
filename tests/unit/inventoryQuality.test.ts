import { describe, expect, it } from 'vitest'
import {
  ITEM_QUALITY_STATE_OPTIONS,
  isInventoryQuality,
  qualityBadgeClass,
  qualityStateClass,
} from '../../src/utils/inventoryQuality'

describe('inventoryQuality', () => {
  it('accepts only known qualities', () => {
    expect(isInventoryQuality('bonne')).toBe(true)
    expect(isInventoryQuality('inconnue')).toBe(false)
    expect(isInventoryQuality(true)).toBe(false)
    expect(isInventoryQuality(null)).toBe(false)
  })

  it.each([
    ['médiocre', 'badge-warning', 'btn-warning'],
    [' Normal ', 'badge-neutral', 'btn-neutral'],
    ['bonne', 'badge-info', 'btn-info'],
    ['exceptionelle', 'badge-success', 'btn-success'],
    [null, 'badge-outline', 'btn-outline'],
  ] as const)('maps %s to badge and state classes', (quality, badge, state) => {
    expect(qualityBadgeClass(quality)).toBe(badge)
    expect(qualityStateClass(quality)).toBe(state)
  })

  it('exposes one state option per quality', () => {
    expect(ITEM_QUALITY_STATE_OPTIONS.map((option) => option.value)).toEqual([
      'médiocre',
      'normal',
      'bonne',
      'exceptionelle',
    ])
  })
})
