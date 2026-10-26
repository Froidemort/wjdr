<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { CharacterSkill, CharacterTalent } from '../../types/domain'
import { formatNamedWithSpecialization } from '../../utils/characterSheet'
import SearchInput from '../ui/SearchInput.vue'
import CharacterSkillsPanel from './CharacterSkillsPanel.vue'
import CharacterTalentsPanel from './CharacterTalentsPanel.vue'

type MasteryLevel = 1 | 2 | 3
type Filter = 'all' | 'skills' | 'talents'

const props = defineProps<{
  skills: CharacterSkill[]
  talents: CharacterTalent[]
  editable: boolean
  busyKey: string | null
  skillsMessage: string | null
  talentsMessage: string | null
}>()

const emit = defineEmits<{
  'add-skills': []
  'add-talents': []
  'delete-skill': [skillId: string]
  'delete-talent': [talentId: string]
  'change-mastery': [skillId: string, level: MasteryLevel]
  'show-description': [title: string, description: string | null]
}>()

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'skills', label: 'Compétences' },
  { id: 'talents', label: 'Talents' },
]

const filter = ref<Filter>('all')
const query = ref('')

const normalizedQuery = computed(() => query.value.trim().toLocaleLowerCase('fr'))

function matches(name: string, specialization: string | null): boolean {
  return (
    !normalizedQuery.value ||
    formatNamedWithSpecialization(name, specialization).toLocaleLowerCase('fr').includes(normalizedQuery.value)
  )
}

const filteredSkills = computed(() =>
  props.skills.filter((skill) => matches(skill.name, skill.specialization))
)
const filteredTalents = computed(() =>
  props.talents.filter((talent) => matches(talent.name, talent.specialization))
)

interface PendingDelete {
  kind: 'skill' | 'talent'
  id: string
  name: string
}

const deleteDialog = ref<HTMLDialogElement | null>(null)
const deleteTitleId = useId()
const pendingDelete = ref<PendingDelete | null>(null)

const deleteTitle = computed(() => {
  if (!pendingDelete.value) return null
  return pendingDelete.value.kind === 'skill' ? 'Supprimer la compétence ?' : 'Supprimer le talent ?'
})

function requestDelete(kind: PendingDelete['kind'], id: string): void {
  const target =
    kind === 'skill'
      ? props.skills.find((skill) => skill.skillId === id)
      : props.talents.find((talent) => talent.talentId === id)
  if (!target) return

  pendingDelete.value = { kind, id, name: formatNamedWithSpecialization(target.name, target.specialization) }
  deleteDialog.value?.showModal()
}

function closeDeleteModal(): void {
  if (deleteDialog.value?.open) {
    deleteDialog.value.close()
    return
  }
  pendingDelete.value = null
}

function confirmDelete(): void {
  const target = pendingDelete.value
  closeDeleteModal()
  if (!target) return

  if (target.kind === 'skill') {
    emit('delete-skill', target.id)
  } else {
    emit('delete-talent', target.id)
  }
}
</script>

<template>
  <section
    id="character-panel-skills"
    role="tabpanel"
    aria-labelledby="character-tab-skills"
    class="scroll-mt-4 space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
  >
    <h2 class="text-lg font-semibold">Compétences et Talents</h2>

    <div class="space-y-2">
      <SearchInput v-model="query" placeholder="Filtrer par nom" />
      <div class="join" role="group" aria-label="Type d'éléments">
        <button
          v-for="option in FILTERS"
          :key="option.id"
          type="button"
          class="btn btn-sm join-item min-h-11 ui-critical-action"
          :class="filter === option.id ? 'btn-active' : ''"
          :aria-pressed="filter === option.id"
          @click="filter = option.id"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <CharacterSkillsPanel
      v-if="filter !== 'talents'"
      :skills="filteredSkills"
      :editable="editable"
      :busy-key="busyKey"
      :success-message="skillsMessage"
      @add="emit('add-skills')"
      @delete="requestDelete('skill', $event)"
      @change-mastery="(skillId, level) => emit('change-mastery', skillId, level)"
      @show-description="(title, description) => emit('show-description', title, description)"
    />

    <CharacterTalentsPanel
      v-if="filter !== 'skills'"
      :talents="filteredTalents"
      :editable="editable"
      :busy-key="busyKey"
      :success-message="talentsMessage"
      @add="emit('add-talents')"
      @delete="requestDelete('talent', $event)"
      @show-description="(title, description) => emit('show-description', title, description)"
    />

    <dialog
      ref="deleteDialog"
      class="modal modal-top sm:modal-middle"
      :aria-labelledby="deleteTitleId"
      @close="pendingDelete = null"
    >
      <div class="modal-box grim-modal-box max-w-md p-6">
        <button
          type="button"
          class="btn btn-sm btn-circle grim-modal-close absolute right-3 top-3 min-h-11 min-w-11"
          aria-label="Fermer"
          @click="closeDeleteModal"
        >
          ✕
        </button>
        <h3 :id="deleteTitleId" class="grim-modal-title mb-2 px-8 text-center text-2xl">{{ deleteTitle }}</h3>
        <p class="break-words text-center text-sm opacity-80 [overflow-wrap:anywhere]">
          <span class="font-semibold">{{ pendingDelete?.name }}</span> sera retiré de la fiche.
        </p>

        <div class="grim-modal-actions mt-4 flex flex-wrap items-center justify-end gap-2">
          <button type="button" class="btn btn-sm min-h-11 ui-critical-action" autofocus @click="closeDeleteModal">
            Annuler
          </button>
          <button type="button" class="btn btn-error btn-sm min-h-11" @click="confirmDelete">Supprimer</button>
        </div>
      </div>

      <form method="dialog" class="modal-backdrop">
        <button tabindex="-1">Fermer</button>
      </form>
    </dialog>
  </section>
</template>
