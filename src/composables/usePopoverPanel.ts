import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { type Ref, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface PopoverPanelOptions {
  onOpen?: () => void
  /** Panel root element — owned by the caller and bound in the template. */
  rootRef: Ref<HTMLElement | null>
  /** Trigger button — focus is restored here on close. */
  triggerRef: Ref<HTMLButtonElement | null>
}

/** Shared open/close behaviour for navbar dropdown panels (missives, account). */
export function usePopoverPanel({ onOpen, rootRef, triggerRef }: PopoverPanelOptions) {
  const route = useRoute()
  const isOpen = ref(false)

  function close(): void {
    isOpen.value = false
    triggerRef.value?.focus()
  }

  function toggle(): void {
    if (isOpen.value) {
      close()
      return
    }
    isOpen.value = true
    onOpen?.()
  }

  watch(() => route.path, close)
  onClickOutside(rootRef, () => {
    if (isOpen.value) {
      close()
    }
  })
  onKeyStroke('Escape', () => {
    if (isOpen.value) {
      close()
    }
  })

  return { isOpen, close, toggle }
}
