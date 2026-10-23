import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useCharacterFeedback } from '../../src/composables/useCharacterFeedback'

function setup() {
  const errorMessage = ref<string | null>(null)
  const feedback = useCharacterFeedback({ errorMessage })
  return { feedback, errorMessage }
}

describe('useCharacterFeedback', () => {
  it('resets the action success message after the timeout', () => {
    vi.useFakeTimers()
    const { feedback } = setup()

    feedback.setSectionSuccess('skills', 'Compétence mise à jour.')
    expect(feedback.actionSuccessMessage.value).toBe('Compétence mise à jour.')

    vi.advanceTimersByTime(4000)
    expect(feedback.actionSuccessMessage.value).toBeNull()

    vi.useRealTimers()
  })

  it('resets the section success message after its own timeout', () => {
    vi.useFakeTimers()
    const { feedback } = setup()

    feedback.setSectionSuccess('weapons', 'Arme équipée.')
    expect(feedback.getSectionSuccessMessage('weapons')).toBe('Arme équipée.')

    vi.advanceTimersByTime(4500)
    expect(feedback.getSectionSuccessMessage('weapons')).toBeNull()

    vi.useRealTimers()
  })

  it('getSectionSuccessMessage returns null for a different section', () => {
    const { feedback } = setup()

    feedback.setSectionSuccess('skills', 'ok')

    expect(feedback.getSectionSuccessMessage('talents')).toBeNull()
  })

  it('restarts the timer when a new success message arrives before expiry', () => {
    vi.useFakeTimers()
    const { feedback } = setup()

    feedback.setSectionSuccess('items', 'first')
    vi.advanceTimersByTime(3000)
    feedback.setSectionSuccess('items', 'second')
    vi.advanceTimersByTime(3000)

    expect(feedback.getSectionSuccessMessage('items')).toBe('second')

    vi.useRealTimers()
  })

  it('beginAction is blocked while another action is busy', () => {
    const { feedback } = setup()

    expect(feedback.beginAction('first')).toBe(true)
    expect(feedback.actionBusyKey.value).toBe('first')
    expect(feedback.beginAction('second')).toBe(false)
    expect(feedback.actionBusyKey.value).toBe('first')
  })

  it('beginAction clears a stale error message and endAction frees the key', () => {
    const { feedback, errorMessage } = setup()
    errorMessage.value = 'boom'

    feedback.beginAction('first')
    expect(errorMessage.value).toBeNull()

    feedback.endAction()
    expect(feedback.actionBusyKey.value).toBeNull()
    expect(feedback.beginAction('second')).toBe(true)
  })

  it('runWithBusyAction skips the operation while busy and always frees the key', async () => {
    const { feedback } = setup()
    const operation = vi.fn().mockResolvedValue(undefined)

    feedback.beginAction('first')
    await feedback.runWithBusyAction('second', operation)
    expect(operation).not.toHaveBeenCalled()

    feedback.endAction()
    await feedback.runWithBusyAction('third', operation)
    expect(operation).toHaveBeenCalledOnce()
    expect(feedback.actionBusyKey.value).toBeNull()
  })

  it('runWithBusyAction frees the key even when the operation throws', async () => {
    const { feedback } = setup()
    const operation = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(feedback.runWithBusyAction('key', operation)).rejects.toThrow('fail')

    expect(feedback.actionBusyKey.value).toBeNull()
  })

  it('confirmDestructiveAction resolves via useConfirmAction', async () => {
    const { feedback } = setup()

    await expect(feedback.confirmDestructiveAction('Supprimer ?')).resolves.toBe(true)
  })
})
