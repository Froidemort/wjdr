<script setup lang="ts">
import { Bell, LogOut, UserCircle } from '@lucide/vue'
import { useAuthLogout } from '../../composables/useAuthLogout'
import { useMissivesInbox } from '../../composables/useMissivesInbox'
import { mainNavLinks } from '../../config/navLinks'

// Collapsible drawer for authenticated users on small screens (sm and below).
const open = defineModel<boolean>('open', { required: true })

const { unreadCount } = useMissivesInbox()
const logout = useAuthLogout()

async function onLogout(): Promise<void> {
  open.value = false
  await logout()
}

function close(): void {
  open.value = false
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-x-0 top-16 z-40 border-b border-base-300 bg-base-200 p-3 shadow-lg sm:hidden"
  >
    <ul class="menu w-full p-0">
      <li v-for="link in mainNavLinks" :key="link.to">
        <router-link :to="link.to" class="min-h-11 gap-3" @click="close">
          <component :is="link.icon" class="size-5 text-primary" />
          {{ link.label }}
        </router-link>
      </li>
      <li>
        <router-link to="/notifications" class="min-h-11 gap-3" @click="close">
          <Bell class="size-5 text-primary" />
          Missives
          <span v-if="unreadCount > 0" class="badge badge-xs badge-warning">{{ unreadCount }}</span>
        </router-link>
      </li>
      <li>
        <router-link to="/profile" class="min-h-11 gap-3" @click="close">
          <UserCircle class="size-5 text-primary" />
          Profil
        </router-link>
      </li>
      <li>
        <button type="button" class="min-h-11 gap-3 text-error" @click="onLogout">
          <LogOut class="size-5" />
          Se déconnecter
        </button>
      </li>
    </ul>
  </div>
</template>
