<script setup lang="ts">
import { ref, useId } from 'vue'
import type { NewItemForm } from '../../composables/useCharacterCatalogActions'
import type { CatalogItem } from '../../types/domain'
import { ITEM_QUALITY_OPTIONS } from '../../utils/inventoryQuality'
import SearchInput from '../ui/SearchInput.vue'
import { useIsOnline } from '../../composables/useIsOnline'

type ItemQuality = (typeof ITEM_QUALITY_OPTIONS)[number]

defineProps<{
  section: string
  sectionLabel: string
  options: CatalogItem[]
  hiddenOptionsCount: number
  selectedIds: string[]
  selectedLabels: Record<string, string>
  searchLoading: boolean
  error: string | null
  adding: boolean
  creating: boolean
  formatLabel: (option: CatalogItem) => string
}>()

const emit = defineEmits<{
  close: []
  closed: []
  toggle: [id: string]
  remove: [id: string]
  'confirm-add': []
  'confirm-create': []
}>()

const query = defineModel<string>('query', { required: true })
const mode = defineModel<'search' | 'create'>('mode', { required: true })
const itemsQuality = defineModel<ItemQuality>('itemsQuality', { required: true })
const itemsQuantity = defineModel<number>('itemsQuantity', { required: true })
const form = defineModel<NewItemForm>('form', { required: true })

const isOnline = useIsOnline()
const titleId = useId()
const dialog = ref<HTMLDialogElement | null>(null)

defineExpose({ dialog })
</script>

