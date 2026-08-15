import type { Ref } from 'vue'

interface UsePaginatedNavigationOptions {
  canGoPrevious: Ref<boolean>
  canGoNext: Ref<boolean>
  loading: Ref<boolean>
  previousPage: () => void
  nextPage: () => void
  onNavigate?: () => void | Promise<void>
}

export function usePaginatedNavigation(options: UsePaginatedNavigationOptions) {
  async function goToPreviousPage(): Promise<void> {
    if (!options.canGoPrevious.value || options.loading.value) {
      return
    }

    options.previousPage()
    await options.onNavigate?.()
  }

  async function goToNextPage(): Promise<void> {
    if (!options.canGoNext.value || options.loading.value) {
      return
    }

    options.nextPage()
    await options.onNavigate?.()
  }

  return {
    goToPreviousPage,
    goToNextPage,
  }
}
