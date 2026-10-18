<script setup lang="ts">
import { ScrollText, Sparkles, Sword, UserCog } from '@lucide/vue'
import { useVModel } from '@vueuse/core'
import type { Component } from 'vue'
import type { CharacterTabId } from '../../types/characterSheet'

const props = defineProps<{
  modelValue: CharacterTabId
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CharacterTabId]
}>()

const model = useVModel(props, 'modelValue', emit)

const TABS: ReadonlyArray<{ id: CharacterTabId; label: string; icon: Component }> = [
  { id: 'profile', label: 'Profil', icon: UserCog },
  { id: 'skills', label: 'Compétences', icon: ScrollText },
  { id: 'talents', label: 'Talents', icon: Sparkles },
  { id: 'inventory', label: 'Inventaire', icon: Sword },
]
</script>

<template>
  <!-- Mobile: segmented control pinned above the dock, within thumb reach. -->
  <nav
    class="fixed inset-x-0 bottom-(--grim-dock-height,0px) z-30 border-t border-base-300 bg-base-100/95 p-2 backdrop-blur sm:hidden"
    aria-label="Sections du personnage"
  >
    <div role="tablist" class="join grid w-full grid-cols-4">
      <button
        v-for="tab in TABS"
        :id="`character-tab-mobile-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="model === tab.id"
        :aria-controls="`character-panel-${tab.id}`"
        class="btn join-item min-h-12 flex-col gap-0.5 px-1 text-[11px]"
        :class="model === tab.id ? 'btn-primary' : 'btn-ghost'"
        @click="model = tab.id"
      >
        <component :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>
  </nav>

  <div
    role="tablist"
    aria-label="Sections du personnage"
    class="hidden flex-wrap items-center gap-2 rounded-box border border-base-300 bg-base-100 p-3 sm:flex"
  >
    <button
      v-for="tab in TABS"
      :id="`character-tab-${tab.id}`"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="model === tab.id"
      :aria-controls="`character-panel-${tab.id}`"
      class="btn btn-sm ui-critical-action gap-2"
      :class="{ 'btn-active': model === tab.id }"
      @click="model = tab.id"
    >
      <component :is="tab.icon" class="h-4 w-4" />
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.btn-active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-content);
}
</style>
