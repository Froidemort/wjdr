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

    <div v-if="showSyncIndicator" class="toast toast-bottom toast-start z-50 p-2 sm:p-4">
      <div class="alert" :class="isOnline ? 'alert-info' : 'alert-warning'" role="status" aria-live="polite">
        <span v-if="isSyncing">Synchronisation en cours...</span>
        <span v-else-if="!isOnline">
          Hors ligne: {{ pendingCount }} modification{{ pendingCount > 1 ? 's' : '' }} en attente.
        </span>
        <span v-else>
          {{ pendingCount }} modification{{ pendingCount > 1 ? 's' : '' }} en attente de synchronisation.
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { APP_SPLASH } from './config/appSplash'
import AppSplash from './components/ui/AppSplash.vue'
import CampaignCreateModal from './components/ui/CampaignCreateModal.vue'
import { useOfflineQueueSync } from './composables/useOfflineQueueSync'
import AppLayout from './layouts/AppLayout.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const showSplash = ref(true)
const authReady = ref(false)

const { isOnline, pendingCount, isSyncing } = useOfflineQueueSync()
const showSyncIndicator = computed(() => pendingCount.value > 0)

onMounted(() => {
  document.documentElement.classList.add(APP_SPLASH.classNames.activeHtmlClass)

  void authStore.initAuth().finally(() => {
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
