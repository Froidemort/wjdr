<template>
	<footer
		class="flex flex-col items-start gap-3 border-t border-base-300 pt-4 mt-6 sm:flex-row sm:items-center sm:justify-between"
		:class="mobileVisible ? '' : 'max-sm:hidden'"
	>
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
	mobileVisible?: boolean
}>()
</script>
