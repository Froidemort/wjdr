<script setup lang="ts">
import type { CharacterArmor, CharacterItem, CharacterWeapon } from '../../types/domain'
import type { CharacterQuickField, CharacterQuickValues } from '../../types/characterSheet'
import CharacterMoneyCard from '../ui/CharacterMoneyCard.vue'
import CharacterArmorsSection from './CharacterArmorsSection.vue'
import CharacterItemsSection from './CharacterItemsSection.vue'
import CharacterSection from './CharacterSection.vue'
import CharacterWeaponsSection from './CharacterWeaponsSection.vue'

type CatalogSection = 'weapons' | 'armors' | 'items'

defineProps<{
  weapons: CharacterWeapon[]
  armors: CharacterArmor[]
  items: CharacterItem[]
  values: CharacterQuickValues
  editable: boolean
  busyKey: string | null
  weaponsMessage: string | null
  armorsMessage: string | null
  itemsMessage: string | null
}>()

const emit = defineEmits<{
  add: [section: CatalogSection]
  'quick-change': [field: CharacterQuickField, value: number]
  'money-commit': []
  'money-subtract': [value: { silver: number; copper: number }]
  'delete-weapon': [linkId: string]
  'delete-armor': [linkId: string]
  'delete-item': [linkId: string]
  'weapon-state-change': [weapon: CharacterWeapon, value: string | boolean | null]
  'weapon-quality-change': [weapon: CharacterWeapon, value: string | boolean | null]
  'armor-state-change': [armor: CharacterArmor, value: string | boolean | null]
  'armor-quality-change': [armor: CharacterArmor, value: string | boolean | null]
  'item-quality-change': [item: CharacterItem, value: string | boolean | null]
  'item-quantity-change': [item: CharacterItem, delta: number]
  'show-description': [title: string, description: string | null]
}>()
</script>

<template>
  <section
    id="character-panel-inventory"
    role="tabpanel"
    aria-labelledby="character-tab-inventory"
    class="space-y-4 rounded-box border border-base-300 bg-base-100 p-4"
  >
    <CharacterSection title="Argent">
      <CharacterMoneyCard
        :gold="values.moneyGold"
        :silver="values.moneySilver"
        :copper="values.moneyCopper"
        :editable="editable"
        @update:gold="emit('quick-change', 'moneyGold', $event)"
        @update:silver="emit('quick-change', 'moneySilver', $event)"
        @update:copper="emit('quick-change', 'moneyCopper', $event)"
        @commit="emit('money-commit')"
        @subtract="emit('money-subtract', $event)"
      />
    </CharacterSection>

    <CharacterWeaponsSection
      :weapons="weapons"
      :editable="editable"
      :busy-key="busyKey"
      :success-message="weaponsMessage"
      @add="emit('add', 'weapons')"
      @delete="emit('delete-weapon', $event)"
      @state-change="(weapon, value) => emit('weapon-state-change', weapon, value)"
      @quality-change="(weapon, value) => emit('weapon-quality-change', weapon, value)"
    />

    <CharacterArmorsSection
      :armors="armors"
      :editable="editable"
      :busy-key="busyKey"
      :success-message="armorsMessage"
      @add="emit('add', 'armors')"
      @delete="emit('delete-armor', $event)"
      @state-change="(armor, value) => emit('armor-state-change', armor, value)"
      @quality-change="(armor, value) => emit('armor-quality-change', armor, value)"
    />

    <CharacterItemsSection
      :items="items"
      :editable="editable"
      :busy-key="busyKey"
      :success-message="itemsMessage"
      @add="emit('add', 'items')"
      @delete="emit('delete-item', $event)"
      @quality-change="(item, value) => emit('item-quality-change', item, value)"
      @quantity-change="(item, delta) => emit('item-quantity-change', item, delta)"
      @show-description="(title, description) => emit('show-description', title, description)"
    />
  </section>
</template>
