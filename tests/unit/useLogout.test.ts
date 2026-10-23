import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ replace: vi.fn(), signOut: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('../../src/stores/auth', () => ({ useAuthStore: () => ({ signOut: mocks.signOut }) }))

import { useLogout } from '../../src/composables/useLogout'

describe('useLogout', () => {
  beforeEach(() => {
    mocks.replace.mockReset()
    mocks.signOut.mockReset()
  })

  it('runs the pre-hook, signs out, then redirects home in that order', async () => {
    const order: string[] = []
    mocks.signOut.mockImplementation(async () => void order.push('signOut'))
    mocks.replace.mockImplementation(async () => void order.push('replace'))

    await useLogout(() => order.push('before')).logout()

    expect(order).toEqual(['before', 'signOut', 'replace'])
    expect(mocks.replace).toHaveBeenCalledWith('/')
  })

  it('works without a pre-hook', async () => {
    await useLogout().logout()

    expect(mocks.signOut).toHaveBeenCalledOnce()
    expect(mocks.replace).toHaveBeenCalledWith('/')
  })
})
