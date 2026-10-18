import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUserContextStore } from '../stores/userContext'
import type { MapRole } from '../types/map'
import { useCurrentContext } from './useCurrentContext'

/** Resolves the campaign whose markers are shown: `?campaign=` first, then the current context. */
export function useMapCampaign() {
  const route = useRoute()
  const authStore = useAuthStore()
  const { campaigns } = storeToRefs(useUserContextStore())
  const { campaign: contextCampaign } = useCurrentContext()

  const campaign = computed(() => {
    const requested = typeof route.query.campaign === 'string' ? route.query.campaign : null
    if (requested) {
      return campaigns.value.find((item) => item.id === requested) ?? null
    }
    return contextCampaign.value
  })

  const campaignId = computed(() => (authStore.isAuthenticated ? (campaign.value?.id ?? null) : null))
  const role = computed<MapRole | null>(() => {
    const userId = authStore.user?.id
    if (!campaign.value || !userId) return null
    return campaign.value.mjId === userId ? 'mj' : 'player'
  })

  return { campaign, campaignId, role, userId: computed(() => authStore.user?.id ?? null) }
}
