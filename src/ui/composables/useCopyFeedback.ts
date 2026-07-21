import { ref } from 'vue'

export function useCopyFeedback() {
  const feedbackMap = ref<Record<string, string>>({})

  async function copyLink(id: string, path: string): Promise<void> {
    const url = typeof window !== 'undefined' ? `${window.location.origin}${path}` : path
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      /* silently ignore */
    }

    feedbackMap.value = { ...feedbackMap.value, [id]: 'Lien copié !' }
    setTimeout(() => {
      const next = { ...feedbackMap.value }
      delete next[id]
      feedbackMap.value = next
    }, 2500)
  }

  return { feedbackMap, copyLink }
}
