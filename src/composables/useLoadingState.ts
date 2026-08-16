import { useAsyncState } from '@vueuse/core'
import { type Ref, ref } from 'vue'

interface LoadingStateOptions<T> {
  fallbackValue?: T
  defaultLoading?: boolean
}

export interface LoadingState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: (operation: () => Promise<T>) => Promise<void>
  reset: () => void
}

/**
 * Composable pour standardiser les états de chargement
 * Gère loading, error, et data états uniformément
 *
 * @example
 * const { data, loading, error, execute } = useLoadingState<Character[]>({ fallbackValue: [] })
 * await execute(() => listCharacters())
 */
export function useLoadingState<T>(options: LoadingStateOptions<T> = {}): LoadingState<T> {
  const initialValue: T | null = options.fallbackValue ?? null
  const loading = ref(options.defaultLoading ?? false)
  const error = ref<string | null>(null)
  const { state, execute: runOperation } = useAsyncState<T | null, [() => Promise<T>]>(
    async (operation) => operation(),
    initialValue,
    {
      immediate: false,
      resetOnExecute: false,
      throwError: true,
    }
  )

  const data = state as Ref<T | null>

  async function execute(operation: () => Promise<T>): Promise<void> {
    loading.value = true
    error.value = null

    try {
      data.value = (await runOperation(0, operation)) ?? (options.fallbackValue ?? null)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Une erreur est survenue'
      data.value = options.fallbackValue ?? null
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    data.value = options.fallbackValue ?? null
    loading.value = false
    error.value = null
  }

  return {
    data: data as Ref<T | null>,
    loading,
    error,
    execute,
    reset,
  }
}
