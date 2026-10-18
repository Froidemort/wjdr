import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useAuthStore } from './auth'

export interface LastActiveEntry {
  campaignId: string | null
  sessionId: string | null
  characterId: string | null
}

export interface LastActiveValidIds {
  campaignIds?: readonly string[]
  sessionIds?: readonly string[]
  characterIds?: readonly string[]
}

const STORAGE_KEY = 'wjdr:last-active'
const EMPTY_ENTRY: LastActiveEntry = { campaignId: null, sessionId: null, characterId: null }

export const useLastActiveStore = defineStore('lastActive', () => {
  const authStore = useAuthStore()
  const entries = useStorage<Record<string, LastActiveEntry>>(STORAGE_KEY, {})

  const userId = computed(() => authStore.user?.id ?? null)
  const entry = computed(() => (userId.value && entries.value[userId.value]) || EMPTY_ENTRY)
  const campaignId = computed(() => entry.value.campaignId)
  const sessionId = computed(() => entry.value.sessionId)
  const characterId = computed(() => entry.value.characterId)

  function patch(next: Partial<LastActiveEntry>): void {
    if (!userId.value) {
      return
    }

    entries.value = { ...entries.value, [userId.value]: { ...entry.value, ...next } }
  }

  function removeEntry(targetUserId: string): void {
    const { [targetUserId]: _removed, ...rest } = entries.value
    entries.value = rest
  }

  // A campaign switch invalidates the session and character remembered for the previous one.
  function setCampaign(nextCampaignId: string | null): void {
    if (nextCampaignId === campaignId.value) {
      return
    }

    patch({ campaignId: nextCampaignId, sessionId: null, characterId: null })
  }

  function setSession(nextCampaignId: string, nextSessionId: string | null): void {
    setCampaign(nextCampaignId)
    if (nextSessionId !== sessionId.value) {
      patch({ sessionId: nextSessionId })
    }
  }

  function setCharacter(nextCampaignId: string, nextCharacterId: string | null): void {
    setCampaign(nextCampaignId)
    if (nextCharacterId !== characterId.value) {
      patch({ characterId: nextCharacterId })
    }
  }

  function clear(): void {
    if (userId.value) {
      removeEntry(userId.value)
    }
  }

  // Drops remembered ids absent from freshly loaded data; omitted lists are left untouched.
  function prune(valid: LastActiveValidIds): void {
    const { campaignIds, sessionIds, characterIds } = valid
    if (campaignId.value && campaignIds && !campaignIds.includes(campaignId.value)) {
      patch({ campaignId: null, sessionId: null, characterId: null })
      return
    }

    if (sessionId.value && sessionIds && !sessionIds.includes(sessionId.value)) {
      patch({ sessionId: null })
    }

    if (characterId.value && characterIds && !characterIds.includes(characterId.value)) {
      patch({ characterId: null })
    }
  }

  watch(userId, (next, previous) => {
    if (previous && !next) {
      removeEntry(previous)
    }
  })

  return { campaignId, sessionId, characterId, setCampaign, setSession, setCharacter, clear, prune }
})
