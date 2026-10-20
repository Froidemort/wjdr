<script setup lang="ts">
import { Crown, Eye, FileText, List, Users } from '@lucide/vue'
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'

type CampaignTab = 'overview' | 'management' | 'table' | 'sessions' | 'notes'

const props = defineProps<{
  modelValue: CampaignTab
  isMj: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CampaignTab]
}>()

const model = useVModel(props, 'modelValue', emit)

const mobileTabs = computed(() => {
  const tabs = [
    { key: 'overview', label: 'Aperçu', ariaLabel: 'Aperçu', icon: Eye },
    { key: 'management', label: 'Gestion', ariaLabel: 'Gestion MJ', icon: Crown },
    { key: 'table', label: 'Table', ariaLabel: 'Table', icon: Users },
    { key: 'sessions', label: 'Sessions', ariaLabel: 'Sessions', icon: List },
    { key: 'notes', label: 'Notes', ariaLabel: 'Notes', icon: FileText },
  ] as const
  return tabs.filter((tab) => props.isMj || (tab.key !== 'management' && tab.key !== 'table'))
})
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-3 sm:p-4">
    <div
      v-if="isMobile"
      role="tablist"
      aria-label="Sections de campagne"
      class="tabs tabs-box w-full flex-nowrap"
    >
      <button
        v-for="tab in mobileTabs"
        :id="`campaign-tab-${tab.key}`"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="model === tab.key ? 'true' : 'false'"
        :aria-controls="`campaign-panel-${tab.key}`"
        :aria-label="tab.ariaLabel"
        class="tab min-h-11 flex-1 flex-col gap-0.5 px-1 text-xs ui-critical-action"
        :class="model === tab.key ? 'tab-active' : ''"
        @click="model = tab.key"
      >
        <component :is="tab.icon" class="h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <div
      v-else
      role="tablist"
      aria-label="Sections de campagne"
      class="flex flex-wrap items-center gap-2 border-b border-base-300 pb-3"
    >
      <button
        id="campaign-tab-overview"
        type="button"
        role="tab"
        :aria-selected="model === 'overview' ? 'true' : 'false'"
        aria-controls="campaign-panel-overview"
        class="btn btn-sm ui-critical-action gap-2"
        :class="model === 'overview' ? 'btn-active' : ''"
        @click="model = 'overview'"
      >
        <Eye class="h-4 w-4" />
        Aperçu
      </button>
      <button
        v-if="isMj"
        id="campaign-tab-management"
        type="button"
        role="tab"
        :aria-selected="model === 'management' ? 'true' : 'false'"
        aria-controls="campaign-panel-management"
        class="btn btn-sm ui-critical-action gap-2"
        :class="model === 'management' ? 'btn-active' : ''"
        @click="model = 'management'"
      >
        <Crown class="h-4 w-4" />
        Gestion MJ
        <span class="badge badge-outline badge-xs">spécial</span>
      </button>
      <button
        v-if="isMj"
        id="campaign-tab-table"
        type="button"
        role="tab"
        :aria-selected="model === 'table' ? 'true' : 'false'"
        aria-controls="campaign-panel-table"
        class="btn btn-sm ui-critical-action gap-2"
        :class="model === 'table' ? 'btn-active' : ''"
        @click="model = 'table'"
      >
        <Users class="h-4 w-4" />
        Table
      </button>
      <button
        id="campaign-tab-sessions"
        type="button"
        role="tab"
        :aria-selected="model === 'sessions' ? 'true' : 'false'"
        aria-controls="campaign-panel-sessions"
        class="btn btn-sm ui-critical-action gap-2"
        :class="model === 'sessions' ? 'btn-active' : ''"
        @click="model = 'sessions'"
      >
        <List class="h-4 w-4" />
        Sessions
      </button>
      <button
        id="campaign-tab-notes"
        type="button"
        role="tab"
        :aria-selected="model === 'notes' ? 'true' : 'false'"
        aria-controls="campaign-panel-notes"
        class="btn btn-sm ui-critical-action gap-2"
        :class="model === 'notes' ? 'btn-active' : ''"
        @click="model = 'notes'"
      >
        <FileText class="h-4 w-4" />
        Notes
      </button>
    </div>
  </div>
</template>
