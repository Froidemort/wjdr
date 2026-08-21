<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    label: string;
    modelValue: number;
    maxPoints?: number;
  }>(),
  {
    label: "Dummy",
    modelValue: 2,
    maxPoints: 4,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const currentFortune = computed({
  get: () => props.modelValue,
  set: (val: number) => {
    const sanitized = Math.min(props.maxPoints, Math.max(0, Number(val) || 0));
    if (sanitized !== props.modelValue) {
      emit('update:modelValue', sanitized);
    }
  },
});

// Permet de sélectionner une valeur, ou de remettre à 0 si on re-clique sur la même
const setPoints = (index: number) => {
  if (currentFortune.value === index) {
    currentFortune.value = index - 1; // Décrémente ou passe à 0
  } else {
    currentFortune.value = index;
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center p-4 bg-base-100 rounded-2xl shadow-lg border border-base-200 w-fit select-none min-w-[200px]">
    <!-- En-tête -->
    <div class="flex items-center justify-between w-full mb-3 px-1">
      <span class="font-bold tracking-wider text-base-content text flex items-center gap-1.5">
        {{ label }}
      </span>
<!--      <span class="text-sm font-bold text-base-content/70">
        {{ currentFortune }} / {{ maxPoints }}
      </span>-->
    </div>

    <!-- Alignement des jetons -->
    <div class="flex items-center gap-2">
      <button
        v-for="index in maxPoints"
        :key="index"
        type="button"
        @click="setPoints(index)"
        class="transition-all duration-200 transform active:scale-90 focus:outline-none"
        :aria-label="`Point de fortune ${index}`"
      >
    <svg
      class="w-10 h-10 sm:w-10 sm:h-10 transition-colors duration-200 drop-shadow-sm"
      :class="index <= currentFortune ? 'text-success fill-success' : 'text-base-300 fill-base-200 stroke-base-300'"
      viewBox="0 0 32 32"
    >
      <path
        d="M12 11.2c-1.7-2.9-5-4-7.5-2.5S2.8 13 4.5 15.3c1.7 2.3 5.2 2.6 7.3 1.2-1.4 2.1-1.1 5.6 1.2 7.3 2.3 1.7 
        5.6 1.2 7.1-1.3 1.5-2.5.4-5.8-2.5-7.3 2.9-1.5 4-4.8 2.5-7.1-1.5-2.3-4.8-2.6-7.1-1.1-2.3 1.5-2.6 5-1.2 7.1z"
      />
    </svg>
      </button>
    </div>
  </div>
</template>