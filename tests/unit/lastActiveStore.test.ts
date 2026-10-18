import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/stores/auth', async () => {
  const { reactive: makeReactive } = await import('vue')
  const state = makeReactive({ user: null })
  return { useAuthStore: () => state }
})

import { useAuthStore } from '../../src/stores/auth'
import { useLastActiveStore } from '../../src/stores/lastActive'

const authState = useAuthStore() as unknown as { user: { id: string } | null }

describe('last active store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    authState.user = { id: 'user-1' }
  })

  it('stores campaign, session and character per user', () => {
    const store = useLastActiveStore()
    store.setCharacter('c1', 'char1')
    store.setSession('c1', 's1')

    expect(store).toMatchObject({ campaignId: 'c1', sessionId: 's1', characterId: 'char1' })

    authState.user = { id: 'user-2' }
    expect(store.campaignId).toBeNull()
  })

  it('resets session and character when the campaign changes', () => {
    const store = useLastActiveStore()
    store.setSession('c1', 's1')
    store.setCharacter('c1', 'char1')
    store.setCampaign('c2')

    expect(store).toMatchObject({ campaignId: 'c2', sessionId: null, characterId: null })
  })

  it('ignores writes without a signed-in user', () => {
    authState.user = null
    const store = useLastActiveStore()
    store.setCampaign('c1')

    expect(store.campaignId).toBeNull()
  })

  it('clears the entry of the current user', () => {
    const store = useLastActiveStore()
    store.setCampaign('c1')
    store.clear()

    expect(store.campaignId).toBeNull()
  })

  it('prunes ids missing from loaded data', () => {
    const store = useLastActiveStore()
    store.setSession('c1', 's1')
    store.setCharacter('c1', 'char1')

    store.prune({ sessionIds: ['s2'], characterIds: ['char1'] })
    expect(store).toMatchObject({ campaignId: 'c1', sessionId: null, characterId: 'char1' })

    store.prune({ campaignIds: ['c9'] })
    expect(store).toMatchObject({ campaignId: null, characterId: null })
  })

  it('drops the persisted entry on sign-out', async () => {
    const store = useLastActiveStore()
    store.setCampaign('c1')
    authState.user = null
    await nextTick()
    authState.user = { id: 'user-1' }

    expect(store.campaignId).toBeNull()
  })
})
