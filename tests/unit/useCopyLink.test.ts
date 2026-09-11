import { describe, expect, it, vi } from 'vitest'

const feedback = vi.hoisted(() => ({
  copyLink: vi.fn(),
  feedbackMap: { value: {} as Record<string, string> },
}))

vi.mock('../../src/composables/useCopyFeedback', () => ({
  useCopyFeedback: () => feedback,
}))

import { useCopyLink } from '../../src/composables/useCopyLink'

describe('useCopyLink', () => {
  it('delegates copy actions and exposes their feedback', async () => {
    feedback.feedbackMap.value = { '__copy-link-feedback__': 'Lien copie !' }
    const copy = useCopyLink()

    await copy.copyLink('/campaign/ABC123')

    expect(feedback.copyLink).toHaveBeenCalledWith('__copy-link-feedback__', '/campaign/ABC123', 'Lien copie !')
    expect(copy.copyFeedback.value).toBe('Lien copie !')
  })
})