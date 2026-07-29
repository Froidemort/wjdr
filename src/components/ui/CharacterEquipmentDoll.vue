<script setup lang="ts">
import { Shield, Sword } from '@lucide/vue'
import { computed, ref } from 'vue'
import type { CharacterArmor, CharacterWeapon } from '../../types/domain'
import {
  ARMOR_SLOTS,
  MAX_ARMORS_PER_LOCATION,
  WEAPON_SLOTS,
  type ArmorByLocation,
  type ArmorSlotId,
  type EquipmentSlotId,
  getArmorPointsForSlot,
  getEquippedArmorsForSlot,
  getWeaponForSlot,
} from '../../utils/equipmentSlots'
import EquipmentSlotPickerModal from './EquipmentSlotPickerModal.vue'

const props = withDefaults(
  defineProps<{
    armors: CharacterArmor[]
    weapons: CharacterWeapon[]
    armorByLocation: ArmorByLocation
    editable?: boolean
    busy?: boolean
  }>(),
  {
    editable: false,
    busy: false,
  }
)

const emit = defineEmits<{
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: 'droite' | 'gauche' | 'd&g']
  'unequip-weapon': [weaponId: string]
}>()

const activeSlotId = ref<EquipmentSlotId | null>(null)
const pickerOpen = ref(false)
const hoveredSlotId = ref<EquipmentSlotId | null>(null)

const leftWeaponSlot = WEAPON_SLOTS.find((slot) => slot.column === 'left')!
const rightWeaponSlot = WEAPON_SLOTS.find((slot) => slot.column === 'right')!

type ArmorSlotView = {
  slot: (typeof ARMOR_SLOTS)[number]
  layers: CharacterArmor[]
  filled: boolean
  stacked: boolean
  full: boolean
  pa: number
  depth: boolean[]
  areaClass: string
}

function buildArmorSlotView(slot: (typeof ARMOR_SLOTS)[number]): ArmorSlotView {
  const layers = getEquippedArmorsForSlot(props.armors, slot.id)
  return {
    slot,
    layers,
    filled: layers.length > 0,
    stacked: layers.length > 1,
    full: layers.length >= MAX_ARMORS_PER_LOCATION,
    pa: getArmorPointsForSlot(props.armorByLocation, slot.id),
    depth: Array.from({ length: MAX_ARMORS_PER_LOCATION }, (_, index) => index < layers.length),
    areaClass: `equip-area--${slot.id.replaceAll('_', '-')}`,
  }
}

const armorViews = computed(() => ARMOR_SLOTS.map(buildArmorSlotView))

const armorViewById = computed(() => {
  const map = new Map<ArmorSlotId, ArmorSlotView>()
  for (const view of armorViews.value) {
    map.set(view.slot.id, view)
  }
  return map
})

const leftWeaponView = computed(() => buildWeaponSlotView(leftWeaponSlot))
const rightWeaponView = computed(() => buildWeaponSlotView(rightWeaponSlot))

type WeaponSlotView = {
  slot: (typeof WEAPON_SLOTS)[number]
  weapon: CharacterWeapon | null
  filled: boolean
  twoHanded: boolean
  damage: string | null
  encumbrance: number | null
}

function buildWeaponSlotView(slot: (typeof WEAPON_SLOTS)[number]): WeaponSlotView {
  const weapon = getWeaponForSlot(props.weapons, slot.id)
  return {
    slot,
    weapon,
    filled: Boolean(weapon),
    twoHanded: weapon?.equipped === 'd&g',
    damage: weapon?.damageFormula?.trim() || null,
    encumbrance: weapon ? weapon.encumbrance : null,
  }
}

const highlightedLocation = computed(() => {
  const id = hoveredSlotId.value ?? activeSlotId.value
  if (!id) {
    return null
  }

  switch (id) {
    case 'tete':
      return 'tete'
    case 'corps':
      return 'corps'
    case 'bras_droit':
    case 'main_droite':
      return 'bras_droit'
    case 'bras_gauche':
    case 'main_gauche':
      return 'bras_gauche'
    case 'jambe_droite':
      return 'jambe_droite'
    case 'jambe_gauche':
      return 'jambe_gauche'
    default:
      return null
  }
})

function openSlot(slotId: EquipmentSlotId): void {
  if (!props.editable) {
    return
  }
  activeSlotId.value = slotId
  pickerOpen.value = true
}

