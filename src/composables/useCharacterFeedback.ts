import { useTimeoutFn } from '@vueuse/core'
import { type Ref, ref } from 'vue'
import { useConfirmAction } from './useConfirmAction'

export type FeedbackSection =
  | 'skills'
  | 'talents'
  | 'weapons'
  | 'armors'
  | 'items'
  | 'stats'
  | 'career'
  | 'catalog'

interface UseCharacterFeedbackOptions {
  errorMessage: Ref<string | null>
}

export function useCharacterFeedback({ errorMessage }: UseCharacterFeedbackOptions) {
  const { confirmAction } = useConfirmAction()
  const actionSuccessMessage = ref<string | null>(null)
  const sectionSuccess = ref<{ section: FeedbackSection; message: string } | null>(null)

  const actionBusyKey = ref<string | null>(null)

  const { start: startActionSuccessReset, stop: stopActionSuccessReset } = useTimeoutFn(
    () => {
      actionSuccessMessage.value = null
    },
    4000,
    { immediate: false }
  )
  const { start: startSectionSuccessReset, stop: stopSectionSuccessReset } = useTimeoutFn(
    () => {
      sectionSuccess.value = null
    },
    4500,
    { immediate: false }
  )

  function setActionSuccess(message: string): void {
    actionSuccessMessage.value = message
    stopActionSuccessReset()
    startActionSuccessReset()
  }

  function setSectionSuccess(section: FeedbackSection, message: string): void {
    sectionSuccess.value = { section, message }
    stopSectionSuccessReset()
    startSectionSuccessReset()

    setActionSuccess(message)
  }

  function getSectionSuccessMessage(section: FeedbackSection): string | null {
    if (!sectionSuccess.value || sectionSuccess.value.section !== section) {
      return null
    }

    return sectionSuccess.value.message
  }

  async function confirmDestructiveAction(message: string): Promise<boolean> {
    return confirmAction(message)
  }

  function beginAction(key: string): boolean {
    if (actionBusyKey.value) {
      return false
    }

    errorMessage.value = null
    actionBusyKey.value = key
    return true
  }

  function endAction(): void {
    actionBusyKey.value = null
  }

  async function runWithBusyAction(key: string, operation: () => Promise<void>): Promise<void> {
    if (!beginAction(key)) {
      return
    }

    try {
      await operation()
    } finally {
      endAction()
    }
  }

  return {
    actionSuccessMessage,
    sectionSuccess,
    actionBusyKey,
    setSectionSuccess,
    getSectionSuccessMessage,
    confirmDestructiveAction,
    beginAction,
    endAction,
    runWithBusyAction,
  }
}

export type CharacterFeedbackHelpers = Pick<
  ReturnType<typeof useCharacterFeedback>,
  | 'actionBusyKey'
  | 'setSectionSuccess'
  | 'confirmDestructiveAction'
  | 'beginAction'
  | 'endAction'
  | 'runWithBusyAction'
>
