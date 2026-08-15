<template>
	<footer class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-base-300 mt-6">
		<slot name="left">
			<router-link v-if="backTo" class="btn btn-outline btn-sm min-h-11 px-4" :to="backTo">
				{{ backLabel }}
			</router-link>
		</slot>

		<slot name="center" />

		<slot name="right" />
	</footer>
</template>

<script setup lang="ts">
defineProps<{
  backTo?: string
  backLabel?: string
}>()
</script>
