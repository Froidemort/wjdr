<script setup lang="ts">
import { Bell, LogOut, UserCircle } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { mainNavLinks } from '../../config/navLinks'

// Collapsible drawer for authenticated users on small screens (sm and below).
const open = defineModel<boolean>('open', { required: true })
defineProps<{
  unreadCount: number
}>()

const authStore = useAuthStore()
const router = useRouter()

async function onLogout(): Promise<void> {
  open.value = false
  await authStore.signOut()
  await router.replace('/')
}

function close(): void {
  open.value = false
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-x-0 top-(--grim-nav-height) z-40 border-b border-base-300 bg-base-200 p-3 shadow-lg sm:hidden"
  >
    <ul class="menu w-full p-0">
      <li v-for="link in mainNavLinks" :key="link.label">
        <router-link v-if="link.to" :to="link.to" class="min-h-11 gap-3" @click="close">
          <component :is="link.icon" class="size-5 text-primary" />
          {{ link.label }}
        </router-link>
        <span v-else class="min-h-11 gap-3 text-base-content/40" aria-disabled="true">
          <component :is="link.icon" class="size-5" />
          {{ link.label }}
          <span class="badge badge-xs badge-soft badge-info">Bientôt</span>
        </span>
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
