// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref, type Ref } from 'vue'
import type { CharacterTabId } from '../../src/types/characterSheet'

type ObserverCallback = (entries: Array<{ target: { id: string }; isIntersecting: boolean }>) => void

const vueuse = vi.hoisted(() => ({
  media: new Map<string, { value: boolean }>(),
  observerCallback: null as ObserverCallback | null,
  observerTarget: null as { value: HTMLElement[] } | null,
  observerOptions: null as unknown,
  scrollEnd: null as (() => void) | null,
  timeoutCallback: null as (() => void) | null,
  timeoutStart: vi.fn(),
  timeoutStop: vi.fn(),
}))

vi.mock('@vueuse/core', () => ({
  useMediaQuery: (query: string) => {
    const state = vueuse.media.get(query) ?? { value: false }
    vueuse.media.set(query, state)
    return state
  },
  useIntersectionObserver: (
    target: { value: HTMLElement[] },
    callback: ObserverCallback,
    options: unknown
  ) => {
    vueuse.observerTarget = target
    vueuse.observerCallback = callback
    vueuse.observerOptions = options
  },
  useEventListener: (_event: string, listener: () => void) => {
    vueuse.scrollEnd = listener
  },
  useTimeoutFn: (callback: () => void) => {
    vueuse.timeoutCallback = callback
    return { start: vueuse.timeoutStart, stop: vueuse.timeoutStop }
  },
}))

import {
  CHARACTER_TAB_ORDER,
  characterPanelId,
  pickActiveTab,
  tabIdFromPanelId,
  useCharacterTabNavigation,
} from '../../src/composables/useCharacterTabNavigation'

const MOBILE_QUERY = '(max-width: 639px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function setMedia(mobile: boolean, reducedMotion = false): void {
  vueuse.media.set(MOBILE_QUERY, { value: mobile })
  vueuse.media.set(REDUCED_MOTION_QUERY, { value: reducedMotion })
}

function mountPanels(): Map<CharacterTabId, HTMLElement> {
  const panels = new Map<CharacterTabId, HTMLElement>()
  for (const tab of CHARACTER_TAB_ORDER) {
    const el = document.createElement('section')
    el.id = characterPanelId(tab)
    el.scrollIntoView = vi.fn()
    document.body.appendChild(el)
    panels.set(tab, el)
  }
  return panels
}

function intersect(tab: CharacterTabId, isIntersecting: boolean): void {
  vueuse.observerCallback?.([{ target: { id: characterPanelId(tab) }, isIntersecting }])
}

function setup(ready: Ref<boolean> = ref(true)) {
  return { ready, nav: useCharacterTabNavigation({ ready }) }
}

describe('pickActiveTab', () => {
  it('returns the first visible tab in page order, or null', () => {
    expect(pickActiveTab(new Set<CharacterTabId>())).toBeNull()
    expect(pickActiveTab(new Set<CharacterTabId>(['inventory', 'skills']))).toBe('skills')
    expect(pickActiveTab(new Set<CharacterTabId>(['stats', 'overview']))).toBe('overview')
  })
})

describe('tabIdFromPanelId', () => {
  it('maps panel ids back to tab ids', () => {
    expect(tabIdFromPanelId('character-panel-skills')).toBe('skills')
    expect(tabIdFromPanelId('character-panel-unknown')).toBeNull()
  })
})