function onPickerClosed(): void {
  pickerOpen.value = false
  activeSlotId.value = null
}

function slotAriaLabel(slotId: EquipmentSlotId, label: string): string {
  if (slotId === 'main_droite' || slotId === 'main_gauche') {
    const weapon = getWeaponForSlot(props.weapons, slotId)
    if (!weapon) {
      const state = 'vide'
      if (!props.editable) {
        return `${label}, ${state}`
      }
      return `${label}, ${state}. Activer pour choisir une arme.`
    }
    const damage = weapon.damageFormula?.trim()
    const details = [weapon.name, damage, weapon.equipped === 'd&g' ? 'deux mains' : null]
      .filter(Boolean)
      .join(', ')
    const state = `équipé : ${details}`
    if (!props.editable) {
      return `${label}, ${state}`
    }
    return `${label}, ${state}. Activer pour choisir une arme.`
  }

  const view = armorViewById.value.get(slotId)
  const layers = view?.layers ?? []
  const pa = view?.pa ?? 0
  let state: string
  if (layers.length === 0) {
    state = 'vide'
  } else if (layers.length === 1) {
    state = `équipé : ${layers[0].name}, ${pa} PA`
  } else {
    state = `${layers.length} couches : ${layers.map((a) => a.name).join(', ')}, total ${pa} PA`
  }

  if (!props.editable) {
    return `${label}, ${state}`
  }
  return `${label}, ${state}. Activer pour gérer l’équipement.`
}

function isLocationActive(zone: string): boolean {
  return highlightedLocation.value === zone
}

function onArmorSlotEnter(slotId: ArmorSlotId): void {
  hoveredSlotId.value = slotId
}

function onArmorSlotLeave(): void {
  hoveredSlotId.value = null
}

function slotButtonClass(opts: {
  filled: boolean
  stacked?: boolean
  full?: boolean
  active: boolean
  weapon?: boolean
}): string[] {
  return [
    'relative flex h-full min-h-0 w-full flex-col gap-1 overflow-hidden rounded-box border bg-base-100 px-2 py-1.5 text-left transition',
    'border-base-content/15',
    'enabled:hover:-translate-y-px enabled:hover:border-accent/55 enabled:hover:bg-accent/10 enabled:hover:shadow-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
    'disabled:cursor-default disabled:opacity-95',
    'motion-reduce:transition-none motion-reduce:enabled:hover:translate-y-0',
    opts.weapon ? 'min-h-16 gap-0.5' : '',
    opts.filled ? 'border-accent/40 bg-accent/10' : '',
    opts.stacked ? 'border-primary/35' : '',
    opts.full ? 'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]' : '',
    opts.active ? 'border-accent shadow-md ring-1 ring-accent/40' : '',
  ]
}
</script>

