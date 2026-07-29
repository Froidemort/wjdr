<template>
  <div id="app" class="min-h-screen flex flex-col">
    <AppSplash v-if="showSplash" :ready="authReady" @dismissed="onSplashDismissed" />
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn btn-sm">
      Aller au contenu principal
    </a>
    <header>
      <NavBar />
    </header>
    <CampaignCreateModal />
    <main id="main-content" class="flex-1" tabindex="-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { APP_SPLASH } from './ui/config/appSplash'
import AppSplash from './ui/components/AppSplash.vue'
import Footer from './ui/components/Footer.vue'
import NavBar from './ui/components/NavBar.vue'
import CampaignCreateModal from './ui/components/CampaignCreateModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const showSplash = ref(true)
const authReady = ref(false)

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

<style scoped>
</style>