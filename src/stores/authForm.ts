import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AuthMode = 'login' | 'signup'

/** Mode du formulaire d'auth sur la home. */
export const useAuthFormStore = defineStore('authForm', () => {
  const mode = ref<AuthMode>('login')

  function setMode(targetMode: AuthMode): void {
    mode.value = targetMode
  }

  return {
    mode,
    setMode,
  }
})
