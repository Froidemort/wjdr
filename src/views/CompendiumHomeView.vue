<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { compendiumSections } from '../config/compendiumSections'
</script>

<template>
  <section class="bg-base-100">
    <header class="bg-base-300 text-base-content p-6">
      <h1 class="text-2xl font-bold">Compendium</h1>
      <p class="opacity-80 text-sm mt-1">L'encyclopédie du Vieux Monde : consultez les références en lecture seule.</p>
    </header>

    <ul class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Sections du compendium">
      <li v-for="section in compendiumSections" :key="section.to">
        <router-link
          :to="section.to"
          class="card card-border bg-base-200 shadow-md h-full transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div class="card-body gap-3">
            <component :is="section.icon" class="size-8 text-primary" aria-hidden="true" />
            <h2 class="card-title">{{ section.title }}</h2>
            <p class="text-sm text-base-content/80">{{ section.description }}</p>
            <span class="mt-auto inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
              Consulter
              <ArrowRight class="size-4" aria-hidden="true" />
            </span>
          </div>
        </router-link>
      </li>
    </ul>
  </section>
</template>
