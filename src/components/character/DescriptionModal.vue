<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  title: string | null
  content: string | null
}>()

const emit = defineEmits<{
  close: []
  closed: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)

defineExpose({ dialog })
</script>

<template>
  <dialog ref="dialog" class="modal modal-top sm:modal-middle" @close="emit('closed')">
    <div class="modal-box grim-modal-box max-w-lg p-6">
      <button
        type="button"
        class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3 min-h-11 min-w-11"
        aria-label="Fermer"
        @click="emit('close')"
      >
        ✕
      </button>
      <h3 class="grim-modal-title pr-12 text-2xl">{{ title || 'Description' }}</h3>
      <p class="mt-3 whitespace-pre-line text-sm opacity-90">{{ content || 'Aucune description.' }}</p>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>
