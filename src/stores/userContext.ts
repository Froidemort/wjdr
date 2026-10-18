import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listCampaignsForUser } from '../services/campaignsRepository'
import { listCharactersForUser } from '../services/charactersRepository'
import { listSessionsForCampaign } from '../services/sessionsRepository'
import type { CampaignSummary, CharacterSummary, SessionSummary } from '../types/domain'
import { useAuthStore } from './auth'
import { useLastActiveStore } from './lastActive'

const REFRESH_INTERVAL_MS = 30_000

// Shared, best-effort snapshot of the user's campaigns and characters for navigation shortcuts.
export const useUserContextStore = defineStore('userContext', () => {
  const authStore = useAuthStore()
  const lastActive = useLastActiveStore()
  const campaigns = ref<CampaignSummary[]>([])
  const characters = ref<CharacterSummary[]>([])
  const sessions = ref<SessionSummary[]>([])
  const sessionsCampaignId = ref<string | null>(null)
  const loaded = ref(false)
  const loading = ref(false)
  let loadedAt = 0
  let inflight: Promise<void> | null = null

  function reset(): void {
    campaigns.value = []
    characters.value = []
    sessions.value = []
    sessionsCampaignId.value = null
    loaded.value = false
    loadedAt = 0
  }

  async function load(options: { force?: boolean } = {}): Promise<void> {
    const userId = authStore.user?.id
    if (!userId) {
      reset()
      return
    }

    if (inflight) {
      return inflight
    }

    if (!options.force && loaded.value && Date.now() - loadedAt < REFRESH_INTERVAL_MS) {
      return
    }

    inflight = (async () => {
      loading.value = true
      try {
        const [nextCampaigns, nextCharacters] = await Promise.all([
          listCampaignsForUser(userId),
          listCharactersForUser(userId),
        ])
        if (authStore.user?.id !== userId) {
          return
        }

        campaigns.value = nextCampaigns
        characters.value = nextCharacters
        loaded.value = true
        loadedAt = Date.now()
        lastActive.prune({
          campaignIds: nextCampaigns.map((campaign) => campaign.id),
          characterIds: nextCharacters.map((character) => character.id),
        })
      } catch {
        // Navigation shortcuts are optional; keep the previous snapshot on failure.
      } finally {
        loading.value = false
        inflight = null
      }
    })()

    return inflight
  }

  async function loadSessions(campaignId: string): Promise<void> {
    try {
      const nextSessions = await listSessionsForCampaign(campaignId)
      sessions.value = nextSessions
      sessionsCampaignId.value = campaignId
      if (lastActive.campaignId === campaignId) {
        lastActive.prune({ sessionIds: nextSessions.map((item) => item.id) })
      }
    } catch {
      // Same as load(): the current session shortcut is optional.
    }
  }

  return { campaigns, characters, sessions, sessionsCampaignId, loaded, loading, load, loadSessions, reset }
})
