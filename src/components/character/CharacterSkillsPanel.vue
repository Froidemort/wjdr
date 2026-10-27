<script setup lang="ts">
import { ChevronDown, Info, Plus, Trash2 } from '@lucide/vue'
import { useIsOnline } from '../../composables/useIsOnline'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
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

const isOnline = useIsOnline()

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
  void nextTick(() => {
    document
      .getElementById(`skill-mastery-options-${skillId}`)
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.focus()
  })
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
        :disabled="!isOnline"
        :title="isOnline ? undefined : 'Indisponible hors ligne'"
        @click.stop.prevent="emit('add')"
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>
    <p v-if="skills.length === 0" class="text-sm opacity-70">Aucune compétence.</p>
    <div v-else class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <article v-for="skill in skills" :key="skill.skillId" class="group card relative border border-base-300 bg-base-100">
        <div class="card-body min-w-0 gap-3 p-3">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h4
              class="mb-0 min-w-32 max-w-full flex-1 break-words text-left font-semibold leading-snug [overflow-wrap:anywhere]"
            >
              {{ formatNamedWithSpecialization(skill.name, skill.specialization) }}
            </h4>
            <div class="flex shrink-0 items-center gap-1">
              <span class="badge badge-neutral badge-sm">{{ skill.statCode }}</span>
              <span v-if="!skill.isBasic" class="badge badge-warning badge-sm">Avancée</span>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <span class="badge badge-neutral min-h-8 px-3" aria-label="Niveau de maîtrise">
                {{ masteryLabel(skill.masteryLevel) }}
              </span>
              <button
                v-if="editable"
                :ref="(element) => setTrigger(skill.skillId, element)"
                type="button"
                class="btn btn-ghost btn-sm btn-square min-h-11 min-w-11 opacity-70 hover:opacity-100 focus-visible:opacity-100"
                :title="
                  activeMasteryId === skill.skillId
                    ? 'Fermer le choix du niveau de maîtrise'
                    : 'Modifier le niveau de maîtrise'
                "
                :aria-label="
                  activeMasteryId === skill.skillId
                    ? 'Fermer le choix du niveau de maîtrise'
                    : `Modifier la maîtrise de ${formatNamedWithSpecialization(skill.name, skill.specialization)}`
                "
                :aria-expanded="activeMasteryId === skill.skillId"
                :aria-controls="`skill-mastery-options-${skill.skillId}`"
                :disabled="Boolean(busyKey)"
                :aria-busy="busyKey === `mastery-${skill.skillId}` ? 'true' : 'false'"
                data-skill-mastery-control
                @click="toggleMastery(skill.skillId)"
              >
                <ChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="activeMasteryId === skill.skillId ? 'rotate-180' : ''"
                  aria-hidden="true"
                />
              </button>
            </div>
            <div class="hover-actions ml-auto flex shrink-0 items-center gap-1">
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
                :aria-label="`Supprimer ${formatNamedWithSpecialization(skill.name, skill.specialization)}`"
                @click="emit('delete', skill.skillId)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            v-if="editable && activeMasteryId === skill.skillId"
            :id="`skill-mastery-options-${skill.skillId}`"
            class="absolute inset-0 z-20 flex items-center justify-center rounded-box bg-neutral/20 p-2 backdrop-blur-sm"
            data-skill-mastery-control
            @click.self="closeMastery"
          >
            <div
              class="flex w-full max-w-72 items-center gap-1 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
              role="group"
              aria-label="Choisir le niveau de maîtrise"
            >
              <button
                v-for="level in MASTERY_LEVELS"
                :key="level"
                type="button"
                class="btn btn-ghost btn-sm min-h-11 min-w-0 flex-1 px-2"
                :class="skill.masteryLevel === level ? 'btn-active' : ''"
                :aria-pressed="skill.masteryLevel === level"
                :disabled="Boolean(busyKey)"
                @click="selectMastery(skill.skillId, level)"
              >
                {{ masteryLabel(level) }}
              </button>
            </div>
          </div>

          <div v-if="skill.linkedTalents?.length" class="mt-3 space-y-1.5">
            <div class="text-[10px] font-semibold uppercase tracking-wide opacity-70">Talents liés</div>
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
