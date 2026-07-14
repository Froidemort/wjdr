import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AuthMode = 'login' | 'signup'

export const useAuthModalStore = defineStore('authModal', () => {
  const isOpen = ref(false)
  const mode = ref<AuthMode>('login')

  function openModal(targetMode: AuthMode = 'login') {
    mode.value = targetMode
    isOpen.value = true
  }

  function closeModal() {
    isOpen.value = false
  }

  return {
    isOpen,
    mode,
    openModal,
    closeModal
  }
})