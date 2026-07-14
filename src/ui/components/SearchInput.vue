<script setup lang="ts">
const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder: string
}>()

function onInput(event: Event): void {
  const target = event.target as HTMLInputElement
  model.value = target.value
}
</script>

<template>
  <label class="input w-full">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <input :value="model" type="search" class="grow" :placeholder="placeholder" @input="onInput" />
  </label>
</template>
