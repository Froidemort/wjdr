<template>
	<AppCard :title="title" :compact="compact">
		<div class="flex flex-col gap-3 sm:flex-row">
			<input 
				:value="modelValue"
				type="text" 
				:maxlength="maxLength"
				:class="['input', inputClass]"
				:placeholder="placeholder"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<button 
				class="btn btn-sm btn-accent"
				:disabled="Boolean(disabled || loading)"
				@click="$emit('submit')"
			>
				<span v-if="loading" class="loading loading-spinner loading-xs" aria-hidden="true" />
				{{ buttonLabel }}
			</button>
		</div>

		<div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm mt-3">
			<span>{{ successMessage }}</span>
		</div>
		<div v-if="errorMessage" role="alert" class="alert alert-error alert-soft text-sm mt-3">
			<span>{{ errorMessage }}</span>
		</div>
	</AppCard>
</template>

<script setup lang="ts">
import AppCard from './AppCard.vue'

defineProps<{
	modelValue: string
	title: string
	placeholder: string
	buttonLabel: string
	loading?: boolean
	disabled?: boolean
	successMessage?: string | null
	errorMessage?: string | null
	maxLength?: number
	compact?: boolean
	inputClass?: string
}>()

defineEmits<{
	'update:modelValue': [value: string]
	'submit': []
}>()
</script>
