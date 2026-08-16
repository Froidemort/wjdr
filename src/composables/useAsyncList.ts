import { useAsyncState } from '@vueuse/core'
import { ref } from 'vue'

interface UseAsyncListOptions<TItem> {
  fallbackItems?: TItem[]
  errorMessage: string
  loadItems: () => Promise<TItem[]>
}

export function useAsyncList<TItem>(options: UseAsyncListOptions<TItem>) {
  const { state: items, isLoading, execute: runLoad } = useAsyncState<TItem[]>(
    options.loadItems,
    options.fallbackItems ?? [],
    {
      immediate: false,
      resetOnExecute: false,
      throwError: true,
    }
  )
  const loading = isLoading
  const error = ref<string | null>(null)

  async function load(): Promise<TItem[]> {
    error.value = null

    try {
      const result = (await runLoad(0)) ?? options.fallbackItems ?? []
      items.value = result
      return result
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : options.errorMessage
      throw loadError
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
