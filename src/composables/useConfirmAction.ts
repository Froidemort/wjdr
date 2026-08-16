import { useConfirmDialog } from '@vueuse/core'

export function useConfirmAction() {
  const { reveal, confirm, cancel } = useConfirmDialog<string, true, false>()

  async function confirmAction(message: string): Promise<boolean> {
    if (typeof window === 'undefined') {
      return true
    }

    const pendingReveal = reveal(message)
    const accepted = window.confirm(message)

    if (accepted) {
      confirm(true)
    } else {
      cancel(false)
    }

    const result = await pendingReveal
    return !result.isCanceled
  }

  return {
    confirmAction,
  }
}
