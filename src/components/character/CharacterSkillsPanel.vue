<script setup lang="ts">
import { Info, Plus, Trash2 } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { CharacterSkill } from '../../types/domain'
import { formatNamedWithSpecialization } from '../../utils/characterSheet'

type MasteryLevel = 1 | 2 | 3

defineProps<{
  skills: CharacterSkill[]
  editable: boolean
  busyKey: string | null
  successMessage: string | null
}>()

const emit = defineEmits<{
  add: []
  delete: [skillId: string]
  'change-mastery': [skillId: string, level: MasteryLevel]
  'show-description': [title: string, description: string | null]
}>()

const MASTERY_LEVELS: readonly MasteryLevel[] = [1, 2, 3]
const activeMasteryId = ref<string | null>(null)
const triggers = new Map<string, HTMLElement>()

function masteryLabel(level: MasteryLevel): string {
  return level === 1 ? 'Acquis' : `+${(level - 1) * 10}%`
}

function setTrigger(skillId: string, element: Element | ComponentPublicInstance | null): void {
  if (element instanceof HTMLElement) {
    triggers.set(skillId, element)
  } else {
    triggers.delete(skillId)
  }
}

function closeMastery(): void {
  const trigger = activeMasteryId.value ? triggers.get(activeMasteryId.value) : null
  activeMasteryId.value = null
  trigger?.focus()
}

function toggleMastery(skillId: string): void {
  if (activeMasteryId.value === skillId) {
    closeMastery()
    return
  }

  activeMasteryId.value = skillId
}

function selectMastery(skillId: string, level: MasteryLevel): void {
  emit('change-mastery', skillId, level)
  closeMastery()
}

function onPointerDown(event: PointerEvent): void {
  const target = event.target
  if (activeMasteryId.value && target instanceof Element && !target.closest('[data-skill-mastery-control]')) {
    closeMastery()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && activeMasteryId.value) {
    event.preventDefault()
    closeMastery()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
  triggers.clear()
})
</script>

<template>
  <section aria-labelledby="character-skills-title">
    <h3 id="character-skills-title" class="mb-3 text-base font-semibold">Compétences</h3>
    <div v-if="successMessage" role="status" class="alert alert-success alert-soft mb-3 text-sm">
      <span>{{ successMessage }}</span>
    </div>
    <div v-if="editable" class="mb-3 flex justify-start">
      <button
        class="btn btn-sm btn-square min-h-11 min-w-11"
        aria-label="Ajouter des compétences"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="skills.length === 0" class="text-sm opacity-70">Aucune compétence.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <article v-for="skill in skills" :key="skill.skillId" class="group card border border-base-300 bg-base-100">
        <div class="card-body min-w-0 gap-3 p-3">
          <div class="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex min-w-0 flex-1 flex-wrap items-start gap-2">
              <h4 class="min-w-0 max-w-full break-words text-left font-semibold leading-snug [overflow-wrap:anywhere]">
                {{ formatNamedWithSpecialization(skill.name, skill.specialization) }}
              </h4>
              <span class="badge badge-neutral badge-sm shrink-0 self-start">{{ skill.statCode }}</span>
              <span v-if="!skill.isBasic" class="badge badge-warning badge-sm shrink-0 self-start">Avancée</span>
            </div>
            <div class="hover-actions ml-auto flex shrink-0 items-center gap-1 self-end sm:self-start">
              <button
                v-if="skill.description"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
                aria-label="Afficher la description de la compétence"
                @click="emit('show-description', formatNamedWithSpecialization(skill.name, skill.specialization), skill.description)"
              >
                <Info class="h-4 w-4" />
              </button>
              <button
                v-if="editable"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11"
                :disabled="Boolean(busyKey)"
                :aria-busy="busyKey === `skill-${skill.skillId}` ? 'true' : 'false'"
                :aria-label="`Supprimer ${skill.name}`"
                @click="emit('delete', skill.skillId)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="editable" class="relative w-full self-start sm:w-auto" data-skill-mastery-control>
            <button
              :ref="(element) => setTrigger(skill.skillId, element)"
              type="button"
              class="btn btn-sm h-11 min-h-11 w-full sm:w-auto"
              :aria-expanded="activeMasteryId === skill.skillId"
              :aria-controls="`skill-mastery-options-${skill.skillId}`"
              :disabled="Boolean(busyKey)"
              :aria-busy="busyKey === `mastery-${skill.skillId}` ? 'true' : 'false'"
              @click="toggleMastery(skill.skillId)"
            >
              {{ masteryLabel(skill.masteryLevel) }}
            </button>
            <div
              v-if="activeMasteryId === skill.skillId"
              :id="`skill-mastery-options-${skill.skillId}`"
              class="absolute left-0 top-full z-30 mt-1 w-40 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-1 shadow-xl"
              role="group"
              aria-label="Choisir le niveau de maîtrise"
            >
              <button
                v-for="level in MASTERY_LEVELS"
                :key="level"
                type="button"
                class="btn btn-ghost btn-sm min-h-10 w-full justify-start"
                :class="skill.masteryLevel === level ? 'btn-active' : ''"
                :aria-pressed="skill.masteryLevel === level"
                :disabled="Boolean(busyKey)"
                @click="selectMastery(skill.skillId, level)"
              >
                {{ masteryLabel(level) }}
              </button>
            </div>
          </div>
          <span v-else class="badge badge-neutral min-h-11 self-start px-3" aria-label="Niveau de maîtrise">
            {{ masteryLabel(skill.masteryLevel) }}
          </span>

          <div v-if="skill.linkedTalents?.length" class="mt-3 space-y-1.5">
            <div class="text-[10px] font-semibold uppercase tracking-wide opacity-60">Talents liés</div>
            <div class="flex min-w-0 flex-wrap gap-1.5">
              <button
                v-for="talent in skill.linkedTalents"
                :key="`${skill.skillId}-${talent.talentId}`"
                type="button"
                class="btn btn-xs btn-outline h-auto min-h-8 max-w-full justify-start whitespace-normal break-words px-2 text-left [overflow-wrap:anywhere]"
                @click="emit('show-description', formatNamedWithSpecialization(talent.name, talent.specialization), talent.description)"
              >
                {{ formatNamedWithSpecialization(talent.name, talent.specialization) }}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
