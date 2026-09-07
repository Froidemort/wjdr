import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const listeners = vi.hoisted(() => ({
  onClickOutside: vi.fn(),
  onKeyStroke: vi.fn(),
}))

vi.mock('@vueuse/core', () => listeners)
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }) }))

import { usePopoverPanel } from '../../src/composables/usePopoverPanel'

describe('usePopoverPanel', () => {
  beforeEach(() => vi.resetAllMocks())

  it('opens, closes, restores focus, and registers dismissal listeners', () => {
    const onOpen = vi.fn()
    const focus = vi.fn()
    const panel = usePopoverPanel({
      onOpen,
      rootRef: ref(null),
      triggerRef: ref({ focus } as HTMLButtonElement),
    })

    panel.toggle()
    expect(panel.isOpen.value).toBe(true)
    expect(onOpen).toHaveBeenCalledOnce()
    panel.toggle()
    expect(panel.isOpen.value).toBe(false)
    expect(focus).toHaveBeenCalledOnce()
    expect(listeners.onClickOutside).toHaveBeenCalledOnce()
    expect(listeners.onKeyStroke).toHaveBeenCalledWith('Escape', expect.any(Function))
  })

  it('closes only open panels through outside-click and escape handlers', () => {
    const focus = vi.fn()
    const panel = usePopoverPanel({ rootRef: ref(null), triggerRef: ref({ focus } as HTMLButtonElement) })
    const outsideHandler = listeners.onClickOutside.mock.calls[0][1]
    const escapeHandler = listeners.onKeyStroke.mock.calls[0][1]

    outsideHandler()
    expect(focus).not.toHaveBeenCalled()
    panel.toggle()
    escapeHandler()
    expect(panel.isOpen.value).toBe(false)
    expect(focus).toHaveBeenCalledOnce()
  })
})