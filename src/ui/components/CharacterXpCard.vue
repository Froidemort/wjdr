<script setup lang="ts">
const props = withDefaults(defineProps<{
  current: number
  max: number
  editable?: boolean
}>(), {
  editable: false
})

const emit = defineEmits<{
  (event: 'update:current', value: number): void
  (event: 'update:max', value: number): void
}>()

function onCurrentInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:current', Math.max(0, Number(target.value || 0)))
}

function onMaxInput(event: Event): void {
  const target = event.target as HTMLInputElement
  emit('update:max', Math.max(0, Number(target.value || 0)))
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100">
    <div class="card-body p-4 gap-4">
      <div class="flex items-center justify-between">
        <div class="tooltip" data-tip="Experience">
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width="2" 
  stroke-linecap="round" 
  stroke-linejoin="round" 
  class="w-6 h-6 inline-block align-text-bottom"
  aria-label="Points d'Expérience"
>
  <path d="M 3 5 L 11 19" />
  <path d="M 11 5 L 3 19" />

  <path d="M 13 5 L 13 19" />
  <path d="M 13 5 L 18 5 C 21 5, 21 12, 18 12 L 13 12" />
</svg>


        </div>

        <div class="flex items-center gap-2 font-semibold tabular-nums">
          <template v-if="editable">
            <input
              :value="current"
              type="number"
              min="0"
              class="input input-sm h-10 w-24 text-center text-xl font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Experience disponible"
              @change="onCurrentInput"
            />
            <span class="text-lg opacity-60">/</span>
            <input
              :value="max"
              type="number"
              min="0"
              class="input input-sm h-10 w-24 text-center text-xl font-bold [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Experience maximale"
              @change="onMaxInput"
            />
          </template>
          <template v-else>
            <span class="text-4xl font-black leading-none">{{ current }}</span>
            <span class="text-xl opacity-50">/</span>
            <span class="text-3xl font-bold leading-none opacity-80">{{ max }}</span>
          </template>
        </div>
      </div>

    </div>
  </article>
</template>
