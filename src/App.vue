<template>
  <div id="app">
    <AppSplash v-if="showSplash" :ready="authReady" @dismissed="onSplashDismissed" />
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn btn-sm">
      Aller au contenu principal
    </a>
    <CampaignCreateModal />
    <AppLayout>
      <router-view />
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useReferenceDataStore } from './stores/referenceData'
import { APP_SPLASH } from './config/appSplash'
import AppSplash from './components/ui/AppSplash.vue'
import CampaignCreateModal from './components/ui/CampaignCreateModal.vue'
import AppLayout from './layouts/AppLayout.vue'

const authStore = useAuthStore()
const referenceDataStore = useReferenceDataStore()
const router = useRouter()
const route = useRoute()
const showSplash = ref(true)
const authReady = ref(false)

onMounted(() => {
  document.documentElement.classList.add(APP_SPLASH.classNames.activeHtmlClass)

  void Promise.all([authStore.initAuth(), referenceDataStore.init()]).finally(() => {
    authReady.value = true
  })
})

function onSplashDismissed(): void {
  showSplash.value = false
  document.documentElement.classList.remove(APP_SPLASH.classNames.activeHtmlClass)
}

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    const onProtectedRoute = route.matched.some((record) => Boolean(record.meta.requiresAuth))
    if (!isAuthenticated && onProtectedRoute) {
      void router.replace('/')
    }
  }
)
</script>
