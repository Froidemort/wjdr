import { computed, ref } from 'vue'
import type { Ref } from 'vue'

interface PaginationOptions {
  pageSize: number
  initialPage?: number
}

interface PaginationNavigateOptions {
  loading: Ref<boolean>
  onNavigate?: () => void | Promise<void>
}

export function usePagination(options: PaginationOptions) {
  const page = ref(options.initialPage ?? 1)
  const totalItems = ref(0)
  const pageSize = options.pageSize

  const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
  const canGoPrevious = computed(() => page.value > 1)
  const canGoNext = computed(() => page.value < totalPages.value)

  function nextPage() {
    if (canGoNext.value) page.value++
  }

  function previousPage() {
    if (canGoPrevious.value) page.value--
  }

  function resetPage() {
    page.value = options.initialPage ?? 1
  }

  async function goToPreviousPage(options: PaginationNavigateOptions): Promise<void> {
    if (!canGoPrevious.value || options.loading.value) {
      return
    }

    previousPage()
    await options.onNavigate?.()
  }

  async function goToNextPage(options: PaginationNavigateOptions): Promise<void> {
    if (!canGoNext.value || options.loading.value) {
      return
    }

    nextPage()
    await options.onNavigate?.()
  }

  return {
    page,
    totalItems,
    totalPages,
    pageSize,
    canGoPrevious,
    canGoNext,
    nextPage,
    previousPage,
    resetPage,
    goToPreviousPage,
    goToNextPage,
  }
}
