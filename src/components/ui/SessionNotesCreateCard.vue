<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDeviceBreakpoint } from '../../composables/useDeviceBreakpoint'
import type { SessionSummary } from '../../types/domain'
import AppCard from './AppCard.vue'
import SessionNoteCreateFields from './SessionNoteCreateFields.vue'

interface SessionNoteCreateForm {
  title: string
  contentText: string
  isVisible: boolean
  sessionId: string
}

const props = defineProps<{
  title: string
  isSessionArchived: boolean
  isMj: boolean
  creating: boolean
  createError: string | null
  createContentError: string | null
  createForm: SessionNoteCreateForm
  sessions: SessionSummary[]
  selectedSessionId: string | null | undefined
  formatSessionLabel: (session: SessionSummary) => string
}>()

const emit = defineEmits<{
  create: []
  'patch:createForm': [patch: Partial<SessionNoteCreateForm>]
}>()

// Tailwind `md:` starts at 768px.
const { isMobile } = useDeviceBreakpoint({ mobileMaxWidth: 767 })
const dialogRef = ref<HTMLDialogElement | null>(null)

watch(
  () => props.creating,
  (isCreating, wasCreating) => {
    if (wasCreating && !isCreating && !props.createError) {
      dialogRef.value?.close()
    }
  }
)
</script>

<template>
  <AppCard :title="title" compact>
    <div class="space-y-3">
      <div v-if="isSessionArchived" class="alert alert-warning alert-soft text-sm">
        <span>Campagne archivée: ajout de note indisponible.</span>
      </div>

      <template v-if="isMobile">
        <button
          type="button"
          class="btn btn-sm min-h-11 w-full ui-critical-action"
          :disabled="isSessionArchived"
          @click="dialogRef?.showModal()"
        >
          {{ createForm.contentText.trim() ? 'Reprendre le brouillon' : 'Ajouter une note' }}
        </button>

        <dialog ref="dialogRef" class="modal modal-top" aria-labelledby="notes-create-title">
          <div class="modal-box grim-modal-box max-h-[calc(100vh-2rem)] w-11/12 overflow-y-auto p-4">
            <button
              type="button"
              class="btn btn-circle min-h-11 min-w-11 grim-modal-close absolute right-3 top-3"
              aria-label="Fermer la modale"
              @click="dialogRef?.close()"
            >
              ✕
            </button>
            <h3 id="notes-create-title" class="grim-modal-title mb-3 pr-12 text-xl">{{ title }}</h3>
            <SessionNoteCreateFields
              :is-session-archived="isSessionArchived"
              :is-mj="isMj"
              :creating="creating"
              :create-error="createError"
              :create-content-error="createContentError"
              :create-form="createForm"
              :sessions="sessions"
              :selected-session-id="selectedSessionId"
              :format-session-label="formatSessionLabel"
              @create="emit('create')"
              @patch:create-form="emit('patch:createForm', $event)"
            />
          </div>
          <form method="dialog" class="modal-backdrop">
            <button tabindex="-1">Fermer</button>
          </form>
        </dialog>
      </template>

      <SessionNoteCreateFields
        v-else
        :is-session-archived="isSessionArchived"
        :is-mj="isMj"
        :creating="creating"
        :create-error="createError"
        :create-content-error="createContentError"
        :create-form="createForm"
        :sessions="sessions"
        :selected-session-id="selectedSessionId"
        :format-session-label="formatSessionLabel"
        @create="emit('create')"
        @patch:create-form="emit('patch:createForm', $event)"
      />
    </div>
  </AppCard>
</template>
