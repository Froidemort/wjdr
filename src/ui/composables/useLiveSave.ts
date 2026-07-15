import { ref, type Ref } from 'vue'

// Définition des états stricts de notre machine d'état de sauvegarde
export type SaveStatus = 'idle' | 'pending' | 'saving' | 'error'

export function useLiveSave<T>(
  saveFunction: (data: T) => Promise<void>,
  delay: number = 500
) {
  const status: Ref<SaveStatus> = ref('idle')
  let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null
  let visibilityTimeoutId: ReturnType<typeof setTimeout> | null = null

  async function executeSave(data: T): Promise<void> {
    status.value = 'saving'

    try {
      await saveFunction(data)
      status.value = 'idle'

      visibilityTimeoutId = setTimeout(() => {
        status.value = 'idle'
      }, 500)
    } catch (error) {
      console.error('Failed to save data, reason:', error)
      status.value = 'error'

      visibilityTimeoutId = setTimeout(() => {
        status.value = 'idle'
      }, 500)
    }
  }

  function triggerSave(data: T): void {
    // 1. Passage en attente (l'utilisateur tape ou modifie)
    status.value = 'pending'
    
    // Nettoyage des timers précédents
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId)
    }
    if (visibilityTimeoutId) {
      clearTimeout(visibilityTimeoutId)
    }

    // 2. Lancement de l'anti-rebond (debounce)
    debounceTimeoutId = setTimeout(async () => {
      await executeSave(data)
    }, delay)
  }

  async function triggerSaveNow(data: T): Promise<void> {
    if (debounceTimeoutId) {
      clearTimeout(debounceTimeoutId)
      debounceTimeoutId = null
    }
    if (visibilityTimeoutId) {
      clearTimeout(visibilityTimeoutId)
      visibilityTimeoutId = null
    }

    await executeSave(data)
  }

  return {
    status,
    triggerSave,
    triggerSaveNow
  }
}