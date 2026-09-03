<script setup lang="ts">
import NavBar from '../components/ui/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-base-100 [--grim-nav-height:4rem]">
    <header class="sticky top-0 z-40">
      <NavBar />
    </header>
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
