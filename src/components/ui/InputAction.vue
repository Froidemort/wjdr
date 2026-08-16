<template>
	<AppCard :title="props.title" :compact="props.compact">
		<div v-if="props.helperMessage" class="alert alert-info alert-soft mb-3 text-sm" role="note">
			<span>{{ props.helperMessage }}</span>
		</div>
		<form :class="props.compact ? 'flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:justify-start' : 'flex flex-col gap-3 sm:flex-row'" @submit.prevent="emit('submit')">
			<input 
				v-model="model"
				type="text" 
				:maxlength="props.maxLength"
				:class="['input bg-base-100 ui-critical-control', props.errorMessage ? 'input-error' : '', props.inputClass]"
				:placeholder="props.placeholder"
				:disabled="Boolean(props.disabled || props.loading)"
				:aria-invalid="props.errorMessage ? 'true' : 'false'"
			/>
			<button 
				type="submit"
				:class="props.compact ? 'btn btn-sm ui-critical-action min-h-11 w-full sm:w-auto' : 'btn btn-sm ui-critical-action min-h-11'"
				:disabled="Boolean(props.disabled || props.loading)"
				:aria-busy="props.loading ? 'true' : 'false'"
			>
				<span v-if="props.loading" class="loading loading-spinner loading-xs" aria-hidden="true" />
				{{ props.buttonLabel }}
			</button>
		</form>

		<div v-if="props.successMessage" role="status" class="alert alert-success alert-soft text-sm mt-3">
			<span>{{ props.successMessage }}</span>
		</div>
		<div v-if="props.errorMessage" role="alert" class="alert alert-error alert-soft text-sm mt-3">
			<span>{{ props.errorMessage }}</span>
		</div>
	</AppCard>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import AppCard from './AppCard.vue'

const props = defineProps<{
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
	helperMessage?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const model = useVModel(props, 'modelValue', emit)
</script>
