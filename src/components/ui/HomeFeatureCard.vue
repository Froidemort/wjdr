<script setup lang="ts">
import { ArrowRight, Hourglass } from '@lucide/vue'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { HomeFeature } from '../../config/homeFeatures'

const props = defineProps<{ feature: HomeFeature }>()

const isAvailable = computed(() => Boolean(props.feature.to))
const surfaceTag = computed(() => (isAvailable.value ? RouterLink : 'div'))
const isFeatured = computed(() => Boolean(props.feature.featured))
</script>

<template>
  <li class="min-w-0">
    <component
      :is="surfaceTag"
      :to="feature.to"
      class="group relative flex h-full flex-col overflow-hidden rounded-box border outline-none grim-hero-panel grim-feature-card focus-visible:ring-2 focus-visible:ring-primary/35"
      :class="isAvailable ? 'grim-feature-card--interactive cursor-pointer' : 'cursor-default'"
      :aria-disabled="isAvailable ? undefined : 'true'"
    >
      <figure class="relative h-48 shrink-0 overflow-hidden sm:h-56 lg:h-64">
        <img
          :src="feature.image"
          alt=""
          decoding="async"
          class="grim-feature-card__image size-full object-cover"
        />

        <div
          class="absolute inset-0 bg-linear-to-t from-base-100 via-base-100/25 to-transparent transition-opacity duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] group-hover:opacity-70"
          aria-hidden="true"
        />

        <div class="absolute right-3 top-3" aria-hidden="true">
          <div class="relative flex size-10 items-center justify-center rounded-full bg-error shadow-md">
            <div class="absolute inset-0.75 rounded-full border border-error-content/40 bg-error/85" />
            <span class="relative font-grim-title text-sm text-error-content">{{ feature.numeral }}</span>
          </div>
          <div
            class="absolute -bottom-2 right-3.5 h-4 w-2 bg-error/80 [clip-path:polygon(0%_0%,100%_0%,100%_100%,50%_75%,0%_100%)]"
          />
        </div>
      </figure>

      <div class="relative z-10 -mt-5 flex flex-1 flex-col gap-2 px-5 pb-5">
        <div class="flex items-start gap-2.5">
          <span
            class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-box border border-primary/25 bg-base-100/90 text-primary transition-colors duration-300 group-hover:border-primary/45 group-hover:bg-primary/10"
            aria-hidden="true"
          >
            <component :is="feature.icon" class="size-4.5" />
          </span>
          <h3
            class="mb-0 leading-snug tracking-wide transition-colors duration-300"
            :class="[isFeatured ? 'text-xl lg:text-2xl' : 'text-lg', isAvailable ? 'group-hover:text-primary' : '']"
          >
            {{ feature.title }}
          </h3>
        </div>

        <p class="text-sm leading-relaxed text-base-content/75">{{ feature.description }}</p>

        <!-- Hairline keeps the three call-to-actions aligned whatever the description length. -->
        <div class="mt-auto border-t border-base-content/10 pt-4">
          <span v-if="isAvailable && isFeatured" class="grim-cta">
            {{ feature.cta }}
            <ArrowRight
              class="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
          <span
            v-else-if="isAvailable"
            class="inline-flex items-center gap-1.5 font-grim-title text-xs uppercase tracking-[0.16em] text-primary"
          >
            {{ feature.cta }}
            <ArrowRight
              class="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 font-grim-title text-xs uppercase tracking-[0.16em] text-base-content/45"
          >
            <Hourglass class="size-3.5" aria-hidden="true" />
            {{ feature.cta }}
          </span>
        </div>
      </div>
    </component>
  </li>
</template>
