import { useDebounceFn, useTimeoutFn } from '@vueuse/core'
import { type Ref, ref } from 'vue'

// Définition des états stricts de notre machine d'état de sauvegarde
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'error'

export function useLiveSave<T>(saveFunction: (data: T) => Promise<void>, delay: number = 500) {
  const status: Ref<SaveStatus> = ref('idle')
  const { start: startVisibilityReset, stop: stopVisibilityReset } = useTimeoutFn(
    () => {
      status.value = 'idle'
    },
    500,
    { immediate: false }
  )

  async function executeSave(data: T): Promise<void> {
    status.value = 'saving'

    try {
      await saveFunction(data)
      status.value = 'idle'
      stopVisibilityReset()
      startVisibilityReset()
    } catch (error) {
      console.error('Failed to save data, reason:', error)
      status.value = 'error'
      stopVisibilityReset()
      startVisibilityReset()
    }
  }

  const debouncedExecuteSave = useDebounceFn((data: T) => {
    void executeSave(data)
  }, delay)

  function triggerSave(data: T): void {
    // 1. Passage en attente (l'utilisateur tape ou modifie)
    status.value = 'pending'

    // Nettoyage des timers précédents
    debouncedExecuteSave.cancel()
    stopVisibilityReset()

    // 2. Lancement de l'anti-rebond (debounce)
    void debouncedExecuteSave(data)
  }

  async function triggerSaveNow(data: T): Promise<void> {
    debouncedExecuteSave.cancel()
    stopVisibilityReset()

    await executeSave(data)
  }

  return {
    status,
    triggerSave,
    triggerSaveNow,
  }
}
