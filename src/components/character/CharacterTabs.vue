<script setup lang="ts">
import { ChartNoAxesColumn, ScrollText, Sword } from '@lucide/vue'
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

const TABS: ReadonlyArray<{ id: CharacterTabId; label: string; shortLabel: string; icon: Component }> = [
  { id: 'stats', label: 'Statistiques', shortLabel: 'Stats', icon: ChartNoAxesColumn },
  { id: 'skills', label: 'Compétences et Talents', shortLabel: 'Compétences', icon: ScrollText },
  { id: 'inventory', label: 'Inventaire', shortLabel: 'Inventaire', icon: Sword },
]
</script>

<template>
  <!-- Mobile: pinned above the dock within thumb reach; from sm: inline bar. -->
  <nav
    class="fixed inset-x-0 bottom-[calc(var(--grim-dock-height,0px)+env(safe-area-inset-bottom,0px))] z-30 border-t border-base-300 bg-base-100/95 p-2 backdrop-blur sm:static sm:rounded-box sm:border sm:p-3 sm:backdrop-blur-none"
    aria-label="Sections du personnage"
  >
    <div role="tablist" class="join grid w-full grid-cols-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
      <button
        v-for="tab in TABS"
        :id="`character-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="model === tab.id"
        :aria-controls="`character-panel-${tab.id}`"
        :tabindex="model === tab.id ? 0 : -1"
        class="btn join-item min-h-12 flex-col gap-0.5 px-1 text-xs sm:btn-sm sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3 sm:text-sm"
        :class="model === tab.id ? 'btn-primary' : 'btn-ghost'"
        @click="model = tab.id"
      >
        <component :is="tab.icon" class="h-4 w-4" aria-hidden="true" />
        <span class="sm:hidden">{{ tab.shortLabel }}</span>
        <span class="hidden sm:inline">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
