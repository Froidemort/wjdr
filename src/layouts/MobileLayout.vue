<script setup lang="ts">
import { Bell, House, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMissivesInbox } from '../composables/useMissivesInbox'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from '../components/ui/ThemeToggle.vue'

const authStore = useAuthStore()
const route = useRoute()
const { unreadCount } = useMissivesInbox()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const navItems = computed(() => [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
  { to: '/', label: 'Accueil', icon: House },
  { to: '/notifications', label: 'Missives', icon: Bell },
  { to: '/profile', label: 'Profil', icon: UserCircle },
])

function isRouteActive(path: string): boolean {
  const section = path.slice(1)
  return route.meta.navSection === section
}
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <header class="navbar min-h-14 border-b border-base-300 bg-base-200 px-3">
      <div class="flex w-full items-center justify-between">
        <router-link to="/" class="btn btn-ghost px-2 text-lg font-bold normal-case tracking-wide">
          GRIMORIUM
        </router-link>
        <ThemeToggle />
      </div>
    </header>

    <main id="main-content" class="pb-20" tabindex="-1">
      <slot />
    </main>

    <div v-if="isAuthenticated" class="dock dock-sm z-40 border-t border-base-300 bg-base-200">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative"
        :class="isRouteActive(item.to) ? 'dock-active' : ''"
      >
        <component :is="item.icon" class="size-5" />
        <span class="dock-label">{{ item.label }}</span>
        <span
          v-if="item.to === '/notifications' && unreadCount > 0"
          class="badge badge-xs badge-warning absolute right-3 top-2"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </router-link>
    </div>
  </div>
</template>
