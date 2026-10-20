<script setup lang="ts">
import { computed } from 'vue'
import { renderSafeMarkdown } from '../../utils/markdown'

const props = defineProps<{
  source: string | null | undefined
}>()

const html = computed(() => renderSafeMarkdown(props.source))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- html comes from renderSafeMarkdown (DOMPurify-sanitized) -->
  <div
    class="markdown-body text-sm"
    v-html="html"
  />
</template>
