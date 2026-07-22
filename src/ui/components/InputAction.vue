<template>
	<AppCard :title="title" :compact="compact">
		<form :class="compact ? 'flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:justify-start' : 'flex flex-col gap-3 sm:flex-row'" @submit.prevent="$emit('submit')">
			<input 
				:value="modelValue"
				type="text" 
				:maxlength="maxLength"
				:class="['input bg-base-100', inputClass]"
				:placeholder="placeholder"
				:disabled="Boolean(disabled || loading)"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<button 
				type="submit"
				:class="compact ? 'btn btn-sm w-full sm:w-auto' : 'btn btn-sm'"
				:disabled="Boolean(disabled || loading)"
				:aria-busy="loading ? 'true' : 'false'"
			>
				<span v-if="loading" class="loading loading-spinner loading-xs" aria-hidden="true" />
				{{ buttonLabel }}
			</button>
		</form>

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
  submit: []
}>()
</script>
