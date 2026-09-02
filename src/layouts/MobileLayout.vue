<script setup lang="ts">
import { Bell, BookOpenText, House, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useMissivesInbox } from '../composables/useMissivesInbox'
import { usePageScrolled } from '../composables/usePageScrolled'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from '../components/ui/ThemeToggle.vue'

const authStore = useAuthStore()
const route = useRoute()
const { unreadCount } = useMissivesInbox()
const { isScrolled } = usePageScrolled()

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Missives live in the header, so the dock keeps the five destinations reachable with a thumb.
const navItems = [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
  { to: '/', label: 'Accueil', icon: House },
  { label: 'Compendium', icon: BookOpenText },
  { to: '/profile', label: 'Profil', icon: UserCircle },
] satisfies { to?: string; label: string; icon: Component }[]

function isRouteActive(path: string): boolean {
  const section = path.slice(1)
  return route.meta.navSection === section
}
</script>

<template>
  <div class="min-h-screen bg-base-100 [--grim-nav-height:3.5rem]">
    <header
      class="sticky top-0 z-40 navbar min-h-14 border-b border-transparent px-3 transition-[background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none"
      :class="
        isScrolled
          ? 'border-base-content/8 bg-base-100/60 shadow-[0_6px_28px_-16px_color-mix(in_oklab,black_60%,transparent)] backdrop-blur-xl backdrop-saturate-150'
          : 'bg-transparent'
      "
    >
      <div class="flex w-full items-center justify-between">
        <router-link to="/" class="px-2 font-grim-title text-lg tracking-[0.08em]">
          GRIMORIUM
        </router-link>

        <div class="flex items-center gap-1">
          <router-link
            v-if="isAuthenticated"
            to="/notifications"
            class="btn btn-ghost btn-square relative min-h-11 min-w-11"
            :class="isRouteActive('/notifications') ? 'text-primary' : ''"
            aria-label="Missives"
          >
            <Bell class="size-5" />
            <span
              v-if="unreadCount > 0"
              class="badge badge-xs badge-warning absolute right-1.5 top-1.5"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </router-link>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <main id="main-content" class="pb-20" tabindex="-1">
      <slot />
    </main>

    <div v-if="isAuthenticated" class="dock dock-sm z-40 border-t border-base-300 bg-base-200">
      <component
        :is="item.to ? RouterLink : 'button'"
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        :type="item.to ? undefined : 'button'"
        :disabled="item.to ? undefined : true"
        :title="item.to ? undefined : 'Bientôt disponible'"
        :class="[
          isRouteActive(item.to) ? 'dock-active' : '',
          item.to ? '' : 'text-base-content/35',
        ]"
      >
        <component :is="item.icon" class="size-5" />
        <span class="dock-label">{{ item.label }}</span>
      </component>
    </div>
  </div>
</template>
