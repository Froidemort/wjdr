<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CharacterRace } from '../../types/character'
import type { CharacterArmor, CharacterStatValue, CharacterWeapon } from '../../types/domain'
import {
  computeArmorByLocation,
  type WeaponHand,
} from '../../utils/equipmentSlots'
import {
  computeMaxEncumbrance,
  computeTotalEncumbrance,
  getStatTotal,
  normalizeStatCode,
  sortStatsByCharacteristicOrder,
} from '../../utils/characterSheet'
import type { CharacterItem } from '../../types/domain'
import CharacterDerivedStatsCard from '../ui/CharacterDerivedStatsCard.vue'
import CharacteristicCard from '../ui/CharacteristicCard.vue'
import StateCycleBadge from '../ui/StateCycleBadge.vue'
import CharacterSection from './CharacterSection.vue'

const props = defineProps<{
  race: CharacterRace
  stats: CharacterStatValue[]
  armors: CharacterArmor[]
  weapons: CharacterWeapon[]
  items: CharacterItem[]
  editable: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  'stat-tick': [statCode: string, step: number]
  'stat-base-change': [statCode: string, baseValue: number]
  'stat-total-advanced-change': [statCode: string, totalAdvanced: number]
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()

const VIEW_OPTIONS = [
  { value: 'compact', label: 'Compact', badgeClass: 'btn-neutral' },
  { value: 'normal', label: 'Détaillé', badgeClass: 'btn-outline' },
] as const

const viewMode = ref<'normal' | 'compact'>('compact')

const visibleStats = computed(() =>
  sortStatsByCharacteristicOrder(
    props.stats.filter((stat) => normalizeStatCode(stat.statCode) !== 'PD')
  )
)
const primaryRows = computed(() => {
  const primary = visibleStats.value.filter((stat) => !stat.isSecondary).slice(0, 8)
  return [primary.slice(0, 4), primary.slice(4, 8)]
})
const secondaryStats = computed(() => visibleStats.value.filter((stat) => stat.isSecondary))
const compactRows = computed(() => [...primaryRows.value, secondaryStats.value])

const bonusForce = computed(() => Math.floor(getStatTotal(props.stats, 'F') / 10))
const bonusEndurance = computed(() => Math.floor(getStatTotal(props.stats, 'E') / 10))
const maxEncumbrance = computed(() => computeMaxEncumbrance(props.race, props.stats))
const totalEncumbrance = computed(() =>
  computeTotalEncumbrance({ weapons: props.weapons, armors: props.armors, items: props.items })
)
const armorByLocation = computed(() => computeArmorByLocation(props.armors))

function onViewModeChange(value: string | boolean | null): void {
  if (value === 'normal' || value === 'compact') {
    viewMode.value = value
  }
}
</script>

<template>
  <section
    id="character-panel-profile"
    role="tabpanel"
    aria-labelledby="character-tab-profile"
    class="space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
  >
    <CharacterSection title="Caractéristiques">
      <div class="flex flex-wrap items-center justify-start gap-3 border-b border-base-300 pb-3">
        <StateCycleBadge :value="viewMode" :options="VIEW_OPTIONS" @change="onViewModeChange" />
      </div>
      <p v-if="visibleStats.length === 0" class="text-sm opacity-70">Aucune caractéristique disponible.</p>
      <div v-else-if="viewMode === 'normal'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CharacteristicCard
          v-for="stat in visibleStats"
          :key="stat.statCode"
          :stat="stat"
          :editable="editable"
          @tick-up="emit('stat-tick', $event.statCode, $event.step)"
          @tick-down="emit('stat-tick', $event.statCode, -$event.step)"
          @update-base="emit('stat-base-change', $event.statCode, $event.baseValue)"
          @update-total-advanced="emit('stat-total-advanced-change', $event.statCode, $event.totalAdvanced)"
        />
      </div>
      <div v-else class="space-y-2 overflow-x-hidden">
        <div v-for="(row, index) in compactRows" :key="index" class="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div
            v-for="stat in row"
            :key="`compact-${stat.statCode}`"
            class="rounded-box border border-base-300 bg-base-200 px-2 py-1 text-center"
          >
            <div class="text-xs font-semibold uppercase opacity-75">{{ stat.statCode }}</div>
            <div class="text-lg font-black tabular-nums">{{ stat.baseValue + stat.currentAdvanced }}</div>
          </div>
        </div>
      </div>
    </CharacterSection>

    <CharacterSection title="Statistiques dérivées" collapsed>
      <CharacterDerivedStatsCard
        :total-encumbrance="totalEncumbrance"
        :max-encumbrance="maxEncumbrance"
        :bonus-force="bonusForce"
        :bonus-endurance="bonusEndurance"
        :armor-by-location="armorByLocation"
        :armors="armors"
        :weapons="weapons"
        :editable="editable"
        :busy="busy"
        @equip-armor="emit('equip-armor', $event)"
        @unequip-armor="emit('unequip-armor', $event)"
        @unequip-armors="emit('unequip-armors', $event)"
        @equip-weapon="(weaponId, hand) => emit('equip-weapon', weaponId, hand)"
        @unequip-weapon="emit('unequip-weapon', $event)"
      />
    </CharacterSection>
  </section>
</template>
