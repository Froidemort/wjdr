import { describe, expect, it } from 'vitest'
import { useBusyOperations } from '../../src/composables/useBusyOperations'

describe('useBusyOperations', () => {
  it('tracks, clears, and resets busy operation identifiers', () => {
    const operations = useBusyOperations()

    expect(operations.isBusy('save')).toBe(false)
    operations.setBusy('save')
    operations.setBusy('delete')
    expect(operations.isBusy('save')).toBe(true)
    expect(operations.busyIds.value).toEqual(new Set(['save', 'delete']))
    operations.clearBusy('save')
    expect(operations.isBusy('save')).toBe(false)
    operations.clearAllBusy()
    expect(operations.busyIds.value).toEqual(new Set())
  })
})