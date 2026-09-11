import { describe, expect, it, vi } from 'vitest'

const mediaQuery = vi.hoisted(() => vi.fn())

vi.mock('@vueuse/core', () => ({
  useMediaQuery: mediaQuery,
}))

import { useDeviceBreakpoint } from '../../src/composables/useDeviceBreakpoint'

describe('useDeviceBreakpoint', () => {
  it('uses the default and custom mobile breakpoints', () => {
    mediaQuery.mockReturnValue({ value: true })

    expect(useDeviceBreakpoint().isMobile.value).toBe(true)
    expect(useDeviceBreakpoint({ mobileMaxWidth: 767 }).isMobile.value).toBe(true)
    expect(mediaQuery).toHaveBeenNthCalledWith(1, '(max-width: 639px)')
    expect(mediaQuery).toHaveBeenNthCalledWith(2, '(max-width: 767px)')
  })
})