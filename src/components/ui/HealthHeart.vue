<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: number;
    maxHp: number;
  }>(),
  {
    modelValue: 10,
    maxHp: 15,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

// Animation du battement de cœur
const isBeating = ref(false);

const heartBeatFrequency = computed(() => {
  if (currentHp.value <= 3) return '200ms';
  if (currentHp.value <= props.maxHp / 2) return '450ms';
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
    const sanitized = Math.min(props.maxHp, Math.max(0, Number(val) || 0));
    if (sanitized !== props.modelValue) {
      emit('update:modelValue', sanitized);
      triggerHeartbeat();
    }
  },
});

// Calcul du pourcentage de remplissage
const hpPercentage = computed(() => {
  if (props.maxHp <= 0) return 0;
  return Math.min(100, Math.max(0, (currentHp.value / props.maxHp) * 100));
});

// Code couleur dynamique : Vert > 50%, Orange entre 3PV et 50%, Rouge <= 3PV
const hpColorClass = computed(() => {
  if (currentHp.value <= 3) return 'text-error';
  if (currentHp.value <= props.maxHp / 2) return 'text-warning';
  return 'text-success';
});

// Incrémentation et décrémentation
const decrease = () => {
  if (currentHp.value > 0) currentHp.value--;
};

const increase = () => {
  if (currentHp.value < props.maxHp) currentHp.value++;
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
  <div class="flex flex-col items-center justify-center text-2xl">
    <span class="font-bold text-primary tracking-wider mb-2">PV</span>

    <div class="flex items-center justify-center gap-4 sm:gap-6 p-4 select-none">
      <!-- Bouton - (Décrémenter) -->
      <button
        type="button"
        @click="decrease"
        :disabled="currentHp <= 0"
        class="btn btn-circle btn-lg border-2 border-base-300 base-content-200 hover:base-content-300 hover:text-base-content shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 text-2xl font-bold"
        aria-label="Diminuer les points de vie"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <!-- Conteneur Cœur central agrandi -->
      <div
        class="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center transition-transform duration-300"
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
          class="absolute inset-x-0 bottom-0 overflow-hidden transition-all duration-500 ease-out flex items-end justify-center"
          :style="{ height: `${hpPercentage}%` }"
        >
          <svg
            class="w-56 h-56 sm:w-64 sm:h-64 fill-current transition-colors duration-300 drop-shadow-2xl absolute bottom-0"
            :class="hpColorClass"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <!-- Valeurs superposées exactement au centre du cœur -->
        <div
          class="absolute inset-0 z-10 flex items-center justify-center text-white pointer-events-none"
        >
          <div class="flex items-baseline justify-center pointer-events-auto -mt-2">
            <!-- Champ éditable pour les PV actuels (centré au milieu du cœur) -->
            <input
              type="number"
              v-model.number="currentHp"
              min="0"
              :max="maxHp"
              aria-label="Points de vie actuels"
              class="w-20 sm:w-24 bg-transparent 
              text-center text-5xl sm:text-6xl 
              text-base-content p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-0 border-none"
            />
            <!-- Affichage secondaire des PV Max (placé à droite, légèrement plus petit) -->
            <span class="text-xl text-base-content sm:text-2xl font-bold opacity-80 -ml-1">/ {{ maxHp }}</span>
          </div>
        </div>
      </div>

      <!-- Bouton + (Incrémenter) -->
      <button
        type="button"
        @click="increase"
        :disabled="currentHp >= maxHp"
        class="btn btn-circle btn-lg border-2 border-base-300 base-content-200 hover:base-content-300 hover:text-base-content shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-30 text-2xl font-bold"
        aria-label="Augmenter les points de vie"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  </div>
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