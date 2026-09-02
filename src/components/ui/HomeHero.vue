<script setup lang="ts">
import heroBackdrop from '../../assets/images/home-campaigns.webp'

defineProps<{
  displayName?: string | null
}>()
</script>

<template>
  <!-- Pulled under the overlay header so the backdrop runs edge to edge, then padded back to keep content clear of it. -->
  <header
    class="relative -mt-(--grim-nav-height) overflow-hidden pt-(--grim-nav-height)"
    aria-labelledby="home-brand"
  >
    <img
      :src="heroBackdrop"
      alt=""
      class="pointer-events-none absolute inset-0 size-full object-cover object-[center_35%]"
      aria-hidden="true"
    />

    <div
      class="pointer-events-none absolute inset-0 bg-linear-to-b from-base-100/70 via-base-100/45 to-base-100"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_10%,color-mix(in_oklab,var(--color-base-100)_62%,transparent)_100%)]"
      aria-hidden="true"
    />

    <div class="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-14 text-center sm:pb-24 sm:pt-16">
      <p class="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-primary">
        The Old World · JDR v2
      </p>

      <h1 id="home-brand" class="grim-modal-title mt-4 text-6xl sm:text-7xl lg:text-8xl">
        Grimorium
      </h1>

      <div class="mx-auto mt-5 flex w-56 items-center gap-3 sm:w-72" aria-hidden="true">
        <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/55" />
        <span class="size-1.5 rotate-45 border border-primary/60 bg-primary/25" />
        <span class="h-px flex-1 bg-linear-to-l from-transparent to-primary/55" />
      </div>

      <p class="mx-auto mt-5 max-w-lg text-base leading-relaxed text-base-content/80 sm:text-lg">
        Forgez votre légende dans les ténèbres du Vieux Monde.
      </p>

      <p
        v-if="displayName"
        class="mt-6 inline-flex items-center gap-2 border-y border-base-content/15 px-4 py-1.5 text-sm"
      >
        <span class="text-base-content/65">Bienvenue,</span>
        <span class="font-grim-title tracking-wide text-primary">{{ displayName }}</span>
      </p>
    </div>
  </header>
</template>
