<script setup lang="ts">
import { mainNavLinks } from '../config/navLinks'

// Centered desktop nav links — data lives in config/navLinks.ts
const linkClass =
  'btn btn-ghost min-h-11 gap-2.5 px-4 font-medium normal-case [&.router-link-active]:bg-primary/10 [&.router-link-active]:text-primary'
</script>

<template>
  <nav aria-label="Navigation principale" class="flex items-center gap-1">
    <router-link v-for="link in mainNavLinks" :key="link.to" :to="link.to" :class="linkClass">
      <component :is="link.icon" class="size-5 shrink-0" aria-hidden="true" />
      <span>{{ link.label }}</span>
    </router-link>
  </nav>
</template>
