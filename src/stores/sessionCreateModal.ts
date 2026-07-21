import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSessionCreateModalStore = defineStore('sessionCreateModal', () => {
  const isOpen = ref(false)

  function openModal(): void {
    isOpen.value = true
  }

  function closeModal(): void {
    isOpen.value = false
  }

  return {
    isOpen,
    openModal,
    closeModal,
  }
})
