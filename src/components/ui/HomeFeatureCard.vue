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
      class="grim-feature-card group relative flex h-full flex-col overflow-hidden rounded-box border outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      :class="
        isAvailable
          ? 'cursor-pointer border-base-content/10'
          : 'cursor-default border-base-content/6'
      "
      :aria-disabled="isAvailable ? undefined : 'true'"
    >
      <figure
        class="relative shrink-0 overflow-hidden"
        :class="isFeatured ? 'h-52 sm:h-64 lg:h-72' : 'h-44 sm:h-52'"
      >
        <img
          :src="feature.image"
          alt=""
          decoding="async"
          class="grim-feature-card__img size-full object-cover will-change-transform"
          :class="isAvailable ? '' : 'saturate-[0.2] brightness-[0.5]'"
        />

        <div
          class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-200 via-base-200/20 to-transparent"
          aria-hidden="true"
        />

        <div
          class="grim-feature-card__topline pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent"
          aria-hidden="true"
        />

        <div class="absolute right-3 top-3" aria-hidden="true">
          <div class="grim-feature-card__seal relative flex size-9 items-center justify-center rounded-full bg-primary shadow-[0_2px_10px_color-mix(in_oklab,var(--color-primary)_40%,transparent)]">
            <div class="absolute inset-0.5 rounded-full border border-primary-content/20" />
            <span class="relative font-grim-title text-sm leading-none text-primary-content">{{ feature.numeral }}</span>
          </div>
          <div class="absolute -bottom-2 right-3 h-3.5 w-1.5 bg-primary/75 [clip-path:polygon(0%_0%,100%_0%,100%_100%,50%_70%,0%_100%)]" />
        </div>
      </figure>

      <div class="grim-feature-card__body relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div class="flex items-center gap-3">
          <span
            class="grim-feature-card__icon flex size-8 shrink-0 items-center justify-center rounded-sm border border-primary/15 bg-primary/6 text-primary/60"
            aria-hidden="true"
          >
            <component :is="feature.icon" class="size-4" />
          </span>
          <h3
            class="grim-feature-card__title font-grim-title leading-snug tracking-wide"
            :class="[
              isFeatured ? 'text-xl lg:text-2xl' : 'text-lg',
              isAvailable ? 'text-base-content/75' : 'text-base-content/35',
            ]"
          >
            {{ feature.title }}
          </h3>
        </div>

        <p
          class="grim-feature-card__desc text-sm leading-relaxed"
          :class="isAvailable ? 'text-base-content/50' : 'text-base-content/25'"
        >
          {{ feature.description }}
        </p>

        <div class="mt-auto border-t border-base-content/8 pt-4">
          <span v-if="isAvailable" class="grim-feature-card__cta-secondary">
            {{ feature.cta }}
            <ArrowRight class="grim-feature-card__arrow size-3.5" aria-hidden="true" />
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 font-grim-title text-xs uppercase tracking-[0.18em] text-base-content/25"
          >
            <Hourglass class="size-3.5" aria-hidden="true" />
            {{ feature.cta }}
          </span>
        </div>
      </div>
    </component>
  </li>
</template>
