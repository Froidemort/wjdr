import { computed } from 'vue'
import { useCopyFeedback } from './useCopyFeedback'

export function useCopyLink() {
  const feedbackId = '__copy-link-feedback__'
  const { feedbackMap, copyLink: copyLinkWithFeedback } = useCopyFeedback()
  const copyFeedback = computed(() => feedbackMap.value[feedbackId] ?? '')

  async function copyLink(path: string): Promise<void> {
    await copyLinkWithFeedback(feedbackId, path, 'Lien copie !')
  }

  return { copyFeedback, copyLink }
}
