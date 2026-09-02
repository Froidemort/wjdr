<script setup lang="ts">
import { useRoute } from 'vue-router'
import { mainNavLinks } from '../../config/navLinks'

// Centered desktop nav links — data lives in config/navLinks.ts
const route = useRoute()
const linkClass =
  'btn btn-ghost min-h-11 gap-2.5 px-4 font-medium normal-case'

function isRouteActive(path: string): boolean {
  return route.meta.navSection === path.slice(1)
}
</script>

<template>
  <nav aria-label="Navigation principale" class="flex items-center gap-1">
    <router-link
      v-for="link in mainNavLinks"
      :key="link.to"
      :to="link.to"
      :class="[linkClass, isRouteActive(link.to) ? 'bg-primary/10 text-primary' : '']"
    >
      <component :is="link.icon" class="size-5 shrink-0" aria-hidden="true" />
      <span>{{ link.label }}</span>
    </router-link>
  </nav>
</template>
