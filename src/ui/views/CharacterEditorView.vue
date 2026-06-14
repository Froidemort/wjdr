<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="medium">
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/character/${characterId}`" />
        </ion-buttons>
        <ion-title>Edition</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list inset v-if="formLoaded">
        <ion-item>
          <ion-input data-testid="edit-name-input" v-model="name" label="Nom" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-wounds-current-input" v-model.number="woundsCurrent" type="number" label="PV actuels" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-wounds-max-input" v-model.number="woundsMax" type="number" label="PV max" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-fortune-input" v-model.number="fortune" type="number" label="Fortune" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-fate-input" v-model.number="fate" type="number" label="Destin" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-input" v-model.number="money" type="number" label="Argent" label-placement="stacked" />
        </ion-item>

        <ion-button data-testid="save-editor-button" expand="block" class="ion-margin-top" @click="onSave">Sauvegarder</ion-button>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { computed, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { patchResources, renameCharacter, type Character } from '../../domain/character'
import { getCharacterById, saveCharacter } from '../../repositories/characterRepository'

const route = useRoute()
const router = useRouter()

const characterId = computed(() => String(route.params.id ?? ''))

const character = ref<Character>()
const formLoaded = ref(false)

const name = ref('')
const woundsCurrent = ref(0)
const woundsMax = ref(0)
const fortune = ref(0)
const fate = ref(0)
const money = ref(0)

const fillForm = (current: Character): void => {
  name.value = current.name
  woundsCurrent.value = current.wounds.current
  woundsMax.value = current.wounds.max
  fortune.value = current.fortune
  fate.value = current.fate
  money.value = current.money
}

const loadCharacter = async (): Promise<void> => {
  const found = await getCharacterById(characterId.value)
  character.value = found
  if (found) {
    fillForm(found)
    formLoaded.value = true
  }
}

onIonViewWillEnter(() => {
  void loadCharacter()
})

const onSave = async (): Promise<void> => {
  if (!character.value) {
    return
  }

  // Dexie requires plain serializable objects, not Vue proxies.
  const plainCharacter = structuredClone(toRaw(character.value))

  const renamed = renameCharacter(plainCharacter, name.value)
  const patched = patchResources(renamed, {
    woundsCurrent: woundsCurrent.value,
    woundsMax: woundsMax.value,
    fortune: fortune.value,
    fate: fate.value
  })

  const next: Character = {
    ...patched,
    money: Math.max(0, Math.trunc(money.value))
  }

  await saveCharacter(next)
  await router.push(`/character/${characterId.value}`)
}
</script>
