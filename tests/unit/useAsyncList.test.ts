import { describe, expect, it } from 'vitest'
import { useAsyncList } from '../../src/composables/useAsyncList'

describe('useAsyncList', () => {
  it('loads and clears its items', async () => {
    const list = useAsyncList({ errorMessage: 'Indisponible', loadItems: async () => ['one'] })

    await expect(list.load()).resolves.toEqual(['one'])
    expect(list.items.value).toEqual(['one'])
    list.clear(['two'])
    expect(list.items.value).toEqual(['two'])
    expect(list.error.value).toBeNull()
  })

  it('stores and rethrows loading errors', async () => {
    const list = useAsyncList<string>({
      errorMessage: 'Indisponible',
      fallbackItems: [],
      loadItems: async () => { throw new Error('Reseau indisponible') },
    })

    await expect(list.load()).rejects.toThrow('Reseau indisponible')
    expect(list.error.value).toBe('Reseau indisponible')
  })
})