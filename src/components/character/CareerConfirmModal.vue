<script setup lang="ts">
import { ref, useId } from 'vue'
import { useIsOnline } from '../../composables/useIsOnline'

defineProps<{
  careerName: string | null
  rows: ReadonlyArray<{ statCode: string; value: number }>
  error: string | null
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  closed: []
  apply: [applyCharacteristics: boolean]
}>()

const isOnline = useIsOnline()
const titleId = useId()
const dialog = ref<HTMLDialogElement | null>(null)

defineExpose({ dialog })
</script>

<template>
  <dialog ref="dialog" class="modal modal-top sm:modal-middle" :aria-labelledby="titleId" @close="emit('closed')">
    <div class="modal-box grim-modal-box p-6">
      <button
        type="button"
        class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3 min-h-11 min-w-11"
        aria-label="Fermer"
        @click="emit('close')"
      >
        ✕
      </button>
      <h3 :id="titleId" class="grim-modal-title mb-2 px-8 text-center text-2xl sm:text-3xl">Appliquer le profil de carrière</h3>

      <p class="text-sm opacity-80">
        Nouvelle carrière: <span class="font-semibold">{{ careerName }}</span>
      </p>
      <p class="mt-1 text-sm opacity-80">
        Choisissez si vous souhaitez remplacer les avancées totales du personnage avec le profil de cette carrière.
      </p>

      <div class="mt-4 rounded-box border border-base-300 bg-base-100 p-3">
        <p class="mb-2 text-xs opacity-70">Profil de carrière proposé (avancées totales)</p>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <div
            v-for="entry in rows"
            :key="`career-profile-${entry.statCode}`"
            class="rounded-lg border border-base-300 bg-base-200 px-2 py-1 text-center"
          >
            <p class="text-xs font-semibold">{{ entry.statCode }}</p>
            <p class="text-sm tabular-nums">{{ entry.value }}</p>
          </div>
        </div>
      </div>

      <div v-if="error" role="alert" class="alert alert-error alert-soft mt-4 text-sm">
        <span>{{ error }}</span>
      </div>

      <div class="grim-modal-actions mt-4 flex flex-wrap items-center justify-end gap-2">
        <button type="button" class="btn btn-sm min-h-11 ui-critical-action" :disabled="busy || !isOnline" @click="emit('close')">
          Annuler
        </button>
        <button type="button" class="btn btn-sm min-h-11 ui-critical-action" :disabled="busy || !isOnline" @click="emit('apply', false)">
          <span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />
          Ne pas appliquer
        </button>
        <button type="button" class="btn btn-sm min-h-11 ui-critical-action" :disabled="busy || !isOnline" @click="emit('apply', true)">
          <span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />
          Appliquer
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button tabindex="-1">Fermer</button>
    </form>
  </dialog>
</template>
