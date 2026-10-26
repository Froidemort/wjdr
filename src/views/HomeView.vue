<script setup lang="ts">
import { CalendarDays, Scroll, UserRound } from '@lucide/vue'
import { computed } from 'vue'
import { useCurrentContext } from '../composables/useCurrentContext'
import { useAuthStore } from '../stores/auth'
import { homeFeatures } from '../config/homeFeatures'
import { homePillars } from '../config/homePillars'
import AuthForm from '../components/ui/AuthForm.vue'
import HomeFeatureCard from '../components/ui/HomeFeatureCard.vue'
import HomeHero from '../components/ui/HomeHero.vue'
import HomePillarCard from '../components/ui/HomePillarCard.vue'
import HomeResumeCard from '../components/ui/HomeResumeCard.vue'
import { parseCampaignSessionDate } from '../utils/campaignSessions'

const authStore = useAuthStore()
const { campaign, session, character, campaignTo, sessionTo, characterTo } = useCurrentContext()

const campaignCreationDate = computed(() =>
  campaign.value?.createdAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(campaign.value?.createdAt)) : 'Date de création inconnue'
)

const sessionDate = computed(() =>
  session.value?.date ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(session.value?.date)) : 'Date de session inconnue'
)

const sessionTitle = computed(() => {
  if (!session.value) {
    return ''
  }

  const name = session.value.name?.trim()
  if (name) {
    return name
  }

  const parsed = parseCampaignSessionDate(session.value.date)
  return `Session du ${parsed ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(parsed) : session.value.date}`
})
const characterDescription = computed(() =>
  character.value ? [character.value.race, character.value.careerName].filter(Boolean).join(' · ') : ''
)
const hasResume = computed(() => Boolean(campaignTo.value))
</script>

<template>
  <div class="w-full">
    <!-- Section non-authentifiée : présentation + formulaire de connexion -->
    <section
      v-if="!authStore.isAuthenticated"
      class="grid lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-2"
      aria-label="Accueil et authentification"
    >
      <div
        class="order-2 bg-linear-to-b from-base-100 to-base-200/30 px-6 py-10 sm:px-10 lg:order-1 lg:px-12 lg:py-14 xl:px-16"
      >
        <div class="mx-auto max-w-md lg:mx-0 lg:max-w-lg">
          <header class="space-y-3">
            <h1 id="home-brand" class="grim-modal-title text-4xl sm:text-5xl">Grimorium</h1>
            <div class="h-px w-16 bg-primary/40" aria-hidden="true" />
            <p class="text-sm leading-relaxed text-base-content/80 sm:text-base">
              GRIMORIUM est une interface pour gérer les campagnes, sessions de jeu, personnages
              et notes pour le jeu de rôles Warhammer « The Old World » en version 2.
            </p>
          </header>

          <ul
            class="mt-8 divide-y divide-base-300/60 border-y border-base-300/60"
            aria-label="Ce que propose Grimorium"
          >
            <HomePillarCard
              v-for="pillar in homePillars"
              :key="pillar.title"
              :numeral="pillar.numeral"
              :title="pillar.title"
              :description="pillar.description"
              :icon="pillar.icon"
              :to-be-done="pillar.toBeDone"
            />
          </ul>
        </div>
      </div>

      <div
        class="order-1 flex flex-col justify-center border-b border-base-300/50 bg-base-200/40 px-6 py-10 sm:px-10 lg:order-2 lg:min-h-[calc(100dvh-8rem)] lg:border-b-0 lg:border-l lg:px-12 lg:py-14 xl:px-16"
      >
        <AuthForm class="mx-auto w-full max-w-md" />
      </div>
    </section>

    <!-- Section authentifiée : hero + cards de navigation -->
    <template v-else>
      <HomeHero />

      <section
        v-if="hasResume && campaign && campaignTo"
        class="relative z-10 mx-auto max-w-6xl space-y-3 px-4 pb-6 sm:px-6 md:-mt-16 lg:px-8"
        aria-labelledby="home-resume-title"
      >
        <h2 id="home-resume-title" class="font-grim-title text-sm uppercase tracking-[0.16em] text-base-content/70">
          Reprendre
        </h2>
        <ul class="grid gap-3 md:grid-cols-3" aria-label="Reprendre">
          <HomeResumeCard label="Campagne"
          :title="campaign.name"
          :description="campaignCreationDate"
          :to="campaignTo"
          :icon="Scroll" />
          <HomeResumeCard
            v-if="session && sessionTo"
            label="Session"
            :title="sessionTitle"
            :description="sessionDate"
            :to="sessionTo"
            :icon="CalendarDays"
          />
          <HomeResumeCard
            v-if="character && characterTo"
            label="Personnage"
            :title="character.name"
            :description="characterDescription"
            :to="characterTo"
            :icon="UserRound"
          />
        </ul>
      </section>

      <ul
        class="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pb-6 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr] md:gap-5 md:pb-16 lg:px-8 lg:gap-6"
        :class="hasResume ? '' : 'md:-mt-16'"
        aria-label="Sections de Grimorium"
      >
        <HomeFeatureCard
          v-for="feature in homeFeatures"
          :key="feature.title"
          :feature="feature"
        />
      </ul>
    </template>
  </div>
</template>
