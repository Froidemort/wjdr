import { computed, onBeforeUnmount, ref } from 'vue'

interface UseDeviceBreakpointOptions {
  mobileMaxWidth?: number
}

export function useDeviceBreakpoint(options: UseDeviceBreakpointOptions = {}) {
  const mobileMaxWidth = options.mobileMaxWidth ?? 639
  const mediaQuery =
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${mobileMaxWidth}px)`)
      : null

  const isMobile = ref(Boolean(mediaQuery?.matches))

  function syncMatches(): void {
    if (!mediaQuery) {
      isMobile.value = false
      return
    }

    isMobile.value = mediaQuery.matches
  }

  if (mediaQuery) {
    syncMatches()

    const handleChange = () => {
      syncMatches()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      onBeforeUnmount(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    } else {
      mediaQuery.addListener(handleChange)
      onBeforeUnmount(() => {
        mediaQuery.removeListener(handleChange)
      })
    }
  }

  return {
    isMobile: computed(() => isMobile.value),
  }
}
