import { useEventListener, useIntersectionObserver, useMediaQuery, useTimeoutFn } from '@vueuse/core'
import { nextTick, ref, shallowRef, watch, type Ref } from 'vue'
import type { CharacterTabId } from '../types/characterSheet'
import { useDeviceBreakpoint } from './useDeviceBreakpoint'

export const CHARACTER_TAB_ORDER: readonly CharacterTabId[] = ['overview', 'stats', 'skills', 'inventory']

const PANEL_ID_PREFIX = 'character-panel-'
// Fallback when `scrollend` never fires (no scroll needed, unsupported browser).
const SPY_LOCK_FALLBACK_MS = 1200

export function characterPanelId(tab: CharacterTabId): string {
  return `${PANEL_ID_PREFIX}${tab}`
}

export function tabIdFromPanelId(panelId: string): CharacterTabId | null {
  return CHARACTER_TAB_ORDER.find((tab) => characterPanelId(tab) === panelId) ?? null
}

// First visible section in page order wins when several cross the observed band.
export function pickActiveTab(visible: ReadonlySet<CharacterTabId>): CharacterTabId | null {
  return CHARACTER_TAB_ORDER.find((tab) => visible.has(tab)) ?? null
}

interface UseCharacterTabNavigationOptions {
  ready: Ref<boolean>
}

export function useCharacterTabNavigation({ ready }: UseCharacterTabNavigationOptions) {
  const { isMobile } = useDeviceBreakpoint()
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const activeTab = ref<CharacterTabId>(isMobile.value ? 'overview' : 'stats')
  const observedSections = shallowRef<HTMLElement[]>([])
  const visibleTabs = new Set<CharacterTabId>()
  let spyLocked = false

  const { start: startSpyLock, stop: stopSpyLock } = useTimeoutFn(
    () => {
      spyLocked = false
    },
    SPY_LOCK_FALLBACK_MS,
    { immediate: false }
  )

  useEventListener('scrollend', () => {
    spyLocked = false
    stopSpyLock()
  })

  watch(
    [ready, isMobile],
    async ([isReady, mobile]) => {
      visibleTabs.clear()
      await nextTick()
      observedSections.value =
        isReady && mobile
          ? CHARACTER_TAB_ORDER.flatMap((tab) => document.getElementById(characterPanelId(tab)) ?? [])
          : []
    },
    { immediate: true }
  )

  useIntersectionObserver(
    observedSections,
    (entries) => {
      for (const entry of entries) {
        const tab = tabIdFromPanelId(entry.target.id)
        if (!tab) continue
        if (entry.isIntersecting) visibleTabs.add(tab)
        else visibleTabs.delete(tab)
      }
      if (spyLocked) return
      const next = pickActiveTab(visibleTabs)
      if (next) activeTab.value = next
    },
    // Thin band near the top of the viewport: one section at a time.
    { rootMargin: '-35% 0px -55% 0px' }
  )

  async function selectTab(tab: CharacterTabId): Promise<void> {
    activeTab.value = tab
    if (isMobile.value) {
      spyLocked = true
      startSpyLock()
    }
    await nextTick()
    document.getElementById(characterPanelId(tab))?.scrollIntoView({
      behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  function isPanelVisible(tab: CharacterTabId): boolean {
    return isMobile.value || activeTab.value === tab
  }

  return { activeTab, isMobile, selectTab, isPanelVisible }
}
