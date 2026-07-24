<template>
  <div id="app" class="min-h-screen flex flex-col">
    <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 btn btn-sm">
      Aller au contenu principal
    </a>
    <header>
      <NavBar />
    </header>
    <SessionCreateModal />
    <main id="main-content" class="flex-1" tabindex="-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Footer from './ui/components/Footer.vue'
import NavBar from './ui/components/NavBar.vue'
import SessionCreateModal from './ui/components/SessionCreateModal.vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

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