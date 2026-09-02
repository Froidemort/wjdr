import { useWindowScroll } from '@vueuse/core'
import { computed } from 'vue'

/**
 * Tracks whether the page left the top of the document.
 * Overlay headers use it to stay transparent over the hero and only turn opaque once content scrolls behind them.
 */
export function usePageScrolled(offset = 8) {
  const { y } = useWindowScroll()

  return {
    isScrolled: computed(() => y.value > offset),
  }
}
