<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeAvatarUrl } from '../../utils/avatarUrl'

const props = defineProps<{
  title?: string
  compact?: boolean
  avatarUrl?: string | null
  avatarAlt?: string
}>()

const safeAvatarUrl = computed(() => sanitizeAvatarUrl(props.avatarUrl))
</script>

<template>
  <article class="card rounded-box border border-base-300 bg-base-100">
    <div class="card-body" :class="compact ? 'gap-3 p-4 lg:p-3.5' : 'gap-4 p-5'">
      <div v-if="title" class="flex gap-3" :class="compact ? 'mb-0 items-start' : 'mb-1 items-center'">
        <div v-if="safeAvatarUrl" class="avatar">
          <div class="w-9 rounded-full ring ring-base-300 ring-offset-1 ring-offset-base-100">
            <img :src="safeAvatarUrl" :alt="avatarAlt || title" class="object-cover" />
          </div>
        </div>
        <h2
          class="card-title text-base-content leading-tight"
          :class="compact ? 'line-clamp-2 min-h-[3.5rem] text-xl lg:min-h-[3.25rem] lg:text-lg' : 'text-3xl'"
        >
          {{ title }}
        </h2>
      </div>
      <slot />
    </div>
  </article>
</template>
