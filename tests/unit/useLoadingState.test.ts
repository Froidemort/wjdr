import { describe, expect, it } from 'vitest'
import { useLoadingState } from '../../src/composables/useLoadingState'

describe('useLoadingState', () => {
  it('stores successful operation data', async () => {
    const state = useLoadingState<string[]>({ fallbackValue: [] })

    await state.execute(async () => ['result'])

    expect(state.data.value).toEqual(['result'])
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBeNull()
  })

  it('restores the fallback after a failed operation and resets state', async () => {
    const state = useLoadingState<string[]>({ fallbackValue: [], defaultLoading: true })

    await state.execute(async () => { throw new Error('Indisponible') })

    expect(state.data.value).toEqual([])
    expect(state.error.value).toBe('Indisponible')
    state.reset()
    expect(state.loading.value).toBe(false)
    expect(state.error.value).toBeNull()
  })
})