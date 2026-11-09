<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CharacterSkill, CharacterStatValue, CharacterTalent } from '../../types/domain'
import { formatNamedWithSpecialization, normalizeStatCode, sortStatsByCharacteristicOrder } from '../../utils/characterSheet'
import { characterTalentReminders } from '../../utils/characterTalentReminders'
import CharacteristicCard from '../ui/CharacteristicCard.vue'
import CharacterSection from './CharacterSection.vue'

const props = defineProps<{
  stats: CharacterStatValue[]
  skills: CharacterSkill[]
  talents: CharacterTalent[]
  editable: boolean
}>()

const emit = defineEmits<{
  'stat-tick': [statCode: string, step: number]
  'stat-base-change': [statCode: string, baseValue: number]
  'stat-total-advanced-change': [statCode: string, totalAdvanced: number]
}>()

const expandedCodes = ref<string[]>([])
const reminders = computed(() => characterTalentReminders(props.skills, props.talents))

const visibleStats = computed(() =>
  sortStatsByCharacteristicOrder(
    props.stats.filter((stat) => normalizeStatCode(stat.statCode) !== 'PD')
  )
)
const allExpanded = computed(
  () => visibleStats.value.length > 0 && visibleStats.value.every((stat) => expandedCodes.value.includes(stat.statCode))
)

function toggleStat(statCode: string): void {
  expandedCodes.value = expandedCodes.value.includes(statCode)
    ? expandedCodes.value.filter((code) => code !== statCode)
    : [...expandedCodes.value, statCode]
}

function toggleAll(): void {
  expandedCodes.value = allExpanded.value ? [] : visibleStats.value.map((stat) => stat.statCode)
}
</script>

<template>
  <section
    id="character-panel-stats"
    role="tabpanel"
    aria-labelledby="character-tab-stats"
    class="scroll-mt-20 space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
  >
    <CharacterSection title="Caractéristiques">
      <div class="flex flex-wrap items-center justify-start gap-3 border-b border-base-300 pb-3">
        <button
          type="button"
          class="btn btn-sm min-h-11 px-3 normal-case tracking-wide"
          :class="allExpanded ? 'btn-outline' : 'btn-neutral'"
          data-testid="character-stat-view-mode"
          :disabled="visibleStats.length === 0"
          @click="toggleAll"
        >
          {{ allExpanded ? 'Tout compacter' : 'Tout détailler' }}
        </button>
      </div>
      <p class="text-xs opacity-70">
        Rappels indicatifs : seuls les liens disponibles entre compétences et talents possédés sont affichés.
        Les effets directs et certains liens peuvent manquer. Vérifie les conditions dans la description.
      </p>
      <p v-if="visibleStats.length === 0" class="text-sm opacity-70">Aucune caractéristique disponible.</p>
      <div v-else class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div
          v-for="stat in visibleStats"
          :key="stat.statCode"
          class="min-w-0"
          :class="expandedCodes.includes(stat.statCode) ? 'col-span-2' : ''"
        >
          <CharacteristicCard
            :stat="stat"
            :editable="editable"
            :expanded="expandedCodes.includes(stat.statCode)"
            @toggle="toggleStat(stat.statCode)"
            @tick-up="emit('stat-tick', $event.statCode, $event.step)"
            @tick-down="emit('stat-tick', $event.statCode, -$event.step)"
            @update-base="emit('stat-base-change', $event.statCode, $event.baseValue)"
            @update-total-advanced="emit('stat-total-advanced-change', $event.statCode, $event.totalAdvanced)"
          />
          <details v-if="reminders.get(normalizeStatCode(stat.statCode))?.length" class="mt-1 rounded-box border border-base-300 p-2 text-sm">
            <summary class="cursor-pointer min-h-11 flex items-center font-semibold">
              Talents liés à {{ stat.statCode }} ({{ reminders.get(normalizeStatCode(stat.statCode))?.length }})
            </summary>
            <ul class="space-y-3 pb-2">
              <li v-for="reminder in reminders.get(normalizeStatCode(stat.statCode))" :key="reminder.talent.talentId">
                <strong>{{ formatNamedWithSpecialization(reminder.talent.name, reminder.talent.specialization) }}</strong>
                <p>Compétences : {{ reminder.skills.join(', ') }}</p>
                <p class="whitespace-pre-line">{{ reminder.talent.description || 'Aucune description disponible.' }}</p>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </CharacterSection>
  </section>
</template>
