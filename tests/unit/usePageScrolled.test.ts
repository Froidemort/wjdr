import { describe, expect, it, vi } from 'vitest'

const scroll = vi.hoisted(() => ({ y: { value: 0 } }))

vi.mock('@vueuse/core', () => ({
  useWindowScroll: () => scroll,
}))

import { usePageScrolled } from '../../src/composables/usePageScrolled'

describe('usePageScrolled', () => {
  it('reports scroll only above the requested offset', () => {
    scroll.y.value = 8
    expect(usePageScrolled(8).isScrolled.value).toBe(false)
    scroll.y.value = 9
    expect(usePageScrolled(8).isScrolled.value).toBe(true)
  })
})