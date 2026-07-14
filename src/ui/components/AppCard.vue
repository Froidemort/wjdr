<script setup lang="ts">
defineProps<{
  title?: string
  compact?: boolean
}>()
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body" :class="compact ? 'p-4' : 'p-5'">
      <h2 v-if="title" class="card-title text-base-content text-2xl">{{ title }}</h2>
      <slot />
    </div>
  </article>
</template>
