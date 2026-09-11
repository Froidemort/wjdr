import { beforeEach, describe, expect, it, vi } from 'vitest'

const dialog = vi.hoisted(() => ({
  cancel: vi.fn(),
  confirm: vi.fn(),
  reveal: vi.fn(),
}))

vi.mock('@vueuse/core', () => ({
  useConfirmDialog: () => dialog,
}))

import { useConfirmAction } from '../../src/composables/useConfirmAction'

describe('useConfirmAction', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dialog.reveal.mockResolvedValue({ isCanceled: false })
  })

  it('accepts without opening a dialog during server rendering', async () => {
    vi.stubGlobal('window', undefined)

    await expect(useConfirmAction().confirmAction('Supprimer ?')).resolves.toBe(true)
    expect(dialog.reveal).not.toHaveBeenCalled()
  })

  it.each([
    [true, false, 'confirm'],
    [false, true, 'cancel'],
  ])('handles a browser confirmation response', async (accepted, isCanceled, method) => {
    dialog.reveal.mockResolvedValue({ isCanceled })
    vi.stubGlobal('window', { confirm: vi.fn().mockReturnValue(accepted) })

    await expect(useConfirmAction().confirmAction('Supprimer ?')).resolves.toBe(!isCanceled)

    expect(dialog[method as 'confirm' | 'cancel']).toHaveBeenCalledOnce()
  })
})