<script setup lang="ts">
import { computed, ref } from 'vue'
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
</script>

<template>
  <section
    id="character-panel-skills"
    role="tabpanel"
    aria-labelledby="character-tab-skills"
    class="space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
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
      @delete="emit('delete-skill', $event)"
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
      @delete="emit('delete-talent', $event)"
      @show-description="(title, description) => emit('show-description', title, description)"
    />
  </section>
</template>
