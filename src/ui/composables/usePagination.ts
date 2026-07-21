import { ref, computed } from 'vue'

interface PaginationOptions {
  pageSize: number
  initialPage?: number
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
  }
}
