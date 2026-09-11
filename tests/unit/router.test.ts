import { beforeEach, describe, expect, it, vi } from 'vitest'

type NavigationGuard = (
  to: { matched: Array<{ meta: { requiresAuth?: boolean } }> },
  from: unknown,
  next: (target?: unknown) => void,
) => Promise<void>

const testState = vi.hoisted(() => ({
  guard: null as NavigationGuard | null,
  initAuth: vi.fn(),
  setMode: vi.fn(),
  authStore: { initialized: true, isAuthenticated: false, initAuth: vi.fn() },
}))

vi.mock('vue-router', () => ({
  createWebHistory: vi.fn(() => 'history'),
  createRouter: vi.fn(() => ({
    beforeEach: (guard: NavigationGuard) => {
      testState.guard = guard
    },
  })),
}))

vi.mock('../../src/router/routes', () => ({ appRoutes: [] }))
vi.mock('../../src/stores/auth', () => ({ useAuthStore: () => testState.authStore }))
vi.mock('../../src/stores/authForm', () => ({ useAuthFormStore: () => ({ setMode: testState.setMode }) }))

async function loadGuard(): Promise<NavigationGuard> {
  vi.resetModules()
  testState.guard = null
  await import('../../src/router/router')
  if (!testState.guard) {
    throw new Error('Router guard was not registered')
  }
  return testState.guard
}

describe('router guard', () => {
  beforeEach(() => {
    testState.initAuth.mockReset()
    testState.setMode.mockReset()
    testState.authStore.initialized = true
    testState.authStore.isAuthenticated = false
    testState.authStore.initAuth = testState.initAuth
  })

  it('initializes auth and redirects unauthenticated protected navigation to login', async () => {
    testState.authStore.initialized = false
    const guard = await loadGuard()
    const next = vi.fn()

    await guard({ matched: [{ meta: { requiresAuth: true } }] }, null, next)

    expect(testState.initAuth).toHaveBeenCalledOnce()
    expect(testState.setMode).toHaveBeenCalledWith('login')
    expect(next).toHaveBeenCalledWith({ path: '/' })
  })

  it('continues after failed auth initialization for public navigation', async () => {
    testState.authStore.initialized = false
    testState.initAuth.mockRejectedValueOnce(new Error('Unavailable'))
    const guard = await loadGuard()
    const next = vi.fn()

    await guard({ matched: [{ meta: {} }] }, null, next)

    expect(testState.initAuth).toHaveBeenCalledOnce()
    expect(testState.setMode).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith()
  })

  it('continues authenticated navigation and prefetches frequent views once', async () => {
    testState.authStore.isAuthenticated = true
    const guard = await loadGuard()
    const firstNext = vi.fn()
    const secondNext = vi.fn()

    await guard({ matched: [{ meta: { requiresAuth: true } }] }, null, firstNext)
    await guard({ matched: [{ meta: {} }] }, null, secondNext)

    expect(testState.initAuth).not.toHaveBeenCalled()
    expect(firstNext).toHaveBeenCalledWith()
    expect(secondNext).toHaveBeenCalledWith()
  })
})