<template>
  <div class="w-full">
    <div class="mb-2.5 flex items-center justify-between gap-2 border-b border-base-content/10 pb-1.5">
      <p class="m-0 font-[family-name:var(--font-grim-title)] text-[0.95rem] uppercase leading-none tracking-[0.08em] text-primary">
        Équipement
      </p>
      <div
        class="inline-flex size-6 items-center justify-center border border-accent/35 bg-accent/10 text-accent"
        aria-hidden="true"
      >
        <Shield class="h-3.5 w-3.5" />
      </div>
    </div>

    <div
      class="relative border border-base-content/10 bg-gradient-to-b from-base-200/55 to-base-100/30 px-1.5 pb-1.5 pt-2 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-base-content)_4%,transparent)]"
    >
      <div class="equip-grid">
        <button
          v-for="view in armorViews"
          :key="view.slot.id"
          type="button"
          :class="[
            view.areaClass,
            ...slotButtonClass({
              filled: view.filled,
              stacked: view.stacked,
              full: view.full,
              active: activeSlotId === view.slot.id,
            }),
          ]"
          :disabled="!editable"
          :aria-label="slotAriaLabel(view.slot.id, view.slot.label)"
          @click="openSlot(view.slot.id)"
          @mouseenter="onArmorSlotEnter(view.slot.id)"
          @mouseleave="onArmorSlotLeave"
          @focus="onArmorSlotEnter(view.slot.id)"
          @blur="onArmorSlotLeave"
        >
          <span
            class="pointer-events-none absolute left-1 top-1 size-1.5 border-l border-t border-primary/55 opacity-55"
            aria-hidden="true"
          />
          <span
            class="pointer-events-none absolute bottom-1 right-1 size-1.5 border-b border-r border-primary/55 opacity-55"
            aria-hidden="true"
          />

          <span class="flex min-w-0 shrink-0 items-baseline justify-between gap-1.5">
            <span class="inline-flex min-w-0 items-center gap-1 text-[0.62rem] font-bold uppercase leading-tight tracking-wider text-base-content/70">
              {{ view.slot.label }}
            </span>
            <span class="shrink-0 text-[0.6rem] tabular-nums leading-none tracking-wide opacity-50">
              {{ view.slot.hitRange }}
            </span>
          </span>

          <span
            class="flex shrink-0 gap-0.5"
            :aria-label="`${view.layers.length} sur ${MAX_ARMORS_PER_LOCATION} couches`"
          >
            <span
              v-for="(filled, index) in view.depth"
              :key="index"
              class="h-0.5 flex-1 rounded-sm"
              :class="filled ? 'bg-accent' : 'bg-base-content/10'"
            />
          </span>

          <span class="flex min-h-12 min-w-0 flex-1 flex-col justify-start gap-0.5 max-[420px]:min-h-11">
            <template v-if="view.filled">
              <span
                v-for="(armor, index) in view.layers"
                :key="armor.id"
                class="grid min-h-4 min-w-0 grid-cols-[0.35rem_minmax(0,1fr)_auto] items-center gap-1"
              >
                <span
                  class="size-1 rounded-full"
                  :class="index === 0 ? 'bg-accent' : 'bg-accent/55'"
                  aria-hidden="true"
                />
                <span
                  class="min-w-0 truncate text-[0.72rem] leading-tight"
                  :class="index === 0 ? 'font-bold' : 'font-semibold'"
                  :title="armor.name"
                >
                  {{ armor.name }}
                </span>
                <span v-if="view.stacked" class="text-[0.58rem] font-bold tabular-nums leading-none opacity-55">
                  {{ armor.armorPoints }}
                </span>
              </span>
            </template>
            <span v-else class="pt-0.5 text-[0.72rem] italic leading-tight opacity-40">Vide</span>
          </span>

          <span
            class="mt-auto flex min-h-5 shrink-0 items-center justify-between gap-1.5 border-t border-base-content/10 pt-1"
          >
            <span
              v-if="view.stacked"
              class="text-[0.58rem] font-semibold uppercase tracking-wide opacity-50"
            >
              {{ view.layers.length }} couches
            </span>
            <span v-else class="invisible text-[0.58rem]" aria-hidden="true">&nbsp;</span>
            <span
              v-if="view.filled"
              class="ml-auto inline-flex items-baseline gap-0.5 border border-accent/70 bg-accent px-1.5 py-0.5 text-[0.72rem] font-extrabold tabular-nums leading-tight text-accent-content"
            >
              {{ view.pa }}
              <span class="text-[0.58rem] font-bold tracking-wide opacity-85">PA</span>
            </span>
            <span
              v-else
              class="ml-auto inline-flex min-w-10 justify-center px-1.5 py-0.5 text-transparent"
              aria-hidden="true"
            >
              —
            </span>
          </span>
        </button>

        <div
          class="equip-area--figure flex min-h-full flex-col items-center justify-center py-0.5"
          aria-hidden="true"
        >
          <div class="equip-silhouette-wrap relative flex w-full justify-center">
            <svg
              class="equip-silhouette relative h-auto w-full max-w-[7.75rem] max-[420px]:max-w-[5.75rem]"
              viewBox="0 0 140 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="70" cy="248" rx="28" ry="5" class="equip-sil-shadow" />
              <path
                d="M70 8 C58 8 50 18 50 30 C50 42 56 50 62 54 L78 54 C84 50 90 42 90 30 C90 18 82 8 70 8 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('tete') }"
              />
              <path
                d="M62 52 L64 62 L76 62 L78 52 Z"
                class="equip-zone equip-zone--neck"
                :class="{ 'equip-zone--active': isLocationActive('tete') }"
              />
              <path
                d="M46 64 C38 66 30 72 26 82 L28 98 C32 92 40 88 48 88 L50 124 L90 124 L92 88 C100 88 108 92 112 98 L114 82 C110 72 102 66 94 64 C88 62 80 60 70 60 C60 60 52 62 46 64 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('corps') }"
              />
              <path
                d="M28 96 C18 110 14 132 16 152 L30 154 C30 134 34 116 42 104 L36 96 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('bras_droit') }"
              />
              <path
                d="M112 96 C122 110 126 132 124 152 L110 154 C110 134 106 116 98 104 L104 96 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('bras_gauche') }"
              />
              <path
                d="M50 124 L46 168 C44 188 42 204 40 220 L54 246 L68 248 L70 220 L66 168 L70 124 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('jambe_droite') }"
              />
              <path
                d="M90 124 L94 168 C96 188 98 204 100 220 L86 246 L72 248 L70 220 L74 168 L70 124 Z"
                class="equip-zone"
                :class="{ 'equip-zone--active': isLocationActive('jambe_gauche') }"
              />
              <path d="M50 124 H90" class="equip-sil-detail" />
              <path d="M68 120 V128" class="equip-sil-detail equip-sil-detail--soft" />
              <path
                d="M70 8 C58 8 50 18 50 30 C50 42 56 50 62 54 L64 62 M70 8 C82 8 90 18 90 30 C90 42 84 50 78 54 L76 62
                   M46 64 C38 66 30 72 26 82 L28 98 C22 112 16 132 16 152 L30 154
                   M94 64 C102 66 110 72 114 82 L112 98 C118 112 124 132 124 152 L110 154
                   M48 88 L50 124 L46 168 C44 188 42 204 40 220 L54 246 L68 248 L70 220
                   M92 88 L90 124 L94 168 C96 188 98 204 100 220 L86 246 L72 248 L70 220
                   M50 124 H90"
                class="equip-outline-stroke"
              />
              <circle cx="70" cy="28" r="11" class="equip-sil-face" />
            </svg>
          </div>
        </div>

        <div
          class="equip-area--weapons mx-auto grid w-full max-w-[22rem] grid-cols-2 gap-2 pt-0.5 max-[420px]:max-w-none"
        >
          <button
            v-for="view in [leftWeaponView, rightWeaponView]"
            :key="view.slot.id"
            type="button"
            :class="
              slotButtonClass({
                filled: view.filled,
                active: activeSlotId === view.slot.id,
                weapon: true,
              })
            "
            :disabled="!editable"
            :aria-label="slotAriaLabel(view.slot.id, view.slot.label)"
            @click="openSlot(view.slot.id)"
            @mouseenter="hoveredSlotId = view.slot.id"
            @mouseleave="hoveredSlotId = null"
            @focus="hoveredSlotId = view.slot.id"
            @blur="hoveredSlotId = null"
          >
            <span
              class="pointer-events-none absolute left-1 top-1 size-1.5 border-l border-t border-primary/55 opacity-55"
              aria-hidden="true"
            />
            <span
              class="pointer-events-none absolute bottom-1 right-1 size-1.5 border-b border-r border-primary/55 opacity-55"
              aria-hidden="true"
            />

            <span class="flex min-w-0 shrink-0 items-baseline justify-between gap-1.5">
              <span class="inline-flex min-w-0 items-center gap-1 text-[0.62rem] font-bold uppercase leading-tight tracking-wider text-base-content/70">
                <Sword class="size-2.5 shrink-0 opacity-75" aria-hidden="true" />
                {{ view.slot.label }}
              </span>
              <span
                v-if="view.twoHanded"
                class="shrink-0 text-[0.58rem] font-extrabold uppercase tracking-wider text-accent opacity-85"
              >
                2M
              </span>
            </span>

            <span class="flex min-h-5 min-w-0 flex-1 flex-col justify-center gap-0.5">
              <span
                v-if="view.filled && view.weapon"
                class="block truncate text-[0.75rem] font-semibold leading-tight"
                :title="view.weapon.name"
              >
                {{ view.weapon.name }}
              </span>
              <span v-else class="pt-0.5 text-[0.72rem] italic leading-tight opacity-40">Vide</span>
            </span>

            <span
              class="mt-auto flex min-h-5 shrink-0 items-center justify-between gap-1.5 border-t border-base-content/10 pt-1"
            >
              <span
                v-if="view.filled && view.encumbrance !== null"
                class="text-[0.58rem] font-semibold tabular-nums tracking-wide opacity-50"
              >
                Enc. {{ view.encumbrance }}
              </span>
              <span v-else class="invisible text-[0.58rem]" aria-hidden="true">&nbsp;</span>
              <span
                v-if="view.filled && view.damage"
                class="ml-auto inline-flex items-baseline border border-accent/70 bg-accent px-1.5 py-0.5 text-[0.7rem] font-extrabold tabular-nums leading-tight text-accent-content"
              >
                {{ view.damage }}
              </span>
              <span
                v-else
                class="ml-auto inline-flex min-w-10 justify-center px-1.5 py-0.5 text-transparent"
                aria-hidden="true"
              >
                —
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <p v-if="editable" class="mt-2 text-center text-[0.7rem] leading-snug tracking-wide opacity-60">
      Cliquez un emplacement · jusqu’à {{ MAX_ARMORS_PER_LOCATION }} couches d’armure
    </p>
    <p v-else class="mt-2 text-center text-[0.7rem] leading-snug tracking-wide opacity-60">
      Lecture seule
    </p>

    <EquipmentSlotPickerModal
      :open="pickerOpen"
      :slot-id="activeSlotId"
      :armors="armors"
      :weapons="weapons"
      :editable="editable"
      :busy="busy"
      @close="onPickerClosed"
      @equip-armor="emit('equip-armor', $event)"
      @unequip-armor="emit('unequip-armor', $event)"
      @unequip-armors="emit('unequip-armors', $event)"
      @equip-weapon="(id, hand) => emit('equip-weapon', id, hand)"
      @unequip-weapon="emit('unequip-weapon', $event)"
    />
  </div>
