import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

interface UseDeviceBreakpointOptions {
  mobileMaxWidth?: number
}

export function useDeviceBreakpoint(options: UseDeviceBreakpointOptions = {}) {
  const mobileMaxWidth = options.mobileMaxWidth ?? 639
  const isMobile = useMediaQuery(`(max-width: ${mobileMaxWidth}px)`)

  return {
    isMobile: computed(() => isMobile.value),
  }
}
