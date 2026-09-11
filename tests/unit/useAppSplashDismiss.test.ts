import { describe, expect, it, vi } from 'vitest'
import { ref, type Ref } from 'vue'

type TimeoutCall = {
  callback: () => void
  delay: Ref<number> | number
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

const testState = vi.hoisted(() => ({
  mounted: [] as Array<() => void>,
  unmounted: [] as Array<() => void>,
  watchers: [] as Array<() => void>,
  timeouts: [] as TimeoutCall[],
  reducedMotion: { value: false } as Ref<boolean>,
}))

vi.mock('vue', async (importOriginal) => {
  const vue = await importOriginal<typeof import('vue')>()

  return {
    ...vue,
    onMounted: (callback: () => void) => testState.mounted.push(callback),
    onUnmounted: (callback: () => void) => testState.unmounted.push(callback),
    watch: (_source: unknown, callback: () => void) => testState.watchers.push(callback),
  }
})

vi.mock('@vueuse/core', () => ({
  useMediaQuery: () => testState.reducedMotion,
  useTimeoutFn: (callback: () => void, delay: Ref<number> | number) => {
    const timeout = { callback, delay, start: vi.fn(), stop: vi.fn() }
    testState.timeouts.push(timeout)
    return timeout
  },
}))

import { useAppSplashDismiss } from '../../src/composables/useAppSplashDismiss'

function resetState(): void {
  testState.mounted.length = 0
  testState.unmounted.length = 0
  testState.watchers.length = 0
  testState.timeouts.length = 0
  testState.reducedMotion.value = false
}

describe('useAppSplashDismiss', () => {
  it('waits for readiness, animation, and the regular minimum duration before fading out', () => {
    resetState()
    const ready = ref(false)
    const onDismissed = vi.fn()
    const splash = useAppSplashDismiss({ ready, onDismissed })

    testState.mounted[0]()
  expect(testState.timeouts[0].delay).toBe(520)
  expect((testState.timeouts[1].delay as Ref<number>).value).toBe(1400)
  expect(testState.timeouts[2].delay).toBe(5000)

    ready.value = true
    testState.watchers[0]()
    splash.onAnimationEnd()
    testState.timeouts[1].callback()

    expect(splash.exiting.value).toBe(true)
    expect(testState.timeouts[0].start).toHaveBeenCalledOnce()
    expect(onDismissed).not.toHaveBeenCalled()

    testState.timeouts[0].callback()
    expect(onDismissed).toHaveBeenCalledOnce()
  })

  it('uses reduced-motion timing, forces dismissal at the maximum, and cleans up timers', () => {
    resetState()
    testState.reducedMotion.value = true
    const splash = useAppSplashDismiss({ ready: ref(false), onDismissed: vi.fn() })

    testState.mounted[0]()
    expect(splash.prefersReducedMotion.value).toBe(true)
    expect((testState.timeouts[1].delay as Ref<number>).value).toBe(500)

    testState.timeouts[2].callback()
    expect(splash.exiting.value).toBe(true)
    expect(testState.timeouts[0].start).toHaveBeenCalledOnce()

    testState.unmounted[0]()
    expect(testState.timeouts[0].stop).toHaveBeenCalledTimes(2)
    expect(testState.timeouts[1].stop).toHaveBeenCalledOnce()
    expect(testState.timeouts[2].stop).toHaveBeenCalledOnce()
  })
})