import { useOptimisticUpdate } from './useOptimisticUpdate'

export type { SaveStatus } from './useOptimisticUpdate'

export function useLiveSave<T>(saveFunction: (data: T) => Promise<void>, delay: number = 500) {
  const { status, update, flush } = useOptimisticUpdate<T>({
    onSave: async (patch) => {
      await saveFunction(patch as T)
    },
    debounceMs: delay,
  })

  function triggerSave(data: T): void {
    update(data as Partial<T>)
  }

  async function triggerSaveNow(data: T): Promise<void> {
    await flush(data as Partial<T>)
  }

  return {
    status,
    triggerSave,
    triggerSaveNow,
  }
}
