import { describe, expect, it, vi } from 'vitest'

const clipboard = vi.hoisted(() => ({
  copy: vi.fn(),
  isSupported: { value: true },
}))

vi.mock('@vueuse/core', () => ({
  useClipboard: () => clipboard,
}))

import { useCopyFeedback } from '../../src/composables/useCopyFeedback'

describe('useCopyFeedback', () => {
  it('copies text and clears feedback after the configured delay', async () => {
    vi.useFakeTimers()
    clipboard.copy.mockResolvedValue(undefined)
    const feedback = useCopyFeedback()

    await feedback.copyText('campaign', 'ABC123', 'Code copie')

    expect(clipboard.copy).toHaveBeenCalledWith('ABC123')
    expect(feedback.feedbackMap.value).toEqual({ campaign: 'Code copie' })
    await vi.advanceTimersByTimeAsync(2500)
    expect(feedback.feedbackMap.value).toEqual({})
    vi.useRealTimers()
  })

  it('records feedback when the clipboard operation fails', async () => {
    clipboard.copy.mockRejectedValue(new Error('refuse'))
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const feedback = useCopyFeedback()

    await feedback.copyLink('invite', '/campaign/ABC123')

    expect(feedback.feedbackMap.value.invite).toBe('Lien copie !')
    expect(warning).toHaveBeenCalledOnce()
    warning.mockRestore()
  })
})