import { createSharedComposable, useNetwork } from '@vueuse/core'

export const useIsOnline = createSharedComposable(() => useNetwork().isOnline)