</template>

<style scoped>
/* Anatomical layout — grid-template-areas stays in CSS */
.equip-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(5rem, 7.25rem) minmax(0, 1fr);
  grid-template-areas:
    "tete      figure  corps"
    "bras-d    figure  bras-g"
    "jambe-d   figure  jambe-g"
    "weapons   weapons weapons";
  gap: 0.45rem 0.55rem;
  align-items: stretch;
}

@media (min-width: 640px) {
  .equip-grid {
    grid-template-columns: minmax(0, 1fr) minmax(6rem, 8.25rem) minmax(0, 1fr);
    gap: 0.55rem 0.85rem;
  }
}

@media (max-width: 420px) {
  .equip-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "figure  figure"
      "tete    corps"
      "bras-d  bras-g"
      "jambe-d jambe-g"
      "weapons weapons";
    gap: 0.45rem;
  }
}

.equip-area--tete { grid-area: tete; }
.equip-area--corps { grid-area: corps; }
.equip-area--bras-droit { grid-area: bras-d; }
.equip-area--bras-gauche { grid-area: bras-g; }
.equip-area--jambe-droite { grid-area: jambe-d; }
.equip-area--jambe-gauche { grid-area: jambe-g; }
.equip-area--figure { grid-area: figure; }
.equip-area--weapons { grid-area: weapons; }

