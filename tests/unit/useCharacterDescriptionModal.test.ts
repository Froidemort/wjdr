import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useCharacterDescriptionModal } from '../../src/composables/useCharacterDescriptionModal'

function createDialog(open = false) {
  return { open, showModal: vi.fn(), close: vi.fn() } as unknown as HTMLDialogElement
}

describe('useCharacterDescriptionModal', () => {
  it('opens with a trimmed description and shows the dialog', () => {
    const dialog = createDialog()
    const modal = useCharacterDescriptionModal(ref(dialog))

    modal.openDescriptionModal('Epee', '  Lame aiguisee  ')

    expect(modal.descriptionTitle.value).toBe('Epee')
    expect(modal.descriptionContent.value).toBe('Lame aiguisee')
    expect(dialog.showModal).toHaveBeenCalledOnce()
  })

  it('keeps a null description null', () => {
    const modal = useCharacterDescriptionModal(ref(createDialog()))

    modal.openDescriptionModal('Epee', null)

    expect(modal.descriptionContent.value).toBeNull()
  })

  it('does not throw when the dialog ref is empty', () => {
    const modal = useCharacterDescriptionModal(ref(null))

    expect(() => modal.openDescriptionModal('Epee', 'x')).not.toThrow()
    expect(modal.descriptionTitle.value).toBe('Epee')
  })

  it('closes an open dialog without resetting state directly', () => {
    const dialog = createDialog(true)
    const modal = useCharacterDescriptionModal(ref(dialog))
    modal.openDescriptionModal('Epee', 'x')

    modal.closeDescriptionModal()

    expect(dialog.close).toHaveBeenCalledOnce()
    expect(modal.descriptionTitle.value).toBe('Epee')
  })

  it('resets state when closing a dialog that is not open', () => {
    const modal = useCharacterDescriptionModal(ref(createDialog(false)))
    modal.openDescriptionModal('Epee', 'x')

    modal.closeDescriptionModal()

    expect(modal.descriptionTitle.value).toBeNull()
    expect(modal.descriptionContent.value).toBeNull()
  })

  it('resets state on dialog closed event', () => {
    const modal = useCharacterDescriptionModal(ref(createDialog()))
    modal.openDescriptionModal('Epee', 'x')

    modal.onDescriptionDialogClosed()

    expect(modal.descriptionTitle.value).toBeNull()
    expect(modal.descriptionContent.value).toBeNull()
  })
})
