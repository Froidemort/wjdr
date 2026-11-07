<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCompendiumFilterStateStore } from '../../stores/compendiumFilterState'
import { useCompendiumSpellsStore } from '../../stores/compendiumSpells'
import { useSpellShortcutPreferencesStore } from '../../stores/spellShortcutPreferences'

const props = defineProps<{ userId: string; characterId: string }>()
const router = useRouter()
const spellsStore = useCompendiumSpellsStore()
const { spells, loading, loaded, error } = storeToRefs(spellsStore)
const filters = useCompendiumFilterStateStore()
const preferences = useSpellShortcutPreferencesStore()
const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
const selected = ref<string[]>([])
const saveFailed = ref(false)
const navigationError = ref<string | null>(null)
const preference = computed(() => preferences.get(props.userId, props.characterId))
const categories = computed(() => [...new Set(spells.value.map((spell) => spell.category))].sort((a, b) => a.localeCompare(b, 'fr')))
const unavailable = computed(() => selected.value.filter((category) => !categories.value.includes(category)))
const canApply = computed(() => selected.value.length > 0 && unavailable.value.length === 0 && loaded.value && !error.value)

watch(() => [props.userId, props.characterId], () => {
  dialog.value?.close()
  selected.value = []
  saveFailed.value = false
  navigationError.value = null
})

async function load(): Promise<boolean> {
  await spellsStore.loadSpells()
  return loaded.value && !error.value
}

async function configure(): Promise<void> {
  selected.value = [...(preference.value.categories ?? [])]
  saveFailed.value = false
  if (!dialog.value?.open) dialog.value?.showModal()
  await load()
}

async function openShortcut(): Promise<void> {
  const identity = [props.userId, props.characterId]
  navigationError.value = null
  if (!await load()) {
    if (identity[0] !== props.userId || identity[1] !== props.characterId) return
    await configure()
    return
  }
  if (identity[0] !== props.userId || identity[1] !== props.characterId) return
  const saved = preference.value.categories
  if (!saved?.length || saved.some((category) => !categories.value.includes(category))) {
    await configure()
    return
  }
  await openCompendium(saved)
}

async function openCompendium(selection: string[]): Promise<void> {
  const difficulties = spells.value.map((spell) => spell.difficulty)
  if (!difficulties.length) return
  filters.applySpellCategories(selection, { min: Math.min(...difficulties), max: Math.max(...difficulties) })
  try {
    const failure = await router.push('/compendium/spells')
    if (failure) {
      navigationError.value = 'Impossible d’ouvrir le compendium de sorts.'
      return
    }
    dialog.value?.close()
  } catch {
    navigationError.value = 'Impossible d’ouvrir le compendium de sorts.'
  }
}

async function saveAndOpen(): Promise<void> {
  if (!canApply.value) return
  if (!preferences.save(props.userId, props.characterId, selected.value)) {
    saveFailed.value = true
    return
  }
  await openCompendium(selected.value)
}

async function useTemporarily(): Promise<void> {
  if (!canApply.value) return
  preferences.useTemporarily(props.userId, props.characterId, selected.value)
  await openCompendium(selected.value)
}
</script>

<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-4" aria-label="Raccourci de sorts">
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-primary min-h-11" :disabled="loading || !userId" @click="openShortcut">Mes sorts</button>
      <button type="button" class="btn btn-outline min-h-11" :disabled="loading || !userId" @click="configure">Configurer les catégories</button>
    </div>
    <p v-if="preference.error" role="status" class="mt-2 text-sm">{{ preference.error }}</p>
    <p v-if="navigationError" role="alert" class="mt-2 text-sm">{{ navigationError }}</p>
    <dialog ref="dialog" class="modal modal-top sm:modal-middle" :aria-labelledby="titleId">
      <div class="modal-box">
        <h2 :id="titleId" class="text-xl font-bold">Catégories de sorts</h2>
        <p class="mt-2 text-sm">Sélectionne au moins une catégorie. Cette préférence reste sur cet appareil, pour ce personnage.</p>
        <p v-if="preference.error && !saveFailed" role="status" class="mt-2 text-sm">{{ preference.error }}</p>
        <p v-if="loading" class="mt-3" role="status">Chargement des sorts…</p>
        <div v-else-if="error" class="alert alert-error mt-3" role="alert">
          <span>{{ error }}</span>
          <button type="button" class="btn btn-sm min-h-11" @click="spellsStore.loadSpells(true)">Réessayer</button>
        </div>
        <template v-else-if="loaded">
          <p v-if="!categories.length" class="mt-3">Aucune catégorie disponible.</p>
          <fieldset v-else class="mt-3 space-y-2">
            <legend class="font-semibold">Catégories disponibles</legend>
            <label v-for="category in categories" :key="category" class="flex min-h-11 items-center gap-2">
              <input v-model="selected" type="checkbox" class="checkbox" :value="category" />
              <span>{{ category }}</span>
            </label>
          </fieldset>
          <div v-if="unavailable.length" role="alert" class="mt-3">
            Catégories indisponibles :
            <label v-for="category in unavailable" :key="category" class="flex min-h-11 items-center gap-2">
              <input v-model="selected" type="checkbox" class="checkbox" :value="category" />
              <span>{{ category }} (retirer)</span>
            </label>
          </div>
          <p v-if="saveFailed" role="alert" class="mt-3">{{ preference.error }}</p>
          <p v-if="navigationError" role="alert" class="mt-3">{{ navigationError }}</p>
        </template>
        <div class="modal-action flex-wrap">
          <button type="button" class="btn min-h-11" @click="dialog?.close()">Annuler</button>
          <button v-if="saveFailed" type="button" class="btn min-h-11" :disabled="!canApply" @click="useTemporarily">Utiliser temporairement</button>
          <button type="button" class="btn btn-primary min-h-11" :disabled="!canApply" @click="saveAndOpen">Enregistrer et ouvrir</button>
        </div>
      </div>
    </dialog>
  </section>
</template>
