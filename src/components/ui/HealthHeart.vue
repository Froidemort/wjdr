<script setup lang="ts">
import { Minus, Plus } from '@lucide/vue'
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    maxHp: number;
    label?: string;
    mobileLabel?: string;
    editable?: boolean;
  }>(),
  {
    modelValue: 10,
    maxHp: 15,
    label: 'Points de Blessures',
    editable: true,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const resolvedMaxHp = computed(() => Math.max(0, Math.floor(props.maxHp)));
const clampedCurrentHp = computed(() =>
  Math.min(resolvedMaxHp.value, Math.max(0, Math.floor(props.modelValue)))
);

// Animation du battement de cœur
const isBeating = ref(false);

const heartBeatFrequency = computed(() => {
  if (clampedCurrentHp.value <= 3) return '200ms';
  if (clampedCurrentHp.value <= resolvedMaxHp.value / 2) return '450ms';
  return '650ms';
});

const triggerHeartbeat = () => {
  isBeating.value = true;
  window.setTimeout(() => {
    isBeating.value = false;
  }, heartBeatFrequency.value.replace('ms', '') as unknown as number);
};

// Modèle réactif synchronisé avec validation des bornes
const currentHp = computed({
  get: () => props.modelValue,
  set: (val: number) => {
    if (!props.editable) return;

    const sanitized = Math.min(resolvedMaxHp.value, Math.max(0, Math.floor(Number(val) || 0)));
    if (sanitized !== props.modelValue) {
      emit('update:modelValue', sanitized);
      triggerHeartbeat();
    }
  },
});

// Calcul du pourcentage de remplissage
const hpPercentage = computed(() => {
  if (resolvedMaxHp.value <= 0) return 0;
  return Math.min(100, Math.max(0, (clampedCurrentHp.value / resolvedMaxHp.value) * 100));
});

// Code couleur dynamique : Vert > 50%, Orange entre 3PV et 50%, Rouge <= 3PV
const hpColorClass = computed(() => {
  if (clampedCurrentHp.value <= 3) return 'text-error';
  if (clampedCurrentHp.value <= resolvedMaxHp.value / 2) return 'text-warning';
  return 'text-success';
});

// Incrémentation et décrémentation
const decrease = () => {
  if (clampedCurrentHp.value > 0) currentHp.value--;
};

const increase = () => {
  if (clampedCurrentHp.value < resolvedMaxHp.value) currentHp.value++;
};

// Détection des changements externes pour déclencher l'animation
watch(
  () => props.modelValue,
  () => {
    triggerHeartbeat();
  }
);
</script>

<template>
  <article class="card h-full min-w-0 border border-base-300 bg-base-100">
    <div class="card-body gap-2 p-3 sm:gap-3 sm:p-4 md:min-h-64">
      <div class="flex items-baseline justify-between gap-2">
        <p class="text-sm font-semibold leading-tight text-base-content/85" :aria-label="label">
          <span class="hidden sm:inline">{{ label }}</span>
          <span class="sm:hidden">{{ mobileLabel || 'Blessures' }}</span>
        </p>
      </div>

      <div
        class="select-none"
        :class="editable ? 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3' : 'flex justify-center'"
      >
      <!-- Bouton - (Décrémenter) -->
      <button
        v-if="editable"
        type="button"
        @click="decrease"
        :disabled="currentHp <= 0"
        class="btn btn-circle btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content transition-transform active:scale-95"
        :aria-label="`Diminuer les ${label.toLowerCase()}`"
      >
          <Minus class="text-primary" :class="{ 'disabled opacity-30': currentHp <= 0 }"/>
      </button>

      <!-- Conteneur Cœur central agrandi -->
      <div
        class="relative mx-auto aspect-square w-full max-w-36 sm:max-w-44 md:max-w-48 transition-transform duration-300"
        :class="{ 'animate-heartbeat': isBeating }"
      >
        <!-- Cœur d'arrière-plan (Vide / Muted) -->
        <svg
          class="absolute inset-0 w-full h-full text-base-300 fill-current drop-shadow-xl"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>

        <!-- Cœur de remplissage (Niveau dynamique de bas en haut) -->
        <div
          class="absolute inset-0 overflow-hidden transition-[clip-path] duration-500 ease-out"
          :style="{ clipPath: `inset(${100 - hpPercentage}% 0 0 0)` }"
        >
          <svg
            class="absolute inset-0 h-full w-full fill-current transition-colors duration-300"
            :class="hpColorClass"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <!-- Valeurs superposées exactement au centre du cœur -->
        <div
          class="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <div class="flex flex-col items-center justify-center text-base-content leading-none">
            <!-- Champ éditable pour les PV actuels (centré au milieu du cœur) -->
            <input
              v-if="editable"
              type="number"
              v-model.number="currentHp"
              min="0"
              :max="resolvedMaxHp"
              aria-label="Points de vie actuels"
              class="w-16 h-8 bg-transparent text-center text-4xl font-black[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none sm:h-16 sm:w-20 sm:text-5xl"
            />
            <span
              v-else
              class="w-16 text-center text-4xl font-black sm:w-20 sm:text-5xl"
            >{{ clampedCurrentHp }}</span>
            <span class="text-sm font-bold opacity-85 sm:text-base">/ {{ resolvedMaxHp }}</span>
          </div>
        </div>
      </div>

      <!-- Bouton + (Incrémenter) -->
      <button
        v-if="editable"
        type="button"
        @click="increase"
        :disabled="currentHp >= maxHp"
        class="btn btn-circle btn-sm min-h-11 min-w-11 border border-base-300 bg-base-100 text-base-content transition-transform active:scale-95"
        :aria-label="`Augmenter les ${label.toLowerCase()}`"
      >
          <Plus class="text-primary" :class="{ 'disabled opacity-30': currentHp >= maxHp }"/>
      </button>
      </div>
    </div>
  </article>
</template>

<style scoped>

/* Animation de battement de cœur */
@keyframes heartbeat {
  0% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.12);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.12);
  }
  70% {
    transform: scale(1);
  }
}

.animate-heartbeat {
  animation: heartbeat v-bind(heartBeatFrequency) ease-in-out;
}
</style>