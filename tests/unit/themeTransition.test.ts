import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runAnimatedThemeToggle, type ThemeTransitionVariant } from '../../src/utils/themeTransition'

const animate = vi.fn()
const removeProperty = vi.fn()
const setProperty = vi.fn()
const startViewTransition = vi.fn()
const root = {
  animate,
  dataset: {} as Record<string, string>,
  style: { removeProperty, setProperty },
}

beforeEach(() => {
  vi.resetAllMocks()
  for (const key of Object.keys(root.dataset)) {
    delete root.dataset[key]
  }
  vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 })
  vi.stubGlobal('document', { documentElement: root, startViewTransition })
})

describe('runAnimatedThemeToggle', () => {
  it('applies the theme immediately when view transitions are unavailable', () => {
    vi.stubGlobal('document', { documentElement: root })
    const applyTheme = vi.fn()

    runAnimatedThemeToggle({ applyTheme })

    expect(applyTheme).toHaveBeenCalledOnce()
    expect(animate).not.toHaveBeenCalled()
  })

  it.each<ThemeTransitionVariant>(['circle', 'square', 'triangle', 'diamond', 'hexagon', 'rectangle', 'star'])(
    'animates the %s transition variant',
    async (variant) => {
      const applyTheme = vi.fn()
      startViewTransition.mockImplementation((callback: () => void) => {
        callback()
        return { finished: Promise.resolve(), ready: Promise.resolve() }
      })

      runAnimatedThemeToggle({ applyTheme, duration: 120, variant, fromCenter: true })
      await Promise.resolve()
      await Promise.resolve()

      expect(applyTheme).toHaveBeenCalledOnce()
      expect(animate).toHaveBeenCalledWith(expect.objectContaining({ clipPath: expect.any(Array) }), expect.objectContaining({
        duration: 120,
        easing: variant === 'star' ? 'linear' : 'ease-in-out',
      }))
      expect(removeProperty).toHaveBeenCalledWith('--magicui-theme-vt-clip-from')
    },
  )

  it('uses a button position and ignores overlapping transitions', async () => {
    startViewTransition.mockImplementation((callback: () => void) => {
      callback()
      return { ready: Promise.resolve(), finished: new Promise(() => {}) }
    })
    const applyTheme = vi.fn()
    const button = {
      getBoundingClientRect: () => ({ top: 100, left: 200, width: 40, height: 20 }),
    } as HTMLElement

    runAnimatedThemeToggle({ applyTheme, button })
    runAnimatedThemeToggle({ applyTheme, button })
    await Promise.resolve()

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledWith(expect.objectContaining({ clipPath: expect.arrayContaining([expect.stringContaining('22%')]) }), expect.anything())
  })
})