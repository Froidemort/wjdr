<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed, ref } from 'vue'
import { normalizeSearchText } from '../../utils/searchText'
import SearchInput from './SearchInput.vue'

interface SearchSelectOption {
  id: string
  label: string
}

const MAX_RESULTS = 50

const model = defineModel<string>({ default: '' })

const props = defineProps<{
  options: SearchSelectOption[]
  label: string
  placeholder?: string
}>()

const query = ref('')

const selected = computed(() => props.options.find((option) => option.id === model.value) ?? null)

const results = computed(() => {
  const needle = normalizeSearchText(query.value.trim())
  if (!needle) return []
  return props.options.filter((option) => normalizeSearchText(option.label).includes(needle))
})

const visibleResults = computed(() => results.value.slice(0, MAX_RESULTS))
const hasQuery = computed(() => query.value.trim().length > 0)

function pick(option: SearchSelectOption): void {
  model.value = option.id
  query.value = ''
}

function clear(): void {
  model.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-1" role="group" :aria-label="label">
    <span class="text-sm">{{ label }}</span>

    <div v-if="selected" class="flex min-h-11 items-center justify-between gap-2 rounded-box border border-base-300 bg-base-200 ps-3">
      <span class="font-semibold">{{ selected.label }}</span>
      <button type="button" class="btn btn-ghost btn-square min-h-11 min-w-11" :aria-label="`Retirer : ${selected.label}`" @click="clear">
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>

    <template v-else>
      <SearchInput v-model="query" :placeholder="placeholder ?? 'Rechercher'" :aria-label="label" />
      <ul
        v-if="hasQuery"
        class="menu max-h-64 w-full flex-nowrap overflow-y-auto rounded-box border border-base-300 bg-base-100 p-1"
        :aria-label="`Résultats : ${label}`"
      >
        <li v-for="option in visibleResults" :key="option.id">
          <button type="button" class="min-h-11" @click="pick(option)">{{ option.label }}</button>
        </li>
        <li v-if="results.length === 0" class="px-3 py-2 text-sm opacity-70">Aucun résultat.</li>
        <li v-else-if="results.length > MAX_RESULTS" class="px-3 py-2 text-xs opacity-70">Affine ta recherche pour voir plus de résultats.</li>
      </ul>
    </template>
  </div>
</template>
