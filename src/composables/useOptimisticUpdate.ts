import { useDebounceFn } from '@vueuse/core'
import { computed, getCurrentInstance, onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'error'

type MergePatch<T> = (current: Partial<T>, next: Partial<T>) => Partial<T>

interface UseOptimisticUpdateOptions<T> {
  onSave: (data: Partial<T>) => Promise<void>
  debounceMs?: number
  onError?: (error: unknown) => void
  mergePatch?: MergePatch<T>
  flushOnUnmount?: boolean
}

const defaultMergePatch = <T>(current: Partial<T>, next: Partial<T>): Partial<T> => ({
  ...current,
  ...next,
})

export function useOptimisticUpdate<T>(options: UseOptimisticUpdateOptions<T>) {
  const status: Ref<SaveStatus> = ref('idle')
  const error = ref<unknown | null>(null)
  const lastSavedAt = ref<number | null>(null)
  const pendingPatch = ref<Partial<T> | null>(null)
  const mergePatch = options.mergePatch ?? defaultMergePatch<T>
  const debounceMs = options.debounceMs ?? 500

  let saveQueue = Promise.resolve()

  function syncStatus(): void {
    if (status.value === 'error') {
      return
    }

    status.value = pendingPatch.value ? 'pending' : 'idle'
  }

  async function runSaveCycle(): Promise<void> {
    while (pendingPatch.value) {
      const payload = pendingPatch.value
      pendingPatch.value = null
      status.value = 'saving'

      try {
        await options.onSave(payload)
        error.value = null
        lastSavedAt.value = Date.now()
      } catch (saveError) {
        pendingPatch.value = payload
        status.value = 'error'
        error.value = saveError
        options.onError?.(saveError)
        throw saveError
      }
    }

    syncStatus()
  }

  function queueSave(): Promise<void> {
    saveQueue = saveQueue.then(runSaveCycle)
    return saveQueue
  }

  const debouncedQueueSave = useDebounceFn(() => {
    void queueSave().catch(() => undefined)
  }, debounceMs)

  function update(patch: Partial<T>): void {
    pendingPatch.value = pendingPatch.value
      ? mergePatch(pendingPatch.value, patch)
      : { ...patch }

    if (status.value === 'error') {
      error.value = null
    }

    if (status.value !== 'saving') {
      status.value = 'pending'
    }

    debouncedQueueSave()
  }

  async function flush(patch?: Partial<T>): Promise<void> {
    if (patch) {
      pendingPatch.value = pendingPatch.value
        ? mergePatch(pendingPatch.value, patch)
        : { ...patch }
    }

    debouncedQueueSave.cancel()

    if (!pendingPatch.value) {
      syncStatus()
      return
    }

    await queueSave()
  }

  function cancel(): void {
    pendingPatch.value = null
    debouncedQueueSave.cancel()
    if (status.value !== 'saving') {
      status.value = 'idle'
      error.value = null
    }
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      if (options.flushOnUnmount ?? true) {
        void flush()
        return
      }

      cancel()
    })
  }

  return {
    status,
    error,
    lastSavedAt,
    isSaving: computed(() => status.value === 'saving'),
    update,
    flush,
    cancel,
  }
}
