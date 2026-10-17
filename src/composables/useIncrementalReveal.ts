import { useInfiniteScroll } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'

interface UseIncrementalRevealOptions {
  pageSize?: number
}

/** Reveals items progressively from a reactive source as the given element is scrolled. */
export function useIncrementalReveal<TItem>(
  source: Ref<TItem[]>,
  scrollTarget: Ref<HTMLElement | Window | null | undefined>,
  options: UseIncrementalRevealOptions = {}
) {
  const pageSize = options.pageSize ?? 18
  const visibleCount = ref(pageSize)

  const visibleItems = computed(() => source.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < source.value.length)

  function loadMore(): void {
    if (hasMore.value) {
      visibleCount.value = Math.min(visibleCount.value + pageSize, source.value.length)
    }
  }

  // Restart the reveal whenever the filtered source itself changes.
  watch(source, () => {
    visibleCount.value = pageSize
  })

  useInfiniteScroll(scrollTarget, loadMore, { distance: 200, canLoadMore: () => hasMore.value })

  return {
    visibleItems,
    hasMore,
  }
}
