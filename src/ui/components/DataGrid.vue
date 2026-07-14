<template>
	<div class="space-y-4">
		<!-- Loading State -->
		<div v-if="loading" :class="gridClass">
			<div v-for="item in skeletonCount" :key="item" class="skeleton rounded-box w-full" :style="{ height: skeletonHeight }" />
		</div>

		<!-- Error State -->
		<div v-else-if="error" role="alert" class="alert alert-error alert-soft">
			<span>{{ error }}</span>
		</div>

		<!-- Empty State -->
		<div v-else-if="items.length === 0" class="alert alert-warning alert-soft">
			<span>{{ emptyMessage }}</span>
		</div>

		<!-- Data Grid -->
		<div v-else :class="gridClass">
			<slot :items="items" />
		</div>

		<!-- Pagination (if needed) -->
		<div v-if="showPagination && totalPages > 1" class="flex items-center justify-between gap-2 rounded-box border border-base-300 bg-base-100 p-3">
			<p class="text-sm opacity-70">Page {{ page }} / {{ totalPages }}</p>
			<div class="join">
				<button class="btn btn-sm join-item" :class="!canGoPrevious || loading ? 'btn-disabled' : ''" @click="$emit('prev-page')">
					Précédent
				</button>
				<button class="btn btn-sm join-item" :class="!canGoNext || loading ? 'btn-disabled' : ''" @click="$emit('next-page')">
					Suivant
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" generic="T extends { id: string }">
import { computed } from 'vue'

interface Props<T> {
	items: T[]
	loading?: boolean
	error?: string | null
	emptyMessage?: string
	gridClass?: string
	skeletonCount?: number
	skeletonHeight?: string
	page?: number
	totalPages?: number
	showPagination?: boolean
}

const props = withDefaults(defineProps<Props<T>>(), {
	loading: false,
	error: null,
	emptyMessage: 'Aucun élément disponible.',
	gridClass: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
	skeletonCount: 6,
	skeletonHeight: '14rem',
	page: 1,
	totalPages: 1,
	showPagination: false
})

const canGoPrevious = computed(() => props.page > 1)
const canGoNext = computed(() => props.page < props.totalPages)

defineEmits<{ 'prev-page': []; 'next-page': [] }>()
</script>
