<script setup lang="ts">
import { computed, ref } from 'vue'

const DESCRIPTION_LIMIT = 150

const props = defineProps<{
  title: string
  encumbrance: number
  highlight?: { label: string; value: string }
  badges?: string[]
  description?: string | null
}>()

const expanded = ref(false)
const description = computed(() => props.description?.trim() ?? '')
const isLong = computed(() => description.value.length > DESCRIPTION_LIMIT)
const shownDescription = computed(() =>
  isLong.value && !expanded.value
    ? `${description.value.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
    : description.value
)
</script>

<template>
  <article class="card card-border bg-base-200 shadow-sm">
    <div class="card-body gap-3 p-4">
      <header class="flex items-start justify-between gap-2">
        <h3 class="card-title text-lg">{{ title }}</h3>
        <span class="badge badge-ghost shrink-0" title="Encombrement">Enc. {{ encumbrance }}</span>
      </header>

      <p v-if="highlight" class="text-sm">
        <span class="opacity-70">{{ highlight.label }} :</span>
        <span class="badge badge-primary ml-2">{{ highlight.value }}</span>
      </p>

      <ul v-if="badges?.length" class="flex flex-wrap gap-1" aria-label="Propriétés">
        <li v-for="badge in badges" :key="badge" class="badge badge-sm badge-outline">{{ badge }}</li>
      </ul>

      <p v-if="description" class="text-sm opacity-80">{{ shownDescription }}</p>
      <button v-if="isLong" type="button" class="btn btn-link btn-xs self-start px-0" @click="expanded = !expanded">
        {{ expanded ? 'Voir moins' : 'Voir plus' }}
      </button>
    </div>
  </article>
</template>
