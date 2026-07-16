import { onBeforeUnmount, onMounted } from 'vue'

interface UseSmartRefreshOptions {
  enabled?: boolean
  minIntervalMs?: number
}

export function useSmartRefresh(callback: () => void, options: UseSmartRefreshOptions = {}): void {
  const enabled = options.enabled ?? true
  const minIntervalMs = Math.max(0, options.minIntervalMs ?? 1200)
  let lastRunAt = 0

  function trigger(): void {
    if (!enabled) {
      return
    }

    const now = Date.now()
    if (now - lastRunAt < minIntervalMs) {
      return
    }

    lastRunAt = now
    callback()
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      trigger()
    }
  }

  function handleFocus(): void {
    trigger()
  }

  function handleOnline(): void {
    trigger()
  }

  function handlePageShow(): void {
    trigger()
  }

  onMounted(() => {
    if (!enabled) {
      return
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('online', handleOnline)
    window.addEventListener('pageshow', handlePageShow)
  })

  onBeforeUnmount(() => {
    if (!enabled) {
      return
    }

    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleFocus)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('pageshow', handlePageShow)
  })
}
