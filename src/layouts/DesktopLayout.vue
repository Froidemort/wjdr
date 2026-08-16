<script setup lang="ts">
import { Bell, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AccountPopover from '../components/ui/AccountPopover.vue'
import MissivesPopover from '../components/ui/MissivesPopover.vue'
import ThemeToggle from '../components/ui/ThemeToggle.vue'

const route = useRoute()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

const sideLinks = computed(() => [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
  { to: '/notifications', label: 'Missives', icon: Bell },
  { to: '/profile', label: 'Profil', icon: UserCircle },
])

function isRouteActive(path: string): boolean {
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <div class="min-h-screen bg-base-100 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
    <aside class="hidden border-r border-base-300 bg-base-200 lg:flex lg:flex-col">
      <div class="border-b border-base-300 px-4 py-4">
        <router-link to="/" class="text-xl font-bold tracking-wide">GRIMORIUM</router-link>
      </div>
      <ul class="menu flex-1 p-3 text-base-content">
        <li v-for="link in sideLinks" :key="link.to">
          <router-link :to="link.to" :class="isRouteActive(link.to) ? 'menu-active' : ''">
            <component :is="link.icon" class="size-4" />
            {{ link.label }}
          </router-link>
        </li>
      </ul>
    </aside>

    <div class="min-w-0">
      <header class="navbar min-h-16 border-b border-base-300 bg-base-200 px-4 sm:px-6">
        <div class="flex w-full items-center justify-between gap-3">
          <h1 class="truncate text-sm font-semibold uppercase tracking-[0.14em] opacity-70">
            Warhammer 2e
          </h1>
          <div class="flex items-center gap-2">
            <template v-if="isAuthenticated">
              <MissivesPopover />
              <ThemeToggle />
              <AccountPopover />
            </template>
            <ThemeToggle v-else />
          </div>
        </div>
      </header>

      <main id="main-content" tabindex="-1">
        <slot />
      </main>
    </div>
  </div>
</template>
