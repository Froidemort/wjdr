<script setup lang="ts">
import type { CharacterArmor, CharacterWeapon } from '../../types/domain'
import type { ArmorByLocation, WeaponHand } from '../../utils/equipmentSlots'
import CharacterEquipmentDoll from './CharacterEquipmentDoll.vue'

withDefaults(
  defineProps<{
    armorByLocation: ArmorByLocation
    armors?: CharacterArmor[]
    weapons?: CharacterWeapon[]
    editable?: boolean
    busy?: boolean
  }>(),
  {
    armors: () => [],
    weapons: () => [],
    editable: false,
    busy: false,
  }
)

defineEmits<{
  'equip-armor': [armorId: string]
  'unequip-armor': [armorId: string]
  'unequip-armors': [armorIds: string[]]
  'equip-weapon': [weaponId: string, hand: WeaponHand]
  'unequip-weapon': [weaponId: string]
}>()
</script>

<template>
  <article class="rounded-lg border border-base-300 bg-base-200 p-3">
    <CharacterEquipmentDoll
      :armors="armors"
      :weapons="weapons"
      :armor-by-location="armorByLocation"
      :editable="editable"
      :busy="busy"
      @equip-armor="$emit('equip-armor', $event)"
      @unequip-armor="$emit('unequip-armor', $event)"
      @unequip-armors="$emit('unequip-armors', $event)"
      @equip-weapon="(id, hand) => $emit('equip-weapon', id, hand)"
      @unequip-weapon="$emit('unequip-weapon', $event)"
    />
  </article>
</template>
