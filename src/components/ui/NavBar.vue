<template>
  <nav class="navbar min-h-16 border-b border-base-300 bg-base-200 px-4 sm:px-6">
    <div
      class="flex w-full items-center"
      :class="isAuthenticated && 'sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-4'"
    >
      <router-link
        to="/"
        class="btn btn-ghost shrink-0 px-2 text-xl font-bold normal-case tracking-wide"
        :class="isAuthenticated && 'justify-self-start'"
      >
        GRIMORIUM
      </router-link>

      <NavMainLinks v-if="isAuthenticated" class="hidden justify-self-center sm:flex" />

      <div
        class="ml-auto flex items-center gap-1 sm:gap-2"
        :class="isAuthenticated && 'justify-self-end sm:ml-0'"
      >
        <template v-if="isAuthenticated">
          <!-- Only one navbar popover open at a time -->
          <MissivesPopover ref="missivesRef" @open="accountRef?.close()" />
          <ThemeToggle />
          <AccountPopover ref="accountRef" @open="missivesRef?.close()" />

          <button
            type="button"
            class="btn btn-ghost btn-square min-h-11 min-w-11 sm:hidden"
            aria-label="Ouvrir le menu"
            :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Menu v-if="!mobileMenuOpen" class="size-5" />
            <X v-else class="size-5" />
          </button>
        </template>

        <ThemeToggle v-else />
      </div>
    </div>

    <NavMobileMenu v-if="isAuthenticated" v-model:open="mobileMenuOpen" />
  </nav>
</template>

<script lang="ts" setup>
import { Menu, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AccountPopover from './AccountPopover.vue'
import MissivesPopover from './MissivesPopover.vue'
import NavMainLinks from './NavMainLinks.vue'
import NavMobileMenu from './NavMobileMenu.vue'
import ThemeToggle from './ThemeToggle.vue'

// Layout: brand (left) | main links (center) | utilities (right).
// On sm+, a 3-column grid keeps center links visually centered regardless of right-side width.
const authStore = useAuthStore()
const route = useRoute()

const mobileMenuOpen = ref(false)
const missivesRef = ref<InstanceType<typeof MissivesPopover> | null>(null)
const accountRef = ref<InstanceType<typeof AccountPopover> | null>(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)

// Close every overlay on navigation so panels do not linger across routes.
watch(() => route.path, () => {
  mobileMenuOpen.value = false
  missivesRef.value?.close()
  accountRef.value?.close()
})
</script>
