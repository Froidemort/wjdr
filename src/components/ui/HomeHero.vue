<script setup lang="ts">
import heroBackdrop from '../../assets/images/home-campaigns.webp'
</script>

<template>
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
      class="pointer-events-none absolute inset-0 bg-linear-to-b from-base-100/65 via-base-100/30 to-base-100"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_15%,color-mix(in_oklab,var(--color-base-100)_55%,transparent)_100%)]"
      aria-hidden="true"
    />

    <div class="relative z-10 mx-auto max-w-3xl px-6 pt-6 pb-14 text-center sm:pt-12 sm:pb-32">
      <h1 id="home-brand" class="grim-modal-title text-6xl sm:text-7xl lg:text-8xl">
        Grimorium
      </h1>

      <div class="mx-auto mt-5 flex w-64 items-center gap-3 sm:w-80" aria-hidden="true">
        <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/50" />
        <span class="size-1.5 rotate-45 border border-primary/55 bg-primary/20" />
        <span class="h-px flex-1 bg-linear-to-l from-transparent to-primary/50" />
      </div>
    </div>
  </header>
</template>