<template>
  <dialog ref="dialog" class="modal modal-top sm:modal-middle" :aria-labelledby="titleId" @close="emit('closed')">
    <div class="modal-box grim-modal-box flex max-h-[calc(100vh-2rem)] w-11/12 max-w-2xl flex-col overflow-hidden p-4 sm:p-6">
      <button
        type="button"
        class="btn btn-sm btn-circle grim-modal-close absolute right-4 top-4 min-h-11 min-w-11"
        aria-label="Fermer"
        @click="emit('close')"
      >
        ✕
      </button>
      <h3 :id="titleId" class="grim-modal-title mb-4 px-10 text-center text-2xl text-primary sm:text-3xl">
        Ajouter des {{ sectionLabel }}
      </h3>

      <div v-if="section === 'items'" class="mb-4 flex justify-center">
        <div class="join" role="group" aria-label="Mode d'ajout">
          <button
            type="button"
            class="btn btn-sm join-item min-h-11 ui-critical-action"
            :class="mode === 'search' ? 'btn-active' : ''"
            :aria-pressed="mode === 'search'"
            @click="mode = 'search'"
          >
            Recherche
          </button>
          <button
            type="button"
            class="btn btn-sm join-item min-h-11 ui-critical-action"
            :class="mode === 'create' ? 'btn-active' : ''"
            :aria-pressed="mode === 'create'"
            @click="mode = 'create'"
          >
            Création
          </button>
        </div>
      </div>

      <div class="space-y-4 overflow-y-auto pr-1">
        <template v-if="section === 'items' && mode === 'create'">
          <div class="grid gap-3">
            <label class="fieldset">
              <span class="fieldset-legend">Nom</span>
              <input v-model="form.name" type="text" class="input min-h-11" maxlength="100" placeholder="Nom de l'équipement" />
            </label>

            <label class="fieldset">
              <span class="fieldset-legend">Description</span>
              <textarea
                v-model="form.description"
                class="textarea min-h-24"
                maxlength="3000"
                placeholder="Description (optionnelle)"
              ></textarea>
            </label>

            <div class="grid gap-3 sm:grid-cols-2">
              <label class="fieldset">
                <span class="fieldset-legend">Qualité</span>
                <select v-model="form.quality" class="select min-h-11">
                  <option v-for="quality in ITEM_QUALITY_OPTIONS" :key="quality" :value="quality">{{ quality }}</option>
                </select>
              </label>

              <label class="fieldset">
                <span class="fieldset-legend">Encombrement</span>
                <input v-model.number="form.encumbrance" type="number" min="0" class="input min-h-11" />
              </label>
            </div>

            <label class="fieldset">
              <span class="fieldset-legend">Quantité</span>
              <input v-model.number="form.quantity" type="number" min="1" class="input min-h-11" />
            </label>
          </div>
        </template>

        <template v-else>
          <div class="sticky top-0 z-10 bg-base-100/95 py-1 backdrop-blur">
            <SearchInput v-model="query" :placeholder="`Chercher des ${sectionLabel}`" class="w-full" />
            <p class="mt-2 text-xs opacity-70">Saisissez au moins 2 caractères pour lancer la recherche.</p>
          </div>

          <div v-if="searchLoading" class="flex items-center gap-2 text-sm opacity-70">
            <span class="loading loading-spinner loading-xs" aria-hidden="true" />
            Recherche en cours...
          </div>

          <div class="overflow-hidden rounded-lg border border-base-300 bg-base-100">
            <div class="max-h-64 overflow-y-auto">
              <ul v-if="options.length > 0" class="menu menu-compact w-full">
                <li
                  v-for="option in options"
                  :key="option.id"
                  :class="[
                    'border-l-4 transition-colors',
                    selectedIds.includes(option.id) ? 'border-l-warning bg-base-300' : 'border-l-transparent hover:bg-base-200',
                  ]"
                >
                  <label class="label min-h-11 cursor-pointer justify-start gap-3 rounded-none px-4 py-3">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-md"
                      :checked="selectedIds.includes(option.id)"
                      @change="emit('toggle', option.id)"
                    />
                    <div class="min-w-0 flex-1">
                      <div class="flex min-w-0 flex-wrap items-center gap-2">
                        <span class="break-words font-medium leading-tight">{{ formatLabel(option) }}</span>
                        <span v-if="selectedIds.includes(option.id)" class="badge badge-warning badge-sm">Sélectionné</span>
                      </div>
                      <p v-if="option.specialization" class="text-xs opacity-60">{{ option.specialization }}</p>
                    </div>
                  </label>
                </li>
              </ul>
              <p v-else class="py-8 text-center text-sm opacity-70">
                {{ query.trim().length < 2 ? 'Saisissez au moins 2 caractères.' : 'Aucun élément trouvé.' }}
              </p>
            </div>
          </div>

          <p v-if="hiddenOptionsCount > 0" class="px-1 text-xs opacity-70">
            Affichage limité aux {{ options.length }} premiers résultats. Précisez votre recherche pour affiner.
          </p>

          <div v-if="section === 'items'" class="rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="mb-3">
              <p class="text-sm font-semibold">Paramètres appliqués à toute la sélection</p>
              <p class="text-xs opacity-70">
                La même qualité et la même quantité seront attribuées à tous les équipements sélectionnés.
              </p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="fieldset">
                <span class="fieldset-legend">Qualité</span>
                <select v-model="itemsQuality" class="select min-h-11">
                  <option v-for="quality in ITEM_QUALITY_OPTIONS" :key="quality" :value="quality">{{ quality }}</option>
                </select>
              </label>

              <label class="fieldset">
                <span class="fieldset-legend">Quantité</span>
                <input v-model.number="itemsQuantity" type="number" min="1" class="input min-h-11" />
              </label>
            </div>
          </div>

          <div v-if="selectedIds.length > 0" class="rounded-lg border border-base-300 bg-base-200 p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold">{{ selectedIds.length }} sélectionné(s)</p>
              <p class="text-xs opacity-70">Cliquez sur un badge pour le retirer.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="selectedId in selectedIds"
                :key="selectedId"
                type="button"
                class="btn btn-sm btn-outline btn-neutral h-auto min-h-11 max-w-full justify-start gap-2 whitespace-normal px-3 py-2 text-left normal-case"
                :aria-label="`Retirer ${selectedLabels[selectedId] || selectedId} de la sélection`"
                @click="emit('remove', selectedId)"
              >
                <span class="break-words">{{ selectedLabels[selectedId] || selectedId }}</span>
                <span aria-hidden="true" class="text-xs opacity-70">✕</span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <div v-if="error" role="alert" class="alert alert-error alert-soft mt-3">
        <span>{{ error }}</span>
      </div>

      <div class="grim-modal-actions sticky bottom-0 mt-3 flex items-center justify-end gap-3 border-t border-base-300 bg-base-100/95 pt-3 backdrop-blur">
        <button type="button" class="btn btn-sm btn-ghost min-h-11 ui-critical-action" @click="emit('close')">Annuler</button>
        <button
          v-if="section === 'items' && mode === 'create'"
          type="button"
          class="btn btn-sm min-h-11 ui-critical-action"
          :disabled="creating || !isOnline"
          @click="emit('confirm-create')"
        >
          <span v-if="creating" class="loading loading-spinner loading-xs" aria-hidden="true" />
          Créer et ajouter
        </button>
        <button
          v-else
          type="button"
          class="btn btn-sm min-h-11 ui-critical-action"
          :disabled="adding || !isOnline || selectedIds.length === 0"
          @click="emit('confirm-add')"
        >
          <span v-if="adding" class="loading loading-spinner loading-xs" aria-hidden="true" />
          Ajouter ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button tabindex="-1">Fermer</button>
    </form>
  </dialog>
</template>
