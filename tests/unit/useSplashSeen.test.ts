// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { SPLASH_TTL_MS } from '../../src/config/appSplash'
import { SPLASH_STORAGE_KEY, useSplashSeen } from '../../src/composables/useSplashSeen'

const NOW = new Date('2026-01-10T12:00:00.000Z')

describe('useSplashSeen', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('shows the splash when storage is empty', () => {
    expect(useSplashSeen().shouldShow()).toBe(true)
  })

  it('hides the splash when seen less than 24h ago', () => {
    localStorage.setItem(SPLASH_STORAGE_KEY, String(NOW.getTime() - SPLASH_TTL_MS + 1000))
    expect(useSplashSeen().shouldShow()).toBe(false)
  })

  it('shows the splash when seen 24h ago or more', () => {
    localStorage.setItem(SPLASH_STORAGE_KEY, String(NOW.getTime() - SPLASH_TTL_MS))
    expect(useSplashSeen().shouldShow()).toBe(true)
  })

  it('shows the splash when the stored value is corrupt', () => {
    localStorage.setItem(SPLASH_STORAGE_KEY, 'not-a-number')
    expect(useSplashSeen().shouldShow()).toBe(true)
  })

  it('shows the splash when the stored timestamp is in the future', () => {
    localStorage.setItem(SPLASH_STORAGE_KEY, String(NOW.getTime() + SPLASH_TTL_MS))
    expect(useSplashSeen().shouldShow()).toBe(true)
  })

  it('markSeen stores the current time and hides the splash', async () => {
    const splash = useSplashSeen()
    splash.markSeen()
    await nextTick()

    expect(localStorage.getItem(SPLASH_STORAGE_KEY)).toBe(String(NOW.getTime()))
    expect(splash.shouldShow()).toBe(false)

    vi.setSystemTime(NOW.getTime() + SPLASH_TTL_MS)
    expect(splash.shouldShow()).toBe(true)
  })
})
