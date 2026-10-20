<script setup lang="ts">
import { Mars, UserPen, Venus } from '@lucide/vue'
import { useIsOnline } from '../../composables/useIsOnline'
import type { CharacterGender, CharacterRace } from '../../types/character'

defineProps<{
  name: string
  race: CharacterRace
  gender: CharacterGender
  careerName: string | null
  editable: boolean
}>()

const emit = defineEmits<{
  'edit-career': []
}>()

const isOnline = useIsOnline()
</script>

<template>
  <header class="rounded-box border border-base-300 bg-base-100 px-4 py-3" data-testid="character-summary">
    <div class="flex items-center gap-2">
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-lg font-black leading-tight sm:text-xl">{{ name }}</h1>
        <p class="flex items-center gap-1.5 truncate text-sm opacity-85">
          <component :is="gender === 'masculin' ? Mars : Venus" class="h-4 w-4 shrink-0 opacity-75" />
          <span class="capitalize">{{ race }}</span>
          <span aria-hidden="true">·</span>
          <span class="truncate">{{ careerName || 'Inconnue' }}</span>
          <span v-if="!editable" class="badge badge-neutral badge-sm shrink-0">Lecture seule</span>
        </p>
      </div>
      <button
        v-if="editable"
        type="button"
        class="btn btn-accent btn-square min-h-11 min-w-11"
        aria-label="Modifier la carrière"
        :disabled="!isOnline"
        :title="isOnline ? undefined : 'Indisponible hors ligne'"
        @click="emit('edit-career')"
      >
        <UserPen :size="22" stroke-width="1.5" />
      </button>
    </div>
  </header>
</template>
