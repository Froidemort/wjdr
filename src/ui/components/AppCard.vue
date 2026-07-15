<script setup lang="ts">
defineProps<{
  title?: string
  compact?: boolean
  avatarUrl?: string | null
  avatarAlt?: string
}>()
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body" :class="compact ? 'p-4' : 'p-5'">
      <div v-if="title" class="flex items-center gap-3">
        <div v-if="avatarUrl" class="avatar">
          <div class="w-10 rounded-full ring ring-base-300 ring-offset-1 ring-offset-base-100">
            <img :src="avatarUrl" :alt="avatarAlt || title" class="object-cover" />
          </div>
        </div>
        <h2 class="card-title text-base-content text-2xl">{{ title }}</h2>
      </div>
      <slot />
    </div>
  </article>
</template>
