<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Weight } from '@lucide/vue'

const props = withDefaults(defineProps<{
  totalEncumbrance: number
  maxEncumbrance: number
  bonusForce: number
  bonusEndurance: number
  armorByLocation: {
    tete: number
    corps: number
    bras: number
    jambes: number
  }
}>(), {
  totalEncumbrance: 0,
  maxEncumbrance: 0,
  bonusForce: 0,
  bonusEndurance: 0
})

const isEncumbranceOverLimit = computed(() => props.totalEncumbrance > props.maxEncumbrance)
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-3">
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center sm:col-span-1">
          <div class="flex justify-center">
            <Weight class="h-4 w-4 text-accent" aria-hidden="true" />
          </div>
          <p class="translate-y-2 text-2xl font-black leading-none text-center whitespace-nowrap" :class="isEncumbranceOverLimit ? 'text-error' : 'text-accent'">
            {{ totalEncumbrance }} / {{ maxEncumbrance }}
          </p>
        </div>
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
          <div class="text-sm font-bold uppercase text-accent">BF</div>
          <p class="text-3xl font-black leading-none text-accent text-center">{{ bonusForce }}</p>
        </div>
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
          <div class="text-sm font-bold uppercase text-accent">BE</div>
          <p class="text-3xl font-black leading-none text-accent text-center">{{ bonusEndurance }}</p>
        </div>
      </div>

      <div class="rounded-lg border border-base-300 bg-base-200 p-3">
        <div class="mb-2 flex justify-center">
          <Shield class="h-4 w-4 text-accent" aria-hidden="true" />
        </div>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs opacity-70">Tête</p>
            <p class="text-3xl font-black leading-none text-accent">{{ armorByLocation.tete }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs opacity-70">Corps</p>
            <p class="text-3xl font-black leading-none text-accent">{{ armorByLocation.corps }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs opacity-70">Bras</p>
            <p class="text-3xl font-black leading-none text-accent">{{ armorByLocation.bras }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs opacity-70">Jambes</p>
            <p class="text-3xl font-black leading-none text-accent">{{ armorByLocation.jambes }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
