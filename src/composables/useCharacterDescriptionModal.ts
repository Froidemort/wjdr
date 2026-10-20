import { ref, type Ref } from 'vue'

export function useCharacterDescriptionModal(descriptionDialogRef: Ref<HTMLDialogElement | null>) {
  const descriptionTitle = ref<string | null>(null)
  const descriptionContent = ref<string | null>(null)

  function openDescriptionModal(title: string, description: string | null): void {
    descriptionTitle.value = title
    descriptionContent.value = description?.trim() ?? null
    descriptionDialogRef.value?.showModal()
  }

  function resetDescriptionModalState(): void {
    descriptionTitle.value = null
    descriptionContent.value = null
  }

  function closeDescriptionModal(): void {
    if (descriptionDialogRef.value?.open) {
      descriptionDialogRef.value.close()
      return
    }
    resetDescriptionModalState()
  }

  return {
    descriptionTitle,
    descriptionContent,
    openDescriptionModal,
    closeDescriptionModal,
    onDescriptionDialogClosed: resetDescriptionModalState,
  }
}
