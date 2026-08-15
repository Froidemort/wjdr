<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import { computed, ref, useId } from 'vue'
import { getPasswordStrength } from '../../utils/validation'

const model = defineModel<string>({ default: '' })
const reveal = ref(false)
const inputId = useId()

const props = withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    minlength?: number | string
    autocomplete?: string
    bordered?: boolean
    showStrength?: boolean
    invalid?: boolean
    errorMessageId?: string | null
  }>(),
  {
    required: false,
    bordered: false,
    showStrength: false,
    invalid: false,
    errorMessageId: null,
  },
)

const strength = computed(() =>
  props.showStrength && model.value ? getPasswordStrength(model.value) : null,
)
</script>

<template>
  <div class="form-control w-full">
    <label v-if="label" class="label" :for="inputId">
      <span class="label-text">{{ label }}</span>
    </label>

    <div :class="['input w-full !pr-1.5 ui-critical-control', { 'input-bordered': bordered, 'input-error': invalid }]">
      <input
        :id="inputId"
        v-model="model"
        :type="reveal ? 'text' : 'password'"
        class="grow min-w-0 !w-auto"
        :required="required"
        :minlength="minlength"
        :autocomplete="autocomplete"
        :aria-label="label"
        :aria-invalid="invalid ? 'true' : 'false'"
        :aria-errormessage="errorMessageId ?? undefined"
      />
      <button
        type="button"
        class="inline-flex size-7 shrink-0 items-center justify-center rounded-sm opacity-55 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
        :aria-label="reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
        :aria-pressed="reveal"
        tabindex="-1"
        @click.stop.prevent="reveal = !reveal"
      >
        <EyeOff v-if="reveal" class="h-4 w-4" aria-hidden="true" />
        <Eye v-else class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="strength"
      class="mt-2 space-y-1"
      role="meter"
      :aria-valuenow="strength.level"
      aria-valuemin="0"
      aria-valuemax="4"
      :aria-valuetext="strength.label"
      aria-label="Robustesse du mot de passe"
    >
      <div class="flex gap-1">
        <span
          v-for="step in 4"
          :key="step"
          class="h-1 flex-1 rounded-sm transition-colors duration-200"
          :class="step <= strength.level ? strength.barClass : 'bg-base-300'"
        />
      </div>
      <p class="text-[11px] leading-none opacity-65">{{ strength.label }}</p>
    </div>
  </div>
</template>
