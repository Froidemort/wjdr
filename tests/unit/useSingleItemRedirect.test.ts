import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn(), query: {} as Record<string, string> }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: router.query }),
  useRouter: () => ({ replace: router.replace }),
}))

import { useSingleItemRedirect } from '../../src/composables/useSingleItemRedirect'

describe('useSingleItemRedirect', () => {
  beforeEach(() => {
    router.replace.mockReset()
    router.query = {}
  })

  it('replaces the route when exactly one item exists', async () => {
    const { redirectIfSingle } = useSingleItemRedirect()

    await expect(redirectIfSingle([{ id: 'a' }], (item) => `/x/${item.id}`)).resolves.toBe(true)
    expect(router.replace).toHaveBeenCalledWith('/x/a')
  })

  it('does nothing for zero or several items', async () => {
    const { redirectIfSingle } = useSingleItemRedirect()

    await expect(redirectIfSingle([], () => '/x')).resolves.toBe(false)
    await expect(redirectIfSingle([{ id: 'a' }, { id: 'b' }], () => '/x')).resolves.toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('is bypassed by ?all=1', async () => {
    router.query = { all: '1' }
    const { redirectIfSingle } = useSingleItemRedirect()

    await expect(redirectIfSingle([{ id: 'a' }], () => '/x')).resolves.toBe(false)
    expect(router.replace).not.toHaveBeenCalled()
  })
})
