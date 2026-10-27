import { useLocalStorage } from '@vueuse/core'
import { SPLASH_TTL_MS } from '../config/appSplash'

export const SPLASH_STORAGE_KEY = 'wjdr:splash-last-seen'

export function useSplashSeen() {
  // With a null default VueUse stores and returns the raw string.
  const lastSeen = useLocalStorage<string | null>(SPLASH_STORAGE_KEY, null)

  function shouldShow(): boolean {
    const timestamp = Number(lastSeen.value ?? Number.NaN)
    if (!Number.isFinite(timestamp)) {
      return true
    }
    const age = Date.now() - timestamp
    return age < 0 || age >= SPLASH_TTL_MS
  }

  function markSeen(): void {
    lastSeen.value = String(Date.now())
  }

  return { shouldShow, markSeen }
}
