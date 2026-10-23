import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RealtimeUpdatePayload } from '../../src/composables/useRealtimeChannels'

const deps = vi.hoisted(() => ({
  invalidateCharacterLinksCache: vi.fn(),
  onBeforeUnmount: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))

let capturedOnUpdate: ((payload?: RealtimeUpdatePayload) => void) | null = null

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>()
  return { ...actual, onBeforeUnmount: deps.onBeforeUnmount }
})
vi.mock('../../src/services/characterLinksRepository', () => ({
  invalidateCharacterLinksCache: deps.invalidateCharacterLinksCache,
}))
vi.mock('../../src/composables/useRealtimeChannels', () => ({
  useRealtimeChannels: (onUpdate: (payload?: RealtimeUpdatePayload) => void) => {
    capturedOnUpdate = onUpdate
    return { subscribe: deps.subscribe, unsubscribe: deps.unsubscribe }
  },
}))

import { useCharacterRealtime } from '../../src/composables/useCharacterRealtime'

function setup() {
  const loadCharacter = vi.fn().mockResolvedValue(undefined)
  const loadCharacterLinks = vi.fn().mockResolvedValue(undefined)
  let saving = false
  let characterId = 'char-1'

  const realtime = useCharacterRealtime({
    getCharacterId: () => characterId,
    isSavingInProgress: () => saving,
    loadCharacter,
    loadCharacterLinks,
  })

  return {
    realtime,
    loadCharacter,
    loadCharacterLinks,
    setSaving: (value: boolean) => { saving = value },
    setCharacterId: (value: string) => { characterId = value },
  }
}

describe('useCharacterRealtime', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    capturedOnUpdate = null
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when there is no current character id', () => {
    const { loadCharacterLinks, setCharacterId } = setup()
    setCharacterId('')

    capturedOnUpdate?.({ table: 'character_skills', event: 'UPDATE' })

    expect(loadCharacterLinks).not.toHaveBeenCalled()
    expect(deps.invalidateCharacterLinksCache).not.toHaveBeenCalled()
  })

  it('reloads the links immediately for a link table when not saving', () => {
    const { loadCharacterLinks } = setup()

    capturedOnUpdate?.({ table: 'character_weapons', event: 'UPDATE' })

    expect(deps.invalidateCharacterLinksCache).toHaveBeenCalledWith('char-1')
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
  })

  it('defers the links reload for a link table while saving', async () => {
    const { loadCharacterLinks, setSaving } = setup()
    setSaving(true)

    capturedOnUpdate?.({ table: 'character_armors', event: 'UPDATE' })
    expect(loadCharacterLinks).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(700)
    expect(loadCharacterLinks).toHaveBeenCalledWith('char-1', { force: true })
  })

  it('refreshes the character immediately for a non-link table when not saving', () => {
    const { loadCharacter } = setup()

    capturedOnUpdate?.({ table: 'characters', event: 'UPDATE' })

    expect(loadCharacter).toHaveBeenCalledWith({ background: true })
  })

  it('defers the character refresh for a non-link table while saving', async () => {
    const { loadCharacter, setSaving } = setup()
    setSaving(true)

    capturedOnUpdate?.({ table: 'characters', event: 'UPDATE' })
    expect(loadCharacter).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(700)
    expect(loadCharacter).toHaveBeenCalledWith({ background: true })
  })

  it('cancels a pending deferred links reload on unmount', async () => {
    const { loadCharacterLinks, setSaving } = setup()
    setSaving(true)
    capturedOnUpdate?.({ table: 'character_skills', event: 'UPDATE' })

    const unmounted = deps.onBeforeUnmount.mock.calls[0]?.[0] as () => void
    unmounted()
    await vi.advanceTimersByTimeAsync(700)

    expect(loadCharacterLinks).not.toHaveBeenCalled()
  })

  it('cancels a pending deferred character reload on unmount', async () => {
    const { loadCharacter, setSaving } = setup()
    setSaving(true)
    capturedOnUpdate?.({ table: 'characters', event: 'UPDATE' })

    const unmounted = deps.onBeforeUnmount.mock.calls[0]?.[0] as () => void
    unmounted()
    await vi.advanceTimersByTimeAsync(700)

    expect(loadCharacter).not.toHaveBeenCalled()
  })

  it('exposes the subscribe and unsubscribe functions from useRealtimeChannels', () => {
    const { realtime } = setup()

    realtime.subscribeRealtime('channel', [])
    realtime.unsubscribeRealtime()

    expect(deps.subscribe).toHaveBeenCalledWith('channel', [])
    expect(deps.unsubscribe).toHaveBeenCalledOnce()
  })
})
