import { ref } from 'vue'

export function useCopyFeedback() {
  const feedbackMap = ref<Record<string, string>>({})

  async function copyText(id: string, text: string, successMessage = 'Copie reussie !'): Promise<void> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      console.warn('Clipboard API not available or failed to write text :', text)
    }

    feedbackMap.value = { ...feedbackMap.value, [id]: successMessage }
    setTimeout(() => {
      const next = { ...feedbackMap.value }
      delete next[id]
      feedbackMap.value = next
    }, 2500)
  }

  async function copyLink(id: string, path: string, successMessage = 'Lien copie !'): Promise<void> {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    await copyText(id, url, successMessage)
  }

  return { feedbackMap, copyText, copyLink }
}
