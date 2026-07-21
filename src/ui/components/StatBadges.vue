<template>
	<div class="mt-3 grid grid-cols-2 gap-2">
		<slot>
			<span v-for="stat in stats" :key="stat.label" class="badge">
				<span class="font-semibold">{{ stat.label }}</span>
				{{ stat.value }}
			</span>
		</slot>
	</div>
</template>

<script setup lang="ts">
interface Stat {
  label: string
  value: string | number
}

defineProps<{
  stats?: Stat[]
}>()
</script>
