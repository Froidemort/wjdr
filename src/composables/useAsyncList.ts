import { ref } from 'vue'

interface UseAsyncListOptions<TItem> {
  fallbackItems?: TItem[]
  errorMessage: string
  loadItems: () => Promise<TItem[]>
}

export function useAsyncList<TItem>(options: UseAsyncListOptions<TItem>) {
  const items = ref<TItem[]>(options.fallbackItems ?? [])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<TItem[]> {
    loading.value = true
    error.value = null

    try {
      const result = await options.loadItems()
      items.value = result
      return result
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : options.errorMessage
      throw loadError
    } finally {
      loading.value = false
    }
  }

  function clear(nextItems: TItem[] = []): void {
    items.value = nextItems
    error.value = null
  }

  return {
    items,
    loading,
    error,
    load,
    clear,
  }
}
