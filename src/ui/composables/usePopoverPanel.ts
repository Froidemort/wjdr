import { type Ref, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

  function onOutsideClick(event: MouseEvent): void {
    const target = event.target as Node | null
    if (!isOpen.value || !target || rootRef.value?.contains(target)) {
      return
    }
    close()
  }

  function onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  watch(() => route.path, close)

  onMounted(() => {
    document.addEventListener('click', onOutsideClick)
    document.addEventListener('keydown', onEscape)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onOutsideClick)
    document.removeEventListener('keydown', onEscape)
  })

  return { isOpen, close, toggle }
}
