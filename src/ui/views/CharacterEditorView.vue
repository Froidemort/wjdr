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
          <ion-input data-testid="edit-money-co-input" v-model.number="moneyCo" type="number" label="Couronnes d'or (co)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-pa-input" v-model.number="moneyPa" type="number" label="Pistoles d'argent (pa)" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input data-testid="edit-money-s-input" v-model.number="moneyS" type="number" label="Sous de cuivre (s)" label-placement="stacked" />
        </ion-item>

        <ion-item lines="none">
          <ion-label>Inventaire et equipement</ion-label>
        </ion-item>
        <ion-item>
          <ion-input v-model="newItemName" label="Objet" label-placement="stacked" placeholder="Ex: Epee" />
        </ion-item>
        <ion-item>
          <ion-input v-model.number="newItemQuantity" type="number" label="Quantite" label-placement="stacked" />
        </ion-item>
        <ion-item>
          <ion-input v-model.number="newItemWeight" type="number" label="Poids" label-placement="stacked" />
        </ion-item>
        <ion-button expand="block" fill="outline" @click="addInventoryItem">Ajouter objet</ion-button>

        <ion-item v-for="item in inventory" :key="item.id">
          <ion-label>
            <h3>{{ item.name }}</h3>
            <p>Quantite: {{ item.quantity }} | Poids: {{ item.weight }}</p>
          </ion-label>
          <ion-button size="small" fill="clear" @click="toggleEquipped(item.id)">
            {{ item.equipped ? 'Equipe' : 'Non equipe' }}
          </ion-button>
          <ion-button size="small" color="danger" fill="clear" @click="removeInventoryItem(item.id)">Supprimer</ion-button>
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
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import { computed, ref, toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  patchInventory,
  patchMoney,
  patchResources,
  renameCharacter,
  type Character,
  type InventoryItem
} from '../../domain/character'
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
const moneyCo = ref(0)
const moneyPa = ref(0)
const moneyS = ref(0)
const inventory = ref<InventoryItem[]>([])
const newItemName = ref('')
const newItemQuantity = ref(1)
const newItemWeight = ref(0)

const fillForm = (current: Character): void => {
  name.value = current.name
  woundsCurrent.value = current.wounds.current
  woundsMax.value = current.wounds.max
  fortune.value = current.fortune
  fate.value = current.fate
  moneyCo.value = current.money.co
  moneyPa.value = current.money.pa
  moneyS.value = current.money.s
  inventory.value = structuredClone(current.inventory)
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

  const withMoney = patchMoney(patched, {
    co: moneyCo.value,
    pa: moneyPa.value,
    s: moneyS.value
  })

  const withInventory = patchInventory(withMoney, inventory.value)

  const next: Character = {
    ...withInventory
  }

  await saveCharacter(next)
  await router.push(`/character/${characterId.value}`)
}

const addInventoryItem = (): void => {
  const name = newItemName.value.trim()
  if (!name) {
    return
  }

  inventory.value.push({
    id: crypto.randomUUID(),
    name,
    quantity: Math.max(0, Math.trunc(newItemQuantity.value)),
    weight: Math.max(0, Math.trunc(newItemWeight.value)),
    equipped: false
  })

  newItemName.value = ''
  newItemQuantity.value = 1
  newItemWeight.value = 0
}

const removeInventoryItem = (id: string): void => {
  inventory.value = inventory.value.filter((item) => item.id !== id)
}

const toggleEquipped = (id: string): void => {
  inventory.value = inventory.value.map((item) =>
    item.id === id ? { ...item, equipped: !item.equipped } : item
  )
}
</script>
