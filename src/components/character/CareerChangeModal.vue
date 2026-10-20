<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CatalogItem } from '../../types/domain'
import SearchInput from '../ui/SearchInput.vue'

const props = defineProps<{
  options: CatalogItem[]
  pathOptionsCount: number
  pathLoading: boolean
  searchLoading: boolean
  selectedId: string | null
  selectedName: string | null
  error: string | null
  successMessage: string | null
  busy: boolean
}>()

const emit = defineEmits<{
  close: []
  closed: []
  select: [id: string, name: string]
  confirm: []
}>()

const filterMode = defineModel<'paths' | 'all'>('filterMode', { required: true })
const query = defineModel<string>('query', { required: true })

const dialog = ref<HTMLDialogElement | null>(null)

defineExpose({ dialog })

const FILTERS = [
  { id: 'paths', label: 'Débouchés' },
  { id: 'all', label: 'Toutes' },
] as const

const emptyMessage = computed(() => {
  if (filterMode.value === 'all') {
    return query.value.trim().length < 2
      ? 'Commencez à taper pour rechercher une carrière.'
      : 'Aucune carrière trouvée.'
  }

  return props.pathOptionsCount === 0
    ? 'Aucun débouché disponible pour la carrière actuelle.'
    : 'Aucune carrière ne correspond à votre recherche.'
})
</script>

<template>
  <dialog ref="dialog" class="modal modal-top sm:modal-middle" @close="emit('closed')">
    <div class="modal-box grim-modal-box p-6">
      <button
        type="button"
        class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3 min-h-11 min-w-11"
        aria-label="Fermer"
        @click="emit('close')"
      >
        ✕
      </button>
      <h3 class="grim-modal-title mb-4 px-8 text-center text-2xl sm:text-3xl">Changer de carrière</h3>

      <div class="space-y-3">
        <div class="join" role="group" aria-label="Filtre des carrières">
          <button
            v-for="option in FILTERS"
            :key="option.id"
            type="button"
            class="btn btn-sm join-item min-h-11 ui-critical-action"
            :class="filterMode === option.id ? 'btn-active' : ''"
            :aria-pressed="filterMode === option.id"
            @click="filterMode = option.id"
          >
            {{ option.label }}
          </button>
        </div>
        <SearchInput v-model="query" placeholder="Chercher une carrière" />
        <p class="text-xs opacity-70">
          {{ filterMode === 'all' ? 'Saisissez au moins 2 caractères.' : 'Filtre actif: débouchés de la carrière actuelle.' }}
        </p>
        <div v-if="pathLoading" class="flex items-center gap-2 text-sm opacity-70">
          <span class="loading loading-spinner loading-xs" aria-hidden="true" />
          Chargement des débouchés...
        </div>
        <div v-if="searchLoading" class="flex items-center gap-2 text-sm opacity-70">
          <span class="loading loading-spinner loading-xs" aria-hidden="true" />
          Recherche des carrières...
        </div>

        <div class="max-h-64 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2">
          <ul v-if="options.length > 0" class="menu menu-sm w-full">
            <li v-for="option in options" :key="option.id">
              <button
                type="button"
                class="min-h-11 justify-start"
                :class="selectedId === option.id ? 'menu-active' : ''"
                @click="emit('select', option.id, option.name)"
              >
                {{ option.name }}
              </button>
            </li>
          </ul>
          <p v-else class="px-2 py-1 text-sm opacity-70">{{ emptyMessage }}</p>
        </div>

        <p v-if="selectedName" class="text-sm opacity-80">Sélection: {{ selectedName }}</p>
        <div v-if="successMessage" role="status" class="alert alert-success alert-soft text-sm">
          <span>{{ successMessage }}</span>
        </div>
        <div v-if="error" role="alert" class="alert alert-error alert-soft text-sm">
          <span>{{ error }}</span>
        </div>

        <div class="grim-modal-actions flex items-center justify-end gap-2">
          <button type="button" class="btn btn-sm min-h-11 ui-critical-action" @click="emit('close')">Annuler</button>
          <button type="button" class="btn btn-sm min-h-11 ui-critical-action" :disabled="busy" @click="emit('confirm')">
            <span v-if="busy" class="loading loading-spinner loading-xs" aria-hidden="true" />
            Valider
          </button>
        </div>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button>Fermer</button>
    </form>
  </dialog>
</template>
