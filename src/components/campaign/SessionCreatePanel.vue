<script setup lang="ts">
import { X } from '@lucide/vue'
import { nextTick, ref, watch } from 'vue'

interface SessionCreatePanelForm {
  date: string
  name: string
}

const props = defineProps<{
  open: boolean
  form: SessionCreatePanelForm
  loading: boolean
  error: string | null
  dateError: string | null
}>()

const emit = defineEmits<{
  'patch:form': [patch: Partial<SessionCreatePanelForm>]
  submit: []
  created: []
  close: []
}>()

const dateInputRef = ref<HTMLInputElement | null>(null)

function onInput(key: keyof SessionCreatePanelForm, event: Event): void {
  emit('patch:form', { [key]: (event.target as HTMLInputElement).value })
}

function onSubmit(): void {
  if (props.loading) {
    return
  }
  emit('submit')
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      dateInputRef.value?.focus()
    }
  }
)

// A finished request without validation or server error means the session was created.
watch(
  () => props.loading,
  (isLoading, wasLoading) => {
    if (wasLoading && !isLoading && !props.error && !props.dateError) {
      emit('created')
    }
  }
)
</script>

<template>
  <div v-if="open">
    <div class="fixed inset-0 z-40 bg-neutral/50 lg:hidden" aria-hidden="true" @click="emit('close')" />
    <aside
      role="dialog"
      aria-labelledby="session-create-panel-title"
      class="fixed inset-y-0 right-0 z-50 flex w-full flex-col gap-4 overflow-y-auto border-l border-base-300 bg-base-100 p-4 shadow-xl sm:p-6 lg:w-96"
      @keydown.esc="emit('close')"
    >
      <header class="flex items-center justify-between gap-2">
        <h2 id="session-create-panel-title" class="text-lg font-semibold">Nouvelle session</h2>
        <button type="button" class="btn btn-ghost btn-sm btn-square" aria-label="Fermer" @click="emit('close')">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <form
        class="flex flex-col gap-4"
        @submit.prevent="onSubmit"
        @keydown.ctrl.enter.prevent="onSubmit"
        @keydown.meta.enter.prevent="onSubmit"
      >
        <label class="form-control">
          <span class="label-text mb-2">Date</span>
          <input
            ref="dateInputRef"
            :value="form.date"
            type="date"
            class="input input-bordered w-full"
            :aria-invalid="dateError ? 'true' : 'false'"
            :aria-describedby="dateError ? 'session-create-panel-date-error' : undefined"
            required
            @input="onInput('date', $event)"
          />
          <p v-if="dateError" id="session-create-panel-date-error" class="label text-error text-xs">
            {{ dateError }}
          </p>
        </label>

        <label class="form-control">
          <span class="label-text mb-2">Titre optionnel</span>
          <input
            :value="form.name"
            type="text"
            class="input input-bordered w-full"
            maxlength="100"
            placeholder="Ex. Arrivée à Middenheim"
            @input="onInput('name', $event)"
          />
        </label>

        <div v-if="error" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ error }}</span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <span class="text-xs opacity-70">Ctrl+Entrée pour valider</span>
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="emit('close')">Annuler</button>
            <button
              type="submit"
              class="btn btn-primary btn-sm"
              :disabled="loading"
              :aria-busy="loading ? 'true' : 'false'"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs" aria-hidden="true" />
              Créer la session
            </button>
          </div>
        </div>
      </form>
    </aside>
  </div>
</template>
