import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import type { NavContext } from '../config/navLinks'
import { useAuthStore } from '../stores/auth'
import { useLastActiveStore, type LastActiveEntry } from '../stores/lastActive'
import { useUserContextStore } from '../stores/userContext'
import type { CampaignSummary, CharacterSummary, SessionSummary } from '../types/domain'
import { sortCampaignSessionsByDate } from '../utils/campaignSessions'

export type CurrentRole = 'mj' | 'player'

export interface CurrentContextInput {
  userId: string | null
  campaigns: readonly CampaignSummary[]
  characters: readonly CharacterSummary[]
  sessions: readonly SessionSummary[]
  lastActive: LastActiveEntry
}

export interface CurrentContext {
  campaign: CampaignSummary | null
  role: CurrentRole | null
  character: CharacterSummary | null
  session: SessionSummary | null
}

export function resolveCurrentContext(input: CurrentContextInput): CurrentContext {
  const { userId, campaigns, characters, sessions, lastActive } = input
  const campaign =
    campaigns.find((item) => item.id === lastActive.campaignId) ??
    (campaigns.length === 1 ? campaigns[0] : null)

  if (!userId || !campaign) {
    return { campaign: null, role: null, character: null, session: null }
  }

  const ownCharacters = characters.filter(
    (item) => item.userId === userId && item.campaignId === campaign.id
  )
  const character =
    ownCharacters.find((item) => item.id === lastActive.characterId) ??
    (ownCharacters.length === 1 ? ownCharacters[0] : null)

  // An MJ cannot be a player; owning a character in the campaign makes the player role win.
  const role: CurrentRole =
    ownCharacters.length === 0 && campaign.mjId === userId ? 'mj' : 'player'

  const campaignSessions = sessions.filter((item) => item.campaignId === campaign.id)
  const session =
    campaignSessions.find((item) => item.id === lastActive.sessionId) ??
    sortCampaignSessionsByDate(campaignSessions)[0] ??
    null

  return { campaign, role, character, session }
}

export function useCurrentContext() {
  const authStore = useAuthStore()
  const lastActive = useLastActiveStore()
  const userContext = useUserContextStore()
  const { campaigns, characters, sessions, sessionsCampaignId, loaded, loading } =
    storeToRefs(userContext)

  const resolved = computed(() =>
    resolveCurrentContext({
      userId: authStore.user?.id ?? null,
      campaigns: campaigns.value,
      characters: characters.value,
      sessions: sessionsCampaignId.value ? sessions.value : [],
      lastActive: {
        campaignId: lastActive.campaignId,
        sessionId: lastActive.sessionId,
        characterId: lastActive.characterId,
      },
    })
  )

  const campaign = computed(() => resolved.value.campaign)
  const role = computed(() => resolved.value.role)
  const character = computed(() => resolved.value.character)
  const session = computed(() => resolved.value.session)
  const campaignTo = computed(() => (campaign.value ? `/campaigns/${campaign.value.id}` : null))
  const characterTo = computed(() => (character.value ? `/characters/${character.value.id}` : null))
  const sessionTo = computed(() =>
    campaign.value && session.value
      ? `/campaigns/${campaign.value.id}/timeline/${session.value.id}`
      : null
  )
  const navContext = computed<NavContext>(() => ({
    role: role.value,
    campaignTo: campaignTo.value,
    characterTo: characterTo.value,
  }))

  watch(
    () => authStore.user?.id,
    (userId) => {
      if (userId) {
        void userContext.load()
      } else {
        userContext.reset()
      }
    },
    { immediate: true }
  )

  watch(
    () => campaign.value?.id,
    (campaignId) => {
      if (campaignId && sessionsCampaignId.value !== campaignId) {
        void userContext.loadSessions(campaignId)
      }
    },
    { immediate: true }
  )

  // A remembered campaign missing from the snapshot (e.g. just joined) triggers one forced reload.
  watch(
    () => [loaded.value, lastActive.campaignId, campaigns.value] as const,
    ([isLoaded, campaignId, list]) => {
      if (isLoaded && campaignId && !list.some((item) => item.id === campaignId)) {
        void userContext.load({ force: true })
      }
    }
  )

  return {
    campaign,
    role,
    character,
    session,
    campaignTo,
    characterTo,
    sessionTo,
    navContext,
    loading,
    refresh: () => userContext.load(),
  }
}
