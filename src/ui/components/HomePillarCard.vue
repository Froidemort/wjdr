<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  numeral: string
  title: string
  description: string
  icon: Component
  toBeDone: boolean
}>()
</script>

<template>
  <li
    class="card card-border relative isolate overflow-hidden bg-base-100/95 px-5 py-5 shadow-sm sm:px-6"
  >
   

    <div class="relative z-10 flex items-start gap-4">
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-box border border-primary/20 bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <component :is="icon" class="size-4" />
      </div>

      <div class="min-w-0 flex-1 pr-14">
        <template v-if="toBeDone">
          <span class="badge badge-info badge-sm badge-soft">A venir</span>
        </template>
        <template v-else>
          <span class="badge badge-success badge-sm badge-soft">Disponible</span>
        </template>
        <h3 class="mt-1 text-base tracking-wide">{{ title }}</h3>
        <p class="mt-0.5 text-sm leading-relaxed text-base-content/70">{{ description }}</p>
      </div>
    </div>

    <div class="absolute right-3 top-3" aria-hidden="true">
      <div class="relative flex size-11 items-center justify-center rounded-full bg-error shadow-md">
        <div class="absolute inset-[3px] rounded-full border border-error-content/40 bg-error/85" />
        <span class="relative font-[family-name:var(--font-grim-title)] text-sm text-error-content">
          {{ numeral }}
        </span>
      </div>
      <div
        class="absolute -bottom-2 right-4 h-4 w-2 bg-error/80 [clip-path:polygon(0%_0%,_100%_0%,_100%_100%,_50%_75%,_0%_100%)]"
      />
    </div>
  </li>
</template>
