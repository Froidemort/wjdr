<script setup lang="ts">
import { Bell, BookOpenText, House, LogOut, MoreHorizontal, Scroll, UserCircle, Users } from '@lucide/vue'
import { computed, type Component, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useMissivesInbox } from '../composables/useMissivesInbox'
import { usePageScrolled } from '../composables/usePageScrolled'
import { useAuthStore } from '../stores/auth'
import ThemeToggle from '../components/ui/ThemeToggle.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { unreadCount } = useMissivesInbox()
const { isScrolled } = usePageScrolled()
const optionsOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Missives live in the header, so the dock keeps the five destinations reachable with a thumb.
const navItems = [
  { to: '/campaigns', label: 'Campagnes', icon: Scroll },
  { to: '/characters', label: 'Personnages', icon: Users },
  { to: '/', label: 'Accueil', icon: House },
  { label: 'Compendium', icon: BookOpenText },
] satisfies { to?: string; label: string; icon: Component }[]

function isRouteActive(path: string): boolean {
  const section = path.slice(1)
  return route.meta.navSection === section
}

function closeOptions(): void {
  optionsOpen.value = false
}

async function onLogout(): Promise<void> {
  closeOptions()
  await authStore.signOut()
  await router.replace('/')
}
</script>

<template>
  <!-- --grim-nav-height:0 — mobile header is sticky, not overlaid, so the hero does not pull up under it -->
  <div class="flex min-h-screen flex-col bg-base-100 [--grim-nav-height:0px] [--grim-dock-height:4rem]">
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

    <main id="main-content" class="flex-1" tabindex="-1">
      <slot />
    </main>

    <div v-if="isAuthenticated" class="sticky bottom-0 z-40 dock dock-sm border-t border-base-300 bg-base-200">
      <component
        :is="item.to ? RouterLink : 'button'"
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        :type="item.to ? undefined : 'button'"
        :disabled="item.to ? undefined : true"
        :title="item.to ? undefined : 'Bientôt disponible'"
        :class="[
          item.to && isRouteActive(item.to) ? 'dock-active' : '',
          item.to ? '' : 'text-base-content/35',
        ]"
      >
        <component :is="item.icon" class="size-5" />
        <span class="dock-label">{{ item.label }}</span>
      </component>

      <details class="dropdown dropdown-top dropdown-end" :open="optionsOpen" @toggle="optionsOpen = !optionsOpen">
        <summary class="flex cursor-pointer flex-col items-center justify-center gap-1 px-2 text-xs text-base-content/80 outline-none list-none">
          <MoreHorizontal class="size-5" />
          <span class="dock-label">Options</span>
        </summary>
        <ul class="menu dropdown-content z-50 w-44 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg mb-2">
          <li>
            <router-link to="/profile" class="min-h-11 gap-3" @click="closeOptions">
              <UserCircle class="size-5 text-primary" />
              Profil
            </router-link>
          </li>
          <li>
            <button type="button" class="min-h-11 w-full justify-start gap-3 text-error" @click="onLogout">
              <LogOut class="size-5" />
              Se déconnecter
            </button>
          </li>
        </ul>
    </details>
    </div>
  </div>
</template>
