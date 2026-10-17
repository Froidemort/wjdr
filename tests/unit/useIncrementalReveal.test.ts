import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

vi.mock('@vueuse/core', () => ({ useInfiniteScroll: vi.fn() }))

import { useInfiniteScroll } from '@vueuse/core'
import { useIncrementalReveal } from '../../src/composables/useIncrementalReveal'

const mockedUseInfiniteScroll = vi.mocked(useInfiniteScroll)

function makeItems(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index)
}

describe('useIncrementalReveal', () => {
  it('reveals only the first page of items and reports more are available', () => {
    const source = ref(makeItems(50))
    const reveal = useIncrementalReveal(source, ref(null), { pageSize: 10 })

    expect(reveal.visibleItems.value).toHaveLength(10)
    expect(reveal.hasMore.value).toBe(true)
  })

  it('defaults to a page size of 18', () => {
    const source = ref(makeItems(50))
    const reveal = useIncrementalReveal(source, ref(null))

    expect(reveal.visibleItems.value).toHaveLength(18)
  })

  it('reveals more items when the infinite-scroll callback fires, capped to the source length', () => {
    const source = ref(makeItems(25))
    const reveal = useIncrementalReveal(source, ref(null), { pageSize: 10 })
    const loadMore = mockedUseInfiniteScroll.mock.calls.at(-1)?.[1] as () => void

    loadMore()
    expect(reveal.visibleItems.value).toHaveLength(20)
    expect(reveal.hasMore.value).toBe(true)

    loadMore()
    expect(reveal.visibleItems.value).toHaveLength(25)
    expect(reveal.hasMore.value).toBe(false)

    // Calling loadMore past the end must not overshoot the source length.
    loadMore()
    expect(reveal.visibleItems.value).toHaveLength(25)
  })

  it('exposes canLoadMore reflecting hasMore to the infinite-scroll options', () => {
    const source = ref(makeItems(10))
    useIncrementalReveal(source, ref(null), { pageSize: 10 })
    const scrollOptions = mockedUseInfiniteScroll.mock.calls.at(-1)?.[2] as { canLoadMore: () => boolean }

    expect(scrollOptions.canLoadMore()).toBe(false)
  })

  it('restarts the reveal to the page size whenever the source changes', async () => {
    const source = ref(makeItems(50))
    const reveal = useIncrementalReveal(source, ref(null), { pageSize: 10 })
    const loadMore = mockedUseInfiniteScroll.mock.calls.at(-1)?.[1] as () => void
    loadMore()
    expect(reveal.visibleItems.value).toHaveLength(20)

    source.value = makeItems(5)
    await nextTick()

    expect(reveal.visibleItems.value).toHaveLength(5)
  })
})
