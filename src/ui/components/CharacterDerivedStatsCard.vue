<script setup lang="ts">
import { Shield, Weight } from '@lucide/vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    totalEncumbrance: 0,
    maxEncumbrance: 0,
    bonusForce: 0,
    bonusEndurance: 0,
  }
)

const isEncumbranceOverLimit = computed(() => props.totalEncumbrance > props.maxEncumbrance)
const encumbranceProgressMax = computed(() => Math.max(props.maxEncumbrance, 1))
const encumbranceProgressValue = computed(() =>
  Math.min(props.totalEncumbrance, encumbranceProgressMax.value)
)
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-3">
      <div class="space-y-2">
        <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Encombrement</p>
            <Weight class="h-5 w-5 text-accent" aria-hidden="true" />
            <p class="text-xs opacity-50">Enc. max : 2xF ou 3xF nains</p>
          </div>
          <div class="relative">
            <progress
              class="progress progress-accent h-10 w-full bg-base-100"
              :value="encumbranceProgressValue"
              :max="encumbranceProgressMax"
            />
            <span
              class="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-black sm:text-xl"
              :class="isEncumbranceOverLimit ? 'text-error' : 'text-accent '"
            >
              {{ totalEncumbrance }} / {{ maxEncumbrance }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
            <div class="text-sm font-bold uppercase text-accent">BF</div>
            <p class="text-3xl font-black leading-none text-accent text-center">{{ bonusForce }}</p>
          </div>
          <div class="rounded-lg border border-base-300 bg-base-200 p-3 text-center">
            <div class="text-sm font-bold uppercase text-accent">BE</div>
            <p class="text-3xl font-black leading-none text-accent text-center">{{ bonusEndurance }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg border border-base-300 bg-base-200 p-3">
        <div class="mb-2 flex items-center justify-between gap-2">
          <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Armure localisee</p>
          <Shield class="h-4 w-4 text-accent" aria-hidden="true" />
          <span aria-hidden="true" class="h-4 w-4" />
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Tête</p>
            <p class="mt-1 text-3xl font-black leading-none text-accent">{{ armorByLocation.tete }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Corps</p>
            <p class="mt-1 text-3xl font-black leading-none text-accent">{{ armorByLocation.corps }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Bras</p>
            <p class="mt-1 text-3xl font-black leading-none text-accent">{{ armorByLocation.bras }}</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-100 p-3 text-center">
            <p class="text-xs font-semibold uppercase tracking-wide opacity-75">Jambes</p>
            <p class="mt-1 text-3xl font-black leading-none text-accent">{{ armorByLocation.jambes }}</p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
