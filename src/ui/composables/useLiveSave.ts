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
      status.value = 'saving'
      
      try {
        // Exécution de la promesse Supabase
        await saveFunction(data)
        status.value = 'idle'
        
        // Auto-hide success state after 500ms
        visibilityTimeoutId = setTimeout(() => {
          status.value = 'idle'
        }, 500)
      } catch (error) {
        console.error("Failed to save data, reason:", error)
        status.value = 'error'
        
        // Auto-hide error state after 500ms
        visibilityTimeoutId = setTimeout(() => {
          status.value = 'idle'
        }, 500)
      }
    }, delay)
  }

  return {
    status,
    triggerSave
  }
}