describe('useCharacterTabNavigation', () => {
  beforeEach(() => {
    vueuse.media.clear()
    vueuse.observerCallback = null
    vueuse.timeoutCallback = null
    vueuse.timeoutStart.mockClear()
    vueuse.timeoutStop.mockClear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('defaults to overview on mobile and stats on desktop', () => {
    setMedia(true)
    expect(setup().nav.activeTab.value).toBe('overview')

    setMedia(false)
    expect(setup().nav.activeTab.value).toBe('stats')
  })

  it('shows every panel on mobile but only the active one on desktop', () => {
    setMedia(true)
    const mobile = setup().nav
    expect(mobile.isPanelVisible('skills')).toBe(true)
    expect(mobile.isPanelVisible('inventory')).toBe(true)

    setMedia(false)
    const desktop = setup().nav
    expect(desktop.isPanelVisible('stats')).toBe(true)
    expect(desktop.isPanelVisible('skills')).toBe(false)
    desktop.activeTab.value = 'overview'
    expect(desktop.isPanelVisible('stats')).toBe(false)
  })

  it('scrolls smoothly to the selected panel, or instantly with reduced motion', async () => {
    setMedia(true)
    const panels = mountPanels()
    const { nav } = setup()

    await nav.selectTab('skills')
    expect(nav.activeTab.value).toBe('skills')
    expect(panels.get('skills')?.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })

    setMedia(true, true)
    const reduced = setup().nav
    await reduced.selectTab('inventory')
    expect(panels.get('inventory')?.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
  })

  it('still scrolls to the panel on desktop without locking the scrollspy', async () => {
    setMedia(false)
    const panels = mountPanels()
    const { nav } = setup()

    await nav.selectTab('inventory')

    expect(panels.get('inventory')?.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(vueuse.timeoutStart).not.toHaveBeenCalled()
  })

  it('observes the four sections on mobile once ready, none on desktop or before ready', async () => {
    setMedia(true)
    mountPanels()
    const ready = ref(false)
    setup(ready)
    await nextTick()
    expect(vueuse.observerTarget?.value).toEqual([])

    ready.value = true
    await nextTick()
    await nextTick()
    expect(vueuse.observerTarget?.value.map((el) => el.id)).toEqual(CHARACTER_TAB_ORDER.map(characterPanelId))

    setMedia(false)
    setup()
    await nextTick()
    await nextTick()
    expect(vueuse.observerTarget?.value).toEqual([])
  })

  it('uses a thin top band as the observer root margin', () => {
    setMedia(true)
    setup()
    expect(vueuse.observerOptions).toEqual({ rootMargin: '-35% 0px -55% 0px' })
  })

  it('updates the active tab from intersections while scrolling', () => {
    setMedia(true)
    const { nav } = setup()

    intersect('stats', true)
    expect(nav.activeTab.value).toBe('stats')

    intersect('stats', false)
    intersect('skills', true)
    expect(nav.activeTab.value).toBe('skills')

    // Nothing visible: keep the last active tab.
    intersect('skills', false)
    expect(nav.activeTab.value).toBe('skills')
  })

  it('ignores unrelated intersection targets', () => {
    setMedia(true)
    const { nav } = setup()

    vueuse.observerCallback?.([{ target: { id: 'something-else' }, isIntersecting: true }])

    expect(nav.activeTab.value).toBe('overview')
  })

  it('freezes the scrollspy after a tab click until scrollend', async () => {
    setMedia(true)
    mountPanels()
    const { nav } = setup()

    await nav.selectTab('inventory')
    expect(vueuse.timeoutStart).toHaveBeenCalledTimes(1)

    intersect('stats', true)
    intersect('skills', true)
    expect(nav.activeTab.value).toBe('inventory')

    vueuse.scrollEnd?.()
    expect(vueuse.timeoutStop).toHaveBeenCalled()
    intersect('stats', false)
    intersect('skills', false)
    intersect('inventory', true)
    expect(nav.activeTab.value).toBe('inventory')

    intersect('inventory', false)
    intersect('skills', true)
    expect(nav.activeTab.value).toBe('skills')
  })

  it('unfreezes the scrollspy when the fallback timer fires', async () => {
    setMedia(true)
    mountPanels()
    const { nav } = setup()

    await nav.selectTab('inventory')
    vueuse.timeoutCallback?.()
    intersect('stats', true)

    expect(nav.activeTab.value).toBe('stats')
  })
})
