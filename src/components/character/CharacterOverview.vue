<script setup lang="ts">
import { Hospital, ScrollText, Weight } from '@lucide/vue'
import { computed } from 'vue'
import type { CharacterRace } from '../../types/character'
import type { CharacterQuickField, CharacterQuickValues } from '../../types/characterSheet'
import type { CharacterArmor, CharacterItem, CharacterStatValue, CharacterWeapon } from '../../types/domain'
import {
  computeMaxEncumbrance,
  computeTotalEncumbrance,
  getStatTotal,
} from '../../utils/characterSheet'
import { computeArmorByLocation, type WeaponHand } from '../../utils/equipmentSlots'
import CharacterDerivedStatsCard from '../ui/CharacterDerivedStatsCard.vue'
import CharacterValueCard from '../ui/CharacterValueCard.vue'
import FortuneClover from '../ui/FortuneClover.vue'
import HealthHeart from '../ui/HealthHeart.vue'

const props = defineProps<{
  race: CharacterRace
  stats: CharacterStatValue[]
  armors: CharacterArmor[]
  weapons: CharacterWeapon[]
  items: CharacterItem[]
  values: CharacterQuickValues
  editable: boolean
  busy: boolean
}>()

const emit = defineEmits<{
  'quick-change': [field: CharacterQuickField, value: number]
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()

const bonusForce = computed(() => Math.floor(getStatTotal(props.stats, 'F') / 10))
const bonusEndurance = computed(() => Math.floor(getStatTotal(props.stats, 'E') / 10))
const maxEncumbrance = computed(() => computeMaxEncumbrance(props.race, props.stats))
const totalEncumbrance = computed(() =>
  computeTotalEncumbrance({ weapons: props.weapons, armors: props.armors, items: props.items })
)
const isOverloaded = computed(() => totalEncumbrance.value > maxEncumbrance.value)
const armorByLocation = computed(() => computeArmorByLocation(props.armors))
const encumbranceMultiplier = computed(() => (props.race === 'nain' ? 20 : 10))
</script>

<template>
  <section
    id="character-overview"
    aria-labelledby="character-overview-title"
    class="space-y-3 rounded-box border border-base-300 bg-base-100 p-3 sm:p-4"
  >
    <h2 id="character-overview-title" class="text-lg font-semibold">Aperçu</h2>

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <div class="space-y-1">
        <HealthHeart
          :model-value="values.pvCurrent"
          :max-hp="values.pvMax"
          label="Points de Blessures"
          mobile-label="Blessures"
          :editable="editable"
          @update:model-value="emit('quick-change', 'pvCurrent', $event)"
        />
        <p class="px-1 text-xs opacity-70">
          PV max {{ values.pvMax }} : valeur de la caractéristique Blessures (B), non modifiable ici.
        </p>
      </div>
      <FortuneClover
        label="Fortune"
        :model-value="values.fortuneCurrent"
        :max-points="values.fortuneMax"
        max-points-editable
        :editable="editable"
        @update:model-value="emit('quick-change', 'fortuneCurrent', $event)"
        @update:max-points="emit('quick-change', 'fortuneMax', $event)"
      />
      <FortuneClover
        label="Destin"
        :model-value="values.destinyCurrent"
        :max-points="values.destinyMax"
        max-points-editable
        variant="destin"
        :editable="editable"
        @update:model-value="emit('quick-change', 'destinyCurrent', $event)"
        @update:max-points="emit('quick-change', 'destinyMax', $event)"
      />
    </div>

    <div class="grid grid-cols-2 gap-2 lg:grid-cols-3">
      <article class="col-span-2 rounded-box border border-base-300 bg-base-100 p-3 lg:col-span-1">
        <div class="flex items-center justify-between gap-2">
          <p class="flex items-center gap-2 text-sm font-semibold">
            <Weight class="h-5 w-5 text-accent" aria-hidden="true" />
            Encombrement
          </p>
          <p
            class="text-xl font-black tabular-nums"
            :class="isOverloaded ? 'text-error' : ''"
            :aria-label="`Encombrement ${totalEncumbrance} sur ${maxEncumbrance}`"
          >
            {{ totalEncumbrance }} / {{ maxEncumbrance }}
          </p>
        </div>
        <progress
          class="progress progress-accent mt-2 h-3 w-full"
          :value="Math.min(totalEncumbrance, Math.max(maxEncumbrance, 1))"
          :max="Math.max(maxEncumbrance, 1)"
          aria-hidden="true"
        />
        <p class="mt-1 text-xs opacity-70">Max : Force × {{ encumbranceMultiplier }}</p>
      </article>

      <article class="rounded-box border border-base-300 bg-base-100 p-3 text-center">
        <p class="text-sm font-semibold">Bonus de Force</p>
        <p class="text-2xl font-black leading-tight text-accent">BF {{ bonusForce }}</p>
        <p class="text-xs opacity-70">F ÷ 10</p>
      </article>
      <article class="rounded-box border border-base-300 bg-base-100 p-3 text-center">
        <p class="text-sm font-semibold">Bonus d'Endurance</p>
        <p class="text-2xl font-black leading-tight text-accent">BE {{ bonusEndurance }}</p>
        <p class="text-xs opacity-70">E ÷ 10</p>
      </article>

      <CharacterValueCard
        label="Points de folie"
        :icon="Hospital"
        icon-class="h-6 w-6 text-warning"
        :current="values.insanityPoints"
        :editable="editable"
        current-aria-label="Points de folie"
        @update:current="emit('quick-change', 'insanityPoints', $event)"
      />
      <CharacterValueCard
        label="Expérience"
        :icon="ScrollText"
        icon-class="h-6 w-6 text-base-content/80"
        :current="values.xpAvailable"
        :max="values.xpTotal"
        :editable="editable"
        current-aria-label="Expérience disponible"
        max-aria-label="Expérience totale"
        @update:current="emit('quick-change', 'xpAvailable', $event)"
        @update:max="emit('quick-change', 'xpTotal', $event)"
      />
    </div>

    <div class="space-y-2">
      <h3 class="text-base font-semibold">Armes et armures équipées</h3>
      <CharacterDerivedStatsCard
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
    </div>
  </section>
</template>
