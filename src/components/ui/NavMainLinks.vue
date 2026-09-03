<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { mainNavLinks } from '../../config/navLinks'

const route = useRoute()

const links = computed(() =>
  mainNavLinks.map((link) => ({
    ...link,
    available: Boolean(link.to),
    active: Boolean(
      link.to &&
        (route.path === link.to || route.path.startsWith(`${link.to}/`)),
    ),
  })),
)
</script>

<template>
  <nav aria-label="Navigation principale" class="flex items-center gap-1">
    <component
      :is="link.available ? RouterLink : 'span'"
      v-for="link in links"
      :key="link.label"
      :to="link.available ? link.to : undefined"
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
      <span>{{ link.label }}</span>

      <!-- Underline indicator — grows in on hover / stays full when active -->
      <span
        v-if="link.available"
        class="absolute inset-x-2 bottom-1.5 h-px origin-center bg-primary transition-transform duration-300 ease-out motion-reduce:transition-none"
        :class="link.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
        aria-hidden="true"
      />
    </component>
  </nav>
</template>
