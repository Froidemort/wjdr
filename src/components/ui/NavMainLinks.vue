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
<<<<<<< HEAD
    <router-link
      v-for="link in mainNavLinks"
      :key="link.to"
      :to="link.to"
      :class="[linkClass, isRouteActive(link.to) ? 'bg-primary/10 text-primary' : '']"
    >
      <component :is="link.icon" class="size-5 shrink-0" aria-hidden="true" />
=======
    <component
      :is="link.available ? RouterLink : 'span'"
      v-for="link in links"
      :key="link.label"
      :to="link.to"
      class="group relative flex min-h-11 items-center gap-2 px-3.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors duration-200"
      :class="{
        'text-primary': link.active,
        'text-base-content/70 hover:text-primary': link.available && !link.active,
        'cursor-default text-base-content/35': !link.available,
      }"
      :aria-disabled="link.available ? undefined : 'true'"
      :title="link.available ? undefined : 'Bientôt disponible'"
    >
      <component :is="link.icon" class="size-4 shrink-0" aria-hidden="true" />
>>>>>>> fd68f54 (refacto: redesign homepage)
      <span>{{ link.label }}</span>

      <span
        v-if="link.available"
        class="absolute inset-x-2 bottom-1.5 h-px origin-center bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
        :class="link.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
        aria-hidden="true"
      />
    </component>
  </nav>
</template>