/* Silhouette SVG — fills/strokes not practical in Tailwind */
.equip-silhouette-wrap::before {
  content: "";
  position: absolute;
  inset: 6% 12% 4%;
  border-radius: 46% 46% 40% 40%;
  background: radial-gradient(
    ellipse at 50% 28%,
    color-mix(in oklab, var(--color-accent) 16%, transparent),
    transparent 72%
  );
  pointer-events: none;
}

.equip-silhouette {
  color: color-mix(in oklab, var(--color-base-content) 62%, transparent);
  filter: drop-shadow(0 2px 2px color-mix(in oklab, var(--color-base-content) 10%, transparent));
}

.equip-zone {
  fill: color-mix(in oklab, var(--color-base-content) 10%, transparent);
  stroke: none;
  transition: fill 0.2s ease;
}

.equip-zone--neck {
  fill: color-mix(in oklab, var(--color-base-content) 8%, transparent);
}

.equip-zone--active {
  fill: color-mix(in oklab, var(--color-accent) 38%, transparent);
}

.equip-sil-shadow {
  fill: color-mix(in oklab, var(--color-base-content) 14%, transparent);
}

.equip-sil-detail {
  fill: none;
  stroke: color-mix(in oklab, var(--color-base-content) 34%, transparent);
  stroke-width: 1.4;
  stroke-linecap: round;
}

.equip-sil-detail--soft {
  stroke-opacity: 0.55;
  stroke-width: 1.1;
}

.equip-sil-face {
  fill: none;
  stroke: color-mix(in oklab, var(--color-base-content) 22%, transparent);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.equip-outline-stroke {
  fill: none;
  stroke: color-mix(in oklab, var(--color-base-content) 48%, transparent);
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (prefers-reduced-motion: reduce) {
  .equip-zone {
    transition: none;
  }
}
</style>
