<script setup lang="ts">
import { Bell, PanelLeftClose, PanelLeftOpen, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AccountPopover from '../components/ui/AccountPopover.vue'
import MissivesPopover from '../components/ui/MissivesPopover.vue'
import ThemeToggle from '../components/ui/ThemeToggle.vue'

const route = useRoute()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const drawerOpen = ref(true)

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
  <div v-if="isAuthenticated" class="min-h-screen bg-base-100">
    <div class="drawer">
      <input id="desktop-nav-drawer" v-model="drawerOpen" type="checkbox" class="drawer-toggle" />

      <div class="drawer-content min-w-0">
        <header class="navbar min-h-16 border-b border-base-300 bg-base-200 px-4 sm:px-6">
          <div class="relative flex w-full items-center justify-between gap-3">
            <div class="flex items-center">
              <label
                for="desktop-nav-drawer"
                class="btn btn-ghost btn-square drawer-button min-h-11 min-w-11"
                :aria-label="drawerOpen ? 'Réduire le menu latéral' : 'Ouvrir le menu latéral'"
              >
                <PanelLeftClose v-if="drawerOpen" class="size-5" />
                <PanelLeftOpen v-else class="size-5" />
              </label>
            </div>

            <h1
              class="pointer-events-none absolute left-1/2 top-1/2 w-full max-w-[70%] -translate-x-1/2 -translate-y-1/2 truncate px-2 text-center text-sm font-semibold uppercase tracking-[0.14em] text-base-content"
            >
              GRIMORIUM
            </h1>

            <div class="flex items-center gap-2">
              <MissivesPopover />
              <ThemeToggle />
              <AccountPopover />
            </div>
          </div>
        </header>

        <main id="main-content" tabindex="-1">
          <slot />
        </main>
      </div>

      <div class="drawer-side z-20">
        <label for="desktop-nav-drawer" aria-label="Fermer le menu latéral" class="drawer-overlay"></label>
        <aside
          class="min-h-full border-r border-base-300 bg-base-200 transition-[width] duration-200 ease-out"
          :class="drawerOpen ? 'w-72' : 'w-20'"
        >
          <div class="border-b border-base-300 px-4 py-4">
            <router-link to="/" class="inline-flex items-center gap-2 text-xl font-bold tracking-wide">
              <span v-if="drawerOpen">GRIMORIUM</span>
            </router-link>
          </div>

          <ul class="menu flex-1 p-3 text-base-content">
            <li v-for="link in sideLinks" :key="link.to">
              <router-link :to="link.to" :class="isRouteActive(link.to) ? 'menu-active' : ''" class="min-h-11">
                <component :is="link.icon" class="size-5" />
                <span v-if="drawerOpen">{{ link.label }}</span>
                <span v-else class="sr-only">{{ link.label }}</span>
              </router-link>
            </li>
          </ul>

          <div class="border-t border-base-300 p-3">
            <label
              for="desktop-nav-drawer"
              class="btn btn-ghost btn-sm drawer-button w-full justify-start gap-2"
            >
              <PanelLeftClose v-if="drawerOpen" class="size-4" />
              <PanelLeftOpen v-else class="size-4" />
              <span v-if="drawerOpen">Réduire</span>
              <span v-else class="sr-only">Ouvrir</span>
            </label>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen bg-base-100">
    <header class="navbar min-h-16 border-b border-base-300 bg-base-200 px-4 sm:px-6">
      <div class="relative flex w-full items-center justify-end gap-3">
        <h1
          class="pointer-events-none absolute left-1/2 top-1/2 w-full max-w-[70%] -translate-x-1/2 -translate-y-1/2 truncate px-2 text-center text-sm font-semibold uppercase tracking-[0.14em] text-base-content"
        >
          GRIMORIUM
        </h1>
        <ThemeToggle />
      </div>
    </header>

    <main id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
