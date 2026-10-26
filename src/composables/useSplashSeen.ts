import { useLocalStorage } from '@vueuse/core'
import { SPLASH_TTL_MS } from '../config/appSplash'

export const SPLASH_STORAGE_KEY = 'wjdr:splash-last-seen'

export function useSplashSeen() {
  const lastSeen = useLocalStorage<number | null>(SPLASH_STORAGE_KEY, null)

  function shouldShow(): boolean {
    // With a null default VueUse returns the raw stored string, so coerce it.
    const timestamp = Number(lastSeen.value ?? Number.NaN)
    if (!Number.isFinite(timestamp)) {
      return true
    }
    const age = Date.now() - timestamp
    return age < 0 || age >= SPLASH_TTL_MS
  }

  function markSeen(): void {
    lastSeen.value = Date.now()
  }

  return { shouldShow, markSeen }
}
