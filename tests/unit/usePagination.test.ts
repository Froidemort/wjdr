import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { usePagination } from '../../src/composables/usePagination'

describe('usePagination', () => {
  it('navigates within the available page range and resets', () => {
    const pagination = usePagination({ pageSize: 2, initialPage: 2 })
    pagination.totalItems.value = 5

    pagination.nextPage()
    expect(pagination.page.value).toBe(3)
    expect(pagination.canGoNext.value).toBe(false)
    pagination.nextPage()
    pagination.previousPage()
    expect(pagination.page.value).toBe(2)
    pagination.resetPage()
    expect(pagination.page.value).toBe(2)
  })

  it('does not navigate while loading and calls the navigation callback otherwise', async () => {
    const pagination = usePagination({ pageSize: 2 })
    pagination.totalItems.value = 5
    const onNavigate = vi.fn()
    const loading = ref(true)

    await pagination.goToNextPage({ loading, onNavigate })
    expect(pagination.page.value).toBe(1)
    expect(onNavigate).not.toHaveBeenCalled()

    loading.value = false
    await pagination.goToNextPage({ loading, onNavigate })
    await pagination.goToPreviousPage({ loading, onNavigate })
    expect(pagination.page.value).toBe(1)
    expect(onNavigate).toHaveBeenCalledTimes(2)
  })
})