<template>
  <div id="app" class="min-h-screen flex flex-col">
    <NavBar />
    <AuthModal />
    <SessionCreateModal />
    <main class="flex-1">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import NavBar from './ui/components/NavBar.vue';
import Footer from './ui/components/Footer.vue';
import AuthModal from './ui/components/AuthModal.vue';
import SessionCreateModal from './ui/components/SessionCreateModal.vue';

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