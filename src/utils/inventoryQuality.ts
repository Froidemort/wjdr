import type { InventoryQuality } from '../types/domain'

export const ITEM_QUALITY_OPTIONS = ['médiocre', 'normal', 'bonne', 'exceptionelle'] as const

export function isInventoryQuality(value: string | boolean | null): value is InventoryQuality {
  return typeof value === 'string' && (ITEM_QUALITY_OPTIONS as readonly string[]).includes(value)
}

export function qualityBadgeClass(quality: string | null): string {
  switch (quality?.trim().toLowerCase()) {
    case 'médiocre':
      return 'badge-warning'
    case 'normal':
      return 'badge-neutral'
    case 'bonne':
      return 'badge-info'
    case 'exceptionelle':
      return 'badge-success'
    default:
      return 'badge-outline'
  }
}

export function qualityStateClass(quality: string | null): string {
  switch (quality?.trim().toLowerCase()) {
    case 'médiocre':
      return 'btn-warning'
    case 'normal':
      return 'btn-neutral'
    case 'bonne':
      return 'btn-info'
    case 'exceptionelle':
      return 'btn-success'
    default:
      return 'btn-outline'
  }
}

export const ITEM_QUALITY_STATE_OPTIONS = ITEM_QUALITY_OPTIONS.map((quality) => ({
  value: quality,
  label: quality,
  badgeClass: qualityStateClass(quality),
}))
