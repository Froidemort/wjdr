<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CharacterStatValue } from '../../types/domain'
import { normalizeStatCode, sortStatsByCharacteristicOrder } from '../../utils/characterSheet'
import CharacteristicCard from '../ui/CharacteristicCard.vue'
import CharacterSection from './CharacterSection.vue'

const props = defineProps<{
  stats: CharacterStatValue[]
  editable: boolean
}>()

const emit = defineEmits<{
  'stat-tick': [statCode: string, step: number]
  'stat-base-change': [statCode: string, baseValue: number]
  'stat-total-advanced-change': [statCode: string, totalAdvanced: number]
}>()

const expandedCodes = ref<string[]>([])

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
    class="space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
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
        </div>
      </div>
    </CharacterSection>
  </section>
</template>
