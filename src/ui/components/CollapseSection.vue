<template>
	<details :class="['collapse', `collapse-${modifier}`, 'border border-base-300 bg-base-100']" :open="defaultOpen">
		<summary class="collapse-title">
			<div class="flex items-center justify-between gap-2">
				<h2 class="text-lg">{{ title }}</h2>
				<slot name="header-action" />
			</div>
		</summary>
		<div class="collapse-content">
			<slot />
		</div>
	</details>
</template>

<script setup lang="ts">
defineProps<{
	title: string
	modifier?: 'arrow' | 'plus' | ''
	defaultOpen?: boolean
}>()
</script>

<style scoped>
details {
	transition: all 0.2s ease-in-out;
}
</style>
