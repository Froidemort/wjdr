<script setup lang="ts">
import NavBar from '../components/ui/NavBar.vue'
</script>

<template>
  <div class="flex flex-1 flex-col bg-base-100 [--grim-nav-height:4rem]">
    <header class="sticky top-0 z-40">
      <NavBar />
    </header>
    <main id="main-content" class="flex-1" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
