import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCampaignCreateModalStore = defineStore('campaignCreateModal', () => {
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
