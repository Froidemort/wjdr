<script setup lang="ts">
import { Bell, BookOpenText, House, LogOut, MoreHorizontal, Scroll, UserCircle, UserRound, Users } from '@lucide/vue'
import { computed, type Component, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useCurrentContext } from '../composables/useCurrentContext'
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

const { navContext } = useCurrentContext()

const isAuthenticated = computed(() => authStore.isAuthenticated)

interface DockItem {
  to: string
  label: string
  icon: Component
  active: boolean
}

const isTableRoute = computed(
  () => route.meta.navSection === 'campaigns' && route.query.tab === 'table'
)

// Missives live in the header, so the dock keeps the five destinations reachable with a thumb.
const navItems = computed<DockItem[]>(() => {
  const { role, campaignTo, characterTo } = navContext.value
  const section = route.meta.navSection
  const middle: DockItem =
    role === 'player' && characterTo
      ? { to: characterTo, label: 'Ma fiche', icon: UserRound, active: section === 'characters' }
      : role === 'mj' && campaignTo
        ? {
            to: `${campaignTo}?tab=table`,
            label: 'Table',
            icon: Users,
            active: isTableRoute.value,
          }
        : { to: '/characters', label: 'Personnages', icon: Users, active: section === 'characters' }

  return [
    {
      to: campaignTo ?? '/campaigns',
      label: 'Campagnes',
      icon: Scroll,
      active: section === 'campaigns' && !isTableRoute.value,
    },
    middle,
    { to: '/', label: 'Accueil', icon: House, active: false },
    { to: '/compendium', label: 'Compendium', icon: BookOpenText, active: section === 'compendium' },
  ]
})

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
            v-if="!isAuthenticated"
            to="/compendium"
            class="btn btn-ghost btn-square min-h-11 min-w-11"
            :class="isRouteActive('/compendium') ? 'text-primary' : ''"
            aria-label="Compendium"
          >
            <BookOpenText class="size-5" />
          </router-link>
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
      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="min-h-11 min-w-11"
        :class="item.active ? 'dock-active' : ''"
      >
        <component :is="item.icon" class="size-5" />
        <span class="dock-label">{{ item.label }}</span>
      </RouterLink>

      <details class="dropdown dropdown-top dropdown-end" :open="optionsOpen" @toggle="optionsOpen = !optionsOpen">
        <summary class="flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center gap-1 px-2 text-xs text-base-content/80 outline-none list-none">
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
