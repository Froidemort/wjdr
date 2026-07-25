<template>
  <main class="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
    <div v-if="loading" class="skeleton h-56 w-full" />

    <div v-else-if="errorMessage" role="alert" class="alert alert-error alert-soft">
      <span>{{ errorMessage }}</span>
    </div>

    <template v-else-if="campaign && sessionItem">
      <AppCard :title="sessionDisplayTitle" class="overflow-hidden">
        <div class="space-y-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="badge badge-outline">{{ formatCampaignSessionDate(sessionItem.date) }}</span>
                <span class="badge" :class="getSessionStatusClass(sessionItem.date)">
                  {{ getSessionStatusLabel(sessionItem.date) }}
                </span>
                <span class="badge badge-ghost">{{ campaign.name }}</span>
              </div>
              <p class="max-w-2xl text-sm leading-relaxed opacity-75">
                Consulte les notes et le suivi de cette session datée sans quitter la campagne.
              </p>
            </div>

            <router-link
              v-if="isMj"
              class="btn btn-sm"
              :to="`/campaigns/${campaign.id}`"
            >
              Modifier la timeline
            </router-link>
          </div>

          <div class="rounded-box border border-base-300 bg-base-200/70 p-4 sm:p-5">
            <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">Détail</p>
                <p v-if="sessionItem.description" class="whitespace-pre-line text-sm leading-relaxed">
                  {{ sessionItem.description }}
                </p>
                <p v-else class="text-sm italic opacity-60">Pas de description.</p>
              </div>

              <div class="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
                <div class="stat px-4 py-3">
                  <div class="stat-title">Créée</div>
                  <div class="stat-value text-lg">{{ formatTimestamp(sessionItem.createdAt) }}</div>
                </div>
                <div class="stat px-4 py-3">
                  <div class="stat-title">Mise à jour</div>
                  <div class="stat-value text-lg">{{ formatTimestamp(sessionItem.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <SessionNotesPanel
        :campaign-id="campaign.id"
        :is-mj="isMj"
        :current-user-id="authStore.user?.id ?? null"
        :is-session-archived="campaign.isArchived"
        :sessions="[sessionItem]"
        :selected-session-id="sessionItem.id"
        :selected-session-label="sessionChipLabel"
      />

      <PageFooter :back-to="`/campaigns/${campaign.id}`" back-label="Retour à la campagne" />
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getCampaignById } from '../../repositories/campaignsRepository'
import { getSessionById } from '../../repositories/sessionsRepository'
import { useAuthStore } from '../../stores/auth'
import type { CampaignSummary, SessionSummary } from '../../types/domain'
import AppCard from '../components/AppCard.vue'
import PageFooter from '../components/PageFooter.vue'
import SessionNotesPanel from '../components/SessionNotesPanel.vue'
import { useRealtimeChannels } from '../composables/useRealtimeChannels'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const campaign = ref<CampaignSummary | null>(null)
const sessionItem = ref<SessionSummary | null>(null)

const campaignId = computed(() => String(route.params.campaignId ?? ''))
const sessionEntryId = computed(() => String(route.params.sessionEntryId ?? ''))
const isMj = computed(() => Boolean(campaign.value && authStore.user?.id === campaign.value.mjId))
const sessionDisplayTitle = computed(() => {
  if (!sessionItem.value) {
    return 'Session'
  }

  const trimmedTitle = sessionItem.value.name?.trim()
  if (trimmedTitle) {
    return trimmedTitle
  }

  return `Session du ${formatCampaignSessionDate(sessionItem.value.date)}`
})
const sessionChipLabel = computed(() => (sessionItem.value ? sessionDisplayTitle.value : null))

function parseSessionDate(value: string): Date | null {
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatCampaignSessionDate(value: string): string {
  const parsed = parseSessionDate(value)
  if (!parsed) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(parsed)
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
  }).format(parsed)
}

function getSessionDateStatus(value: string): 'today' | 'upcoming' | 'past' {
  const parsed = parseSessionDate(value)
  const today = parseSessionDate(new Date().toISOString().slice(0, 10))

  if (!parsed || !today) {
    return 'upcoming'
  }

  const parsedKey = parsed.toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  if (parsedKey === todayKey) {
    return 'today'
  }

  return parsed > today ? 'upcoming' : 'past'
}

function getSessionStatusLabel(value: string): string {
  const status = getSessionDateStatus(value)
  if (status === 'today') return 'Aujourd hui'
  if (status === 'upcoming') return 'A venir'
  return 'Passée'
}

function getSessionStatusClass(value: string): string {
  const status = getSessionDateStatus(value)
  if (status === 'past') return 'badge-secondary border border-secondary-content/30 text-secondary-content shadow-sm'
  return 'badge-info border border-info-content/30 text-info-content'
}

async function loadData(): Promise<void> {
  if (!campaignId.value || !sessionEntryId.value) {
    errorMessage.value = 'Session de campagne invalide.'
    return
  }

  loading.value = true
  errorMessage.value = null

  try {
    const [campaignData, sessionData] = await Promise.all([
      getCampaignById(campaignId.value),
      getSessionById(sessionEntryId.value),
    ])

    if (!campaignData) {
      throw new Error('Campagne introuvable.')
    }

    if (!sessionData || sessionData.campaignId !== campaignData.id) {
      throw new Error('Session introuvable pour cette campagne.')
    }

    campaign.value = campaignData
    sessionItem.value = sessionData
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Chargement impossible.'
    campaign.value = null
    sessionItem.value = null
  } finally {
    loading.value = false
  }
}

const { subscribe, unsubscribe } = useRealtimeChannels(
  () => {
    void loadData()
  },
  { debounceMs: 400 }
)

watch(
  () => [campaignId.value, sessionEntryId.value, authStore.user?.id] as const,
  ([nextCampaignId, nextSessionId, userId]) => {
    if (!nextCampaignId || !nextSessionId) {
      campaign.value = null
      sessionItem.value = null
      errorMessage.value = null
      unsubscribe()
      return
    }

    void loadData()

    if (userId) {
      subscribe(`campaign-session-${nextCampaignId}-${nextSessionId}-${userId}`, [
        { table: 'campaigns', filter: `id=eq.${nextCampaignId}` },
        { table: 'sessions', filter: `id=eq.${nextSessionId}` },
      ])
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  unsubscribe()
})
</script>
