<script setup lang="ts">
import { Coins } from '@lucide/vue'

const props = withDefaults(defineProps<{
  gold: number
  silver: number
  copper: number
  editable?: boolean
}>(), {
  editable: false
})

const emit = defineEmits<{
  (event: 'update:gold', value: number): void
  (event: 'update:silver', value: number): void
  (event: 'update:copper', value: number): void
}>()

function onGoldInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:gold', Math.max(0, Number(target.value || 0)))
}

function onSilverInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:silver', Math.max(0, Number(target.value || 0)))
}

function onCopperInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:copper', Math.max(0, Number(target.value || 0)))
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-4">
      <div class="flex items-center justify-between">
        <div class="tooltip" data-tip="Monnaie">
          <Coins class="h-6 w-6" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 tabular-nums">
        <div class="rounded-box border border-base-300 bg-amber-100 p-2 text-center text-amber-900">
          <template v-if="editable">
            <input
              :value="gold"
              type="number"
              min="0"
              class="input input-sm h-10 w-full border-amber-300 bg-amber-50 text-center text-2xl font-black [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Couronnes d or"
              @input="onGoldInput"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none">{{ gold }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">CO</div>
        </div>

        <div class="rounded-box border border-base-300 bg-slate-100 p-2 text-center text-slate-700">
          <template v-if="editable">
            <input
              :value="silver"
              type="number"
              min="0"
              class="input input-sm h-10 w-full border-slate-300 bg-slate-50 text-center text-2xl font-black [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Pistoles d argent"
              @input="onSilverInput"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none">{{ silver }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">PA</div>
        </div>

        <div class="rounded-box border border-base-300 bg-orange-100 p-2 text-center text-orange-800">
          <template v-if="editable">
            <input
              :value="copper"
              type="number"
              min="0"
              class="input input-sm h-10 w-full border-orange-300 bg-orange-50 text-center text-2xl font-black [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Sous de cuivre"
              @input="onCopperInput"
            />
          </template>
          <template v-else>
            <div class="text-3xl font-black leading-none">{{ copper }}</div>
          </template>
          <div class="text-xs font-semibold opacity-80">S</div>
        </div>
      </div>
    </div>
  </article>
</template>
