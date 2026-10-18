<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { MapMarker, MarkerDraft, MarkerType, MarkerVisibility } from '../../types/map'
import { formatLatLng } from '../../utils/mapCoordinates'

const props = defineProps<{
  open: boolean
  types: MarkerType[]
  visibilities: MarkerVisibility[]
  /** Existing marker when editing, otherwise null. */
  marker: MapMarker | null
  /** Position of a new marker. */
  position: { lat: number; lng: number } | null
  saving: boolean
}>()

const emit = defineEmits<{
  submit: [draft: MarkerDraft]
  close: []
}>()

const VISIBILITY_LABELS: Record<MarkerVisibility, string> = {
  private: 'Privé (moi seul)',
  mj: 'MJ uniquement',
  players: 'Tous les joueurs',
}

const dialogRef = ref<HTMLDialogElement | null>(null)
const form = reactive({ name: '', typeId: '', description: '', visibility: 'private' as MarkerVisibility })
const submitAttempted = ref(false)

const coordinates = computed(() => {
  const source = props.marker ?? props.position
  return source ? formatLatLng(source.lat, source.lng) : ''
})
const nameError = computed(() => (submitAttempted.value && !form.name.trim() ? 'Le nom est requis.' : null))

watch(
  () => props.open,
  (isOpen) => {
    if (!dialogRef.value) return

    if (isOpen) {
      form.name = props.marker?.name ?? ''
      form.typeId = props.marker?.typeId ?? props.types[0]?.id ?? ''
      form.description = props.marker?.description ?? ''
      form.visibility = props.marker?.visibility ?? props.visibilities[0] ?? 'private'
      submitAttempted.value = false
      dialogRef.value.showModal()
    } else {
      dialogRef.value.close()
    }
  }
)

function onSubmit(): void {
  submitAttempted.value = true
  const target = props.marker ?? props.position
  if (nameError.value || !form.typeId || !target) return

  emit('submit', {
    typeId: form.typeId,
    name: form.name.trim(),
    description: form.description.trim() || null,
    lat: target.lat,
    lng: target.lng,
    visibility: form.visibility,
  })
}
</script>

<template>
  <dialog ref="dialogRef" class="modal modal-middle" aria-labelledby="marker-form-title" @close="emit('close')">
    <div class="modal-box grim-modal-box max-h-[calc(100vh-2rem)] w-11/12 max-w-lg overflow-y-auto p-4 sm:p-6">
      <button type="button" class="btn btn-circle min-h-11 min-w-11 grim-modal-close absolute right-3 top-3" aria-label="Fermer la modale" @click="emit('close')">✕</button>
      <h3 id="marker-form-title" class="grim-modal-title mb-1 pr-8 text-center text-2xl">
        {{ marker ? 'Modifier le marqueur' : 'Nouveau marqueur' }}
      </h3>
      <p class="mb-4 text-center text-sm opacity-70">{{ coordinates }}</p>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="form-control">
          <label class="label" for="marker-name"><span class="label-text">Nom</span></label>
          <input
            id="marker-name"
            v-model="form.name"
            type="text"
            class="input w-full"
            maxlength="120"
            required
            :aria-invalid="nameError ? 'true' : 'false'"
            :aria-describedby="nameError ? 'marker-name-error' : undefined"
          />
          <p v-if="nameError" id="marker-name-error" class="label text-xs text-error">{{ nameError }}</p>
        </div>

        <div class="form-control">
          <label class="label" for="marker-type"><span class="label-text">Type</span></label>
          <select id="marker-type" v-model="form.typeId" class="select w-full" required>
            <option v-for="type in types" :key="type.id" :value="type.id">{{ type.label }}</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label" for="marker-visibility"><span class="label-text">Visibilité</span></label>
          <select id="marker-visibility" v-model="form.visibility" class="select w-full" :disabled="visibilities.length < 2">
            <option v-for="visibility in visibilities" :key="visibility" :value="visibility">{{ VISIBILITY_LABELS[visibility] }}</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label" for="marker-description"><span class="label-text">Description</span></label>
          <textarea id="marker-description" v-model="form.description" class="textarea min-h-24 w-full" rows="3" maxlength="2000" />
        </div>

        <button type="submit" class="btn ui-critical-action mt-1 w-full" :disabled="saving" :aria-busy="saving ? 'true' : 'false'">
          <span v-if="saving" class="loading loading-spinner loading-sm" aria-hidden="true" />
          <span>Enregistrer</span>
        </button>
      </form>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>
