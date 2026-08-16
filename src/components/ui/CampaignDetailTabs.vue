<script setup lang="ts">
import { Crown, Eye, FileText, List } from '@lucide/vue'

type CampaignTab = 'overview' | 'management' | 'sessions' | 'notes'

const props = defineProps<{
  modelValue: CampaignTab
  isMj: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CampaignTab]
}>()

function updateTab(value: CampaignTab): void {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="rounded-box border border-base-300 bg-base-100 p-3 sm:p-4">
    <div v-if="isMobile">
      <label class="form-control">
        <span class="label-text mb-2">Section</span>
        <select
          :value="modelValue"
          class="select select-bordered ui-critical-control w-full"
          @change="updateTab(($event.target as HTMLSelectElement).value as CampaignTab)"
        >
          <option value="overview">Aperçu</option>
          <option v-if="isMj" value="management">Gestion MJ</option>
          <option value="sessions">Sessions</option>
          <option value="notes">Notes</option>
        </select>
      </label>
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
        :aria-selected="modelValue === 'overview' ? 'true' : 'false'"
        aria-controls="campaign-panel-overview"
        class="btn btn-sm ui-critical-action gap-2"
        :class="modelValue === 'overview' ? 'btn-active' : ''"
        @click="updateTab('overview')"
      >
        <Eye class="h-4 w-4" />
        Aperçu
      </button>
      <button
        v-if="isMj"
        id="campaign-tab-management"
        type="button"
        role="tab"
        :aria-selected="modelValue === 'management' ? 'true' : 'false'"
        aria-controls="campaign-panel-management"
        class="btn btn-sm ui-critical-action gap-2"
        :class="modelValue === 'management' ? 'btn-active' : ''"
        @click="updateTab('management')"
      >
        <Crown class="h-4 w-4" />
        Gestion MJ
        <span class="badge badge-outline badge-xs">spécial</span>
      </button>
      <button
        id="campaign-tab-sessions"
        type="button"
        role="tab"
        :aria-selected="modelValue === 'sessions' ? 'true' : 'false'"
        aria-controls="campaign-panel-sessions"
        class="btn btn-sm ui-critical-action gap-2"
        :class="modelValue === 'sessions' ? 'btn-active' : ''"
        @click="updateTab('sessions')"
      >
        <List class="h-4 w-4" />
        Sessions
      </button>
      <button
        id="campaign-tab-notes"
        type="button"
        role="tab"
        :aria-selected="modelValue === 'notes' ? 'true' : 'false'"
        aria-controls="campaign-panel-notes"
        class="btn btn-sm ui-critical-action gap-2"
        :class="modelValue === 'notes' ? 'btn-active' : ''"
        @click="updateTab('notes')"
      >
        <FileText class="h-4 w-4" />
        Notes
      </button>
    </div>
  </div>
</template>
