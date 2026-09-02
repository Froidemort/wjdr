<script setup lang="ts">
import NavBar from '../components/ui/NavBar.vue'
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <NavBar />
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
