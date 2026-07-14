<template>
	<footer class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-base-300 mt-6">
		<slot name="left">
			<router-link v-if="backTo" class="btn btn-sm btn-ghost" :to="backTo">
				<ChevronLeft class="h-4 w-4" />
				{{ backLabel }}
			</router-link>
		</slot>

		<slot name="center" />

		<slot name="right" />
	</footer>
</template>

<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'

defineProps<{
	backTo?: string
	backLabel?: string
}>()
</script>
