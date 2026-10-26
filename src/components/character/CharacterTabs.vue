<script setup lang="ts">
import { ChartNoAxesColumn, LayoutDashboard, ScrollText, Sword } from '@lucide/vue'
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
  { id: 'overview', label: 'Aperçu', shortLabel: 'Aperçu', icon: LayoutDashboard },
  { id: 'stats', label: 'Statistiques', shortLabel: 'Stats', icon: ChartNoAxesColumn },
  { id: 'skills', label: 'Compétences et Talents', shortLabel: 'Compétences', icon: ScrollText },
  { id: 'inventory', label: 'Inventaire', shortLabel: 'Inventaire', icon: Sword },
]

function onTablistKeydown(event: KeyboardEvent): void {
  const index = TABS.findIndex((tab) => tab.id === model.value)
  let next: number
  if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = TABS.length - 1
  else return
  event.preventDefault()
  const target = TABS[next]
  if (!target) return
  model.value = target.id
  document.getElementById(`character-tab-${target.id}`)?.focus()
}
</script>

<template>
  <!-- Mobile: fixed above the dock; max-sm:mb-0 cancels the parent's space-y margin that would lift it. From sm: inline bar. -->
  <nav
    class="fixed inset-x-0 bottom-[var(--grim-dock-height,0px)] z-30 max-sm:mb-0 border-t border-base-300 bg-base-100/95 p-2 backdrop-blur sm:static sm:rounded-box sm:border sm:p-3 sm:backdrop-blur-none"
    aria-label="Sections du personnage"
  >
    <div
      role="tablist"
      aria-label="Onglets de la fiche"
      class="join grid w-full grid-cols-4 sm:flex sm:flex-wrap sm:items-center sm:gap-2"
      @keydown="onTablistKeydown"
    >
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
